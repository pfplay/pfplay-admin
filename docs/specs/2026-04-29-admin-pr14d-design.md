# PR 14d — 어드민 파티룸 일괄 액션 (bulk-action) Design

**상태**: G0 초안
**선행**: PR 14c (`8fac84a`) — 단건 mutation 7개 완료, 151/151 PASS
**브랜치**: `feature/admin-platform-frontend` (PR 14a~14d 통합)
**범위**: 14b list page에 row selection 인프라 + bulk-action 모달 + per-item 결과 표시. backend 변경 0 (`POST /api/v1/admin/partyrooms/bulk-action` 재사용).

---

## 1. 목적과 비목적

### 1.1 목적

- 어드민이 파티룸 list에서 N개(1~100)를 선택해 한 번에 **TERMINATE / SUSPEND / SET_HIDDEN** 적용
- 부분 실패 허용(skipErrors=true 기본) — 결과 모달에서 실패 항목별 사유 표시
- 14b list page의 filter / sort / pagination와 충돌 없이 selection 상태 유지 (페이지 이동 시 reset 또는 cross-page persist 정책 결정 필요 — §5에서)

### 1.2 비목적 (14d 범위 외)

- members bulk (backend 미지원)
- bulk RESTORE / SET_FEATURED / SET_NORMAL / UPDATE_META — backend `BulkActionType` 미정의 (§13.2)
- penalty / admin action / avatar publish-retire 단건 — 14c §13.2 그대로 잔존
- e2e Playwright (§13.2 14b 상속)

---

## 2. 백엔드 ground-truth

### 2.1 endpoint

`POST /api/v1/admin/partyrooms/bulk-action` — `@PreAuthorize("@adminAuth.isAdmin()")`, 200 OK + body.

### 2.2 request — `BulkPartyroomActionRequest`

```java
record BulkPartyroomActionRequest(
    @NotEmpty @Size(min=1, max=100) List<Long> partyroomIds,
    @NotNull BulkActionType action,           // TERMINATE | SUSPEND | SET_HIDDEN
    @NotBlank @Size(max=500) String reason,
    Boolean skipErrors                         // default true (skipErrorsOrDefault)
)
```

- `partyroomIds`: 1~100 개. 0개는 `@NotEmpty` 위반 (400).
- `action`: `BulkActionType{TERMINATE, SUSPEND, SET_HIDDEN}`. 다른 값 400.
- `reason`: 필수, 1~500자. 빈 문자열 400.
- `skipErrors`: null이면 true. true면 항목별 실패 무시하고 계속, false면 첫 실패에서 break.

### 2.3 response — `BulkPartyroomActionResponse` (HTTP 200)

```java
record BulkPartyroomActionResponse(List<BulkActionResult> results) {
    record BulkActionResult(Long partyroomId, boolean success, String error) {}
}
```

- `results.length === request.partyroomIds.length` (skipErrors=true) 또는 첫 실패까지 (skipErrors=false)
- 각 결과: `success=true` → `error=null`, `success=false` → `error=AbstractHTTPException.getMessage()` 또는 `"INTERNAL_ERROR"`
- HTTP status는 항상 200 — 부분 실패는 본문 `success: false` row로 표현 (전체 실패도 200)

### 2.4 behavior — per-item TX

- 외부 서비스 `AdminBulkPartyroomActionService`는 non-transactional, per-item TX는 `AdminPartyroomTransactionalUnit#executeOne`이 소유.
- 성공 항목은 자기 TX로 commit 즉시. 후속 break/실패에 영향받지 않음.
- audit row는 per-item TX 안에서 listener가 INSERT — gap 없음.
- 즉, **부분 성공이 진짜로 부분 commit됨**. 클라는 결과 row 1:1 처리 + 실패 항목만 retry/안내.

### 2.5 인증/CSRF

14a `http.ts`가 unsafe POST에 자동 처리. 14d 신규 작업 0.

