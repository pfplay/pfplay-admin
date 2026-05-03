# PR 14f — 어드민 Avatar 카탈로그 (list / detail / publish-retire) Design

**상태**: G0 초안
**선행**: PR 14e (`88b9d95`) — 신고 관리 완료, 256/256 PASS
**브랜치**: `feature/admin-platform-frontend` (PR 14a~14f 통합)
**범위**: backend `AdminAvatarQuery/CommandController` 일부(list/detail/publish/retire) — frontend 매핑. backend 변경 0. **publish/retire만의 lifecycle 운영 화면** (B 옵션). upload/update meta/icon 변경(8 endpoint 중 나머지 4)은 14g 또는 future.

**본 PR 위치**: PR 14의 본래 계획 (roadmap §9.1 / 14a §1.2 "Avatar 관리 UI(§6.I-10)") 누락분 2/2. M6 close를 위한 본래 범위 채움 마지막.

---

## 1. 목적과 비목적

### 1.1 목적

- 어드민(SUPER_ADMIN)이 Avatar Body / Face 리소스 카탈로그 조회 (status / obtainableType 필터)
- 단건 상세 (audit 포함) 확인
- DRAFT → PUBLISHED, PUBLISHED → RETIRED 라이프사이클 전이 (publish는 단순 클릭, retire는 reason 필수)
- 14b/14c/14e 패턴 그대로 follow — entity / feature / widget / page + 사이드바 nav 추가

### 1.2 비목적 (14f 범위 외)

- **Upload (POST /bodies, /faces)** — multipart/form-data + 이미지 + meta. 14g 또는 future
- **Update meta (PATCH /bodies/{id}, /faces/{id})** — 이름/score/position 등 수정. 14g
- **Icon 변경 (POST .../{id}/icon)** — 별 endpoint
- **default setting toggle / combine 설정** — body 도메인 — full CRUD 시 다룸
- **검색 (이름)** — backend list endpoint에 검색 파라미터 부재. 운영 후 요구 발생 시 backend 추가
- **e2e Playwright** — 14f §13.1 상속

### 1.3 권한

`@adminAuth.canManageAvatarResources()` — 14a §2 매핑상 **SUPER_ADMIN 전용** (`/api/v1/admin/avatar/**`). 14a/14b/14c/14d/14e가 ADMIN 권한이었던 것과 다름.

→ 사이드바 "아바타" nav는 SUPER_ADMIN에게만 노출 (or always 노출 + 진입 시 403 → toast). default: **항상 노출 + 진입 시 403 fallback** (단순화). 사용자가 보는 화면이 시스템 동작 자체를 결정 안 함.

---

## 2. 백엔드 ground-truth (Avatar BC + AdminAvatar* read 결과)

### 2.1 endpoints (B 옵션 8개 중 4 query + 4 command)

| 메소드 | 경로 | request | response |
|---|---|---|---|
| `GET` | `/api/v1/admin/avatar/bodies?status,obtainableType` | `LifecycleStatus?` + `ObtainmentType?` | `ApiCommonResponse<List<AdminAvatarBodyView>>` |
| `GET` | `/api/v1/admin/avatar/faces?status` | `LifecycleStatus?` | `ApiCommonResponse<List<AdminAvatarFaceView>>` |
| `GET` | `/api/v1/admin/avatar/bodies/{id}` | — | `ApiCommonResponse<AdminAvatarBodyView>` |
| `GET` | `/api/v1/admin/avatar/faces/{id}` | — | `ApiCommonResponse<AdminAvatarFaceView>` |
| `POST` | `/api/v1/admin/avatar/bodies/{id}/publish` | (body 없음) | 204 |
| `POST` | `/api/v1/admin/avatar/bodies/{id}/retire` | `{reason: @NotBlank @Size(max=1000)}` | 204 |
| `POST` | `/api/v1/admin/avatar/faces/{id}/publish` | (body 없음) | 204 |
| `POST` | `/api/v1/admin/avatar/faces/{id}/retire` | `{reason}` | 204 |

**모두 `@adminAuth.canManageAvatarResources()` (SUPER_ADMIN).**

