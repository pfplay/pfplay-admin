# PR 14g — §13.2 묶음 α (refactor + DTO 확장 + small enhancement) Design

**상태**: G0 초안
**선행**: PR 14f (`f8875b1`) — Avatar 카탈로그 완료, 287/287 PASS
**브랜치**: `feature/admin-platform-frontend` (PR 14a~14g 통합)
**범위**: 14a~14f §13.2 잔존 항목 중 가성비 높은(High value, low effort) 묶음 α 통합 처리. 묶음 α는 (1) 5 shared hook 추출 + (2) backend DTO 확장 2건 + (3) small enhancement 4건. 회귀 0 + 기존 8개 dialog / widget의 inline 코드 단순화.

**본 PR 위치**: M6 close 직전 폴리시. 운영 시작 전 코드 정리 + UX 개선.

---

## 1. 목적과 비목적

### 1.1 목적 (3 카테고리)

**A. Frontend refactor (5 shared hook 추출, ~11h):**
1. `useDialogResetEffect(open, onReset)` — 8 dialog inline `useEffect(() => { if (!open) { ...reset; mutation.reset() } }, [open])` 패턴 통합 (14c §14 entry 4 / 14d §13.2 / 14e §13.2 / 14f §13.2 누적 잔존)
2. `useUrlQueryState<T>(schema)` — 14b members + partyrooms widget의 `parseSearchParams + stripInvalidParams + setParams` 패턴 통합 (single-param) (14b §15.2)
3. `useUrlMultiParamState<T>(schema)` — 14e reports widget의 `URLSearchParams.getAll/append` 패턴 통합 (multi-param) (14e §13.2)
4. `useSelectionState<T>(query)` — 14d partyrooms-list widget의 `useState<Set<T>> + useEffect query reset` 패턴 통합 (14d §13.2)
5. `useRefineError(errors)` — 14c UpdateMetaDialog의 RHF v7 `errors[""]` 빈 키 추출 helper (14c §14 entry 8)

**B. Backend DTO 확장 (cross-repo, ~6h):**
6. `AdminMemberDetailResponse`에 `withdrawn: boolean` + `withdrawnAt: LocalDateTime?` 추가 → frontend dropdown disable 활성화 + types.ts mirror (14c R1 잔존, §13.2)
7. `AdminPartyroomDetailResponse`에 `introduction: String?` + `playbackTimeLimit: Integer?` 추가 → frontend UpdateMetaDialog placeholder 채움 + 14b detail card 추가 행 (14c §13.2)

**C. Small enhancement (~3h):**
8. role-based nav 분기 — 14f Avatar nav는 `useSessionStore.role === "SUPER_ADMIN"`만 노출 (14f R6)
9. `alreadyWithdrawn=true` 토스트 차별화 — withdraw mutation 응답 검사 (14c)
10. mutation 결과 audit-log 카드 자동 강조 — `recentAdminActions` 첫 row 1초 highlight (14c §13.2 마이크로 UX)
11. status badge 색상 토큰화 — `tailwind.config.ts`에 ReportStatus / LifecycleStatus 색상 변수 추가 (14e §13.2)

### 1.2 비목적 (14g 범위 외)

- 묶음 β/γ 항목 — e2e Playwright / Storybook / a11y axe / i18n / OffsetDateTime 통일 / `BulkActionResult.errorCode` / Avatar full CRUD / guest admin / penalty UI / 모바일 반응형 — 별 PR
- 14g §13.2의 잔존 항목 (selection cross-page β / BulkActionType 확장 / etc)

---

## 2. 백엔드 ground-truth (DTO 확장 영역)

### 2.1 AdminMemberDetailResponse 확장

**현재** (PR 12b 시점):
```java
record AdminMemberDetailResponse(
    Long memberId, Long userAccountId, String email, String nickname, ...
)
```