### 2.6 도메인 예외 mapping (per-item error string 후보)

bulk endpoint는 항목별 예외를 `error` string으로 노출. 단건 mutation 시 GlobalExceptionHandler가 매핑한 status/errorCode/message 중 **`message`만** 결과에 들어감. 14c §7.1 매트릭스의 errorCode는 사용 불가 — message로 사용자 안내 + log 보존 정책.

| 단건 errorCode | 메시지 예 | 14d UI |
|---|---|---|
| `NOT_FOUND_ROOM` | "파티룸을 찾을 수 없습니다" | 결과 row "찾을 수 없음" 표시 |
| `ALREADY_TERMINATED` | "이미 종료된 룸입니다" | "이미 종료" |
| `ILLEGAL_STATE_TRANSITION` | "전이 불가" | "전이 불가" + 안내 |
| (기타) | message 그대로 또는 "INTERNAL_ERROR" | 그대로 + tooltip 전체 |

§13.2: backend가 errorCode도 결과에 포함 노출하면 클라가 일관 매핑 가능 (future polish).

---

## 3. 아키텍처

### 3.1 FSD 레이어 변경

**신규 파일:**
```
src/features/partyrooms/
  model/bulk-schema.ts                  # zod BulkPartyroomActionSchema
  api/bulk-partyrooms-api.ts            # bulkPartyroomAction(body): Promise<BulkPartyroomActionResponse>
  api/use-bulk-partyroom-action.ts      # useMutation hook
  ui/bulk-action-toolbar.tsx            # selection toolbar (count + action button)
  ui/bulk-action-dialog.tsx             # action select + reason + skipErrors + submit
  ui/bulk-action-result-dialog.tsx      # success/fail count + 실패 list with error
  ui/__tests__/{bulk-action-toolbar,bulk-action-dialog,bulk-action-result-dialog}.test.tsx
  api/__tests__/{bulk-partyrooms-api,use-bulk-partyroom-action}.test.{ts,tsx}
  model/__tests__/bulk-schema.test.ts
```

**수정 파일:**
```
src/features/partyrooms/ui/partyrooms-table.tsx     # row checkbox + header 전체 선택
src/widgets/partyrooms-list.tsx                     # selection state owner + toolbar 통합
src/components/ui/checkbox.tsx                      # shadcn Checkbox 신규 (의존 §9)
src/test/mocks/handlers/partyrooms.ts               # bulk-action mock handler
src/test/mocks/fixtures/partyrooms.ts               # BulkActionResult fixture
```

### 3.2 라우트 / 사이드바

변경 없음. `/partyrooms` 그대로 — list 화면에 selection UI만 layered.

---

## 4. mutation hook 공통 계약

### 4.1 Invalidate 키

bulk 성공 (부분 성공 포함) 시 `["partyrooms"]` prefix 일괄 invalidate. detail 페이지 들어가 있는 경우도 stale 표시. 14c §4.1 일관.

### 4.2 toast 정책

- 전체 성공 (`results.every(r => r.success)`): `mutationSuccessToast("일괄 처리 완료 (N건)")`
- 부분 실패: `toast.warning(\`성공 \${ok}건 / 실패 \${ng}건\`)` — 상세는 결과 모달에서 보여줌
- 전체 실패 (`results.every(r => !r.success)`): `mutationErrorToast(new ApiError({ message: "일괄 처리 전건 실패" }))` 또는 toast.error
- HTTP 4xx/5xx (요청 자체 실패): 14c `mutationErrorToast` 그대로

### 4.3 결과 모달 분기

- 전체 성공: toast만, 결과 모달 미표시 (UX 단순화)
- 부분/전체 실패: 결과 모달 자동 open (실패 항목 list + 사유 + 닫기 후 selection clear)

---

## 5. list page row selection 인프라

### 5.1 selection state 위치

`PartyroomsListWidget`(`widgets/partyrooms-list.tsx`)이 owner. table은 controlled props (`selectedIds: Set<number>`, `onToggleId`, `onToggleAll`) 받음.

