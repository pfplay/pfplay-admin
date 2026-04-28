# PR 14a Design — 어드민 로그인 + 보호 라우트 + AuthStore + mustChangePassword

**작성일**: 2026-04-28
**대상 레포**: `pfplay-admin` (별 레포)
**시리즈 위치**: pfplay-platform admin-platform 시리즈 PR 14의 첫 sub-PR (14a)
**의존**: PR 4 (admin login API), PR 6 (mustChangePassword + admin password change API)
**백엔드 변경**: 0 (cross-repo 제약)

## 1. 목적과 비목적

### 1.1 목적

- 어드민이 이메일+비밀번호로 로그인하여 보호된 어드민 화면에 진입할 수 있게 한다.
- 새로고침/탭 닫음 후에도 쿠키가 유효하면 세션 유지된다.
- mustChangePassword=true 어드민은 다른 화면 진입 전 강제로 비밀번호를 변경한다.
- 세션 만료(쿠키 만료, 권한 변경 등으로 인한 401)는 즉시 로그아웃 + 로그인 화면 redirect로 회복한다.
- 14b/14c/14d에서 사용할 공통 인프라(http.ts, ApiError, ProtectedRoute, sessionStore)를 14a에서 확정한다.

### 1.2 비목적 (14a 범위 외)

- 유저/룸/Avatar/신고 관리 화면 (14b/14c/14d 각각)
- e2e/Playwright 테스트
- a11y audit, i18n, 다국어
- 다중 탭 동기화 (storage event 리스너)
- 비번 표시 토글, 캡스락 경고

## 2. 백엔드 ground-truth (PR 4/6 read 결과)

| 항목 | 값 / 위치 |
|---|---|
| 로그인 endpoint | `POST /api/v1/auth/admin/login` (`AdminAuthController`) |
| 로그아웃 endpoint | `POST /api/v1/auth/admin/logout` |
| 비번 변경 endpoint | `POST /api/v1/admin/password/change` (`AdminPasswordController`) — 204 No Content |
| 로그인 요청 body | `AdminLoginRequest { email: @Email @NotBlank @Size(max=255), password: @NotBlank @Size(min=8, max=128) }` |
| 로그인 응답 envelope | `ApiCommonResponse { data: AdminLoginResponse }`. `AdminLoginResponse { tokenType: "Cookie", expiresIn: long(=900s), issuedAt: LocalDateTime, role: AdminRole, mustChangePassword: boolean }` |
| 비번 변경 요청 body | `ChangeAdminPasswordRequest { currentPassword: @NotBlank, newPassword: @NotBlank }` (백엔드 measurement 부재 — 검증은 service에서 수행) |
| 신규 비번 정책 | `AdminPasswordPolicy.requireValid`: 최소 10자 + 대문자 + 소문자 + 숫자 + 특수문자 `[!@#$%^&*]` 각 1개 이상 |
| AdminRole enum | `SUPER_ADMIN`, `ADMIN` (오직 2개) |
| Access token 쿠키 | `AdminAccessToken` (httpOnly, Secure, SameSite=Strict, Max-Age=900s, Domain=`${ADMIN_COOKIE_DOMAIN}`) |
| Shared session 쿠키 | `SharedSessionToken` (httpOnly, Secure, SameSite 환경별, Max-Age=86400s) |
| Sliding session | `AdminTokenRenewalFilter` 활성: 마지막 5분(`renewal-threshold-seconds: 300`) 안에 요청 들어오면 자동으로 새 access token 쿠키 발급 → 활동 중인 어드민은 자동으로 세션 갱신됨 |
| Rate limit | IP: 10회/300s, Email: 5회/900s. 성공 시 email bucket 초기화 (`AdminLoginRateLimiter`). 초과 시 `RateLimitedException` (HTTP 429 추정 — spec §12 검증) |
| CSRF | 활성 (`admin-csrf.enabled: true`). `CookieCsrfTokenRepository`가 응답마다 `XSRF-TOKEN` 쿠키 발급 (httpOnly 아님). 변형 요청은 `X-XSRF-TOKEN` 헤더로 echo. 면제: 로그인(`POST /api/v1/auth/admin/login`), 모든 GET/HEAD/OPTIONS/TRACE. **로그아웃, 비번 변경, 모든 admin 변형 호출은 CSRF 토큰 필수.** (`AdminCsrfRequestMatcher`) |
| Origin Guard | `AdminOriginGuardFilter` 활성. 별 allowlist (`admin-origin-guard.allowed`): 운영=`https://admin.pfplay.xyz`, dev=`http://localhost:3000` (Vite 기본은 5173이므로 **dev port=3000 필수** — `vite.config.ts`에 이미 설정됨). |
| CORS | `CorsConfigurationSource`: `allowed-origins=${CORS_ALLOWED_ORIGINS}`, `allow-credentials=true`, methods=`GET,POST,PUT,PATCH,DELETE,OPTIONS`. 운영 env에 `https://admin.pfplay.xyz` 등록 확인 필요(spec §12 검증). |
| 권한 매핑 | `/api/v1/admin/system/**` → `SUPER_ADMIN`, `/api/v1/admin/avatar/**` → `SUPER_ADMIN`, `/api/v1/admin/**` → `ADMIN`, `/api/v1/auth/admin/**` → authenticated |
| 에러 응답 형태 | `ApiErrorResponse { status, errorCode, message }` (flat) — `$.errorCode` 사용 |
| 비번 변경 에러코드 | `AdministratorManagementException.INVALID_CURRENT_PASSWORD`, `INVALID_NEW_PASSWORD` (코드 prefix는 §12 검증) |

