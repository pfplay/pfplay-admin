# PFPlay Admin Console

PFPlay 서비스 **운영 콘솔**. 회원·파티룸·신고·공지·아바타 같은 운영 업무와, 빈 방을 채우는
**가상 크루(봇)** 관리를 한다.

> 실사 기준: 2026-07-31 (`origin/develop`).
> 문서 색인: [`docs/DOCS_ENTRY.md`](docs/DOCS_ENTRY.md)

## 기능 (사이드바 구조 그대로)

| 구획 | 메뉴 | 경로 | 권한 |
|---|---|---|---|
| — | 대시보드 | `/` | ADMIN |
| **운영 관리** | 회원 | `/members`, `/members/:memberId`, `/guests/:guestId` | ADMIN |
| | 파티룸 | `/partyrooms`, `/partyrooms/:partyroomId` | ADMIN |
| | 신고 | `/reports`, `/reports/:reportId` | ADMIN |
| | 사용자 피드백 | `/voc/bug-reports`, `/voc/bug-reports/:bugReportId` | ADMIN |
| | **가상 크루** — 봇 풀 / 송팩 / 페르소나 / 채팅 설정 / 크루 배치 | `/virtual-crew`, `/virtual-crew/:resourceType`, `/virtual-crew/song-packs/:packId` | ADMIN |
| **시스템 관리** | 어드민 관리 | `/administrators`, `/administrators/:administratorId` | **SUPER_ADMIN** |
| | 공지 | `/announcements`, `/announcements/history` | **SUPER_ADMIN** |
| | 아바타 | `/avatars/:resourceType`, `/avatars/:resourceType/:id` | **SUPER_ADMIN** |
| (레이아웃 밖) | 로그인 / 비밀번호 변경 | `/login`, `/password/change` | — |

주요 화면의 성격:

- **파티룸 상세** — 방 정보뿐 아니라 **행동 분석**(일별 입퇴장 집계, 무음 이탈, DJ 이력)을 함께 본다.
- **가상 크루 허브** — 봇 풀·송팩·페르소나·배치를 한 화면에서 접이식으로 조망하고, 각 리소스
  탭으로 이동한다. 크루 배치는 파티룸 단위로 총원과 DJ 봇 수를 정한다.
- **공지** — 일반 공지와 **점검 라이프사이클**(예고 → ACTIVE → 종료)을 같은 화면에서 다룬다.
  점검 상태는 백엔드 필터·프론트 Edge Config·WS 오버레이 3경로로 전파된다.

## 기술 스택

| 영역 | 사용 |
|---|---|
| 코어 | React 18.3 · TypeScript 5 · **Vite 6** (dev 서버 포트 3000) |
| 라우팅 | React Router DOM 7 (`<Routes>` 선언형, `src/App.tsx`) |
| 서버 상태 | TanStack Query 5 |
| 클라이언트 상태 | Zustand 5 (+ `persist`), Immer |
| 폼·검증 | React Hook Form 7 + Zod 3 + `@hookform/resolvers` |
| UI | Tailwind CSS 4 (`@tailwindcss/vite`) · shadcn/ui (Radix 프리미티브) · lucide-react · sonner(토스트) · react-day-picker |
| 테스트 | Vitest 2 + Testing Library + **MSW 2** (jsdom) |

HTTP 클라이언트는 별도 라이브러리 없이 `fetch` 래퍼(`src/shared/api/http.ts`) 하나다.

## 구조 (Feature-Sliced Design)

```
src/
├── app/          # 전역 레이아웃(사이드바 네비게이션) — layout.tsx
├── pages/        # 라우트별 페이지 (21개)
├── widgets/      # 페이지 블록 (목록/상세 위젯, pagination, protected-route)
├── features/     # 기능 슬라이스 (20개)
│   ├── members · guests · partyrooms · partyroom-analytics · reports · bug-reports
│   ├── announcements · avatars · administrators · dashboard-analytics
│   ├── login · logout · change-password · music-search
│   └── virtual-crew-{hub,pool,personas,song-packs,rooms,chat-config}
├── entities/     # 도메인 모델·쿼리 (administrator, announcement, avatar, bug-report,
│                 #                    guest, member, partyroom, report, session, virtual-crew)
├── shared/
│   ├── api/      # http.ts(fetch 래퍼) · csrf.ts · error.ts · page.ts
│   ├── config/   # env.ts
│   └── lib/      # query-client, url-state 훅, format-kst, labels, mutation-toast 등
├── components/ui # shadcn/ui 컴포넌트
├── App.tsx       # 라우트 선언
└── main.tsx      # 진입점
```

