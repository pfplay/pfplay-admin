# PFPlay Admin Console

PFPlay 운영 어드민 콘솔. 회원·파티룸·신고·아바타·공지·어드민 사용자를 관리합니다.

[![Node](https://img.shields.io/badge/Node-22%2B-339933?logo=nodedotjs)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=React&logoColor=black)]()
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)]()
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)]()

- Notion FE 위키: `<TODO notion-fe-wiki>`
- Slack 채널: `<TODO slack-channel>`
- 관련 리포: [pfplay-platform](https://github.com/pfplay/pfplay-platform) (backend), `<TODO pfplay-web-url>` (사용자 프론트)

## Table of Contents

1. [빠른 시작](#빠른-시작)
2. [도메인 개요](#도메인-개요)
3. [아키텍처](#아키텍처)
4. [상태 관리 & 데이터 흐름](#상태-관리--데이터-흐름)
5. [백엔드 연결](#백엔드-연결-pfplay-platform)
6. [테스트](#테스트)
7. [CI/CD 및 배포](#cicd-및-배포)
8. [운영 메모(자주 부딪히는 함정)](#운영-메모자주-부딪히는-함정)
9. [외부 링크 & 참고](#외부-링크--참고)

## 빠른 시작

### Prerequisites
- **Node.js 22+** (`@types/node ^22` 기준)
- **pnpm 9+** — `pnpm-lock.yaml`이 source of truth. npm/yarn 사용 금지
- 로컬 백엔드(`pfplay-platform`)가 띄워져 있어야 admin 콘솔이 의미가 있습니다 (아래 참고)

### 설치
```bash
pnpm install
```

### 환경변수
프로젝트 루트에 `.env.local` (gitignored)을 만들고 다음을 채웁니다:

```bash
# 백엔드 base URL. 미지정 시 http://localhost:8080 (shared/config/env.ts)
VITE_API_BASE_URL=http://localhost:8080
```

dev/stg/prod 환경별 값은 Cloudflare Pages 환경 변수에서 관리합니다.

### 로컬 백엔드 띄우기
`pfplay-platform` 리포에서:

```bash
# pfplay-platform/
docker-compose -f docker-compose.local.yml up -d
```

- `local` 프로파일이 강제 활성화됩니다.
- super-admin이 자동 시드됩니다: `admin@pfplay.local` / `local-test-only-rotate-in-prod`
- `http://localhost:8080`에 떠 있습니다.

자세한 사항은 pfplay-platform README의 "Getting Started" 참고.

### 개발 서버 실행
```bash
pnpm dev          # Vite dev server
pnpm test         # Vitest watch
pnpm test:run     # 단발 실행 (CI용)
pnpm test:ui      # Vitest UI
pnpm build        # tsc + vite build → dist/
pnpm preview      # 빌드 산출물 미리보기
pnpm lint         # ESLint
```

### 첫 로그인 흐름
1. `/login`에서 시드 계정으로 로그인
2. 첫 로그인은 `mustChange = true` → `/password/change`로 강제 리다이렉트
3. 비밀번호 변경 후 `/`(대시보드) 진입
4. 이후 모든 라우트는 `ProtectedRoute`로 감싸여 있고, 어떤 요청이든 401을 받으면 자동으로 세션을 클리어하고 `/login`으로 보냅니다 (`shared/api/http.ts`)

## 도메인 개요

| 도메인 | 라우트 | 책임 |
|---|---|---|
| 인증 | `/login`, `/password/change` | 패스워드 기반 로그인 + JWT 쿠키. OAuth2 미사용. `mustChange` 강제 흐름 |
| 대시보드 | `/` | 핵심 지표 요약 |
| 회원 | `/members`, `/members/:memberId` | 회원 목록·상세. 단건 mutation + bulk-action |
| 파티룸 | `/partyrooms`, `/partyrooms/:partyroomId` | 파티룸 목록·상세. 단건 mutation + bulk-action |
| 신고 | `/reports`, `/reports/:reportId` | 파티룸 신고 처리 (백엔드 V13 schema) |
| 아바타 | `/avatars/:resourceType`, `/avatars/:resourceType/:id` | bodies / faces / combinable / icons 등 리소스 카탈로그. `/avatars`는 `/avatars/bodies`로 리다이렉트 |
| 공지 | `/announcements`, `/announcements/history` | 시스템 공지 (백엔드 V14 schema). 1분 cron 배포. 이력 조회 |
| 어드민 사용자 | `/administrators`, `/administrators/:administratorId` | super-admin이 다른 어드민 계정을 발급·관리 |

도메인별 백엔드 API 매핑은 backend Swagger에서 확인:
```
http://localhost:8080/spec/api    # 로컬
```

## 아키텍처

### Feature-Sliced Design (FSD)
```
App      (src/app/)        — layout, provider, 글로벌 스타일
  ↓
Pages    (src/pages/)      — 라우트당 1 파일, URL state + 위젯 조합
  ↓
Widgets  (src/widgets/)    — 페이지 빌딩 블록 (list/detail/pagination/protected-route)
  ↓
Features (src/features/)   — 도메인 기능 (각 슬라이스 = api/ + model/ + ui/)
  ↓
Entities (src/entities/)   — 도메인 객체 (DTO/Zustand store)
  ↓
Shared   (src/shared/)     — 가로지르는 인프라
```

**의존성 규칙**: 각 레이어는 **하위 레이어만** 의존. 같은 레이어 내 다른 슬라이스를 직접 import하지 않습니다.

### 디렉터리 책임

| 경로 | 내용 |
|---|---|
| `src/app/` | `layout.tsx` (사이드바 네비), QueryClient·Toaster provider, globals.css |
| `src/pages/` | `dashboard-page`, `members-page`, `member-detail-page`, `partyrooms-page`, … (각 라우트 1 파일) |
| `src/widgets/` | `members-list`, `partyrooms-detail`, `reports-list`, `protected-route`, `pagination` 등 |
| `src/features/` | `login`, `logout`, `change-password`, `members`, `partyrooms`, `reports`, `avatars`, `announcements`, `administrators` |
| `src/entities/` | `administrator`, `announcement`, `avatar`, `member`, `partyroom`, `report`, `session` |
| `src/shared/api/` | `http.ts` (fetch 래퍼), `csrf.ts`, `error.ts` (ApiError), `page.ts` (페이지네이션) |
| `src/shared/config/` | `env.ts` — `VITE_API_BASE_URL` |
| `src/shared/lib/` | `format-kst`, `labels`, `mutation-toast`, `query-client`, `url-state`, 각종 hook |

### 페이지 ↔ 위젯 ↔ 피처 패턴
- **페이지**는 URL state와 위젯 조합만. API 호출 금지.
- **위젯**은 레이아웃과 데이터 조합. mutation은 피처에 위임.
- **피처**가 실제 API 호출·mutation·form을 담당.

위젯이 API를 직접 부르지 않습니다. 새 도메인을 추가할 땐 이 슬라이스 패턴(`api/` + `model/` + `ui/`)을 따르세요.

## 상태 관리 & 데이터 흐름

| 종류 | 도구 | 사용처 |
|---|---|---|
| 서버 상태 | TanStack Query 5 | 모든 백엔드 데이터(목록·상세·mutation) |
| 클라이언트 상태 | Zustand 5 + Immer | `entities/session/model/store` (인증 세션) 등 |
| 폼 | React Hook Form 7 + Zod 3 | 모든 form (검증 schema는 `model/`에 분리) |
| URL state | `shared/lib/use-url-query-state.ts`, `use-url-multi-param-state.ts` | 페이지네이션·필터·정렬 |
| 알림 | Sonner | `shared/lib/mutation-toast.ts`로 정형화된 성공/실패 toast |

**원칙**: server state는 React Query, session/UI state는 Zustand, form state는 RHF. 셋의 경계를 넘는 패턴을 만들지 마세요.

## 백엔드 연결 (pfplay-platform)

admin 콘솔은 백엔드에 100% 의존합니다. 아래는 코드만 봐서는 의도를 알기 어려운 연결 결정들입니다.

### 인증 — password + JWT cookie
- pfplay-web과 달리 **OAuth2를 쓰지 않습니다**. super-admin이 발급한 패스워드 기반 로그인.
- 첫 로그인 후 `mustChange` 플래그가 켜져 있으면 `/password/change`로 강제 이동.
- 모든 요청은 `credentials: "include"`로 쿠키를 동행시킵니다 (`shared/api/http.ts`).
- 401 응답은 자동으로 세션 클리어 + `/login` 리다이렉트.

### Cookie 도메인 분리 (의도된 설계)
- `ADMIN_COOKIE_DOMAIN=admin.pfplay.xyz` — SameSite=**Strict**
- shared `COOKIE_DOMAIN=.pfplay.xyz` — SameSite=**Lax**

admin과 사용자 프론트의 세션은 **물리적으로 분리되어야** 합니다. "어차피 같은 사용자니까 통일하자"는 제안은 거절하세요 — admin 쿠키가 일반 사용자 도메인에서 새어 나가는 걸 막는 것이 분리의 목적입니다.

### CSRF — echo 방식
백엔드는 `XSRF-TOKEN` 쿠키를 발급하고, 클라이언트는 unsafe method(`POST`/`PUT`/`PATCH`/`DELETE`)에 `X-XSRF-TOKEN` 헤더로 그대로 echo합니다 (`shared/api/csrf.ts`, `shared/api/http.ts`).

> **OAuth2 wrapping workaround**: Spring Security의 OAuth2 client + cookie bearer 조합에서는 CSRF 보호가 framework 단에서 자동 무력화되는 알려진 이슈가 있어, 백엔드 `SecurityConfig`가 post-processor에서 `setRequireCsrfProtectionMatcher`를 다시 호출하는 workaround가 들어가 있습니다. upstream: [spring-security#17959](https://github.com/spring-projects/spring-security/issues/17959), [#8668](https://github.com/spring-projects/spring-security/issues/8668). upstream fix 시 backend 측 workaround와 함께 제거 가능합니다.

### Super-admin V5 placeholder seed
- 첫 부팅 시 `ApplicationReadyEventListener`가 환경변수로 받은 seed로 super-admin을 idempotent하게 생성합니다.
- 시드된 super-admin이 다른 어드민 계정을 발급하면, 이후 부팅 시 `ADMIN_SEED_*` 환경변수는 **제거 권장**합니다 (secret hygiene).
- 라이프사이클: V5 placeholder + `matchIfMissing` 가드 → idempotent service.

### admin-origin-guard
- 백엔드 `application.yml`에 admin allowed origin이 **하드코딩**되어 있습니다 (env 분리 X — pending hardening).
- 새 admin 도메인(dev/stg/prod)을 띄울 때 백엔드 설정도 함께 갱신해야 합니다.

## 테스트

- **Vitest 2** + **React Testing Library** + **MSW 2** + **jsdom**
- `__tests__` 디렉터리는 `pages/`, `widgets/`, `features/login/`, `shared/lib/`, `shared/api/`에 존재
- **원칙**: 페이지·위젯 레벨에서 사용자 시나리오 기준으로 작성. 단일 컴포넌트의 prop snapshot은 지양.
- MSW로 백엔드 응답을 가짜로 받아 mutation flow까지 검증합니다.

```bash
pnpm test         # watch
pnpm test:run     # CI/단발
pnpm test:ui      # 브라우저 UI
```

## CI/CD 및 배포

### Cloudflare Pages
- 빌드 산출물: `dist/` (Vite 빌드)
- SPA fallback: `wrangler.jsonc`의 `not_found_handling: "single-page-application"` — 모든 404를 `index.html`로
- 도메인:
  - prod: `admin.pfplay.xyz`
  - stg: `<TODO admin-stg-domain>`
  - dev: `<TODO admin-dev-domain>`

### GitHub Actions 없음
이 리포는 **의도적으로** `.github/workflows/`를 두지 않습니다. CI/CD는 **Cloudflare Pages의 native git integration**이 담당:

- main / release / develop 등 브랜치 push 시 Cloudflare 측에서 자동 빌드·배포
- 배포 결과 확인은 **Cloudflare 대시보드**에서. pfplay-platform과 달리 `gh run watch`로 추적 불가
- PR 브랜치에는 preview 배포가 자동 생성됩니다

### 문서/README만 바꿔도 빌드 발생
현재 path filter가 없어 README 변경만으로도 빌드·배포가 돕니다. Cloudflare 측에서 "ignored build step" 스크립트로 제어 가능하지만 현재는 적용하지 않습니다.

## 운영 메모(자주 부딪히는 함정)

코드만 봐서는 의도를 알기 어려운 결정들입니다. **변경 제안 전에 반드시 확인**하세요.

### Cookie 도메인을 통일하지 마세요
admin(`admin.pfplay.xyz`, Strict)과 shared(`.pfplay.xyz`, Lax) 쿠키 분리는 의도된 보안 경계입니다. 통일 제안이 정기적으로 나오지만 거절해 왔습니다.

### super-admin seed env는 첫 부팅 후 제거
- 첫 prod 진입 때만 `ADMIN_SEED_*`가 필요합니다.
- 시드 완료 후 백엔드 deploy env에서 secret을 제거하는 게 권장 경로 (현재 outstanding action).

### admin-origin-guard가 env-aware하지 않음
- 백엔드 `application.yml`에 origin 리스트가 하드코딩 (dev/stg/prod 분리 X).
- 새 admin 도메인을 띄울 때 백엔드 측 hardening 작업이 필요합니다 (pending).

### KST 시각 가정
- 백엔드 JVM TZ는 `Asia/Seoul`로 고정 (`Dockerfile ENV TZ` + `ClockConfig`)
- admin UI도 KST 가정으로 시각을 표시합니다 (`shared/lib/format-kst.ts`)
- 사용자가 다른 timezone에서 접속해도 KST로 보입니다 (의도된 동작).

### combinable body의 `icon_uri=null`은 정상
- 아바타 콘솔에서 combinable type의 body는 채팅 아이콘 셀이 비어 보입니다.
- combinable body는 face와 합성되어야 채팅 아이콘이 결정되는 구조라 자체 아이콘이 없습니다.
- NOT NULL 제약 추가 금지, UI에서 빈 셀로 처리합니다.

### V13 신고 / V14 공지 / V15 호환
- 신고 도메인(V13), 공지 도메인(V14)은 백엔드 schema 버전으로 관리됩니다.
- V15 schema는 V14 호환 컬럼이 추가되어 있고, prod 진입 가드가 있습니다 — 자세한 내용은 backend README.

### 첫 DJ 등록 직후 silent deactivate는 정상
- `enqueueDj` 직후 `PLAYBACK_DEACTIVATED` + 빈 djs 배열 응답이 오는 경우: 첫 트랙 길이가 파티룸 `playbackTimeLimit`를 초과한 케이스.
- 의도된 동작이며 admin UI는 이 상태를 사용자 친화적인 메시지로 보여줄 책임이 있습니다.

## 외부 링크 & 참고

### PFPlay 프로젝트 링크
- Notion FE 위키: `<TODO notion-fe-wiki-url>`
- Notion 환경변수 페이지: `<TODO notion-env-page>`
- Slack 채널: `<TODO slack-channel>`
- Figma: `<TODO figma-link>`

### 관련 리포
- [pfplay-platform](https://github.com/pfplay/pfplay-platform) — backend (Spring Boot 3, Java 21)
- `<TODO pfplay-web-url>` — 사용자 프론트 (Next.js)

### 기술 레퍼런스
- [Feature-Sliced Design](https://feature-sliced.design/) — 아키텍처 레이어 원칙
- [TanStack Query](https://tanstack.com/query/latest) — server state 패턴
- [shadcn/ui](https://ui.shadcn.com/) — UI 컴포넌트 패턴
- [Cloudflare Pages](https://developers.cloudflare.com/pages/) — 배포 플랫폼

---

Built with React 18 + Vite 6 + TypeScript 5 + Tailwind CSS 4 on Cloudflare Pages.