## 3. 아키텍처

### 3.1 FSD 레이어 매핑

```
src/
├── shared/
│   ├── api/
│   │   ├── http.ts            ← fetch wrapper: credentials, CSRF echo, 401 인터셉터, ApiError
│   │   ├── error.ts           ← ApiError class
│   │   └── csrf.ts            ← getCsrfToken() — document.cookie에서 XSRF-TOKEN 읽기
│   └── config/
│       └── env.ts             ← VITE_API_BASE_URL 단일 진입
├── entities/
│   └── session/
│       ├── model/
│       │   ├── types.ts       ← AdminRole, SessionMeta, LoginCommand
│       │   └── store.ts       ← useSessionStore (zustand persist)
│       ├── api/
│       │   └── session.ts     ← login(), logout(), changePassword()
│       └── index.ts
├── features/
│   ├── login/
│   │   ├── model/schema.ts    ← zod loginSchema
│   │   ├── api/use-login.ts   ← react-query mutation
│   │   └── ui/login-form.tsx
│   ├── change-password/
│   │   ├── model/schema.ts    ← zod (10자+복잡도 미러링)
│   │   ├── api/use-change-password.ts
│   │   └── ui/change-password-form.tsx
│   └── logout/
│       └── api/use-logout.ts
├── widgets/
│   ├── protected-route.tsx
│   └── (기존) rooms/, scenarios/, users/  (그대로 유지)
├── pages/
│   ├── login-page.tsx
│   ├── change-password-page.tsx
│   ├── dashboard-page.tsx     ← placeholder
│   └── (기존) rooms-page.tsx, scenarios-page.tsx, users-page.tsx
├── app/
│   └── layout.tsx             ← (기존) + 로그아웃 버튼, 인증 사용자 표시
└── App.tsx                    ← 라우트 정의 (모든 보호 라우트 ProtectedRoute 래핑)
```

### 3.2 라우트 구조

| 경로 | 보호 | 설명 |
|---|---|---|
| `/login` | public | 미인증만 진입. 인증된 상태로 진입 시 `state.returnTo \|\| "/"`로 redirect. |
| `/password/change` | protected + mustChangePassword 게이트 | mustChangePassword=true일 때만 의미. 변경 후 `clearMustChangePassword()` + `/`로 redirect. |
| `/` | protected | dashboard placeholder. |
| `/scenarios`, `/rooms`, `/users` | protected | 기존 demo 그대로. 14b에서 `/rooms`, `/users`를 실제 기능으로 교체. |