레이어 규칙: `app → pages → widgets → features → entities → shared`. 상위만 하위를 의존한다.

## 인증 · 권한

- 어드민 로그인은 **일반 서비스와 분리된 쿠키 도메인**을 쓴다(`admin.pfplay.xyz`).
  백엔드의 어드민 액세스 토큰은 **15분**으로 짧다.
- 상태 변경 요청(POST/PUT/PATCH/DELETE)에는 CSRF 더블 서브밋이 적용된다 —
  `XSRF-TOKEN` 쿠키를 읽어 `X-XSRF-TOKEN` 헤더로 되돌려준다(`shared/api/csrf.ts`).
- 401 응답을 받으면 `http.ts` 가 세션 스토어를 비우고 `/login` 으로 보낸다
  (로그인 요청만 `skip401Redirect` 로 예외).
- 세션 메타는 `localStorage` 에 persist 된다(`pfplay-admin-session`). 이는 **UI 상태일 뿐**이고
  실제 권한은 매 요청마다 서버가 판정한다.
- `mustChangePassword` 가 서 있으면 `/password/change` 로 유도한다.
- SUPER_ADMIN 전용 메뉴는 사이드바에서 숨겨지지만, **가림은 UI 편의이고 강제는 서버가 한다**.

> ⚠️ 어드민 API 경로에서 401 이 오면 라우트가 없는 게 아니라 **Security 가 먼저 차단**한 것일 수
> 있다. 404/401 을 라우트 존재 증명으로 쓰지 말 것.

## 로컬 실행

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

환경변수는 `.env.local` 에 둔다.

| 변수 | 뜻 | 기본값 |
|---|---|---|
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL | `http://localhost:8080` (미설정 시) |

`.env.example` 은 운영 값(`https://api.pfplay.xyz`)을 담고 있으므로, **로컬 백엔드를 붙일 때는
반드시 `.env.local` 로 덮어쓴다.** 안 그러면 로컬에서 운영 API 를 때린다.

## 테스트 · 빌드

```bash
pnpm test         # vitest watch
pnpm test:run     # 1회 실행 (현재 테스트 파일 153개)
pnpm test:ui      # vitest UI
pnpm lint
pnpm build        # tsc && vite build
```

- 테스트는 **MSW 로 HTTP 를 가로채는** 통합 성향이다(`src/test/setup.ts`, `src/test/mocks/`).
- jsdom 이 Radix 에 필요한 API(`hasPointerCapture`, `scrollIntoView`, `ResizeObserver`)를
  제공하지 않아 setup 에서 폴리필한다. Radix 컴포넌트 테스트가 갑자기 깨지면 이 목록부터 본다.

## 배포

**GitHub Actions 워크플로가 없다.** 호스팅 플랫폼(Vercel / Cloudflare) 네이티브 빌드로 배포된다.
따라서 "CI 가 초록인지" 를 확인할 곳은 이 레포가 아니라 호스팅 대시보드다.

브랜치는 `develop`(작업) → `main`(운영). **`develop` 머지는 운영 반영이 아니다** —
`develop → main` PR 을 따로 올려야 운영에 나간다.

## 운영 mutation 원칙

데이터 변경은 **위쪽 게이트부터** 시도한다.

```
어드민 콘솔 UI  >  어드민 API 엔드포인트  >  SQL 직접  >  curl 수동 호출
```

UI 로 되는 일을 SQL 로 하면 감사 로그와 도메인 이벤트가 통째로 빠진다.

## 관련 레포

| 레포 | 역할 |
|---|---|
| `pfplay-platform` | 백엔드 API (`/api/v1/admin/**`) |
| `pfplay-web` | 사용자 웹 |
| `pfplay-streaming` | 음악 검색 사이드카 |