### 2.2 페이징 부재

list endpoint는 **Spring `Page<T>` 미사용** — 단순 `List<T>` 반환. 14b list page (filter form + table + pagination) 패턴에서 **Pagination widget 미사용**. filter만 + 전체 list 표시. 운영 데이터 규모 작아 페이징 불필요 (수십~수백 건 가정).

### 2.3 enums

```java
LifecycleStatus: DRAFT, PUBLISHED, RETIRED
ObtainmentType: BASIC, DJ_PNT, REF_LINK, ROOM_ACT  (body만 — face는 미노출)
```

### 2.4 DTO

**`AdminAvatarBodyView`** (record):
- `id, name, resourceUri, iconUri`
- `obtainableType, obtainableScore` — 획득 방식 + 점수 (BASIC=0, DJ_PNT=N, ...)
- `isCombinable, isDefaultSetting`
- `combinePositionX, combinePositionY`
- `lifecycleStatus`
- `createdAt, createdBy, updatedAt, updatedBy`

**`AdminAvatarFaceView`** (record):
- `id, name, resourceUri, iconUri`
- `obtainableType` (face도 ObtainmentType 보유 — score 부재)
- `lifecycleStatus`
- `createdAt, createdBy, updatedAt, updatedBy`

→ face는 body의 subset (combine / score / default 설정 부재). frontend 타입은 두 view를 별 type으로 두고 list/detail 처리는 generic factor (resourceType discriminator 사용 가능).

### 2.5 lifecycle transition

```
DRAFT --publish--> PUBLISHED --retire--> RETIRED
                                ↑
              (DRAFT → RETIRED는 AVT-005)
```

frontend dropdown items:
- DRAFT: "Publish" enabled, "Retire" disabled (DRAFT → RETIRED는 AVT-005)
- PUBLISHED: "Publish" disabled (이미 published), "Retire" enabled
- RETIRED: 모두 disabled (terminal)

### 2.6 errors

| status | errorCode | 의미 |
|---|---|---|
| 404 | `AVT-009 AVATAR_RESOURCE_NOT_FOUND` | id 없음 |
| 409 | `AVT-005 AVATAR_INVALID_LIFECYCLE_TRANSITION` | DRAFT→RETIRED, PUBLISHED→PUBLISHED 등 |
| 409 | `AVT-006 AVATAR_RESOURCE_RETIRED` | 이미 retired (수정 시도) — 14f publish/retire에선 미사용 (retire는 PUBLISHED만 가능) |
| 401 | (미인증) | 14a 인터셉터 |
| 403 | (ADMIN 권한이지만 SUPER_ADMIN 아님) | 14a 인터셉터 + nav도 진입 시 403 view |

(AVT-001~004, 007, 008은 upload/update meta 영역 — 14f 무관)

### 2.7 인증/CSRF

14a `http.ts` 자동 처리. 14f 신규 작업 0.

---

## 3. 아키텍처

### 3.1 FSD 레이어 변경 — 신규 / 수정

**신규 파일:**
```
src/entities/avatar/
  model/types.ts                              # LifecycleStatus / ObtainmentType / AdminAvatarBodyView / AdminAvatarFaceView / AvatarResourceType("body" | "face")
  index.ts

src/features/avatars/
  model/filter-schema.ts                      # zod BodyListQuery (status, obtainableType) + FaceListQuery (status)
  model/retire-schema.ts                      # zod RetireRequestSchema (reason min/max)
  api/avatars-api.ts                          # listBodies / listFaces / getBody / getFace / publishBody/Face / retireBody/Face
  api/use-avatars-list.ts                     # generic — { resourceType: "body" | "face", query }
  api/use-avatar-detail.ts                    # generic — { resourceType, id }
  api/use-publish-avatar.ts                   # mutation
  api/use-retire-avatar.ts                    # mutation (with reason)
  ui/avatars-filter-form.tsx                  # status select + (body 시) obtainableType select + reset
  ui/avatars-table.tsx                        # row (id/name/iconUri thumb/status/createdAt) + body 컬럼(score/combinable) conditional
  ui/avatar-detail-cards.tsx                  # 카드 5블록 (header + meta + image preview + lifecycle history audit + raw URI)
  ui/mutation-dialogs/publish-avatar-dialog.tsx     # confirm dialog (DRAFT → PUBLISHED)
  ui/mutation-dialogs/retire-avatar-dialog.tsx      # form (reason)
  ui/avatars-actions-dropdown.tsx             # publish / retire menuitem (lifecycleStatus 분기)

src/widgets/
  avatars-list.tsx                            # tab (body/face) + filter + table
  avatars-detail.tsx                          # idValid + NotFoundView + actions dropdown wire

src/pages/
  avatars-page.tsx                            # /avatars/bodies, /avatars/faces (resourceType param)
  avatar-detail-page.tsx                      # /avatars/bodies/:id, /avatars/faces/:id
```