**확장 (14g)**:
```java
record AdminMemberDetailResponse(
    Long memberId, Long userAccountId, String email, String nickname, ...,
    boolean withdrawn,         // user_account.withdrawn 컬럼 (또는 derived)
    LocalDateTime withdrawnAt  // user_account.withdrawn_at (nullable)
)
```

backend grep 필요 (G1.1): `user_account` 테이블에 `withdrawn` / `withdrawn_at` 컬럼이 이미 있는지 확인. 14b §15.2가 "withdrawn(derived)"로 박혀있고 14b list view엔 이미 노출됨 → detail에 누락된 것.

### 2.2 AdminPartyroomDetailResponse 확장

**현재** (PR 14b 시점):
```java
record AdminPartyroomDetail(
    Long partyroomId, String title, PartyroomStatus status, ..., DisplayFlag displayFlag,
    HostMeta host, int crewCount, LocalDateTime lastActivityAt, StageType stageType,
    PlaybackMeta playback, List<CrewMeta> crews, ..., List<RecentAdminAction> recentAdminActions
)
```

**확장 (14g)**:
```java
record AdminPartyroomDetail(
    ..., String introduction, Integer playbackTimeLimit, ...
)
```

backend `PartyroomData` entity엔 두 필드 모두 존재 (14c update-meta 검증 시 backend `partyroom.getIntroduction()` / `getPlaybackTimeLimit().getMinutes()` 사용 확인됨). DTO에 미노출 → backend record 확장 + Repository projection 추가.

### 2.3 backend 변경 분량

- DTO record 2개 필드 추가 (Java)
- Repository QueryDSL projection 추가 (member detail / partyroom detail 각각)
- 기존 backend test (DTO shape assertion) 보강
- 변경 분량: ~3-4시간 (cross-repo)

### 2.4 인증/CSRF

14a `http.ts` 자동 처리. 14g 신규 작업 0.

---

## 3. 아키텍처

### 3.1 FSD 레이어 변경 — 신규 / 수정

**신규 hook (Frontend refactor):**
```
src/shared/lib/use-dialog-reset-effect.ts
src/shared/lib/use-url-query-state.ts
src/shared/lib/use-url-multi-param-state.ts
src/shared/lib/use-selection-state.ts
src/shared/lib/use-refine-error.ts
```

**수정 (refactor 적용 — 회귀 0):**
```
src/features/{members,partyrooms,reports,avatars}/ui/mutation-dialogs/*.tsx  # useDialogResetEffect 적용
src/widgets/{members-list,partyrooms-list,reports-list}.tsx                  # useUrlQueryState / useUrlMultiParamState 적용
src/widgets/partyrooms-list.tsx                                              # useSelectionState 적용
src/features/partyrooms/ui/mutation-dialogs/update-meta-dialog.tsx          # useRefineError 적용
```

**수정 (DTO 확장 + UI 활성화):**
```
src/entities/member/model/types.ts                          # withdrawn / withdrawnAt 추가
src/entities/partyroom/model/types.ts                       # introduction / playbackTimeLimit 추가
src/features/members/ui/members-actions-dropdown.tsx        # withdraw menuitem disable when withdrawn=true
src/features/members/ui/member-detail-cards.tsx             # withdrawn 뱃지 + withdrawnAt tooltip
src/features/partyrooms/ui/partyroom-detail-cards.tsx       # introduction / playbackTimeLimit 행 추가
src/features/partyrooms/ui/mutation-dialogs/update-meta-dialog.tsx  # placeholder = currentIntroduction / currentPlaybackTimeLimit
```

**수정 (Small enhancement):**
```
src/app/layout.tsx                                          # SUPER_ADMIN 분기 nav (14f Avatar 항상 노출 → 분기)
src/features/members/api/use-withdraw-member.ts             # alreadyWithdrawn 토스트 차별화
src/features/partyrooms/ui/partyroom-detail-cards.tsx       # recentAdminActions 첫 row highlight (mutation 직후)
src/globals.css 또는 tailwind.config.ts                      # status badge 색상 토큰
```

