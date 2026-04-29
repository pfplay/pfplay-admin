# PR 14e — 어드민 신고 관리 (report list / detail / status transition) Design

**상태**: G0 초안
**선행**: PR 14d (`0ef0eaf`) — bulk-action 완료, 198/198 PASS
**브랜치**: `feature/admin-platform-frontend` (PR 14a~14e 통합)
**범위**: backend PR 13 (C-2) endpoint를 frontend에 매핑 — list (filter/sort/page) + detail (cross-context join 카드) + PATCH (transition 5종 + resolutionNote conditional). backend 변경 0.

**본 PR 위치**: PR 14의 본래 계획 (roadmap §9.1 / 14a §1.2 "신고 관리 화면")에 명시되었으나 14b/14c/14d에서 누락된 항목. M6 close를 위한 본래 범위 채움 1/2 (다른 1개는 14f Avatar 관리).

---

## 1. 목적과 비목적

### 1.1 목적

- 어드민이 사용자 신고를 list로 조회 (status / category / 기간 filter + 정렬 + 페이징)
- 신고 상세 (cross-context 신고자 / 파티룸 / 호스트 / 검토 메타) 확인
- 신고 상태 5-transition 전이 (PENDING↔REVIEWING / REVIEWING→RESOLVED|DISMISSED + RESOLVED|DISMISSED 시 resolutionNote 필수)
- 14b/14c 패턴 그대로 follow — entity/feature/widget/page + 사이드바 nav 추가

### 1.2 비목적 (14e 범위 외)

- 신고 첨부 파일 / 다중 신고 일괄 처리 / 24h duplicate index — PR 13 §13에 미해결 박힘
- `ReportStatusChanged` 이벤트 / `partyroom_admin_action.REPORT_REVIEWED` chain — PR 13 §future
- 14f Avatar 관리는 별 PR

---

## 2. 백엔드 ground-truth (PR 13 read 결과)

### 2.1 endpoint

| 메소드 | 경로 | 응답 |
|---|---|---|
| `GET` | `/api/v1/admin/reports` | `ApiCommonResponse<Page<AdminReportSummaryResponse>>` |
| `GET` | `/api/v1/admin/reports/{reportId}` | `ApiCommonResponse<AdminReportDetailResponse>` |
| `PATCH` | `/api/v1/admin/reports/{reportId}` | `ApiCommonResponse<AdminReportDetailResponse>` (mutation 후 detail 재구성 응답) |

모두 `@adminAuth.isAdmin()` + `ApiCommonResponse` envelope (14b members와 동일 패턴, `unwrap()` 일괄 적용).

### 2.2 list query 파라미터

| 파라미터 | 타입 | 검증 |
|---|---|---|
| `status` | `List<ReportStatus>` | optional, multi |
| `category` | `List<ReportCategory>` | optional, multi |
| `created_from` | `LocalDate` (`yyyy-MM-dd`) | optional, ≤ `created_to` (cross-field, RPT-004) |
| `created_to` | `LocalDate` | optional |
| `page` | `int` | `@Min(0)`, default 0 |
| `size` | `int` | `@Min(1) @Max(200)`, default 50 |
| `sort` | `String` | `@Pattern(regexp = "created_at_desc|created_at_asc")`, default `created_at_desc` |

cross-field violation (`from > to`) → 400 `RPT-004 INVALID_LIST_QUERY`. 그 외는 Bean Validation `400` (errorCode 없음 — 14b 패턴 일관).

### 2.3 enum

```java
ReportStatus: PENDING, REVIEWING, RESOLVED, DISMISSED
ReportCategory: INAPPROPRIATE_CONTENT, HARASSMENT, SPAM, COPYRIGHT, OTHER
```

### 2.4 list row — `AdminReportSummaryResponse`

```java
record AdminReportSummaryResponse(
    Long reportId,
    Long partyroomId,
    Long reporterUserAccountId,
    ReportCategory category,
    ReportStatus status,
    LocalDateTime createdAt,
    Long reviewedByAdministratorId,    // PENDING이면 null
    LocalDateTime resolvedAt           // PENDING/REVIEWING이면 null
)
```

list view는 cross-context join 미수행 (D7) — partyroom_report 테이블 단독 컬럼만. 닉네임/제목 등은 detail에서.

### 2.5 detail — `AdminReportDetailResponse` (cross-context loose-ref join)

