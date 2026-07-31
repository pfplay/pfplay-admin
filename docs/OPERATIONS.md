# Operations

> 이 콘솔을 **배포·운영**할 때 필요한 사실. 실사 기준: 2026-07-31.

## 1. 배포

**이 레포에는 GitHub Actions 워크플로가 없다.** 호스팅 플랫폼(Vercel / Cloudflare)의 네이티브
빌드가 배포를 수행한다. 그래서:

- 배포 성공/실패는 **호스팅 대시보드**에서 확인한다. 레포의 체크 표시가 아니다.
- 빌드 명령은 `pnpm build`(= `tsc && vite build`). **타입 에러가 곧 배포 실패**다.
- 환경변수는 호스팅 프로젝트 설정에 있다. 레포의 `.env*` 는 로컬 전용이다.

### 브랜치 → 환경

| 브랜치 | 의미 |
|---|---|
| `develop` | 작업 브랜치. 여기 머지해도 **운영에 나가지 않는다** |
| `main` | 운영 |

> 반복해서 밟는 함정: 기능 PR 을 `develop` 에 머지하고 "배포 끝" 이라고 판단하는 것.
> 운영 반영은 **`develop → main` PR** 을 따로 올려야 한다.

## 2. 환경변수

| 변수 | 뜻 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL. 미설정 시 `http://localhost:8080` |

⚠️ `.env.example` 에는 운영 값(`https://api.pfplay.xyz`)이 들어 있다. 로컬 백엔드에 붙이려면
`.env.local` 로 반드시 덮어쓴다. 안 그러면 **로컬 개발이 운영 API 를 때린다.**

도메인 참고: 운영 API `api.pfplay.xyz`, 검증 API `stg-api.pfplay.xyz`,
어드민 콘솔 `admin.pfplay.xyz`(검증 `stg-admin.pfplay.xyz`).

## 3. 인증 · 세션

- 어드민 쿠키는 서비스 웹과 **도메인이 분리**돼 있다(`admin.pfplay.xyz`). 통합하지 않는 것이
  의도된 결정이다.
- 백엔드 어드민 액세스 토큰은 **15분**. 오래 켜둔 탭은 401 을 만난다 → 콘솔이 자동으로
  세션을 비우고 `/login` 으로 보낸다.
- 상태 변경 요청에는 CSRF 더블 서브밋(`XSRF-TOKEN` → `X-XSRF-TOKEN`)이 필요하다. 로그인 직후
  첫 GET 이 쿠키를 심으므로, 로그인하자마자 mutation 을 쏘는 흐름은 실패할 수 있다.

## 4. 운영 mutation 3중 게이트

```
어드민 콘솔 UI  >  어드민 API 엔드포인트  >  SQL 직접  >  curl 수동 호출
```

- 위쪽부터 시도한다. UI 로 되는 일을 SQL 로 하면 **감사 로그와 도메인 이벤트가 통째로 빠진다.**
- SQL 을 쓸 수밖에 없다면 대상 행을 SELECT 로 먼저 확인하고, 되돌릴 방법을 정한 뒤 실행한다.
- 백엔드 테이블명은 **소문자**다(`crew`, `partyroom`, `user_profile` …).

## 5. 진단 시 유의

| 증상 | 흔한 원인 |
|---|---|
| 어드민 API 가 401 | 라우트 부재가 아니라 **Security 선차단**일 수 있다. 401/404 를 라우트 존재 증명으로 쓰지 말 것 |
| mutation 만 403/419 | CSRF 쿠키 미보유 — 로그인 직후 GET 없이 바로 mutation 한 경우 |
| 로컬에서 운영 데이터가 보임 | `.env.local` 누락으로 `.env.example` 의 운영 URL 이 적용됨 |
| 목록이 빈 채로 정상 응답 | 백엔드가 200 + 빈 페이지를 준 것인지, 필터가 URL 상태에 남아 있는지 확인 |

## 6. 백엔드 의존

콘솔의 거의 모든 화면이 `pfplay-platform` 의 `/api/v1/admin/**` 에 붙어 있다. 백엔드가 점검
모드면 콘솔도 함께 막힌다. 점검 상태의 진실은 백엔드의 `system_announcement` ACTIVE 행이며,
전파 경로는 백엔드 필터 · Vercel Edge Config · WS 3가지다(자세한 내용은 platform 레포
`docs/OPERATIONS.md`).