### 5.2 cross-page 정책 (α 결정)

- **α (채택)**: 페이지 이동 시 selection **reset**. 단순/예측 가능. 어드민이 다중 페이지 cross-select 케이스 빈도 낮음.
- β: cross-page persist (Set in URL or memory). 복잡도/UX trade-off. §13.2.

### 5.3 filter 변경 시 정책

filter (status/stageType/host/createdFrom/createdTo) 변경 시도 페이지 reset 동반 → selection reset. sort 변경도 페이지 reset 패턴 (14b §6.1 일관)이라 동일.

### 5.4 selection persistence — 단일 페이지 안

table 행 페이지(50건 default) 안에서만 유지. 100건 max는 한 페이지 안 도달 가능 (size=100까지 확장 future polish — 현재 size=50 기본). size=50일 때 어드민이 50건 일괄 처리 가능, 100건 처리는 두 번 나눠서.

### 5.5 disabled 항목

- TERMINATED 상태 row: 이미 종료된 룸은 SUSPEND/TERMINATE 불가 (개별 mutation과 일관). checkbox 비활성 (`disabled`).
- 단, SET_HIDDEN은 TERMINATED여도 가능 (display flag은 status 무관). 따라서 row checkbox는 enabled, dialog 단계에서 action별로 backend가 per-item 처리 (TERMINATED + TERMINATE → ALREADY_TERMINATED 결과 row).
- α 결정: row checkbox는 항상 enabled, dialog에서 action 선택 후 sample preview에 "예상 실패: X건"이라 보여주지 않음. backend 결과로 받음. 단순화 우선.

### 5.6 header 전체 선택

`<Checkbox indeterminate>` 패턴. shadcn Checkbox는 indeterminate 직접 미지원 — `data-state="indeterminate"` + `<Indicator>` 표시. radix Checkbox 자체는 indeterminate 지원 (checked={"indeterminate"}). React Aria `aria-checked="mixed"`.

선택 상태:
- 전체 선택됨 (모든 row): `checked=true`
- 일부만: `checked="indeterminate"`
- 0개: `checked=false`

전체 선택 클릭 → 현재 페이지 N개 모두 select. 전체 해제 → 0.

### 5.7 max 100 강제

selection.size > 100 즉시 toolbar에 빨간 경고 + bulk action 버튼 disabled. 백엔드 `@Size(max=100)`을 클라에서 미리 차단.

---

## 6. bulk action UI

### 6.1 toolbar (`bulk-action-toolbar.tsx`)

selection.size > 0 시 list 상단에 sticky 노출. 컨텐츠:

- "선택: N건" (size>100이면 "100건 초과 — 100건 이하로 줄여주세요")
- "일괄 처리 ▾" 버튼 (size 0 또는 >100 시 disabled)
- "선택 해제" 버튼

버튼 클릭 → `BulkActionDialog` open with `selectedIds`.

### 6.2 `BulkActionDialog`

form 필드:
- **Action**: shadcn Select — `TERMINATE` (강제 종료) / `SUSPEND` (일시 정지) / `SET_HIDDEN` (표시 숨김)
- **Reason**: `<Textarea>` — `min(1).max(500)`
- **skipErrors**: `<Checkbox>` — 기본 checked (= true). 라벨 "한 항목 실패 시에도 계속 진행 (권장)"
- 선택된 partyroomIds 미리보기 (요약: "선택된 N건: ID 1, 2, 3, ..." or "ID 1~10 등 N건")

submit:
- mutation.mutate({ partyroomIds, action, reason, skipErrors })
- onSuccess(response):
  - 전체 성공 → toast + dialog close + selection clear
  - 부분/전체 실패 → 결과 모달로 전환 (state machine: action-dialog → result-dialog) + selection clear after close

### 6.3 `BulkActionResultDialog`