### 3.3 ProtectedRoute 동작

```ts
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, meta } = useSessionStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />
  }
  if (meta?.mustChangePassword && location.pathname !== "/password/change") {
    return <Navigate to="/password/change" replace />
  }
  return <>{children}</>
}
```

- mustChangePassword 강제 게이트는 `/password/change` 자체는 통과 (해제 위해 폼 접근 가능).
- 변경 성공 → store 업데이트(`clearMustChangePassword`) → re-render → 게이트 해제 → `/`로 navigate.

## 4. 세션 복원 전략 (me-endpoint 부재 해결)

### 4.1 결정: zustand persist + localStorage

- **저장 대상**: `SessionMeta { role, mustChangePassword, issuedAt, expiresAt }`. **토큰 자체는 미저장** (httpOnly cookie).
- **저장 위치**: localStorage, key=`pfplay-admin-session`, version=1.
- **복원 동작**: 앱 mount 시 zustand persist가 자동 hydrate.
- **무효화**: 401 인터셉터가 단일 진입점으로 cleanup. 변조/위조된 메타가 있어도 첫 인증된 호출에서 401 → cleanup → /login.

### 4.2 시나리오 매트릭스

| 쿠키 | localStorage | 결과 |
|---|---|---|
| 살아있음 | 살아있음 | 정상 복원, 보호 라우트 통과 |
| 만료 | 살아있음 | 첫 API 호출에서 401 → 인터셉터가 store.clear() + hard redirect /login |
| 살아있음 | 비움 (수동삭제) | isAuthenticated=false → /login → 재로그인하면 쿠키 덮어씌워짐 |
| 만료 | 비움 | /login |

### 4.3 보안 분석

- **토큰 탈취 불가**: httpOnly cookie. JS에서 접근 못함.
- **메타 위변조**: localStorage XSS로 role을 SUPER_ADMIN으로 위조해도 서버는 매 호출 쿠키 검증 → UI 분기만 영향 → 공격자 자기 화면만 변조됨.
- **CSRF**: `XSRF-TOKEN` 쿠키는 의도적으로 non-httpOnly. JS가 읽어 헤더로 echo. 토큰 자체는 random, 서버 검증.
- **SameSite=Strict**: cross-site (다른 e-TLD+1)에서 쿠키 차단. cross-subdomain (admin.pfplay.xyz ↔ api.pfplay.xyz)는 same-site → 쿠키 전송 OK. **운영 검증 필수** (§12).

## 5. shared/api/http.ts 설계

### 5.1 시그니처

```ts
export interface HttpOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  skip401Redirect?: boolean    // 로그인 호출만 true
}

export async function http<T>(path: string, opts: HttpOptions = {}): Promise<T>
```

### 5.2 핵심 동작 순서

1. **URL 구성**: `${VITE_API_BASE_URL}${path}`.
2. **CSRF echo**: 변형 method (POST/PUT/PATCH/DELETE)일 때 `getCsrfToken()` 호출하여 `X-XSRF-TOKEN` 헤더 추가. 토큰 부재 시 헤더 미추가 (백엔드가 403 반환 → ApiError throw).
3. **Body 직렬화**: opts.body가 있으면 `JSON.stringify` + `Content-Type: application/json`.
4. **fetch 호출**: `credentials: 'include'` 강제.
5. **401 처리**: `skip401Redirect`가 false면 `useSessionStore.getState().clear()` + `window.location.href = "/login"` + `throw new ApiError(401, ...)`. true면 throw만.
6. **에러 처리 (≠2xx)**: 응답 JSON 파싱 (실패 시 `{status, errorCode: "UNKNOWN", message: statusText}` fallback) → `throw new ApiError(status, errorCode, message)`.
7. **204 No Content**: `undefined as T` 반환.
8. **2xx**: `await res.json()` 반환. envelope unwrap은 호출자 책임 (login은 `data` 키 unwrap 필요).