### 3.2 backend 변경 (cross-repo)

```
pfplay-platform/app/src/main/java/.../AdminMemberQueryService.java  # withdrawn projection 추가
pfplay-platform/.../AdminMemberDetailResponse.java                  # 필드 2개 추가
pfplay-platform/.../AdminPartyroomDetail.java                       # 필드 2개 추가
pfplay-platform/.../AdminPartyroomQueryRepositoryImpl.java          # projection 추가
+ backend tests 보강
```

---

## 4. 5 shared hook 명세

### 4.1 `useDialogResetEffect(open, onReset)`

```ts
export function useDialogResetEffect(open: boolean, onReset: () => void): void {
  useEffect(() => {
    if (!open) onReset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

// 사용:
useDialogResetEffect(open, () => {
  setReason("")
  mutation.reset()
})
```

### 4.2 `useUrlQueryState<T>(schema)`

```ts
export function useUrlQueryState<T extends ZodTypeAny>(
  schema: T,
): {
  query: z.infer<T> | null
  setQuery: (next: Partial<z.infer<T>>) => void
  reset: () => void
} {
  const [params, setParams] = useSearchParams()
  const parsed = parseSearchParams(schema, params)
  useEffect(() => {
    if (!parsed.success) {
      setParams(stripInvalidParams(params, parsed.error), { replace: true })
      toast.error("필터 일부가 잘못돼 무시했어요")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.success])

  return {
    query: parsed.success ? parsed.data : null,
    setQuery: (next) => {
      const merged = { ...(parsed.success ? parsed.data : {}), ...next }
      setParams(serializeQuery(merged as Record<string, unknown>))
    },
    reset: () => setParams(new URLSearchParams()),
  }
}
```

### 4.3 `useUrlMultiParamState<T>(schema, multiKeys)`

```ts
export function useUrlMultiParamState<T extends ZodTypeAny>(
  schema: T,
  multiKeys: string[],
): {
  query: z.infer<T> | null
  setQuery: (next: Partial<z.infer<T>>) => void
  reset: () => void
} {
  // URLSearchParams.getAll for multiKeys, URLSearchParams.append for write
  // ... 14e ReportsListWidget의 urlToQueryObj/queryToUrl을 helper로 추출
}
```

### 4.4 `useSelectionState<T>(deps)`

```ts
export function useSelectionState<T>(deps: unknown[]): {
  selectedIds: Set<T>
  toggleId: (id: T) => void
  toggleAll: (checked: boolean, visibleIds: T[]) => void
  clearSelection: () => void
} {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set())
  useEffect(() => {
    setSelectedIds(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return {
    selectedIds,
    toggleId: (id) => setSelectedIds((prev) => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
    }),
    toggleAll: (checked, visibleIds) =>
      setSelectedIds(checked ? new Set(visibleIds) : new Set()),
    clearSelection: () => setSelectedIds(new Set()),
  }
}
```

### 4.5 `useRefineError<T>(errors)`

```ts
export function useRefineError<T extends Record<string, unknown>>(
  errors: T,
): { message?: string } | undefined {
  // RHF v7 zodResolver: top-level refine 에러는 errors[""] (빈 키)
  return (errors as Record<string, { message?: string } | undefined>)[""]
}
```

---

## 5. DTO 확장 활성화 매핑

| backend 필드 | frontend type | UI 활성화 |
|---|---|---|
| `AdminMemberDetail.withdrawn` | `AdminMemberDetail.withdrawn: boolean` | members-actions-dropdown: withdraw menuitem `disabled={member.withdrawn}` (14c R1 idempotent 우회 → 명시적 차단) |
| `AdminMemberDetail.withdrawnAt` | `AdminMemberDetail.withdrawnAt: string \| null` | member-detail-cards header: 회색 "탈퇴됨" 뱃지 + tooltip(`{formatKst(withdrawnAt)}`) |
| `AdminPartyroomDetail.introduction` | `AdminPartyroomDetail.introduction: string \| null` | partyroom-detail-cards meta 카드: "소개" 행 추가 + UpdateMetaDialog `placeholder={current}` |
| `AdminPartyroomDetail.playbackTimeLimit` | `AdminPartyroomDetail.playbackTimeLimit: number \| null` | partyroom-detail-cards: "재생 시간 제한" 행 + UpdateMetaDialog placeholder |

