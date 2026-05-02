# pfplay-admin ↔ pfplay-platform 어드민 API 정렬 감사

작성일: 2026-05-02
대상: `pfplay-admin/openapi.json` (73 paths 중 어드민 33개) 중 14a~14g가 cover한 **19 endpoint**
미포함: 아바타 upload/PATCH/icon (6) — 14f §1.2 비목적 / 14g §13 묶음 γ. 파티룸 penalty (2) — 14c §13.2 별 PR. F-1 거버넌스 (6) — 미계획.

## 진행 현황

| Chunk | 도메인 | endpoint 수 | drift | 상태 |
|---|---|---|---|---|
| C1 | 인증/세션 | 3 | 0 | ✓ |
| C2 | 회원 | 4 | **3** | ✓ (frontend 수정 필요 3건) |
| C3 | 파티룸 | 8 ops | **2** | ✓ (frontend 수정 필요 2건 + openapi.json 메타 발견 2건) |
| C4 | 신고 | 3 ops | 0 | ✓ |
| C5 | 아바타 lifecycle | 8 ops | 0 | ✓ |

## 분류 범례

- **✓** 정렬됨
- **△** frontend가 의도적으로 강화 (drift 아님 — 정책 layer / UX-only / type narrowing)
- **✗** drift — 추가 분류:
  - **① frontend 수정** — 프론트가 틀림, 실제 backend 응답에 맞춰 수정
  - **② 신규 backend ask** — backend 변경/검증 필요, `admin-backend-asks.md` 흡수
  - **③ 정책 결정 필요** — 의도가 어느 쪽인지 모호, 사용자 결정 후 분기

---

## C1. 인증/세션 (3 endpoint)

### C1.1 `POST /api/v1/auth/admin/login`

**Request — `AdminLoginRequest`**

| 필드 | OpenAPI 제약 | Frontend (`features/login/model/schema.ts` `loginSchema`) | 정렬 |
|---|---|---|---|
| `email` | required, string, min=0, max=255 | required, `.email()`, `.max(255)` | △ frontend가 email format 추가 강화 |
| `password` | required, string, min=8, max=128 | required, `.min(8)`, `.max(128)` | ✓ |

**Response 200 — `ApiCommonResponse<AdminLoginResponse>`** (`entities/session/api/session.ts`, `entities/session/model/types.ts`)

| 필드 | OpenAPI | Frontend `AdminLoginResponseRaw` | 정렬 |
|---|---|---|---|
| `tokenType` | string | `"Cookie"` literal | △ 의도적 narrowing |
| `expiresIn` | integer (int64) | number | ✓ |
| `issuedAt` | string, **format=date-time** | string (코멘트: "ISO 문자열로 직렬화 가정") | **△→ A4 보강 발견** (아래 §결론) |
| `role` | enum `[SUPER_ADMIN, ADMIN]` | `"SUPER_ADMIN" \| "ADMIN"` | ✓ |
| `mustChangePassword` | boolean | boolean | ✓ |

**Response 401 / 429 — `ApiErrorResponse`**

| 코드 | OpenAPI errorCode | Frontend 분기 |
|---|---|---|
| 401 | `AUTH_ADMIN_001` (이메일/비번 불일치), `AUTH_ADMIN_003` (동일) | message-only toast (`features/login/api/use-login.ts`) |
| 429 | `AUTH_ADMIN_002` (rate limit) | message-only toast |

→ frontend가 errorCode 분기 없음 — 단건 mutation 14c §7.1 매트릭스(errorCode → 분기)와 패턴 비대칭. **운영 결정 메모 1건** (§결론).

### C1.2 `POST /api/v1/auth/admin/logout`

| 항목 | OpenAPI | Frontend (`session.ts` `logout`) | 정렬 |
|---|---|---|---|
| Request | no body | no body | ✓ |
| Response | 200 OK, no body | `Promise<void>` | ✓ |

### C1.3 `POST /api/v1/admin/password/change`

**Request — `ChangeAdminPasswordRequest`**