### 5.3 getCsrfToken (shared/api/csrf.ts)

```ts
export function getCsrfToken(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}
```

## 6. entities/session API 표면

```ts
// entities/session/model/types.ts
export type AdminRole = "SUPER_ADMIN" | "ADMIN"

export interface SessionMeta {
  role: AdminRole
  mustChangePassword: boolean
  issuedAt: string         // ISO 문자열로 정규화 (백엔드 LocalDateTime → ISO)
  expiresAt: string        // issuedAt + expiresIn 초 (클라 계산)
}

export interface LoginCommand {
  email: string
  password: string
}

// entities/session/api/session.ts
export async function login(cmd: LoginCommand): Promise<SessionMeta> {
  const res = await http<{ data: AdminLoginResponseRaw }>("/api/v1/auth/admin/login", {
    method: "POST", body: cmd, skip401Redirect: true,
  })
  return toSessionMeta(res.data)  // expiresAt 계산, ISO 정규화
}

export async function logout(): Promise<void> {
  await http<void>("/api/v1/auth/admin/logout", { method: "POST" })  // CSRF 필수
}

export async function changePassword(req: { currentPassword: string; newPassword: string }): Promise<void> {
  await http<void>("/api/v1/admin/password/change", { method: "POST", body: req })
}
```

## 7. 폼 + 검증 (zod + RHF)

### 7.1 LoginForm

```ts
const loginSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다").max(255),
  password: z.string().min(8, "8자 이상").max(128),
})
```

- 401 응답: form-level 에러 "이메일 또는 비밀번호가 올바르지 않습니다"
- 429 응답 (RateLimitedException): "잠시 후 다시 시도해주세요"
- 5xx: sonner toast "서버 오류" + form-level "잠시 후 다시 시도해주세요"

### 7.2 ChangePasswordForm

```ts
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{10,128}$/

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().regex(PASSWORD_REGEX, "10자 이상, 대/소문자, 숫자, 특수문자(!@#$%^&*) 각 1개 이상"),
  newPasswordConfirm: z.string(),
}).refine((d) => d.newPassword === d.newPasswordConfirm, {
  path: ["newPasswordConfirm"],
  message: "새 비밀번호와 일치하지 않습니다",
}).refine((d) => d.newPassword !== d.currentPassword, {
  path: ["newPassword"],
  message: "현재 비밀번호와 달라야 합니다",
})
```

- 백엔드 정책 100% 미러링. 백엔드가 추가 거부 시(예: 과거 비번 재사용 차단) errorCode 매핑 추가 — 14a §12 검증.

## 8. 테스트 전략

### 8.1 셋업

`devDependencies`: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`.

`vite.config.ts`에 `test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"] }` 추가.

### 8.2 테스트 케이스 (15개)

**Unit (5)**:
1. `useSessionStore.setSession` → `isAuthenticated=true` + meta 저장 + localStorage persist
2. `useSessionStore.clear` → 초기화 + localStorage 비움
3. `useSessionStore.clearMustChangePassword` → meta.mustChangePassword=false
4. `http.ts` 401 응답 → `store.clear()` + `window.location.href` 호출 (jsdom mock)
5. `http.ts` `skip401Redirect: true` → 인터셉터 우회 + ApiError throw

**Component (3)**:
6. LoginForm: invalid email format → field error
7. LoginForm: short password → field error
8. ChangePasswordForm: newPassword === currentPassword → field error

**Integration (7)**:
9. LoginPage: happy path → `/` navigate + sessionStore meta 갱신
10. LoginPage: 401 응답 → "이메일 또는 비밀번호가 올바르지 않습니다" form-level
11. LoginPage: 429 응답 → "잠시 후 다시 시도해주세요"
12. LoginPage: mustChangePassword=true → `/password/change` navigate
13. ProtectedRoute: 미인증 + `/rooms` 접근 → `/login` + `state.returnTo="/rooms"`
14. ProtectedRoute: 인증 + mustChangePassword=true + `/rooms` → `/password/change`
15. ChangePasswordPage: 204 → `clearMustChangePassword()` + `/` navigate