- 헤더: "일괄 처리 결과 — 성공 X건 / 실패 Y건"
- 실패 항목 list (table 또는 div):
  - partyroomId
  - 14b list cache에서 lookup한 title (없으면 "(N/A)")
  - error message
- 닫기 버튼 → 결과 dialog close, selection이 이미 clear된 상태

### 6.4 진행 표시

`mutation.isPending` 시 dialog submit 버튼 "처리 중..." + spinner. 일괄 처리는 backend per-item 순차 → N개에 따라 수 초~수십 초 소요. 진행률 progress bar는 backend SSE 미지원으로 skip — spinner만 (§13.2 후보).

---

## 7. 에러 / Edge / 미래 호환

### 7.1 요청 자체 실패

- 400 (validation): `BulkPartyroomActionRequest` 위반 — 클라 zod로 미리 차단. 백엔드 도달 0 케이스 가정.
- 401 (인증 만료): 14a interceptor가 logout + redirect.
- 403 (권한): 14a 매트릭스 일관, toast.
- 5xx: `mutationErrorToast` generic.

### 7.2 부분 실패

§4.2 / §4.3 정책. 결과 모달이 catch-all.

### 7.3 race condition

- list staleness: bulk 후 `["partyrooms"]` invalidate → list 재fetch. 사용자가 selection 후 다른 어드민이 status 변경 → 결과 row에서 `ALREADY_TERMINATED` 등으로 노출.
- 결과 모달 닫기 후에도 list가 stale일 수 있음 — invalidate가 처리.

### 7.4 forward-compat

- `BulkActionType` 추가 시 (RESTORE/SET_FEATURED 등) — 14d zod에 enum case 추가만으로 cover.
- `BulkActionResult.error` 구조 변경 (errorCode 추가) — 14d frontend는 string `error` 그대로 사용, errorCode field는 `?:` optional zod로 여유 (§13.2).

### 7.5 권한

- bulk endpoint도 `@adminAuth.isAdmin()` — 14a 매트릭스 일관.
- super-admin 전용 분리 — 14d 비목적.

### 7.6 a11y

- header checkbox `aria-label="전체 선택"`
- row checkbox `aria-label={\`\${title} 선택\`}` 또는 `aria-labelledby={titleCellId}`
- toolbar `role="status"` for "선택: N건" 카운트 (SR 갱신)
- result dialog 실패 list `<table>` + `<caption className="sr-only">실패 항목</caption>`

---

## 8. 테스트 전략

### 8.1 자동 테스트

- `bulk-schema.test.ts`: 1~100 partyroomIds, action enum, reason min/max, skipErrors 기본값 동작 — 5~6 tests
- `bulk-partyrooms-api.test.ts`: POST /admin/partyrooms/bulk-action body shape + 200 response unwrap + 4xx 전파 — 3 tests
- `use-bulk-partyroom-action.test.tsx`: invalidate ['partyrooms'] + toast 분기 (전체성공 / 부분실패 / 전체실패) — 3 tests
- `bulk-action-toolbar.test.tsx`: count 표시 / 100건 초과 disabled / 선택 해제 — 3 tests
- `bulk-action-dialog.test.tsx`: 폼 필드 렌더링 / submit disabled when invalid / 14c §14 entry 14 패턴(Dialog+Select hang) 우회로 user.click(combobox) 미사용 — 4 tests
- `bulk-action-result-dialog.test.tsx`: 성공/실패 카운트 / 실패 항목 list 렌더 / lookup title fallback — 3 tests
- `partyrooms-table.test.tsx` 확장: row checkbox / header 전체 선택 / disabled (해당 시) — 3~4 tests
- `partyrooms-list.test.tsx` 통합: selection persist 단일 페이지 / 페이지 이동 시 reset — 2 tests

총 신규 ~30 tests. 14c 151 → 14d 약 180.

### 8.2 수동 검증 (staging)