```java
record AdminReportDetailResponse(
    Long reportId,
    ReportStatus status,
    ReportCategory category,
    String description,
    Reporter reporter,        // record(userAccountId, email, nickname) — orphan 시 email/nickname null
    Partyroom partyroom,      // record(partyroomId, title, host:Host) — orphan 시 title/host null
    Review review,            // record(reviewedByAdministratorId, resolutionNote, resolvedAt) — PENDING/REVIEWING은 부분 null
    LocalDateTime createdAt
) {
    record Reporter(Long userAccountId, String email, String nickname) {}
    record Partyroom(Long partyroomId, String title, Host host) {}
    record Host(Long userAccountId, String nickname) {}
    record Review(Long reviewedByAdministratorId, String resolutionNote, LocalDateTime resolvedAt) {}
}
```

orphan tolerance — 외부 BC 엔티티 부재 시 nested record는 항상 build, 내부 필드만 null (클라 렌더 일관성).

### 2.6 PATCH request — `AdminReportStatusUpdateRequest`

```java
record AdminReportStatusUpdateRequest(
    @NotNull ReportStatus status,         // 전이 target
    @Size(max=2000) String resolutionNote  // null 허용. terminal 진입 시 service-layer guard로 필수 검증 (RPT-003)
)
```

### 2.7 transition matrix (D3)

| 현재 | 허용 target |
|---|---|
| `PENDING` | `REVIEWING`, `DISMISSED` |
| `REVIEWING` | `RESOLVED`, `DISMISSED`, `PENDING` (보류) |
| `RESOLVED` | (terminal) |
| `DISMISSED` | (terminal) |

위반 시 → 400 `RPT-002 INVALID_STATE_TRANSITION`. terminal(RESOLVED/DISMISSED) 진입 시 `resolutionNote` 빈 문자열 → 400 `RPT-003 RESOLUTION_NOTE_REQUIRED`.

### 2.8 errors

| status | errorCode | 의미 |
|---|---|---|
| 400 | `RPT-002 INVALID_STATE_TRANSITION` | 전이 위반 |
| 400 | `RPT-003 RESOLUTION_NOTE_REQUIRED` | RESOLVED/DISMISSED 진입 시 note 비어있음 |
| 400 | `RPT-004 INVALID_LIST_QUERY` | created_from > created_to |
| 404 | `RPT-001 REPORT_NOT_FOUND` | reportId 없음 |
| 401/403 | (미인증 / non-admin) | 14a 인터셉터 |

### 2.9 인증/CSRF

14a `http.ts`가 자동 처리 — 14e 신규 작업 0.

---

## 3. 아키텍처

### 3.1 FSD 레이어 변경 — 신규 / 수정 파일

**신규 파일:**
```
src/entities/report/
  model/types.ts                                # ReportStatus / ReportCategory union + AdminReportSummary / AdminReportDetail
  index.ts                                      # re-export

src/features/reports/
  model/filter-schema.ts                        # zod ReportsListQuery + sort whitelist
  model/transition-schema.ts                    # zod transition matrix + resolutionNote conditional refine
  api/reports-api.ts                            # listReports, getReportDetail, updateReportStatus
  api/use-reports-list.ts                       # react-query
  api/use-report-detail.ts
  api/use-update-report-status.ts               # mutation hook (success → setQueryData with PATCH 응답)
  ui/reports-filter-form.tsx                    # status[]/category[] checkbox group + 기간 + sort + reset
  ui/reports-table.tsx                          # row + status badge + reporter id + category
  ui/report-detail-cards.tsx                    # 4 카드 (reporter / partyroom / review / description)
  ui/mutation-dialogs/transition-status-dialog.tsx  # status select + resolutionNote conditional
  model/__tests__/{filter-schema,transition-schema}.test.ts
  api/__tests__/{reports-api,use-reports-list,use-report-detail,use-update-report-status}.test.{ts,tsx}
  ui/__tests__/{reports-filter-form,reports-table,report-detail-cards}.test.tsx
  ui/mutation-dialogs/__tests__/transition-status-dialog.test.tsx

src/widgets/
  reports-list.tsx                              # 14b partyrooms-list 패턴 (outer/inner split + URL invalid drop)
  reports-detail.tsx                            # 14b partyroom-detail 패턴 (idValid + 훅 무조건 호출 + NotFoundView)

src/pages/
  reports-page.tsx                              # /reports
  report-detail-page.tsx                        # /reports/:reportId
```