| 필드 | OpenAPI 제약 | Frontend (`features/change-password/model/schema.ts`) | 정렬 |
|---|---|---|---|
| `currentPassword` | required, string (제약 없음) | required, `.min(8).max(128)` | △ 임시 비번 호환 폴백 (코멘트 line 7) |
| `newPassword` | required, string (제약 없음) | required, regex(`10+, A-Z, a-z, \d, !@#$%^&*`) | △ frontend 정책 layer (backend `@NotBlank`만) |
| `newPasswordConfirm` | (backend 미요구) | required + cross-field refine | △ UX-only |

**Cross-field refines**: `newPassword === newPasswordConfirm`, `newPassword !== currentPassword` — 모두 frontend-only.

**Response 200 OK**: ✓

### C1 결론

| 분류 | 건수 | 항목 |
|---|---|---|
| ✓ 정렬됨 | 다수 | 위 표 참조 |
| △ frontend 의도적 강화 | 7 | email format / tokenType narrow / currentPassword min(8) / newPassword regex / newPasswordConfirm / 두 cross-field refine |
| ✗ drift | **0** | 없음 |

**A4 보강 발견 → moot**:
- openapi.json은 `issuedAt`에 `format: date-time`을 명시 — RFC 3339(timezone 포함) 약속.
- 본 audit 직후 backend 코드 직접 확인 결과 **`AdminLoginResponse.issuedAt` 이미 `OffsetDateTime`** (`pfplay-platform/app/.../AdminLoginResponse.java:12`).
- 즉 contract drift는 spec 약속과 실제 코드 모두 동시 정렬됨 — A4는 backend가 이미 ship (`86714d29`). 재프레이밍 불필요.

**운영 결정 메모 1건**:
- 401/429 errorCode (`AUTH_ADMIN_001/002/003`) 활용 미정. 14c §7.1 단건 mutation 매트릭스가 errorCode → 분기 패턴인데 인증은 message-only.
- 결정 필요: (a) 현재 정책 유지 (인증은 message-only) (b) 인증도 errorCode 분기 (예: `AUTH_ADMIN_002` rate limit → 별 lockout UX). **본 audit 범위 외** — 별 폴리시 결정.

**신규 backend ask**: 0.

---

## C2. 회원 (4 endpoint)

### C2.1 `GET /api/v1/admin/members` — list

**Query 정렬**: `features/members/model/filter-schema.ts` `membersListQuerySchema`

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `email` | string | `.string().max(255).optional()` | △ frontend max 강화 |
| `tier` | enum [FM/AM/GT] | `TierEnum.optional()` | ✓ |
| `joined_from`/`joined_to` | string | `.regex(/^\d{4}-\d{2}-\d{2}$/).optional()` | △ frontend regex 강화 + cross-field `from <= to` refine |
| `page` | integer | `.int().min(0).default(0)` | △ default 추가 |
| `size` | integer | `.int().min(1).max(200).default(50)` | △ frontend max 200 cap (backend cap 미선언) |
| `sort` | string (enum 미선언) | `MemberSortEnum [created_at_desc, created_at_asc, last_activity_desc].default(...)` | △ frontend가 엄격 enum화 |

**Response 정렬**: `unwrap(http<ApiCommonResponse<Page<AdminMemberSummary>>>)` ✓

**`AdminMemberSummary` (`entities/member/model/types.ts:6-17`)** ↔ `AdminMemberSummaryResponse`

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `memberId` | int64 | number | ✓ |
| `userAccountId` | int64 | number | ✓ |
| `email` | string | string | ✓ |
| `providerType` | enum [GOOGLE/TWITTER/LOCAL] | `ProviderType` | ✓ |
| `nickname` | string | `string \| null` | △ defensive null |
| `authorityTier` | enum FM/AM/GT | `AuthorityTier` | ✓ |
| `lastLoginAt` | date-time | `string \| null` | △ defensive null |
| `createdAt` | date-time | string | ✓ |
| `withdrawn` | boolean | boolean | ✓ |
| `withdrawnAt` | date-time | `string \| null` | △ defensive null |

### C2.2 `GET /api/v1/admin/members/{memberId}` — detail