- N=1 / N=50 / N=100 경계
- skipErrors=true / false 동작 차이
- TERMINATE 후 list 재fetch에서 row 사라짐 (filter status=ACTIVE 기준)
- 부분 실패 시 결과 모달 표시 + 실패 사유 노출

### 8.3 MSW handler 확장

- `POST /api/v1/admin/partyrooms/bulk-action` mock — body의 action별 fixture response (전체성공 / 부분 / 전체 실패 시나리오 셋)

---

## 9. 의존 라이브러리 추가

- `@radix-ui/react-checkbox` (shadcn Checkbox 컴포넌트 base)
- 그 외 14c 의존 그대로 (radix dropdown-menu/dialog/select 등)

---

## 10. 구현 chunk 분할

| Chunk | 범위 | commits 예상 |
|---|---|---|
| G0 ~ G0.x | spec / plan 작성 + reviewer polish | 3~5 |
| G1 | shadcn Checkbox 의존 추가 + 컴포넌트 + sanity test | 1~2 |
| G2 | partyrooms-table row checkbox + header 전체 선택 + 14b 회귀 0 | 2~3 |
| G3 | partyrooms-list widget selection state + toolbar 통합 | 2~3 |
| G4 | bulk schema + API fn + hook (TDD) | 3~4 |
| G5 | bulk-action-dialog (form + submit + state machine) | 2~3 |
| G6 | bulk-action-result-dialog + dialog 전환 통합 | 2~3 |
| G7 | msw handler + chunk sanity | 1~2 |
| G8 | spec §12 catch-up + §13.2 + 14c §13.2 backfill | 1~2 |

총 commits 예상 ~25 (14c 42보다 작음 — 14d 도메인 좁음).

---

## 11. 위험 / 미해결

### R1 — selection cross-page persist 정책

**상태**: §5.2 α 결정 — 페이지 이동 시 reset. 어드민 cross-page 다중 선택 빈도 추정 기반.
**잔존**: 운영 후 cross-page 요구 발생 시 §13.2의 β로 전환. URL ↔ Set sync 인프라 필요.

### R2 — header indeterminate checkbox

**상태**: shadcn Checkbox는 `checked: boolean | "indeterminate"` 지원. radix Checkbox 1.x. polyfill 불필요.
**대응**: G1에서 컴포넌트 source 확인 + jsdom 호환성 sanity test 1개.

### R3 — Dialog 안 Select interaction 테스트 회피

**상태**: 14c §14 entry 14 동일 한계. `BulkActionDialog`도 Action select가 Dialog 내부.
**대응**: action 선택 테스트는 controlled prop / re-render로 우회 (initial action prop 받기) 또는 `BulkActionDialog` `open=true` + action default `TERMINATE`로 단순 검증. e2e Playwright는 §13.2.

### R4 — 실패 항목 title lookup

**상태**: result dialog는 14b list cache에서 partyroomId → title lookup. 전혀 lookup 안 된 항목 (예: 다른 페이지에서 선택해 캐시에 없음 — α 정책상 reset되지만, 백엔드가 추가 row 반환 시) "(N/A)" fallback.
**대응**: react-query `getQueryData(["partyrooms", filter])` lookup helper. fallback 단일 분기 충분.

### R5 — bulk action 진행 시간 큰 경우 UX

**상태**: 50~100건 per-item 처리 → 백엔드 응답까지 수 초~수십 초. 모달은 spinner만. 사용자가 닫으면?
**대응**: dialog `onOpenChange`를 `mutation.isPending` 동안 무시 (close 차단). 14c R6 패턴 일관. cancel 미지원 (backend 미지원).

### R6 — skipErrors=false + 첫 실패 → 이미 commit된 항목 처리

**상태**: backend behavior — skipErrors=false여도 break 전 성공 항목은 commit됨. 결과 results 배열에 그 항목까지 포함.
**대응**: result dialog "총 N건 시도 / 성공 X건 / 실패 Y건 / 미시도 Z건" 표시. Z = request.partyroomIds.length - results.length.