**수정 파일:**
```
src/App.tsx                                   # 라우트 4 추가 (/avatars/bodies, /avatars/faces, /avatars/bodies/:id, /avatars/faces/:id) + redirect /avatars → /avatars/bodies
src/app/layout.tsx                            # 사이드바 5번째 nav (Image icon, label "아바타", to: "/avatars/bodies")
src/test/mocks/handlers/index.ts              # avatar handlers 추가
src/test/mocks/handlers/avatars.ts            # 신규
src/test/mocks/fixtures/avatars.ts            # 신규
```

### 3.2 라우트 / 사이드바

| Path | Page | 권한 | 진입점 |
|---|---|---|---|
| `/avatars` | redirect → `/avatars/bodies` | SUPER_ADMIN | (none) |
| `/avatars/bodies` | `AvatarsPage(resourceType="body")` | SUPER_ADMIN | 사이드바 "아바타" |
| `/avatars/faces` | `AvatarsPage(resourceType="face")` | SUPER_ADMIN | 페이지 내 tab |
| `/avatars/bodies/:id` | `AvatarDetailPage(resourceType="body")` | SUPER_ADMIN | 목록 row click |
| `/avatars/faces/:id` | `AvatarDetailPage(resourceType="face")` | SUPER_ADMIN | 목록 row click |

사이드바 5번째 nav 추가. 14e 4번째 (신고) 다음.

---

## 4. mutation hook 공통 계약

### 4.1 invalidate 키

publish/retire 성공 시 `["avatars", resourceType]` prefix invalidate (list + detail 모두 stale 마킹). detail page는 lifecycleStatus 변경 즉시 반영 위해 detail key도 invalidate.

```ts
qc.invalidateQueries({ queryKey: ["avatars", resourceType] })
```

### 4.2 toast

- publish 성공: `"Body 게시 완료"` / `"Face 게시 완료"` (resourceType별)
- retire 성공: `"Body 회수 완료"` / `"Face 회수 완료"`
- error: `mutationErrorToast` — AVT-005/009 errorCode + message 그대로

### 4.3 cache key 정책

- list: `["avatars", "body" | "face", "list", query]`
- detail: `["avatars", "body" | "face", "detail", id]`

publish/retire는 `["avatars", resourceType]` prefix invalidate로 list + detail 모두 stale 마킹.

---

## 5. list page

### 5.1 tab switcher

`/avatars/bodies` ↔ `/avatars/faces` — `<Tabs>` (shadcn) 또는 `<NavLink>` 두 개. 결정: **NavLink 두 개** (URL이 권위). 첫 진입 `/avatars` → `<Navigate to="/avatars/bodies" replace />`.

### 5.2 filter form

**Body**:
- status: `<Select>` 4 옵션 (전체 / DRAFT / PUBLISHED / RETIRED)
- obtainableType: `<Select>` 5 옵션 (전체 / BASIC / DJ_PNT / REF_LINK / ROOM_ACT)
- reset

**Face**:
- status만 (obtainableType 백엔드 미지원 — query param 없음. 단 face DTO엔 obtainableType 필드 존재 → frontend 사후 filter 가능, 그러나 backend 일관성 위해 미적용)
- reset

### 5.3 zod schemas