**수정 파일:**
```
src/App.tsx                                     # 라우트 2 추가 (/reports, /reports/:reportId)
src/widgets/sidebar.tsx (또는 Layout)           # 신고 nav 1개 추가 (대시보드/회원/파티룸/신고 4개)
src/test/mocks/handlers/index.ts                # report handlers 추가
src/test/mocks/handlers/reports.ts              # 신규 — list / detail / PATCH default handler
src/test/mocks/fixtures/reports.ts              # 신규 — summary / detail / error fixtures
```

### 3.2 라우트 / 사이드바

| Path | Page | 권한 | 진입점 |
|---|---|---|---|
| `/reports` | `ReportsPage` | ADMIN | 사이드바 "신고" |
| `/reports/:reportId` | `ReportDetailPage` | ADMIN | 목록 row click |

사이드바 nav 4번째로 추가. 14d sidebar 코드 그대로 확장.

---

## 4. mutation hook 공통 계약

### 4.1 invalidate 키

PATCH 성공 시:
1. `qc.setQueryData(["reports", "detail", reportId], newDetail)` — PATCH 응답이 `AdminReportDetailResponse`라 즉시 cache 갱신 (14d list cache lookup 패턴과 다름 — 응답 자체로 cache 채움)
2. `qc.invalidateQueries({ queryKey: ["reports", "list"] })` — list cache stale 마킹 (status badge / reviewedByAdministratorId / resolvedAt 변경 반영)

### 4.2 toast

- success: `mutationSuccessToast` — 전이별 메시지:
  - PENDING→REVIEWING: "검토 시작"
  - REVIEWING→PENDING: "보류 처리"
  - →RESOLVED: "처리 완료"
  - →DISMISSED: "기각 처리"
- error: `mutationErrorToast` — RPT-002/003 errorCode + message 그대로 노출

---

## 5. list page

### 5.1 filter form

- **statuses**: `<Checkbox>` 4종 (PENDING/REVIEWING/RESOLVED/DISMISSED) — multi-select. 0개 선택 = 전체. URL param `status` (multi)
- **categories**: `<Checkbox>` 5종 — multi. URL param `category` (multi)
- **createdFrom / createdTo**: `<Input type="date">` 2개 — `yyyy-MM-dd`. cross-field 검증 inline (from > to → toast.error + form 차단)
- **sort**: `<Select>` 2종 — `created_at_desc | created_at_asc`. 기본 desc
- **reset** 버튼 — URL params 모두 clear
- **debounce**: 14b host filter처럼 300ms — 다만 본 form은 select/checkbox 위주라 즉시 반영. 기간 input만 onChange 후 page reset

### 5.2 zod `ReportsListQuery`

```ts
export const ReportStatusEnum = z.enum(["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"])
export const ReportCategoryEnum = z.enum(["INAPPROPRIATE_CONTENT", "HARASSMENT", "SPAM", "COPYRIGHT", "OTHER"])
export const ReportsSortEnum = z.enum(["created_at_desc", "created_at_asc"])

export const ReportsListQuerySchema = z.object({
  status: z.array(ReportStatusEnum).optional(),
  category: z.array(ReportCategoryEnum).optional(),
  createdFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  createdTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(200).default(50),
  sort: ReportsSortEnum.default("created_at_desc"),
}).refine(
  (v) => !v.createdFrom || !v.createdTo || v.createdFrom <= v.createdTo,
  { message: "기간 시작일이 종료일보다 늦을 수 없어요" },
)
```

### 5.3 table columns

| 헤더 | 필드 | 비고 |
|---|---|---|
| ID | `reportId` | row click → detail navigate |
| 신고자 | `reporterUserAccountId` | list view에서는 ID만, nickname은 detail |
| 카테고리 | `category` | enum 한국어 매핑 (`INAPPROPRIATE_CONTENT → "부적절 컨텐츠"` 등) |
| 상태 | `status` | Badge (PENDING/REVIEWING/RESOLVED/DISMISSED 색상 4종) |
| 생성일 | `createdAt` | formatKst |
| 검토자 | `reviewedByAdministratorId` | null이면 "-" |
| 처리일 | `resolvedAt` | formatKst null guard |

### 5.4 URL ↔ filter 동기화

14b 패턴 그대로 — outer widget이 URL parse + invalid drop + toast, inner content가 검증된 query로 fetch.

---

## 6. detail page

### 6.1 4 카드