---

## 6. Small enhancement 명세

### 6.1 role-based nav

`src/app/layout.tsx`:
```tsx
const navItems = [
  ...
  { to: "/avatars/bodies", icon: Image, label: "아바타", role: "SUPER_ADMIN" },
]
const visibleNav = navItems.filter(
  (item) => !item.role || meta?.role === item.role,
)
```

### 6.2 alreadyWithdrawn 토스트

`useWithdrawMember`:
```ts
onSuccess: (response) => {
  qc.invalidateQueries({ queryKey: ["members"] })
  if (response.alreadyWithdrawn) {
    toast.info("이미 탈퇴된 회원입니다")
  } else {
    mutationSuccessToast("회원 탈퇴 처리 완료")
  }
}
```

### 6.3 audit-log 카드 highlight

partyroom-detail-cards `recentAdminActions` 카드:
- mutation 성공 직후 invalidate → list refetch
- 첫 row에 `<motion.div initial={{ bg: "yellow-100" }} animate={{ bg: "transparent" }} duration={1000}>` 또는 단순 `useState + setTimeout` highlight 클래스 1초

(framer-motion 의존 추가 회피 — 단순 setTimeout + 클래스 토글)

### 6.4 status badge 색상 토큰

`globals.css`에 추가:
```css
@layer base {
  :root {
    --status-pending: ...
    --status-reviewing: ...
    --status-resolved: ...
    --status-dismissed: ...
    --lifecycle-draft: ...
    --lifecycle-published: ...
    --lifecycle-retired: ...
  }
}
```

table / detail-cards에서 Badge variant `style={{ backgroundColor: "var(--status-pending)" }}` 또는 className 매핑.

---

## 7. 에러 / Edge / 미래 호환

### 7.1 회귀 위험

refactor (4 hook 추출 + 적용)는 **inline 코드를 helper로 교체**. 기존 테스트가 일관 통과하면 회귀 0. 287/287 baseline.

### 7.2 backend DTO 호환

기존 backend 응답에 필드 추가 → frontend `string | null` / `boolean` optional zod로 forward-compat. 기존 14b/14c list/detail 사용처 회귀 0.

### 7.3 alreadyWithdrawn

기존 `useWithdrawMember`는 toast.success만 호출. 새 분기는 toast.info 추가. 기존 테스트 보강 필요.

---

## 8. 테스트 전략

### 8.1 자동 테스트 (신규/보강)

| 영역 | tests |
|---|---|
| useDialogResetEffect | 3 (open=false → reset / open=true → no-op / change deps) |
| useUrlQueryState | 4 (parse / invalid drop / setQuery / reset) |
| useUrlMultiParamState | 3 (multi getAll / append / reset) |
| useSelectionState | 5 (toggle / toggleAll / clear / deps reset / Set immutability) |
| useRefineError | 2 (errors[""] / undefined fallback) |
| 기존 dialog/widget refactor 회귀 | (기존 tests 그대로 PASS) |
| AdminMemberDetail withdrawn 활성화 | 3 (badge / menuitem disable / tooltip) |
| AdminPartyroomDetail introduction/limit | 3 (행 추가 / placeholder / formatKst) |
| alreadyWithdrawn toast | 2 (true → toast.info / false → toast.success) |
| role-based nav | 3 (SUPER_ADMIN nav 노출 / ADMIN 미노출 / 미인증 시) |
| audit-log highlight | 1 (시각적 — 단순 className 검증) |