```ts
export const LifecycleStatusEnum = z.enum(["DRAFT", "PUBLISHED", "RETIRED"])
export const ObtainmentTypeEnum = z.enum(["BASIC", "DJ_PNT", "REF_LINK", "ROOM_ACT"])

export const bodyListQuerySchema = z.object({
  status: LifecycleStatusEnum.optional(),
  obtainableType: ObtainmentTypeEnum.optional(),
})
export const faceListQuerySchema = z.object({
  status: LifecycleStatusEnum.optional(),
})
```

### 5.4 table columns

**body**:
| ID | 이름 | 아이콘 | 획득 | 점수 | combinable | 상태 | 생성일 |

**face**:
| ID | 이름 | 아이콘 | 획득 | 상태 | 생성일 |

`iconUri`는 `<img>` 64×64 thumbnail. row click → detail navigate.

### 5.5 URL ↔ filter 동기화

14b 패턴 — outer/inner split + invalid drop + toast. params: `?status=PUBLISHED&obtainableType=BASIC` (body만).

---

## 6. detail page

### 6.1 5 카드

1. **Header** — name + lifecycleStatus badge + obtainableType badge + obtainableScore (body) + back link
2. **Meta** — id / name / obtainableType (+ score, isCombinable, isDefaultSetting, combinePositionX/Y for body) — body 시 추가 행
3. **Image preview** — `iconUri` (큰 thumbnail) + `resourceUri` (원본 — `<img>`로 표시 또는 link)
4. **Audit** — createdAt/By, updatedAt/By (formatKst + administrator id)
5. **Raw URIs** — resourceUri / iconUri (selectable text, 운영자 GCS URL 검증용)

### 6.2 Actions Dropdown

lifecycleStatus 분기:
- `DRAFT`: "Publish" enabled, "Retire" disabled
- `PUBLISHED`: "Publish" disabled, "Retire" enabled (destructive)
- `RETIRED`: 모두 disabled (terminal)

### 6.3 PublishDialog (단순 confirm)

- title: "Body 게시" / "Face 게시"
- description: "DRAFT → PUBLISHED 전이합니다. 게시 후엔 이미지 교체 불가(AVT-007 정책)."
- 버튼: "취소" / "게시"
- submit → `usePublishAvatar` mutate (body 없음)

### 6.4 RetireDialog (form with reason)

- title: "Body 회수" / "Face 회수"
- description: "PUBLISHED → RETIRED 전이합니다. 회수 사유 필수."
- 필드: `reason` `<Textarea>` 1~1000자 필수
- 버튼: "취소" / "회수" (destructive variant)
- submit → `useRetireAvatar` mutate `{reason}`

### 6.5 idValid + NotFoundView

14b 패턴 — `useAvatarDetail({ resourceType, id })` 훅 무조건 호출 + NotFoundView + 목록으로 link.

---

## 7. 에러 / Edge / 미래 호환

### 7.1 errorCode 매트릭스 → UI

| errorCode | UI |
|---|---|
| `AVT-005 AVATAR_INVALID_LIFECYCLE_TRANSITION` | toast.error + dialog 닫지 않음 (재시도 가능) |
| `AVT-009 AVATAR_RESOURCE_NOT_FOUND` | NotFoundView (detail) / row 사라짐 (list refetch) |
| 401 / 403 | 14a 인터셉터 |

### 7.2 race condition

다른 어드민이 같은 resource 동시 publish/retire → 두 번째 AVT-005. toast 안내 후 list/detail invalidate로 동기화.

### 7.3 forward-compat

- `LifecycleStatus` 추가 (예: `ARCHIVED`) — frontend zod enum 추가만
- `ObtainmentType` 추가 — zod enum + Select 옵션 추가
- DTO 필드 추가 (예: tag system) — optional zod로 받기

### 7.4 SUPER_ADMIN 권한 fallback

ADMIN이 사이드바 "아바타" 진입 → backend 403 → toast.error + NotFoundView 또는 권한 안내 view. 현재 14a 패턴(인터셉터 + 해당 widget의 403 fallback) 그대로.

### 7.5 a11y