### 8.3 msw 핸들러

`src/test/mocks/handlers.ts`에 login(401/429/200 + mustChange), logout(204), changePassword(204/400) 시나리오 분기.

## 9. 의존 라이브러리 추가

```json
{
  "devDependencies": {
    "vitest": "^2.x",
    "@vitest/ui": "^2.x",
    "jsdom": "^25.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/user-event": "^14.x",
    "msw": "^2.x"
  }
}
```

추가 production 의존성 없음 (zustand persist, RHF, zod, sonner, react-query 모두 기존 설치됨).

## 10. 구현 chunk 분할

| Chunk | 내용 | 산출물 |
|---|---|---|
| **G0** | spec + plan 작성 | docs/specs/2026-04-28-admin-pr14a-design.md (본 문서) + plan |
| **G1** | shared 인프라 | `shared/api/{http,error,csrf}.ts`, `shared/config/env.ts`, vitest 셋업, msw 스켈레톤, unit test 4-5 |
| **G2** | entities/session | `types.ts`, `store.ts` (zustand persist), `api/session.ts`, unit test 1-3 |
| **G3** | features/login + LoginPage | schema, mutation, form, page, App.tsx /login 라우트, component test 6-7, integration test 9-12 |
| **G4** | ProtectedRoute + change-password | widget, change-password feature/page, dashboard placeholder, App.tsx 보호 라우트 wiring, layout 로그아웃 버튼, component test 8, integration test 13-15 |
| **G5** | logout + 운영 수동 검증 | logout feature, layout wire, dev 서버에서 5 시나리오 수동 검증 + 1 추가 test. 검증 시나리오: ① happy login(올바른 credentials → 대시보드) ② expired cookie(쿠키 수동 삭제 후 API 호출 → 401 인터셉터 → /login + returnTo 보존) ③ mustChangePassword 흐름(true → /password/change 강제 → 변경 → /) ④ logout(쿠키 클리어 + store.clear + /login) ⑤ CSRF 토큰 발급 확인(로그인 직후 `document.cookie`에 `XSRF-TOKEN` 존재 → R4 검증) |
| **G6** | spec catch-up | §12 deviations + ground-truth backfill |
| **G6.1+** | polish follow-up | 리뷰 결과에 따라 |

각 chunk 완료 후 implementer subagent → spec compliance reviewer → code quality reviewer → 사용자 confirm → 다음 chunk (메모 PR 시리즈 패턴).

## 11. 위험 / 미해결

### 11.1 위험 항목

**R1 — CORS / SameSite cross-subdomain 검증**
- `SameSite=Strict` + cross-subdomain (admin.pfplay.xyz → api.pfplay.xyz) 동작 검증 필수.
- **완화**: G5 수동 검증 시 `stg-admin.pfplay.xyz` → `stg-api.pfplay.xyz`로 실제 동작 확인. 실패 시 백엔드 `same-site: Lax` 또는 `Domain=.pfplay.xyz` 조정 필요 → 별 백엔드 PR로 분리 (메모 "백엔드 작업 0" 위배 → 사용자 confirm).

**R2 — 15분 access token 만료 UX** ✅ 해소
- `AdminTokenRenewalFilter` (renewal-threshold 5분) 활성 확인 → 활동 중 어드민은 자동 sliding 갱신. 15분 비활동 = 로그아웃 (정상 보안 동작).

**R3 — me-endpoint 부재로 stale role**
- 로그인 후 백엔드 role 변경 시 클라 메타 stale. 서버 권한 매번 쿠키 검증이라 보안 영향 0.
- **완화**: §13에 future polish (GET /api/v1/admin/me 도입).