총 신규 ~29 tests (refactor는 회귀 0이라 신규 X). baseline 287 + 29 = **약 316**.

### 8.2 수동 검증 (staging)

- withdraw 회원 dropdown menuitem disabled
- ADMIN 계정으로 사이드바 "아바타" 미노출
- 신고 transition 후 audit-log 첫 row 1초 highlight
- DRAFT body publish 후 list cache 갱신

---

## 9. 의존 라이브러리 추가

없음. 14a~14f 의존으로 충분.

---

## 10. 구현 chunk 분할

| Chunk | 범위 | commits 예상 |
|---|---|---|
| G0 | spec / plan | 2 |
| G1 | 5 shared hook 추출 (TDD) | 5~6 |
| G2 | 기존 dialog/widget refactor 적용 (회귀 0) | 4~5 |
| G3 | backend DTO 확장 (member + partyroom, cross-repo) | 4~5 |
| G4 | frontend type mirror + UI 활성화 (withdrawn / introduction / limit) | 3~4 |
| G5 | small enhancement (role-based nav / alreadyWithdrawn / audit highlight / status badge 토큰) | 4~5 |
| G6 | chunk sanity + spec catch-up | 2~3 |

총 commits 예상 ~25-30.

---

## 11. 위험 / 미해결

### R1 — refactor 회귀

**위험**: 5 hook 추출 + 8 dialog / 4 widget 코드 교체. 기존 287 테스트 회귀 가능.
**대응**: chunk 단위 sanity (typecheck + 전체 테스트). 회귀 catch 시 즉시 polish.

### R2 — backend DTO 변경 cross-repo timing

**위험**: backend DTO 변경 → frontend 활성화 의존. backend 머지/배포 timing 불일치 시 frontend가 새 필드 부재 환경에서 실행.
**대응**: backend 먼저 머지 → staging 검증 → frontend 머지. forward-compat은 frontend가 optional zod로 보장 (필드 부재 → undefined). PR commit chain 안에서는 backend → frontend 순서.

### R3 — audit-log highlight 구현

**위험**: framer-motion 의존 추가하면 bundle 크기 증가. 단순 className timeout 토글로 회피하지만 React 18 Strict Mode 또는 cleanup timing 주의.
**대응**: `useEffect` cleanup으로 setTimeout cancel. test에서 timer 모킹.

### R4 — alreadyWithdrawn 응답 구조

**위험**: backend `AdminMemberWithdrawResponse.alreadyWithdrawn`이 boolean 필드. 14c types.ts에 이미 mirror됨 — 확인 필요.
**대응**: G1.1 backend grep으로 검증.

---

## 12. Open Items / Implementation Reality (post-build catch-up)

(G6 chunk에서 채움)

---

## 13. Future Polish (14a~14f §13.2 잔존)

본 PR은 묶음 α만 처리. 묶음 β/γ는 별 PR:

- **묶음 β 추가** (~15h): e2e Playwright (14a~14g 시나리오) + a11y axe
- **묶음 γ 추가** (~35h): Storybook + i18n + OffsetDateTime + Avatar full CRUD
- **별 도메인 PR**: penalty / guest admin (cross-repo backend 신설) / bulk progress / 모바일 반응형(정책 변경)
- **PR 13 future**: 신고 첨부 / 24h duplicate / bulk PATCH

---

## 참고 자료

- 14f spec: `docs/specs/2026-04-29-admin-pr14f-design.md` (HEAD `f8875b1`)
- 14e/14f memory: `project_pr14ef_completed.md` (M6 close 준비)
- backend (DTO 확장 영역):
  - `AdminMemberDetailResponse` / `AdminMemberQueryService`
  - `AdminPartyroomDetail` / `AdminPartyroomQueryRepositoryImpl`
  - `PartyroomData.getIntroduction()` / `getPlaybackTimeLimit()` (entity 메소드 이미 존재)
- 14a~14f §13.2 누적 잔존 항목 참조