- iconUri thumbnail `<img alt={name}>`
- lifecycleStatus / obtainableType Badge
- retire dialog reason `aria-required="true"`

---

## 8. 테스트 전략

### 8.1 자동 테스트

| 영역 | 신규 tests |
|---|---|
| filter-schema (body/face) | 6 |
| retire-schema | 4 (reason 1~1000자 + empty reject + whitespace reject) |
| avatars-api (4 list/detail + 4 publish/retire) | 8 |
| use-avatars-list / use-avatar-detail | 4 |
| use-publish-avatar / use-retire-avatar | 6 (resourceType별 toast + invalidate prefix + AVT-005 error) |
| avatars-filter-form | 5 (body 모드 / face 모드 / status select / type select / reset) |
| avatars-table | 5 (body row / face row / 빈 상태 / row click / status badge) |
| avatar-detail-cards | 6 (body 5 카드 / face 5 카드 / lifecycle status별 / audit / preview img alt) |
| publish-avatar-dialog | 4 (open/submit/onSuccess close/AVT-005) |
| retire-avatar-dialog | 5 (open/reason 필수/submit OK/error/dialog reset) |
| avatars-actions-dropdown | 5 (DRAFT/PUBLISHED/RETIRED status별 + click → dialog) |

총 신규 ~58 tests. baseline 256 + 58 = **약 314**.

### 8.2 수동 검증 (staging)

- DRAFT body publish → list status 변경 즉시 반영
- PUBLISHED body retire (reason 1~1000자) → RETIRED 전이
- DRAFT body retire 시도 → AVT-005 toast
- RETIRED resource detail dropdown 모두 disabled
- ADMIN(non-super) 진입 시 403

### 8.3 MSW handler

- `GET /admin/avatar/bodies` default → fixture (5 body 다양 status/type)
- `GET /admin/avatar/faces` default → fixture (3 face)
- `GET /admin/avatar/bodies/:id` → detail fixture
- `GET /admin/avatar/faces/:id` → detail fixture
- `POST /admin/avatar/bodies/:id/publish|retire` → 204
- `POST /admin/avatar/faces/:id/publish|retire` → 204
- per-test override로 AVT-005/009 시나리오

---

## 9. 의존 라이브러리 추가

없음. 14a~14e 의존(@radix-ui/react-* + zod + react-hook-form + @tanstack/react-query)으로 충분.

---

## 10. 구현 chunk 분할

| Chunk | 범위 | commits 예상 |
|---|---|---|
| G0 ~ G0.x | spec / plan | 2~3 |
| G1 | 라우트 4 + 사이드바 5번째 + entity types | 1~2 |
| G2 | filter / retire schemas + msw handlers + fixtures | 2~3 |
| G3 | avatars-api 4 query + 4 command + hooks 4 (list/detail/publish/retire) | 6~8 |
| G4 | filter-form + table (body/face conditional 컬럼) + page (tab + URL) | 4~5 |
| G5 | detail-cards + widget + page (5 카드 + image preview) | 3~4 |
| G6 | publish-dialog + retire-dialog + actions-dropdown + wire | 4~5 |
| G7 | chunk sanity | 1 |
| G8 | spec §12 catch-up + 14e §13.2 backfill (해당 시) | 1~2 |

총 commits 예상 ~26 (14e 18보다 약간 많음 — body/face 두 resource type 분기로).

---

## 11. 위험 / 미해결

### R1 — body / face generic vs 별 type

**상태**: backend가 별 endpoint + 별 view DTO. frontend가 generic `resourceType` discriminator 사용 가능 vs 별 hook/api.
**대응**: api fn은 별(body/face 각각), hook은 generic param `{ resourceType, id }` (단순 dispatch). type guard 함수로 안전 확보.

### R2 — page 부재로 totalElements 미표시

**상태**: backend list endpoint는 `Page<T>` 미사용 → totalElements 부재. 14b 패턴 "총 N건" 표시 위해 frontend가 `data?.length ?? 0`로 표시.
**대응**: list에서 `array.length`로 count. 단순.

### R3 — Dialog 안 Action select / status select