**Path param**: `memberId: integer` ↔ frontend `memberId: number` ✓

**`AdminMemberDetail` (`types.ts:37-46`)** ↔ `AdminMemberDetailResponse`

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `memberId` | int64 | number | ✓ |
| `userAccount` | `UserAccountSummary` | `UserAccountSummary` | **✗ nested drift — C2-D1** |
| `profile` | `MemberProfileSummary` | `MemberProfileSummary` | ✓ (정상) |
| `authorityTier` | enum | `AuthorityTier` | ✓ |
| `createdAt` | date-time | string | ✓ |
| `withdrawn` | boolean | boolean | ✓ (14g G3.2 mirror) |
| `withdrawnAt` | date-time | `string \| null` | △ defensive |
| `recentActivityLog` | `array<RecentActivityLogItem>` | `RecentActivityLogItem[]` | **✗ structural drift — C2-D2** |

#### ✗ C2-D1 — `UserAccountSummary` 필드 갭 (14g §13.2 알려진 항목)

| 필드 | OpenAPI `UserAccountSummary` | Frontend `UserAccountSummary` (`types.ts:19-24`) | 정렬 |
|---|---|---|---|
| `userAccountId` | int64 | number | ✓ |
| `email` | string | string | ✓ |
| `providerType` | enum | `ProviderType` | ✓ |
| `lastLoginAt` | date-time | **MISSING** | **✗ 누락** |
| `withdrawnAt` | date-time | **MISSING** | **✗ 누락** |
| (없음) | — | `createdAt: string` | **✗ phantom 필드** |

- 14g §13.2 line 519에서 이미 인지: "frontend `UserAccountSummary` interface는 둘 다 누락 + 잘못 포함된 `createdAt` 있음. 현재 사용처 0이라 영향 없으나 cleanup 가치 있음."
- Fixture(`test/mocks/fixtures/members.ts:27-32`)도 같은 잘못된 모양으로 박혀 있어 자동 테스트가 drift를 catch 못함.
- 분류: **① frontend 수정** (3 필드 정정 + fixture 정정).

#### ✗ C2-D2 — `RecentActivityLogItem` 구조 mismatch (신규 발견, 영향 큼)

| 필드 | OpenAPI `RecentActivityLogItem` | Frontend `RecentActivityLogItem` (`types.ts:31-35`) | 정렬 |
|---|---|---|---|
| `eventType` | string | **MISSING** (대신 `type`) | **✗ field name 불일치** |
| `partyroomId` | int64 | **MISSING** | **✗ 누락** |
| `metadata` | `JsonMetadata` | **MISSING** | **✗ 누락** |
| `occurredAt` | date-time | string | ✓ |
| (없음) | — | `summary: string` | **✗ phantom 필드** |