**R4 — CSRF 토큰 부재 시 첫 변형 요청 403**
- 로그인 응답이 `Set-Cookie: XSRF-TOKEN`을 함께 발급하는지 확인 필요 (Spring Security `CookieCsrfTokenRepository` 기본은 응답 시 발급하나 `requireCsrfProtectionMatcher`가 login을 제외 → 발급 timing 불확실).
- **완화**: G5 수동 검증 시 로그인 직후 `document.cookie`에서 `XSRF-TOKEN` 존재 확인. 부재 시 G3에서 로그인 직후 가벼운 GET (예: dashboard fetch) 1회 호출하여 발급 유도. 또는 백엔드 측 login 응답에 명시적 CSRF 발급 추가 (별 백엔드 PR).

**R5 — 401 인터셉터 hard redirect로 unsaved form data 유실**
- 14a 범위에선 form 거의 없음(login, change-password) → 실제 risk 낮음. §13에 14b 도입 시 재고.

**R6 — zustand persist 마이그레이션**
- store shape 변경 시 마이그레이션 필요. `version: 1` 명시 + 향후 변경 시 `migrate` 함수 제공 정책.

**R7 — dev/staging/prod 환경 변수 정합성**
- 4개 설정이 정렬되어야 동작: 클라 측 `VITE_API_BASE_URL` ↔ 백엔드 `CORS_ALLOWED_ORIGINS` ↔ `ADMIN_COOKIE_DOMAIN` ↔ `admin-origin-guard.allowed`. 하나라도 어긋나면 CORS 거부 / 쿠키 미전송 / Origin Guard 차단.

| 환경 | VITE_API_BASE_URL (admin) | CORS_ALLOWED_ORIGINS (server) | ADMIN_COOKIE_DOMAIN | admin-origin-guard.allowed |
|---|---|---|---|---|
| dev (로컬) | `http://localhost:8080` | `http://localhost:3000` | `localhost` | `http://localhost:3000` (yml 기본) |
| staging | `https://stg-api.pfplay.xyz` | `https://stg-admin.pfplay.xyz` | `.pfplay.xyz` | `https://stg-admin.pfplay.xyz` (env로 주입 필요) |
| prod | `https://api.pfplay.xyz` | `https://admin.pfplay.xyz` | `.pfplay.xyz` | `https://admin.pfplay.xyz` |

- **완화**: G5 수동 검증 시 stg env에서 4개 설정 정합 확인. staging의 `admin-origin-guard.allowed`에 `https://stg-admin.pfplay.xyz` 등록 여부는 백엔드 `application.yml` 또는 deploy env 확인(현재 yml은 운영 도메인만 명시 — staging은 env 주입 의존).

**R8 — Safari ITP localStorage 7일 만료**
- Safari Intelligent Tracking Prevention은 third-party 또는 미사용 사이트의 localStorage를 7일 후 자동 purge. AdminAccessToken 쿠키는 살아있어도 `pfplay-admin-session` localStorage 키가 사라지면 §4.2 row 3 시나리오(쿠키 살아있음 + localStorage 비움)로 진입 → `/login` 강제. 쿠키 인증으로 자동 재로그인 불가능 (서버에 쿠키 → 메타 응답 endpoint 부재).
- **수용 비용**: 7일 이상 비활동 어드민은 재로그인 필요. 정상 운영 어드민은 매일 접속이라 risk 낮음.
- **완화**: GET /api/v1/admin/me 도입(R3 future polish) 시 자연스럽게 해결됨 — 새로고침마다 fresh fetch + localStorage 재구성.

### 11.2 미해결 future polish (§13)

- 백엔드: GET /api/v1/admin/me 추가
- e2e Playwright (login happy/sad path)
- Storybook + 시각적 회귀 테스트
- 다국어(i18n)
- a11y audit (axe-core)
- 비번 표시 토글, 캡스락 경고
- 다중 탭 동기화 (storage event 리스너)

## 12. Open Items / Implementation Reality (post-build catch-up)

> *G6 chunk에서 작성. 구현 중 발견된 백엔드 가정 vs 실제 deviations + 검증 결과.*

(빈 섹션 — G6에서 backfill)

## 13. Future Polish (§11.2 + 신규 발견 누적)

> *G6 chunk에서 backfill.*

(빈 섹션 — G6에서 backfill)