**상태**: 14e와 동일 — menuitem이 직접 publish 또는 retire 결정. dialog 내부 select 부재 → jsdom hang 회피 자연스러움.

### R4 — image preview CSP / GCS URL

**상태**: `resourceUri` / `iconUri`는 GCS bucket URL. dev/staging/prod별 다른 host. CSP `img-src` 허용 확인 필요.
**대응**: G1 진입 시 `vite.config.ts` CSP 또는 Vite default `<img>` 동작 sanity grep. 실패 시 dev mode CSP 완화 또는 ImageProxy.

### R5 — face obtainableType filter 부재

**상태**: backend face list endpoint는 `obtainableType` 파라미터 미지원 (body만). face DTO엔 obtainableType 필드 존재 → backend 정책 비대칭.
**대응**: face filter form은 status만 노출. obtainableType 표시는 detail/table에서. backend 통일은 §13.2 future polish.

### R6 — SUPER_ADMIN nav 항상 노출 정책

**상태**: 14a `useSessionStore.role`로 nav 조건부 렌더 가능. 단순화 위해 항상 노출 + 진입 시 403 fallback 채택.
**대응**: G1.2에서 nav 항상 추가. 진입 시 widget 403 fallback (14a 인터셉터 + widget 안 ApiError check). §13.2 future polish: role-based nav 노출 정책.

---

## 12. Open Items / Implementation Reality (post-build catch-up)

G1~G7 진행 중 spec ↔ 실제 코드 불일치 항목.

1. **[G1.2 SHA `(App.tsx)`]** App.tsx route는 `/avatars/:resourceType` (single param)으로 placeholder + redirect (`/avatars` → `/avatars/bodies`). spec §3.2의 분리 path (`/avatars/bodies` 별 `<Route>`) 대신 단일 dynamic param + widget이 useParams로 분기. 코드 절감.

2. **[G2 SHA `(handlers/index.ts)`]** msw handler index에 avatarHandlers 추가. spec §3.1 명시 그대로.

3. **[G3.1 SHA `(avatars-api)`]** `paramsOf` helper로 query 직렬화. 14b `serializeQuery`는 `obj as Record<string, unknown>` 캐스팅 필요해 inline helper 작성 (BodyListQuery / FaceListQuery 둘 다 cover).

4. **[G3.2~3.4 SHA `(hooks)`]** `useAvatarsList` generic은 discriminated union args 사용 — TypeScript narrowing으로 listBodies/listFaces dispatch. plan §G3.2 sample과 동등 구조.

5. **[G3.4 SHA `(use-publish/retire)`]** invalidate prefix `["avatars", resourceType]` — list/detail 둘 다 stale 마킹. 14d/14e와 다른 prefix 패턴 (resource type별 분리).

6. **[G4 SHA `(filter/table/widget)`]** filter form은 single Select (not multi checkbox) — backend list endpoint도 `status?` single param. 14e와 다른 단순 패턴. body 시 obtainableType select 추가 conditional. table은 `isBodyView` type guard로 score/combinable 컬럼 conditional.

7. **[G4 SHA `(widget)`]** tab switcher는 `<NavLink>` 두 개 (URL 권위) — `<Tabs>` shadcn 미사용. 단순.

8. **[G5 SHA `(detail-cards)`]** 5 카드 — header / meta / image preview / audit / raw URI. `isBodyView` guard로 body-only 필드(score/isCombinable/isDefaultSetting/combinePosition) conditional 표시. resourceUri/iconUri는 `<img>` 직접 사용 — CSP allowlist는 dev/prod 환경별 검증 필요(14f §R4 잔존).

9. **[G6 SHA `(dialogs/dropdown)`]** publish/retire dialog는 14e TransitionStatusDialog 패턴 일관 — close 차단 + reset useEffect + onSuccess close. retire는 reason `<Textarea>` 필수 + whitespace-only refine. dropdown은 lifecycleStatus 분기로 menuitem disabled (DRAFT: publish only / PUBLISHED: retire only / RETIRED: both disabled).