1. **Header** (cards 외 — page top): reportId / status badge / category 한국어 / "→ 파티룸으로" 링크 (`/partyrooms/{partyroomId}` orphan 아닐 시) / "→ 신고자 회원으로" 링크 (`/members/...` — reporter member 미제공이면 미렌더)
2. **Reporter 카드** — userAccountId / email / nickname (orphan 시 "(N/A)")
3. **Partyroom 카드** — partyroomId / title / host nickname (orphan 시 "(N/A)") / "파티룸 상세" 링크
4. **Description 카드** — description (사용자 입력, 신고 사유 본문) — `<pre>` 또는 `<p>` whitespace-preserve
5. **Review 카드** — review.reviewedByAdministratorId / resolutionNote (없으면 "-") / resolvedAt (formatKst)

### 6.2 Actions Dropdown (status별)

14c partyrooms-actions-dropdown 패턴:
- PENDING: "검토 시작" (→REVIEWING) + "기각" (→DISMISSED, terminal)
- REVIEWING: "처리 완료" (→RESOLVED, terminal) + "기각" (→DISMISSED, terminal) + "보류" (→PENDING)
- RESOLVED/DISMISSED: 모든 항목 disabled (terminal)

각 항목 클릭 → `<TransitionStatusDialog>` open with target.

### 6.3 `TransitionStatusDialog`

props: `{ reportId, currentStatus, target, open, onOpenChange }`

내부:
- title: `"신고 처리 — ${labelOf(target)}"`
- description: 현재 → target 전이 명시
- terminal target (`RESOLVED`/`DISMISSED`)이면 resolutionNote `<Textarea>` 필수 (zod refine — `resolutionNote.trim().length >= 1` when target ∈ terminals)
- non-terminal target이면 resolutionNote 미렌더 (또는 optional)
- submit → `useUpdateReportStatus` mutate. onSuccess → setQueryData (detail) + invalidateQueries(["reports", "list"]) + dialog close

### 6.4 idValid 패턴

14b 일관 — `useReportDetail(idValid ? reportId : NaN)` (훅 무조건 호출), `idValid && !data && !error` → `<NotFoundView />`. invalid id 또는 404 시 NotFoundView (`<h2>` + 목록으로 link).

---

## 7. 에러 / Edge / 미래 호환

### 7.1 errorCode 매트릭스 → UI

| errorCode | UI |
|---|---|
| `RPT-002 INVALID_STATE_TRANSITION` | toast.error + dialog 닫지 않음 (재시도 가능) |
| `RPT-003 RESOLUTION_NOTE_REQUIRED` | toast.error + textarea aria-invalid + 포커스 |
| `RPT-004 INVALID_LIST_QUERY` | toast.error (frontend zod에서 미리 차단됨, 도달 0 가정) |
| `RPT-001 REPORT_NOT_FOUND` | NotFoundView (detail) / row 사라짐 (list refetch) |
| 401 / 403 | 14a 인터셉터 |

### 7.2 cross-context orphan tolerance

backend가 `partyroom: { title: null, host: null }` 등 nested record를 항상 build하고 내부만 null로 채움. frontend는 `partyroom.title ?? "(N/A)"` fallback으로 렌더. orphan link는 미렌더 (예: `partyroom.title === null` → "파티룸으로" 링크 미렌더, "(삭제된 파티룸 — id: 123)" 표시).

### 7.3 forward-compat

- `ReportStatus` 추가 시 (예: `ESCALATED`) — zod enum + transition matrix + Badge 색상 추가만
- `ReportCategory` 추가 — zod enum + 한국어 매핑 추가
- `AdminReportDetailResponse.attachmentUrls`(future) — optional zod로 받기

### 7.4 staleness

PATCH 응답이 detail shape이라 setQueryData로 즉시 반영. list invalidate prefix `["reports", "list"]`만 mark stale → 다음 list 페이지 진입 시 refetch. 다른 어드민이 같은 reportId 동시 처리 시 두 번째 요청 RPT-002 (status 이미 변경) → toast.error.

### 7.5 권한

- `@adminAuth.isAdmin()` (ADMIN/SUPER_ADMIN). 14a 인터셉터 일관.

### 7.6 a11y

- table row click → keyboard Enter도 navigate (14b 패턴)
- transition dialog: 현재 status → target status 명시 (사용자 confusion 회피)
- terminal 진입 시 resolutionNote `aria-required="true"` + `<Label>` 필수 표시

---

## 8. 테스트 전략

### 8.1 자동 테스트