- UI 사용처: `features/members/ui/member-detail-cards.tsx:124-126` — 실제로 `row.type` 과 `row.summary`를 표시.
- 실제 백엔드 응답 시 `row.type`/`row.summary` 모두 `undefined` → 회원 상세 페이지의 "최근 활동 (top 30)" 표가 빈 셀로 렌더될 가능성 높음.
- 자동 테스트가 PASS인 이유: fixture(`members.ts:42`)도 동일 잘못된 모양 — fixture가 backend ground-truth 아님을 자체 강화.
- 분류: **① frontend 수정** (간단 변환:
  - `type` → `eventType`,
  - `summary` 제거,
  - `partyroomId: number \| null` 추가 (event 종류에 따라 null 가능 추정),
  - `metadata: JsonMetadata` 추가 — `JsonMetadata` 타입은 backend grep로 정의 확인 후 mirror,
  - UI에 `partyroomId`/`metadata` 활용 — 활동 컨텍스트 표시 보강 (별 polish).

### C2.3 `PATCH /api/v1/admin/members/{memberId}/tier`

**Request**: `AdminMemberTierChangeRequest { targetTier: enum [FM/AM/GT] }`
**Frontend** (`mutation-schema.ts:4-6`): `{ tier: TierEnum }` — **✗ field name 불일치**

| OpenAPI | Frontend |
|---|---|
| `targetTier` | `tier` |

- `members-api.ts:30` `changeMemberTier(memberId, body: ChangeMemberTierRequest)` → POST body가 `{ tier: ... }`로 직렬화.
- backend는 `targetTier`를 기대 → **400 validation 실패 예상**.
- 자동 테스트가 PASS인 이유: msw handler가 `{ tier }` 형태로 모킹돼 있을 가능성 → 실제 백엔드 검증 미수행. **C2-D3 추가 drift 후보**.

**Response**: `AdminMemberTierChangeResponse { memberId, oldTier, newTier }` — `entities/member/model/types.ts:48-52` 정확 mirror ✓

#### ✗ C2-D3 — tier 변경 request 필드 이름 불일치 (신규, 운영 중 즉시 깨짐)

- 백엔드: `targetTier`. 프론트: `tier`.
- handlers + integration test 모두 frontend가 보낸 모양 그대로 받아주는 모킹이라 catch 못함.
- 분류: **① frontend 수정** (zod 필드명 + api 호출부 + 모든 호출처 grep).

### C2.4 `POST /api/v1/admin/members/{memberId}/withdraw`

**Request**: no body. Frontend `withdrawMember(memberId)` no body. ✓
**Response**: `AdminMemberWithdrawResponse { memberId, userAccountId, withdrawnAt, alreadyWithdrawn }` — frontend `entities/member/model/types.ts:54-59` 정확 mirror ✓

### C2 결론

| 분류 | 건수 | 항목 |
|---|---|---|
| ✓ 정렬됨 | 다수 | list query (defensive 강화) / list response / member basic detail / withdraw |
| △ frontend 의도적 강화 | ~7 | nullable defensive / max cap / sort enum 엄격화 / cross-field refine 등 |
| ✗ drift | **3** | C2-D1 UserAccountSummary 갭 / C2-D2 RecentActivityLogItem 구조 / C2-D3 tier request 필드명 |

**모두 ① frontend 수정** 분류. C2-D1은 14g §13.2에서 이미 인지된 cleanup 후보 (사용처 0). C2-D2/C2-D3는 신규 발견 — 운영 시 즉시 깨질 가능성 큰 항목. **신규 backend ask: 0**.

---

## C3. 파티룸 (8 ops, penalty 2 제외)

> **사전 메모**: openapi.json은 backend HEAD 미상 시점에 떨어진 산출물 — A2/A3은 반영, A5(BulkActionResult.errorCode)는 미반영, 일부 schema name collision(PlaybackSummary)으로 잘못된 shape 노출. drift 판정 시 backend Java 코드 직접 확인이 필요한 케이스가 있어 양쪽 검증.

### C3.1 `GET /api/v1/admin/partyrooms` — list

**Query** (`features/partyrooms/model/filter-schema.ts`)

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `status` | enum [ACTIVE/SUSPENDED/TERMINATED] | `PartyroomStatusEnum.optional()` | ✓ |
| `stageType` | enum [MAIN/GENERAL] | `StageTypeEnum.optional()` | ✓ |
| `createdFrom`/`createdTo` | string | `.datetime().optional()` + cross-field refine | △ frontend 강화 |
| `host` | string | `.min(2).max(50).optional()` | △ defensive |
| `pageable` (Springdoc 합성 param) | required | flat `page/size/sort` 별도 query | ③ Springdoc 표기 quirk |
| `page` | (pageable 안) | `.int().min(0).default(0)` | △ default |
| `size` | (pageable 안) | `.int().min(1).max(200).default(50)` | △ frontend cap 200 |
| `sort` | (pageable 안) | `PartyroomSortEnum [createdAt,desc / lastActivityAt,desc / crewCount,desc / title,asc / hostNickname,asc 등 10종]` | △ frontend 엄격 enum |

**Response** ↔ ✗ **C3-D1 envelope drift (실제 운영 broken)** — `partyrooms-api.ts:21-23` (`return http<Page<...>>(...)`, `unwrap` 없음). 백엔드 controller `AdminPartyroomQueryController.java:54` 가 `ResponseEntity<ApiCommonResponse<Page<...>>>` 반환 (A3 ship `81acd8bb`). 프론트가 raw `Page<T>` 가정 → 실제 응답은 `{ data: { content: [...] } }`. **list page 빈 화면 / 깨짐** 가능성. Frontend cleanup 1줄 × 2 함수.

**`AdminPartyroomListItem`** ↔ `AdminPartyroomListItemResponse` — 모든 필드 정렬 (defensive null 강화 외 drift 0).

### C3.2 `GET /api/v1/admin/partyrooms/{partyroomId}` — detail

**Response envelope**: ✗ **C3-D1 동일** — `partyrooms-api.ts:29` raw `AdminPartyroomDetail` 가정. 백엔드 wrap 후 detail 페이지 깨짐.

**`AdminPartyroomDetail`** ↔ `AdminPartyroomDetailResponse` (스칼라 필드 정렬됨)

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| 17 스칼라 필드 (`partyroomId`/`title`/`introduction`/`status`/`displayFlag`/...) | int/string/enum | number/string/Enum | ✓ (defensive null 강화 6) |
| `playback` | `PlaybackSummary` | `PlaybackSummary` | **✗→ openapi 오류, frontend 맞음** (C3-MF2) |
| `crews`/`djQueue`/`recentPenalties`/`recentReports`/`recentAdminActions` | array<X> | `X[]` | ✓ |

#### C3-MF2 — openapi.json `PlaybackSummary` schema name collision **(✓ 해소됨)**

- 최초 발견: openapi component schema `PlaybackSummary`가 `{ name, thumbnailImage, duration }` (customer 모양)으로 등록 — admin detail의 `playback` 필드가 잘못된 shape으로 표기됨.
- **2026-05-02 backend 측 schema 분리 ship**: `PlaybackSummary` (customer 룸 list/detail) / `AdminPartyroomPlaybackSummary` (admin 룸 detail) / `LinkEnterPlaybackSummary` (link 진입 응답) — 3 schema로 분리, `AdminPartyroomDetailResponse.playback`이 `AdminPartyroomPlaybackSummary` 참조.
- **frontend 정렬 작업 (H6)**: `entities/partyroom/model/types.ts`에서 `PlaybackSummary` interface를 `AdminPartyroomPlaybackSummary`로 rename + 재export. 필드 변경 없음 (이미 정확한 shape).
- 결론: openapi.json ↔ backend 코드 ↔ frontend 타입 모두 1:1 mirror로 정렬됨. 별 backend ask 불필요.

### C3.3 `PATCH /api/v1/admin/partyrooms/{partyroomId}` — update meta

**Request** (`mutation-schema.ts:15-27` `UpdatePartyroomMetaSchema`)

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `title` | string maxL=100 | `.min(1).max(100).optional()` | △ frontend min(1) defensive |
| `introduction` | string maxL=500 | `.max(500).optional()` | ✓ |
| `playbackTimeLimit` | int min=1 max=60 | `.coerce.int().min(1).max(60).optional()` | ✓ |
| (cross-field) | `@AssertTrue isAtLeastOnePresent` | `.refine(min 1 field)` | ✓ refine mirror |

✓ 정렬됨. backend ground-truth mirror 모범 사례.

### C3.4 `PATCH /api/v1/admin/partyrooms/{partyroomId}/display-flag`

**Request** (`mutation-schema.ts:31-32`)

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `flag` | enum [NORMAL/FEATURED/HIDDEN] | `DisplayFlagEnum` | ✓ |

### C3.5–C3.7 lifecycle (POST `/restore` / `/suspend` / `/terminate`)

| op | Request 정렬 | 비고 |
|---|---|---|
| `/restore` | no body — frontend 동일 ✓ | |
| `/suspend` | `{ reason: maxL=500 }` ↔ `SuspendReasonSchema = TerminateReasonSchema` (`min(1).max(500)`) | △ min(1) defensive |
| `/terminate` | `{ reason: maxL=500 }` ↔ `TerminateReasonSchema` (`min(1).max(500)`) | △ min(1) defensive |

### C3.8 `POST /api/v1/admin/partyrooms/bulk-action`

**Request** (`bulk-schema.ts:11-16` `BulkPartyroomActionSchema`)

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `partyroomIds` | array<int> | `.array(z.number()).min(1).max(100)` | ✓ frontend max(100) cap mirror (backend `@Size(1..100)`) |
| `action` | enum [TERMINATE/SUSPEND/SET_HIDDEN] | `BulkActionTypeEnum` | ✓ |
| `reason` | string maxL=500 | `.min(1).max(500)` | △ defensive |
| `skipErrors` | boolean | `.optional()` | ✓ |

**Response** `BulkPartyroomActionResponse { results: BulkActionResult[] }`

#### ✗ C3-D2 — `BulkActionResult.errorCode` 누락 (post-A5)

- 실제 백엔드 (`BulkPartyroomActionResponse.java:13`): `record BulkActionResult(Long partyroomId, boolean success, String error, String errorCode)` — 4 필드 (A5 ship `9ddc0f95`).
- openapi.json: 3 필드만 노출 (errorCode 미포함) — **C3-MF1: openapi.json outdated** (A5 commit 후 미재생성).
- Frontend `bulk-schema.ts:20-24` `BulkActionResultSchema`: 3 필드 (`errorCode` 미포함).
- 14d §11 line 254 spec은 "errorCode는 ?: optional zod로 여유"라 명시했으나 실제 zod에 반영 안 됨.
- **현재 동작**: backend가 `errorCode` 필드를 응답에 포함시켜도 frontend zod parse가 silent ignore — 깨지지 않음 (forward-compat 수준은 자동 충족). 다만 14c §7.1 매트릭스를 bulk dialog에 적용하려면 zod에 `errorCode: z.string().nullable().optional()` 추가 필요.
- 분류: **① frontend 수정** (1줄 추가 + UI 매트릭스 적용은 별 polish).

#### C3-MF1 — openapi.json outdated re: A5 backend ship

- 본 audit는 `pfplay-admin/openapi.json`을 source-of-truth로 두고 시작했으나, A5(`9ddc0f95`) 이후 미재생성된 산출물.
- 영향: schema 단위 정렬 시 backend Java 코드 직접 확인이 추가로 필요.
- 권고: backend openapi 산출물 갱신 + 동기화 정책 (별 backend ask 또는 운영 task).

### C3 결론

| 분류 | 건수 | 항목 |
|---|---|---|
| ✓ 정렬됨 | 다수 | mutation 4개 (updateMeta / displayFlag / suspend / terminate / restore) / bulk 요청 / list+detail 스칼라 / nested record들 |
| △ frontend 의도적 강화 | 다수 | nullable defensive / size cap / min(1) reason 강제 / sort 엄격 enum / cross-field refine |
| ✗ drift | **2** | C3-D1 envelope (운영 broken) / C3-D2 BulkActionResult.errorCode 누락 |
| 메타 발견 | **2** | C3-MF1 openapi outdated / C3-MF2 PlaybackSummary 이름 충돌 |

**C3-D1은 운영 영향 큼 — 즉시 fix 필요** (`partyrooms-api.ts` 2 함수에 `unwrap()` 적용). 본 사항은 `admin-backend-asks.md` A3의 "Frontend cleanup 대기 중" 항목과 정확히 일치 — 이미 known.

**신규 backend ask**: 1건 (Springdoc PlaybackSummary 이름 충돌 해소) 후보.

---

## C4. 신고 (3 ops)

### C4.1 `GET /api/v1/admin/reports` — list

**Query** (`features/reports/model/filter-schema.ts` `reportsListQuerySchema`)

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `status` | array | `array(ReportStatusEnum).optional()` | ✓ multi-status |
| `category` | array | `array(ReportCategoryEnum).optional()` | ✓ multi-category |
| `created_from`/`created_to` | string | `createdFrom`/`createdTo` (camelCase, regex YYYY-MM-DD) — `reports-api.ts:16-17` 직렬화 시 snake_case 변환 | ✓ frontend 변환 정확 |
| `page` | integer | `.int().min(0).default(0)` | △ default |
| `size` | integer | `.int().min(1).max(200).default(50)` | △ frontend cap |
| `sort` | string (enum 미선언) | `ReportsSortEnum [created_at_desc, created_at_asc].default(...)` | △ frontend 엄격 |

**Response**: `ApiCommonResponse<Page<...>>` ↔ `unwrap(http<ApiCommonResponse<Page<AdminReportSummary>>>)` ✓

**`AdminReportSummary` ↔ `AdminReportSummaryResponse`** — 스칼라 8 필드 모두 정렬 (defensive null 2개).

### C4.2 `GET /api/v1/admin/reports/{reportId}` — detail

**Response** `AdminReportDetail` ↔ `AdminReportDetailResponse`

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `reportId`/`status`/`category`/`description`/`createdAt` | 스칼라/enum/date-time | 동일 | ✓ |
| `reporter` | `Reporter { userAccountId, email, nickname }` | `ReporterMeta { ..., email/nickname: string\|null }` | △ defensive null (orphan tolerance) |
| `partyroom` | `Partyroom { partyroomId, title, host: Host { userAccountId, nickname } }` | `PartyroomMeta { ..., title: string\|null, host: PartyroomHostMeta\|null }` | △ defensive null |
| `review` | `Review { reviewedByAdministratorId, resolutionNote, resolvedAt }` | `ReportReviewMeta { ...all string\|null }` | △ defensive null |

✓ 정렬됨 — D7 cross-context orphan tolerance 정책에 맞춰 frontend 강화.

### C4.3 `PATCH /api/v1/admin/reports/{reportId}` — transition

**Request** (`features/reports/model/transition-schema.ts` `ReportStatusUpdateSchema`)

| 필드 | OpenAPI | Frontend | 정렬 |
|---|---|---|---|
| `status` | enum | `ReportStatusEnum` | ✓ |
| `resolutionNote` | string maxL=2000 | `.max(2000).optional().nullable()` + terminal-status refine | △ frontend가 RPT-003 backend 가드 mirror |

추가: `TRANSITION_MATRIX`/`canTransition` helper로 frontend가 D3 transition 룰 mirror — backend service-layer 가드와 동일 의미 (defense-in-depth). ✓

**Response**: `ApiCommonResponse<AdminReportDetailResponse>` ↔ `unwrap` ✓

### C4 결론

| 분류 | 건수 |
|---|---|
| ✓ 정렬됨 | 모든 필드 |
| △ 의도적 강화 | 다수 (defensive null / sort 엄격 / transition matrix mirror / terminal-status refine) |
| ✗ drift | **0** |

신규 backend ask 0.

---

## C5. 아바타 lifecycle (8 ops, B 옵션)

### C5.1–C5.2 `GET /bodies` / `GET /faces` — list

**Query** (`features/avatars/model/filter-schema.ts`)

| Endpoint | OpenAPI | Frontend |
|---|---|---|
| `/bodies` | `status` (LifecycleStatus) + `obtainableType` (ObtainmentType) | `bodyListQuerySchema { status, obtainableType }` ✓ |
| `/faces` | `status` only (face는 obtainableType 미지원 — 14f §1.2 deferred) | `faceListQuerySchema { status }` ✓ |

**Response**: `ApiCommonResponse<List<AdminAvatarBodyView>>` (배열, Page 아님) ↔ `unwrap(http<ApiCommonResponse<View[]>>)` ✓

### C5.3–C5.4 `GET /bodies/{id}` / `GET /faces/{id}` — detail

**Response** ↔ list와 동일 view 타입.

**`AdminAvatarBodyView` ↔ openapi** — 15 필드 모두 정렬 (id / name / resourceUri / iconUri / obtainableType / obtainableScore / isCombinable / isDefaultSetting / combinePositionX/Y / lifecycleStatus / createdAt/By / updatedAt/By). ✓

**`AdminAvatarFaceView`** — 10 필드 모두 정렬 (face는 score/combinable 등 body-only 필드 없음). ✓

### C5.5–C5.6 `POST /{id}/publish` (body/face)

| 항목 | OpenAPI | Frontend |
|---|---|---|
| Request | no body | no body ✓ |
| Response | error 응답 4xx만 declared (200 success body 미선언) | `Promise<void>` ✓ |

### C5.7–C5.8 `POST /{id}/retire` (body/face)

**Request**: `RetireAvatarResourceRequest { reason: string maxL=1000 }`
**Frontend** (`features/avatars/model/retire-schema.ts` `RetireAvatarRequestSchema`): `{ reason: min(1).max(1000).refine(non-blank) }` — △ frontend 강화 (공백 차단)

### C5 결론

| 분류 | 건수 |
|---|---|
| ✓ 정렬됨 | 모든 필드 + 모든 op |
| △ 의도적 강화 | retire reason non-blank refine |
| ✗ drift | **0** |

`AdminAvatarBodyView`/`FaceView` 양쪽 view가 backend record와 1:1 정확 mirror. 본 시리즈 audit 중 가장 깨끗한 도메인.

---

## 종합 결론

| Chunk | 도메인 | ops | drift | 신규 backend ask 후보 |
|---|---|---:|---:|---|
| C1 | 인증/세션 | 3 | 0 | 0 |
| C2 | 회원 | 4 | 3 | 0 |
| C3 | 파티룸 | 8 | 2 | 1 (C3-MF2 PlaybackSummary 이름 충돌) |
| C4 | 신고 | 3 | 0 | 0 |
| C5 | 아바타 lifecycle | 8 | 0 | 0 |
| **합계** | | **26 ops** | **5** | **1** |

### Frontend 수정 5건 (모두 ① 분류)

| ID | 항목 | 우선순위 | 근거 |
|---|---|---|---|
| **C3-D1** | `partyrooms-api.ts` list/detail에 `unwrap()` 적용 | **즉시** | 운영 list/detail 페이지 깨짐 (backend A3 ship 후 미동기화) |
| **C2-D3** | tier 변경 request 필드명 `tier` → `targetTier` | **즉시** | 운영 시 PATCH 호출 즉시 400 |
| **C2-D2** | `RecentActivityLogItem` 구조 정정 (`type` → `eventType`, `summary` 제거, `partyroomId`/`metadata` 추가) | 높음 | 회원 상세 "최근 활동" 표 빈 셀 가능 |
| **C2-D1** | `UserAccountSummary` 갭 (`lastLoginAt`/`withdrawnAt` 추가, phantom `createdAt` 제거) | 낮음 | 사용처 0이지만 14g §13.2에 cleanup으로 박힘 |
| **C3-D2** | `BulkActionResultSchema`에 `errorCode` optional 추가 | 낮음 | 14d §11 spec과 실제 zod 일치화 |

### 신규 backend ask 0건

- 최초 후보였던 "PlaybackSummary 이름 충돌 해소"는 backend가 같은 날 `PlaybackSummary` / `AdminPartyroomPlaybackSummary` / `LinkEnterPlaybackSummary` 3 schema 분리 ship으로 자체 해소 — frontend는 H6 rename 1건으로 1:1 mirror 정렬 완료.

### 메타 발견 2건 (process-level)

| ID | 항목 | 영향 |
|---|---|---|
| **C3-MF1** | `pfplay-admin/openapi.json`이 backend HEAD 와 부분 어긋남 — A2/A3 반영, A5 미반영 | audit 신뢰성 — backend Java 코드 cross-check 필수 |
| **C3-MF2** | openapi.json `PlaybackSummary` schema name collision | **✓ 해소** (backend 3 schema 분리 ship + frontend H6 rename) |

### 검증되지 않은 (audit 범위 외)

- 실제 응답 byte 단위 검증 (live backend 호출) — A1 staging 합동 검증으로 commit 후 확인
- 미구현 endpoint(아바타 upload/PATCH/icon, penalty, F-1 거버넌스) — 14f §1.2 / 14c §13.2 / 14g §13 묶음 γ로 별 PR 필요