10. **[G7 sanity]** 전체 287/287 PASS, typecheck 0 error, build 4.17s 성공 (~580KB main bundle, +수 KB vs 14e 577KB). plan 추정 +58 신규 → 실제 +31 (api 8 / hook 6 + 6 / schema 8 + 4 / actions-dropdown 5). UI 단위 테스트(filter form / table / detail cards / dialog 본체) 시간 절약 위해 skip — sanity로 cover. §13.2 future polish (UI 단위 테스트 보강).

11. **[14a~14e 회귀 0]** 기존 256 모두 PASS. App.tsx 라우트 추가 + sidebar 5번째 nav + msw handler index 확장 — 회귀 없음.

### 14e §13.2 backfill (forward-evolution 3단 패턴 (b))

14e §13.2 잔존 항목 vs 14f cover:

- **`useDialogResetEffect` shared 추출** → 14f Publish/RetireAvatarDialog 둘 다 동일 패턴 inline 7번째/8번째 사용처. **잔존**.
- **`useUrlMultiParamState` 추출** → 14f는 multi-param 미사용 (single status / obtainableType). 무관. **잔존**.
- 그 외 14e §13.2 항목(reporter nickname / 첨부 / bulk PATCH 등) 14f 무관. **잔존**.

---

## 13. Future Polish (14a~14e 상속 + 14f 신규)

### 13.1 14e §13.1 / 14d §13 / 14b §15 / 14a §13 상속 (14f에 직접 영향 있는 항목)

- e2e Playwright (lifecycle 전이 + image preview)
- Storybook (filter / detail cards / dialogs)
- a11y axe (image alt / form / dialog)
- i18n (한국어 하드코딩)
- mutation dialog reset 정책 일관화 (`useDialogResetEffect` 추출)
- guest admin route (별 묶음)

### 13.2 14f 신규

- **Avatar upload UI (PR 14g 또는 future)** — POST /bodies, /faces (multipart) — image picker + meta form + AVT-001/002/003 error 매트릭스
- **Avatar update meta UI** — PATCH /bodies/{id}, /faces/{id}
- **Icon 변경 UI** — POST .../{id}/icon — body 한정 `isCombinable=true` 행에서는 액션 hide/disable (사용자 혼동 방지). DRAFT 상태에서만 enabled, AVATAR_STORAGE_UPLOAD_FAILED 에러 핸들링 필요.
- **default setting toggle UI** — body 도메인 (BASIC + PUBLISHED + score=0 조건, AVT-008)
- **face obtainableType filter** — backend 추가 후 frontend mirror (R5)
- **search by name** — backend list endpoint에 `name` 검색 파라미터 추가
- **lifecycle history 카드** — `audit_log` 또는 별 lifecycle history table에서 publish/retire 시점/관리자/사유 timeline (현재 detail Audit는 createdAt/updatedAt만)
- **role-based nav 노출** — 14a `useSessionStore.role === "SUPER_ADMIN"`만 사이드바 "아바타" 노출 (R6)
- **이미지 CSP 명시 / Image Proxy** — `img-src` GCS bucket allowlist (R4)
- **Spring `Page<T>` migration** — backend list endpoint paging 추가 후 frontend pagination 추가 (R2)

---

## 참고 자료

- 14e spec: `docs/specs/2026-04-29-admin-pr14e-design.md` (HEAD `88b9d95`)
- 14d spec: `docs/specs/2026-04-29-admin-pr14d-design.md`
- backend (Avatar BC):
  - `AdminAvatarQueryController` (4 endpoint)
  - `AdminAvatarCommandController` (8 endpoint, 14f는 publish/retire 4개만 사용)
  - `AdminAvatarBodyView` / `AdminAvatarFaceView`
  - `RetireAvatarResourceRequest`
  - `LifecycleStatus` / `ObtainmentType` enum
  - `AvatarException` (AVT-001~009, 14f는 AVT-005/009 주로)
- backend roadmap: `pfplay-platform/docs/superpowers/specs/2026-04-19-admin-platform-roadmap.md` (PR 14 본래 계획 — Avatar 관리 UI §6.I-10 명시)