| 영역 | 신규 tests | 주요 케이스 |
|---|---|---|
| filter-schema | 6~8 | enum 위반 / multi 파싱 / cross-field refine / sort whitelist |
| transition-schema | 6 | 5 transition 허용 / 위반 / RESOLVED+empty note refine fail |
| reports-api | 4 | list query 직렬화 / detail unwrap / 404 ApiError / PATCH body shape |
| use-reports-list | 2 | 정상 fetch / 400 propagation |
| use-report-detail | 2 | 정상 fetch / 404 ApiError |
| use-update-report-status | 4 | setQueryData / invalidate list / toast 분기 / RPT-002 error |
| reports-filter-form | 5 | checkbox multi / date input / sort change / reset / cross-field guard |
| reports-table | 4 | row 렌더 / status badge / 빈 상태 / row click |
| report-detail-cards | 4 | 4 카드 렌더 / orphan fallback / review null fields / description preserve |
| transition-status-dialog | 5 | terminal target → note 필수 / non-terminal → note 미렌더 / submit / dialog reset (R11) / Dialog Select hang 회피(14c §14 entry 14) |

총 신규 ~42 tests. baseline 198 + 42 = **약 240**.

### 8.2 수동 검증 (staging)

- list 5 status × 5 category 조합 filter
- 전이 5종 모두 시도 (PENDING→REVIEWING, REVIEWING→RESOLVED/DISMISSED/PENDING, terminal에서 dropdown disabled)
- terminal 진입 시 resolutionNote 빈 → backend 400 RPT-003 catch → toast + 재시도 흐름
- orphan partyroom (DB에서 삭제된 reportId) → "(N/A)" 표시 + 링크 미렌더
- 동시 어드민 race — 두 탭에서 같은 신고 처리 → 두 번째 RPT-002 toast

### 8.3 MSW handler

- `GET /admin/reports` default → `bulkResultAllSuccess`-style fixture (list 5건, status 다양)
- `GET /admin/reports/:reportId` default → detail fixture (orphan 미사용)
- `PATCH /admin/reports/:reportId` default → updated detail (target status 반영)
- per-test override로 RPT-002/003/404 시나리오

---

## 9. 의존 라이브러리 추가

없음. 14a~14d 의존(@radix-ui/react-checkbox/dialog/dropdown-menu/select/tooltip + zod + react-hook-form + @tanstack/react-query)으로 충분.

---

## 10. 구현 chunk 분할

| Chunk | 범위 | commits 예상 |
|---|---|---|
| G0 ~ G0.x | spec / plan + reviewer polish | 3~4 |
| G1 | 라우트 placeholder + 사이드바 4번째 nav + entity types | 1~2 |
| G2 | filter-schema + transition-schema + msw handlers/fixtures (TDD) | 3~4 |
| G3 | reports-api + 3 hooks (TDD) | 4~5 |
| G4 | reports-filter-form + reports-table + reports-page (TDD) | 3~4 |
| G5 | report-detail-cards + reports-detail widget + report-detail-page (TDD) | 3~4 |
| G6 | TransitionStatusDialog + actions dropdown + dialog wire (TDD) | 3~4 |
| G7 | chunk sanity (typecheck + 전체 테스트 + build) | 1 |
| G8 | spec §12 catch-up + §13 future polish + 14d backfill | 1~2 |

총 commits 예상 ~22 (14d 20과 비슷).

---

## 11. 위험 / 미해결

### R1 — Dialog 안 Status Select interaction 테스트 한계

**상태**: 14c §14 entry 14 jsdom hang 동일.
**대응**: target prop으로 status 전달 (Action Select 대체) + Select 클릭 흐름은 e2e 미룸. transition dialog는 dropdown menuitem이 직접 target을 결정하므로 dialog 안 Select 자체가 부재하거나 매우 단순.

### R2 — orphan link 정책 일관성

**상태**: detail 4 카드 + header link 모두 nested record 내부 null 체크 일관 필요.
**대응**: `partyroom.title === null && partyroom.host === null` → orphan 표시. 부분 orphan(title만 null)은 backend 정책상 발생 추정 — D7 spec 재확인 (G3 sanity grep).

### R3 — list view 닉네임 부재 UX

**상태**: list view는 cross-context join 미수행 → reporter ID만 보임. 어드민이 list만 보고는 "누가 신고했는지" 모름.
**대응**: row click → detail에서 nickname 노출. list 자체에 reporter nickname 추가 요청은 backend D7 결정 변경 필요 → §13 future polish.

### R4 — terminal 진입 시 resolutionNote frontend vs backend 분리

