# Architecture

> 이 콘솔의 코드를 처음 만질 때 읽는 문서. 기능 목록은 [`../README.md`](../README.md) 를 본다.
> 실사 기준: 2026-07-31 (`origin/develop`).

## 1. 한 줄 요약

**서버가 진실, 콘솔은 뷰다.** 이 앱에는 도메인 로직이 거의 없다. 권한 판정·불변식·감사는 전부
백엔드가 하고, 콘솔은 그 결과를 보여주고 명령을 보낸다. 화면에서 뭔가를 "막는" 코드는 UX 편의일
뿐 보안 경계가 아니다.

## 2. 레이어 (FSD)

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
```

| 레이어 | 담는 것 | 담지 않는 것 |
|---|---|---|
| `app` | 전역 레이아웃(사이드바), 라우트 진입 | 도메인 지식 |
| `pages` | 라우트 하나에 대응하는 조합 | 재사용 UI |
| `widgets` | 목록/상세 같은 페이지 블록 | 라우팅 |
| `features` | 사용자 시나리오(생성·수정·검색 폼과 그 mutation) | 페이지 조립 |
| `entities` | 도메인 타입 + 쿼리 키 + API 호출 | UI |
| `shared` | fetch 래퍼, URL 상태 훅, 포맷터, UI 프리미티브 | 도메인 지식 |

상위 레이어만 하위를 import 한다. 같은 레이어끼리의 교차 참조도 피한다 — 공통이 생기면
한 층 내린다.

## 3. 데이터 흐름

```
컴포넌트
  └─ TanStack Query (useQuery / useMutation)
       └─ entities/<도메인>/api  ─ 호출 ─→  shared/api/http.ts
                                              └─ fetch(credentials: "include")
                                                   → pfplay-platform /api/v1/admin/**
```

### 서버 상태 vs 클라이언트 상태

| 종류 | 도구 | 예 |
|---|---|---|
| 서버 상태 | TanStack Query | 목록, 상세, 통계 |
| 세션 메타 | Zustand + `persist`(localStorage) | 로그인 여부, 역할, `mustChangePassword` |
| 화면 상태 | URL 쿼리스트링 (`shared/lib/url-state`, `use-url-query-state`) | 페이지·검색어·필터 |

> **필터·페이지는 컴포넌트 state 가 아니라 URL 에 둔다.** 새로고침·뒤로가기·링크 공유가
> 그대로 동작해야 하기 때문이다. 새 목록 화면을 만들 때 기존 훅을 재사용한다.

## 4. HTTP 레이어 (`shared/api/http.ts`)

`fetch` 한 겹 래퍼다. 규약이 네 가지다.

1. `credentials: "include"` — 어드민 쿠키를 항상 실어 보낸다.
2. **CSRF** — POST/PUT/PATCH/DELETE 면 `XSRF-TOKEN` 쿠키를 읽어 `X-XSRF-TOKEN` 헤더로 되돌린다.
   쿠키가 없으면 헤더 없이 나가고 서버가 거절한다(로그인 직후 첫 GET 이 쿠키를 심는다).
3. **401 → 세션 클리어 + `/login` 이동.** 로그인 요청만 `skip401Redirect: true` 로 예외.
4. 에러는 `ApiError` 로 정규화한다(`shared/api/error.ts`) — 화면은 상태 코드가 아니라
   이 타입을 본다.

## 5. 권한

- 사이드바 항목에 `role: "SUPER_ADMIN"` 이 붙으면 일반 ADMIN 에게는 **숨긴다**.
- 숨김은 노출 축소일 뿐이다. **서버가 403 을 주는 것이 실제 경계**이며, 콘솔은 그 403 을
  사용자에게 읽히는 메시지로 바꿀 뿐이다.
- 라우트 보호는 `widgets/protected-route` 가 세션 스토어를 보고 처리한다.

## 6. 폼

React Hook Form + Zod. 스키마는 해당 feature 안에 둔다.

- 클라이언트 검증은 **왕복을 아끼는 것**이 목적이다. 서버 검증을 대체하지 않는다.
- 서버가 필드 단위 에러를 주면 `use-refine-error` 로 폼 필드에 되돌려 붙인다.
- mutation 결과 토스트는 `mutation-toast` 로 통일한다(성공/실패 메시지 형식이 흩어지지 않게).

## 7. 시간 표기

백엔드는 KST 로 동작하고 응답도 KST 기준이다. 화면 표기는 `shared/lib/format-kst` 하나로
통일한다 — 개별 화면에서 `toLocaleString()` 을 직접 쓰지 않는다.

## 8. 테스트 전략

- **MSW 로 HTTP 를 가로채는 통합 성향 테스트**가 기본이다. 화면을 렌더하고, 실제로 쿼리가 나가고,
  응답에 따라 UI 가 바뀌는지 본다. 훅 단위 목킹보다 이쪽을 선호한다.
- 목 핸들러는 `src/test/mocks/` 에 모은다.
- jsdom 에 없는 브라우저 API(`hasPointerCapture` / `setPointerCapture` / `scrollIntoView` /
  `ResizeObserver`)를 `src/test/setup.ts` 가 폴리필한다. **Radix 컴포넌트 테스트가 이유 없이
  깨지면 여기부터 확인한다.**

## 9. 새 화면을 추가할 때

1. `entities/<도메인>` 에 타입 + 쿼리 키 + API 호출을 만든다.
2. `features/<시나리오>` 에 폼/액션과 mutation 을 만든다.
3. `widgets` 에 목록·상세 블록을, `pages` 에 조합을 만든다.
4. `App.tsx` 에 라우트를, 필요하면 `app/layout.tsx` 사이드바에 항목을 추가한다
   (SUPER_ADMIN 전용이면 `role` 지정).
5. 목록이면 페이지·필터를 **URL 상태**로 넣는다.
6. MSW 핸들러와 함께 테스트를 추가한다.