### R7 — bulk 후 detail 페이지 stale

**상태**: bulk 성공 후 detail 페이지에 들어가 있는 어드민은 stale 데이터.
**대응**: invalidate `["partyrooms"]` prefix가 detail key도 cover. 14c R6 일관.

---

## 12. Open Items / Implementation Reality (post-build catch-up)

(G8 chunk에서 채움 — G1~G7 진행 중 spec ↔ 실제 코드 불일치 항목 SHA + 사유 + impact)

---

## 13. Future Polish (14a/14b/14c 상속 + 14d 신규)

### 13.1 14c §13.1 / 14b §15.2 / 14a §13 상속 (14d에 직접 영향 있는 항목)

- 백엔드 `LocalDateTime` → `OffsetDateTime` (audit / response timestamps)
- e2e Playwright (bulk-action 시나리오 정확 검증)
- Storybook + 시각적 회귀 (toolbar / dialogs)
- a11y axe (Checkbox + 결과 dialog list)
- i18n (한국어 하드코딩)
- guest 어드민 라우트 (별 묶음)
- penalty UI / admin action audit / avatar publish-retire UI (별 PR)
- mutation dialog reset 정책 일관화 (`useDialogResetEffect` 추출 — 14c §13.2 상속)
- RHF v7 `.refine()` 에러 위치 helper (14c §13.2 상속)
- Dialog 안 radix Select interaction 테스트 회복 (e2e — 14c §13.2 상속)
- `AdminPartyroomCommandService.updateMeta` / `setDisplayFlag` status 가드 grep (14c §13.2 상속)
- `AdminMember/PartyroomDetailResponse` DTO 확장 (14c §13.2 상속)

### 13.2 14d 신규

- **selection cross-page persist (β)** — URL `selected` param으로 Set 동기화 + 페이지 이동/필터 변경 시 명시적 confirm. R1 잔존 시.
- **`BulkActionType` 확장** — RESTORE / SET_FEATURED / SET_NORMAL / UPDATE_META 추가 (backend enum 확장 + frontend dialog 옵션 추가).
- **`BulkActionResult.errorCode` 노출** — backend response에 `errorCode` 필드 추가 → 클라 일관 매핑 (§2.6).
- **bulk 진행률 progress bar** — backend SSE / WebSocket으로 per-item 진행 알림 → 프론트 progress bar. 현재 backend 미지원.
- **bulk action 큐 / 비동기 처리** — 100건 동기 처리는 운영 부담. backend가 큐로 받고 result polling endpoint 노출 시 frontend가 polling으로 진행률 표시.
- **size=100까지 list page 확장** — 현재 size=50 기본. 한 페이지에 100건 cover하려면 size=100 옵션 추가 (14b filter-form sort/page select에 이미 size 옵션 있음 — 검증 필요).
- **filter+selection re-apply** — 100건 select 후 filter 좁힐 때 invalid id (filtered out) selection 자동 정리.
- **result dialog "재시도" 버튼** — 실패 항목만 자동 selection 복원 + dialog 재open. 운영 효율 향상.

---

## 참고 자료

- 14c spec: `docs/specs/2026-04-29-admin-pr14c-design.md` (HEAD `d7b9c03`)
- 14c plan: `docs/plans/2026-04-29-admin-pr14c.md`
- 14b spec: `docs/specs/2026-04-29-admin-pr14b-design.md` (HEAD `8fac84a` post-backfill)
- 14a spec: `docs/specs/2026-04-28-admin-pr14a-design.md`
- backend:
  - `AdminPartyroomCommandController.bulkAction`
  - `AdminBulkPartyroomActionService.execute`
  - `AdminPartyroomTransactionalUnit.executeOne` (per-item TX)
  - `BulkPartyroomActionRequest` / `BulkPartyroomActionResponse` / `BulkActionType`
- shadcn Checkbox: https://ui.shadcn.com/docs/components/checkbox