**상태**: zod refine으로 frontend 차단 + backend RPT-003 가드도 존재.
**대응**: frontend zod refine 우선 — 정상 운영에선 backend 도달 0. 다만 dev tools로 우회 시 backend가 catch (defense-in-depth).

### R5 — invalidate 키 split (`["reports", "list"]` vs `["reports", "detail", id]`)

**상태**: 14d는 `["partyrooms"]` prefix-only invalidate. 14e는 list / detail 분리 → setQueryData(detail) + invalidate(list) 분리. 14d/14b 패턴과 약간 다름.
**대응**: PATCH 응답이 detail shape이라 setQueryData가 자연스러움. list cache는 prefix invalidate로 stale 마킹. 일관 helper는 §13.2 future polish (`useReportInvalidator` 추출 후보).

### R6 — Bean Validation 표준 sort whitelist 위반 시 errorCode 부재

**상태**: `created_at_xxx` 외 sort 값 → 400 (Bean Validation `@Pattern` 위반). `errorCode` 부재.
**대응**: frontend zod로 미리 차단. 도달 0 가정. 14b R3 패턴 일관.

---

## 12. Open Items / Implementation Reality (post-build catch-up)

(G8 chunk에서 채움 — G1~G7 진행 중 spec ↔ 실제 코드 불일치 항목 SHA + 사유 + impact)

---

## 13. Future Polish (14a/14b/14c/14d 상속 + 14e 신규)

### 13.1 14d §13.1 / 14c §13.1 / 14b §15 / 14a §13 상속 (14e에 직접 영향 있는 항목)

- e2e Playwright (신고 전이 5종 + cross-context orphan 시나리오)
- Storybook (filter form / detail cards / transition dialog)
- a11y axe (form / dialog)
- i18n (한국어 하드코딩)
- mutation dialog reset 정책 일관화 (`useDialogResetEffect` 추출)
- guest admin route (별 묶음)
- penalty UI / avatar publish-retire 이미 backend 완비 — 별 PR (14f Avatar에서 cover, penalty는 별도 후속)

### 13.2 14e 신규

- **list view에 reporter nickname 추가** — backend D7 (cross-context join 미수행) 정책 변경 후 frontend mirror (R3 잔존). 현재는 detail만.
- **`useReportInvalidator` shared helper 추출** — `setQueryData(["reports","detail", id], detail)` + `invalidate(["reports","list"])` 패턴 single helper. setQueryData + invalidate 둘 다 보유한 helper.
- **신고 첨부 파일 UI** — backend GCS URL 컬럼 확장 후 frontend 추가 (PR 13 future).
- **24h duplicate 카드** — 동일 신고자 동일 카테고리 24h 내 다른 신고 표시 (R2 abuse 패턴).
- **bulk PATCH (여러 신고 일괄 처리)** — backend `BulkReportStatusUpdateRequest` 신설 + frontend 14d bulk-action 패턴 그대로 (PR 13 §future).
- **`AdminReportSummaryResponse`에 reporter nickname / partyroom title 추가** — list 표시 풍부화 (D7 변경 시).
- **status badge 색상 토큰화** — `tailwind.config.ts`에 ReportStatus 4종 색상 정의 (PENDING blue / REVIEWING amber / RESOLVED green / DISMISSED gray).
- **transition dialog Action Select 회복 e2e** — 14c §14 entry 14 / 14d §13.2와 동일 한계 cover.

---

## 참고 자료

- 14d spec: `docs/specs/2026-04-29-admin-pr14d-design.md` (HEAD `0ef0eaf`)
- 14c spec: `docs/specs/2026-04-29-admin-pr14c-design.md` (post-backfill)
- 14b spec: `docs/specs/2026-04-29-admin-pr14b-design.md`
- backend (PR 13):
  - `AdminReportQueryController` (list / detail)
  - `AdminReportCommandController` (PATCH transition)
  - `AdminReportListQuery` / `AdminReportSummaryResponse` / `AdminReportDetailResponse` / `AdminReportStatusUpdateRequest`
  - `AdminReportException` (RPT-001~007)
  - `ReportStatus` / `ReportCategory` enum
- backend spec: `pfplay-platform/docs/superpowers/specs/2026-04-28-admin-platform-pr13-design.md` §3.2 / §3.3 / §3.4 / §5
- backend roadmap: `pfplay-platform/docs/superpowers/specs/2026-04-19-admin-platform-roadmap.md` (PR 14 본래 계획 — 신고 관리 UI 명시)
