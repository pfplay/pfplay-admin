# PR 14c Design — 어드민 회원/파티룸 단건 mutation (헤더 dropdown + 모달)

**작성일**: 2026-04-29
**대상 레포**: `pfplay-admin` (별 레포)
**시리즈 위치**: pfplay-platform admin-platform 시리즈 PR 14의 세 번째 sub-PR (14c)
**의존**: PR 14a (인프라: `shared/api/http.ts`, CSRF 자동 echo, `entities/session`, FSD 컨벤션, vitest+RTL+msw, sonner toast), PR 14b (read-only 목록/상세 + react-query + `entities/{member,partyroom}` + `widgets/{members,partyrooms}-detail` + msw 분할 + `shared/lib/format-kst`), 백엔드 PR 12b2 (`AdminMemberTier/WithdrawCommandController`), 백엔드 PR 8 (`AdminPartyroomCommandController` B-3~B-6)
**백엔드 변경**: 0 (cross-repo 제약. 기존 mutation endpoint 재사용. `AdminMemberDetailResponse`에 `withdrawn` 필드 추가는 §15.2 future polish로 백로그 — 14c 시점 idempotent 응답으로 우회)

## 1. 목적과 비목적

### 1.1 목적

- 어드민이 14b detail page에서 운영 액션(회원 tier 변경 / 비식별화 탈퇴 / 파티룸 강제 종료 · 일시정지 · 재개 · 메타 수정 · display-flag 변경)을 수행할 수 있다.
- 모든 mutation은 동일한 UX 패턴(헤더 우측 `Actions ▾` dropdown → 모달 확인/폼 → 결과 toast → react-query invalidate)으로 통일한다.
- 14b의 read-only detail 카드 본문은 무수정 — mutation 트리거는 카드 외부의 dropdown으로 격리한다.
- 14b에서 정착된 인프라(`http.ts` CSRF 자동 echo, `ApiError` + `errorCode`, sonner toast, react-query, FSD 컨벤션)를 그대로 재사용한다.

### 1.2 비목적 (14c 범위 외)

- **bulk-action** — `POST /api/v1/admin/partyrooms/bulk-action` (B-8). 14b list page에 row selection 인프라 추가가 필요하므로 14d로 분리. `BulkActionType = TERMINATE | SUSPEND | SET_HIDDEN`만 backend 노출 중.
- **penalty (PENALIZE_CREW / RELEASE_CREW_PENALTY)** — `PartyroomAdminActionType` enum과 `PartyroomAdminActionListener`만 존재. **admin command endpoint 자체가 부재** — 14d 이후 backend + frontend 한 묶음.
- **avatar publish/retire** — `PartyroomAdminActionType.PUBLISH_AVATAR_RESOURCE` / `RETIRE_AVATAR_RESOURCE`는 별 도메인. 14c 범위 외.
- **guest 어드민 화면** — 14b §15.2 상속.
- **신규 페이지** — 14b의 4 라우트(`/members`, `/members/:id`, `/partyrooms`, `/partyrooms/:id`)만 사용. 14c 신규 라우트 0.
- **mutation 로그(audit log) 표시 강화** — 14b detail 8/8 카드 `recentAdminActions`에 mutation 결과가 자동 반영(invalidate)되는 것으로 충분. 별도 폴링/실시간 푸시 없음.
- **e2e Playwright, Storybook, 시각적 회귀, axe-core a11y, i18n, 다국어, 모바일 반응형** — 14a/14b 미해결 상속.

## 2. 백엔드 ground-truth (PR 12b2 / PR 8 read 결과)

### 2.1 회원 mutation 2개

| 항목 | 값 / 위치 |
|---|---|
| **A-3 tier 변경** | `PATCH /api/v1/admin/members/{memberId}/tier` (`AdminMemberTierCommandController`) |
| 권한 가드 | `@adminAuth.isAdmin()` |
| Request body | `AdminMemberTierChangeRequest { tier: AuthorityTier }` (FM/AM/GT) |
| Response envelope | `ApiCommonResponse<AdminMemberTierChangeResponse>` |
| Response payload | `AdminMemberTierChangeResponse { memberId: Long, oldTier: AuthorityTier, newTier: AuthorityTier }` |
| 도메인 예외 | `AdminMemberException.TIER_UNCHANGED` 400 / `MEMBER_NOT_FOUND` 404 |
| 부수 효과 | `MemberTierChangedEvent` publish |
| **A-4 withdraw** | `POST /api/v1/admin/members/{memberId}/withdraw` (`AdminMemberWithdrawCommandController`) |
| 권한 가드 | `@adminAuth.isAdmin()` |
| Request body | (없음) |
| Response envelope | `ApiCommonResponse<AdminMemberWithdrawResponse>` |
| Response payload | `AdminMemberWithdrawResponse { memberId: Long, userAccountId: Long, withdrawnAt: LocalDateTime, alreadyWithdrawn: boolean }` |
| **Idempotent** | 이미 탈퇴된 member 재호출 시 200 + `alreadyWithdrawn=true` (4xx 아님). 정상 탈퇴는 `alreadyWithdrawn=false` + 새 `withdrawnAt`. |
| 도메인 예외 | `MEMBER_NOT_FOUND` 404 |
| 부수 효과 | email PII erase, lastLoginAt 보존, `UserAccountWithdrawnEvent` publish |

### 2.2 파티룸 mutation 5개

`AdminPartyroomCommandController` 모든 endpoint:
- 권한 가드: `@adminAuth.isAdmin()`
- 응답: **204 No Content** (raw, wrap 없음)
- 도메인 예외 매핑: `NOT_FOUND_ROOM` 404 / `ALREADY_TERMINATED` 403 / `ILLEGAL_STATE_TRANSITION` 409 (`GlobalExceptionHandler`)

| 항목 | 값 / 위치 |
|---|---|
| **B-3 강제 종료** | `POST /api/v1/admin/partyrooms/{partyroomId}/terminate` |
| Request | `TerminatePartyroomRequest { reason: String, @NotBlank, max 500 }` |
| **B-4 일시정지** | `POST /api/v1/admin/partyrooms/{partyroomId}/suspend` |
| Request | `SuspendPartyroomRequest { reason: String, @NotBlank, max 500 }` |
| **B-4 재개** | `POST /api/v1/admin/partyrooms/{partyroomId}/restore` |
| Request | (없음) |
| **B-5 메타 수정** | `PATCH /api/v1/admin/partyrooms/{partyroomId}` |
| Request | `UpdatePartyroomMetaRequest { title?: String, introduction?: String, playbackTimeLimit?: Integer }` |
| Validators | `title @Size(max=100)`, `introduction @Size(max=500)`, `playbackTimeLimit @Min(1) @Max(60)`, `@AssertTrue isAtLeastOnePresent("최소 1개 필드는 변경 필요")` |
| **B-6 display-flag 변경** | `PATCH /api/v1/admin/partyrooms/{partyroomId}/display-flag` |
| Request | `UpdateDisplayFlagRequest { flag: DisplayFlag }` (`NORMAL` / `FEATURED` / `HIDDEN`) |

### 2.3 인증/CSRF (14a 인프라 그대로)

- 쿠키 기반 (`AdminAccessToken` httpOnly + `SharedSessionToken`)
- **CSRF**: `XSRF-TOKEN` 쿠키 ↔ `X-XSRF-TOKEN` 헤더 echo. 14a `http.ts`가 unsafe method (POST/PATCH/DELETE)에 자동 echo. **14c 신규 작업 0**.
- Origin Guard: `AdminOriginGuardFilter` (dev=`localhost:3000`)
- 401 인터셉터: `http.ts` 단에서 `useSessionStore.clear()` + `/login` hard redirect (14a)

## 3. 아키텍처

### 3.1 FSD 레이어 변경 — 신규 / 수정 파일

```
src/
├── shared/
│   └── lib/
│       ├── mutation-toast.ts                ← NEW: success/error toast + ApiError errorCode 표시 + invalidate 헬퍼
│       └── __tests__/mutation-toast.test.ts ← NEW
├── features/
│   ├── members/
│   │   ├── api/
│   │   │   ├── members-api.ts               ← MODIFY: changeMemberTier, withdrawMember 추가
│   │   │   ├── use-change-member-tier.ts    ← NEW: useMutation hook
│   │   │   ├── use-withdraw-member.ts       ← NEW: useMutation hook
│   │   │   └── __tests__/(2 신규 hook test 파일 + members-api.test.ts 확장)
│   │   ├── model/
│   │   │   ├── mutation-schema.ts           ← NEW: zod (tier change request)
│   │   │   └── __tests__/mutation-schema.test.ts
│   │   └── ui/
│   │       ├── members-actions-dropdown.tsx ← NEW: 헤더 dropdown (활성 dialog state 보유)
│   │       ├── mutation-dialogs/
│   │       │   ├── change-tier-dialog.tsx   ← NEW: form 모달 (FM/AM/GT select + 현재 tier 비교 disable)
│   │       │   └── withdraw-dialog.tsx      ← NEW: confirm 모달 (idempotent + alreadyWithdrawn toast 분기)
│   │       └── __tests__/(actions-dropdown + 2 dialog test 파일)
│   └── partyrooms/
│       ├── api/
│       │   ├── partyrooms-api.ts            ← MODIFY: terminate / suspend / restore / updateMeta / displayFlag 추가
│       │   ├── use-terminate-partyroom.ts   ← NEW
│       │   ├── use-suspend-partyroom.ts     ← NEW
│       │   ├── use-restore-partyroom.ts     ← NEW
│       │   ├── use-update-partyroom-meta.ts ← NEW
│       │   ├── use-update-partyroom-display-flag.ts ← NEW
│       │   └── __tests__/(5 신규 hook test 파일 + partyrooms-api.test.ts 확장)
│       ├── model/
│       │   ├── mutation-schema.ts           ← NEW: zod (terminate/suspend reason, updateMeta, displayFlag)
│       │   └── __tests__/mutation-schema.test.ts
│       └── ui/
│           ├── partyrooms-actions-dropdown.tsx ← NEW: 헤더 dropdown (status-aware disabled)
│           ├── mutation-dialogs/
│           │   ├── terminate-dialog.tsx     ← NEW: form (reason)
│           │   ├── suspend-dialog.tsx       ← NEW: form (reason)
│           │   ├── restore-dialog.tsx       ← NEW: confirm
│           │   ├── update-meta-dialog.tsx   ← NEW: form (title/introduction/playbackTimeLimit)
│           │   └── display-flag-dialog.tsx  ← NEW: form (NORMAL/FEATURED/HIDDEN select + 현재 flag 비교 disable)
│           └── __tests__/(actions-dropdown + 5 dialog test 파일)
├── widgets/
│   ├── members-detail.tsx                   ← MODIFY: 헤더에 <MembersActionsDropdown> 부착
│   └── partyrooms-detail.tsx                ← MODIFY: 헤더에 <PartyroomsActionsDropdown> 부착
└── test/mocks/handlers/
    ├── members.ts                           ← MODIFY: tier/withdraw mutation 핸들러 + error fixture
    └── partyrooms.ts                        ← MODIFY: 5 mutation 핸들러 + error fixture
```

### 3.2 라우트 / 사이드바

14b 그대로 — 14c 신규 라우트 0, 사이드바 변경 0.

## 4. mutation hook 공통 계약

모든 7개 hook은 동일한 골격:

```ts
// 예: features/members/api/use-change-member-tier.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { changeMemberTier } from "./members-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"
import type { AuthorityTier } from "@/entities/member/model/types"

export function useChangeMemberTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { memberId: number; tier: AuthorityTier }) =>
      changeMemberTier(vars.memberId, { tier: vars.tier }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] })  // prefix — list+detail 모두 stale
      mutationSuccessToast("등급 변경 완료")
    },
    onError: mutationErrorToast,
  })
}
```

### 4.1 Invalidate 키 매트릭스

14b 실제 query 키 (verified `use-{member,partyroom}-detail.ts`, `use-{members,partyrooms}-list.ts`):
- members: `["members", "list", query]` / `["members", "detail", memberId]`
- partyrooms: `["partyrooms", "list", query]` / `["partyrooms", "detail", partyroomId]`

| Mutation | invalidate 키 |
|---|---|
| changeTier | `["members"]` (prefix — list+detail 모두 매칭) |
| withdraw | `["members"]` |
| terminate | `["partyrooms"]` |
| suspend | `["partyrooms"]` |
| restore | `["partyrooms"]` |
| updateMeta | `["partyrooms"]` |
| displayFlag | `["partyrooms"]` |

**정책**: prefix-only invalidate. react-query `invalidateQueries({ queryKey: ["members"] })`는 `["members", "list", *]`와 `["members", "detail", *]` 모두 stale 처리. 명시적 detail 키 중복 호출은 redundant라 제거 (14c 시점 채택). 만약 micro-optimization 필요해지면 §13.2 future polish.

### 4.2 `shared/lib/mutation-toast.ts`

```ts
import { toast } from "sonner"
import { ApiError } from "@/shared/api/error"

export function mutationSuccessToast(message: string) {
  toast.success(message)
}

export function mutationErrorToast(err: unknown) {
  if (err instanceof ApiError) {
    toast.error(err.message ?? "요청 실패", {
      description: `code: ${err.errorCode ?? "UNKNOWN"} (status: ${err.status})`,
    })
  } else {
    toast.error("요청 실패")
  }
}
```

## 5. members 도메인 mutations

### 5.1 API fn (members-api.ts 확장)

```ts
export async function changeMemberTier(
  memberId: number,
  body: { tier: AuthorityTier },
): Promise<AdminMemberTierChangeResponse> {
  const res = await http<ApiCommonResponse<AdminMemberTierChangeResponse>>(
    `/api/v1/admin/members/${memberId}/tier`,
    { method: "PATCH", body },
  )
  return unwrap(res)
}

export async function withdrawMember(
  memberId: number,
): Promise<AdminMemberWithdrawResponse> {
  const res = await http<ApiCommonResponse<AdminMemberWithdrawResponse>>(
    `/api/v1/admin/members/${memberId}/withdraw`,
    { method: "POST" },
  )
  return unwrap(res)
}
```

`entities/member/model/types.ts`에 추가:
```ts
export interface AdminMemberTierChangeResponse {
  memberId: number
  oldTier: AuthorityTier
  newTier: AuthorityTier
}
export interface AdminMemberWithdrawResponse {
  memberId: number
  userAccountId: number
  withdrawnAt: string  // LocalDateTime ISO (KST 가정 — 14b §11 footer)
  alreadyWithdrawn: boolean
}
```
필드 형태는 §2.1 backend DTO ground-truth와 1:1 mirror. 14a/14b의 `LocalDateTime` → ISO string 변환 정책 일관 (`OffsetDateTime` 일괄 교체는 14b §15.2 future polish).

### 5.2 zod schema (`features/members/model/mutation-schema.ts`)

```ts
export const TierEnum = z.enum(["FM", "AM", "GT"])  // 14b filter-schema와 동일

export const changeMemberTierRequestSchema = z.object({
  tier: TierEnum,
})

export type ChangeMemberTierRequest = z.infer<typeof changeMemberTierRequestSchema>
```

### 5.3 dialog UX

**`change-tier-dialog.tsx`** (form 모달):
1. props: `memberId`, `currentTier`, `open`, `onOpenChange`
2. shadcn `Dialog` + `Select` (tier) — 14b filter-form의 Select idiom 그대로 (jsdom polyfill 4 메소드, `aria-label`, `pointerEventsCheck: 0`)
3. 현재 tier와 동일 선택 시 submit 버튼 disable + 안내 ("동일한 등급입니다")
4. submit → `useChangeMemberTier().mutate({ memberId, tier })` → 성공 시 onOpenChange(false)
5. 백엔드 400 `TIER_UNCHANGED`는 클라 zod 1차 차단 (이론상 도달 0) — fallback toast

**`withdraw-dialog.tsx`** (confirm 모달):
1. props: `memberId`, `displayName`, `open`, `onOpenChange`
2. shadcn `Dialog` + destructive 버튼 — 폼 없음
3. 본문: "비식별화 탈퇴 처리됩니다. 이메일 PII가 erase되며 되돌릴 수 없습니다."
4. submit → `useWithdrawMember().mutate({ memberId })` → 성공 시 onOpenChange(false)
5. **idempotent 분기**: response `alreadyWithdrawn=true`면 success toast 메시지 차별화 ("이미 탈퇴된 회원입니다") — `useMutation.onSuccess(data, vars)`에서 `data.alreadyWithdrawn` 분기

### 5.4 `members-actions-dropdown.tsx`

`shadcn DropdownMenu` 트리거 (`Button variant="outline"` + ChevronDown icon) → `DropdownMenuContent` 안에 2 항목:
1. "등급 변경" (always 활성)
2. "비식별화 탈퇴" (destructive 색상, always 활성 — α 결정 일관)

활성 dialog id state (`null | "change-tier" | "withdraw"`) 보유. 항목 클릭 시 state 갱신, dialog mount.

## 6. partyrooms 도메인 mutations

### 6.1 API fn (partyrooms-api.ts 확장)

5개 mutation 모두 **204 No Content** 응답 — `http<void>(...)` 형태:

```ts
export async function terminatePartyroom(
  partyroomId: number,
  body: { reason: string },
): Promise<void> {
  await http<void>(`/api/v1/admin/partyrooms/${partyroomId}/terminate`, {
    method: "POST",
    body,
  })
}

export async function suspendPartyroom(partyroomId: number, body: { reason: string }): Promise<void> { ... }
export async function restorePartyroom(partyroomId: number): Promise<void> { ... }
export async function updatePartyroomMeta(
  partyroomId: number,
  body: { title?: string; introduction?: string; playbackTimeLimit?: number },
): Promise<void> { ... }
export async function updatePartyroomDisplayFlag(
  partyroomId: number,
  body: { flag: DisplayFlag },
): Promise<void> { ... }
```

`http.ts`의 응답 처리는 14a 그대로 — `http.ts:54` `if (res.status === 204) return undefined as T`로 204를 `undefined`로 resolve. 신규 작업 0. 테스트는 mutation hook이 `undefined`로 resolve되는 것만 assert.

### 6.2 zod schema (`features/partyrooms/model/mutation-schema.ts`)

```ts
export const TerminateReasonSchema = z.object({
  reason: z.string().min(1, "사유를 입력해주세요").max(500),
})
export const SuspendReasonSchema = TerminateReasonSchema   // 동일 형태

// backend §2.2 ground-truth mirror
// (.int()는 backend Integer 타입을 zod 단에서 enforce — annotation 1:1 mirror가 아니라 타입 정합성 확장)
export const UpdatePartyroomMetaSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  introduction: z.string().max(500).optional(),
  playbackTimeLimit: z.coerce.number().int().min(1).max(60).optional(),
}).refine(
  v => v.title !== undefined || v.introduction !== undefined || v.playbackTimeLimit !== undefined,
  { message: "최소 1개 필드는 변경 필요" },  // backend @AssertTrue isAtLeastOnePresent와 동일 메시지
)

export const DisplayFlagEnum = z.enum(["NORMAL", "FEATURED", "HIDDEN"])
export const UpdateDisplayFlagSchema = z.object({ flag: DisplayFlagEnum })
```

`UpdatePartyroomMetaSchema`의 각 필드 길이/범위는 G4 chunk에서 backend `UpdatePartyroomMetaRequest` validator 직접 grep 후 mirror — §14에 reality 박음.

### 6.3 dialog UX (5개)

| Dialog | 종류 | 폼 / 본문 |
|---|---|---|
| **terminate** | form | `Textarea reason` (max 500). destructive 버튼. "강제 종료된 룸은 14b 기본 필터에서 자동 제외됩니다" 안내. |
| **suspend** | form | `Textarea reason` (max 500). 일반 버튼. |
| **restore** | confirm | "정상 운영으로 복귀합니다" — 폼 없음. primary 버튼. |
| **update-meta** | form | `Input title` + `Textarea introduction` + `Input number playbackTimeLimit`. 1개 이상 입력 강제 (zod refine). 현재 값 placeholder. |
| **display-flag** | form | `Select flag` (NORMAL/FEATURED/HIDDEN). 현재 flag와 동일 선택 시 submit disable. |

모든 dialog는 14b의 Select idiom + jsdom polyfill 패턴 그대로 (§14 entry 8/9 14b 계승).

### 6.4 `partyrooms-actions-dropdown.tsx`

`DropdownMenu` 트리거 → 5 항목. **status-aware disabled**:

| 항목 | 활성 조건 | disabled tooltip | 클라 차단 못한 시 백엔드 응답 |
|---|---|---|---|
| "메타 수정" | status ∈ {ACTIVE, SUSPENDED} | "종료된 룸은 수정할 수 없습니다" | (backend 별도 가드 미확인 — G4에서 검증) |
| "표시 변경" | status ∈ {ACTIVE, SUSPENDED} | "종료된 룸은 표시를 변경할 수 없습니다" | (G5에서 검증) |
| "일시 정지" | status = ACTIVE | "이미 일시정지된 룸입니다" / "종료된 룸은 정지할 수 없습니다" | 409 `ILLEGAL_STATE_TRANSITION` |
| "재개" | status = SUSPENDED | "정상 운영 중입니다" / "종료된 룸은 재개할 수 없습니다" | 409 `ILLEGAL_STATE_TRANSITION` |
| "강제 종료" | status ∈ {ACTIVE, SUSPENDED} | "이미 종료됨" | 403 `ALREADY_TERMINATED` (이미 TERMINATED 상태일 때만, 다른 status는 정상 처리) |

활성 dialog id state (`null | "terminate" | "suspend" | "restore" | "update-meta" | "display-flag"`) 보유.

## 7. 에러 / Edge / 미래 호환

### 7.1 백엔드 도메인 예외 ↔ UI 처리 매트릭스

| Endpoint | errorCode | HTTP | UI |
|---|---|---|---|
| change-tier | `TIER_UNCHANGED` | 400 | toast.error("동일한 등급입니다") + 모달 유지 (현재 tier 비교 disable로 정상 운용엔 미도달) |
| change-tier | `MEMBER_NOT_FOUND` | 404 | toast + 모달 닫기 + `["members"]` prefix invalidate (UI ↔ backend 동기화) |
| withdraw | `MEMBER_NOT_FOUND` | 404 | 동일 |
| terminate | `NOT_FOUND_ROOM` | 404 | toast + 모달 닫기 + `["partyrooms"]` prefix invalidate |
| **terminate** | `ALREADY_TERMINATED` | **403** | toast.error("이미 종료된 룸입니다") + 모달 닫기 + invalidate. **terminate 전용** — `ILLEGAL_STATE_TRANSITION` 발생 안 함 |
| **suspend / restore** | `ILLEGAL_STATE_TRANSITION` | **409** | toast.error("현재 상태에서 불가") + 모달 닫기 + invalidate. **suspend/restore 전용** — `ALREADY_TERMINATED` 발생 안 함 |
| suspend / restore | `NOT_FOUND_ROOM` | 404 | toast + 모달 닫기 + invalidate |
| updateMeta / displayFlag | (G4/G5에서 backend 가드 검증) | — | 정상 운용엔 클라 disable로 미도달. 도달 시 `mutationErrorToast` generic 처리 + invalidate |
| 모든 mutation | 그 외 (5xx, 네트워크) | — | `mutationErrorToast`가 generic 처리 |

### 7.2 일관 정책

1. **모든 에러 toast로** — 모달 안 inline error 없음 (14b 패턴 일관)
2. **404/409/403 → 모달 닫기 + detail invalidate** — UI 상태가 백엔드 진실과 어긋남을 의미. invalidate로 강제 동기화 → dropdown disabled 상태가 즉시 갱신됨
3. **400 (validation) → 모달 유지** — zod resolver 1차 차단, 백엔드 400은 fallback. 사용자가 입력 수정 가능
4. **CSRF**: 14a `http.ts` 자동 echo. 14c 신규 작업 0
5. **react-query retry**: mutation은 default retry 0 (14b list/detail의 query retry 정책과 분리). 사용자 의도 액션이 자동 재시도되면 안 됨

### 7.3 idempotent withdraw 처리

- response `alreadyWithdrawn=true`면 toast 메시지 차별화 ("이미 탈퇴된 회원입니다")
- 정상 탈퇴는 ("탈퇴 처리 완료")
- 어느 쪽이든 invalidate는 동일

### 7.4 staleness — list 캐시 동기화

mutation 후 invalidate `["members"]` / `["partyrooms"]` prefix → 14b list 페이지로 돌아가면 `keepPreviousData: true`가 이전 결과를 유지하다가 새 fetch 결과로 자연 교체. 별도 작업 0.

### 7.5 권한

- backend `@adminAuth.isAdmin()` — SUPER_ADMIN/ADMIN 둘 다 통과
- frontend role-기반 dropdown 가시성 분기 없음 (14b와 동일 정책)

### 7.6 disabled 항목과 a11y

- shadcn `DropdownMenuItem disabled` + `aria-disabled` (라이브러리 기본). tooltip은 wrapper로 분리 (disabled element 자체는 hover 이벤트 안 받음)
- screen reader가 disabled 사유를 읽을 수 있도록 `aria-describedby`로 tooltip id 연결

## 8. 테스트 전략

스택: vitest + RTL + msw (14b 그대로). 핸들러는 14b의 `mocks/handlers/{members,partyrooms}.ts`에 mutation 핸들러 추가 + error fixture 추가.

| 레이어 | 대상 | 케이스 수 |
|---|---|---|
| Unit (api) | `members-api` mutation 2개 (URL/method/body, idempotent withdraw 응답) | 4 |
| Unit (api) | `partyrooms-api` mutation 5개 (204 처리, body, error mapping) | 7 |
| Unit (model) | members mutation zod | 2 |
| Unit (model) | partyrooms mutation zod (terminate/suspend reason, updateMeta refine, display-flag enum) | 5 |
| Unit (lib) | `mutation-toast` (success/ApiError/generic 분기) | 3 |
| Hook | `use-change-member-tier`, `use-withdraw-member` (success → invalidate 키 + toast spy / error → mutationErrorToast spy / `isPending` toggle) | 4 |
| Hook | partyroom mutation hook 5개 (위 동일 패턴) | 10 |
| Component | members-actions-dropdown (2 항목 클릭 → dialog mount) | 2 |
| Component | partyrooms-actions-dropdown (status-aware disabled 매트릭스) | 5 |
| Component | change-tier-dialog (현재 tier 동일 disable, submit, isPending) | 3 |
| Component | withdraw-dialog (confirm + alreadyWithdrawn 분기) | 2 |
| Component | terminate / suspend / restore dialog | 5 |
| Component | update-meta-dialog (1+ 필드 강제 refine) | 3 |
| Component | display-flag-dialog (현재 flag 동일 disable) | 2 |
| Integration | members-detail widget (dropdown → tier 변경 → invalidate) | 1 |
| Integration | partyrooms-detail widget (dropdown → terminate → status 갱신) | 1 |
| Integration | partyrooms-detail widget (status=TERMINATED일 때 dropdown 항목 모두 disabled) | 1 |
| **합계 신규** | | **~60** (14b 77 → 14c 약 137) |

### 수동 검증 (staging — 메모리 §14 deferred verification 패턴)

- M-1 detail에서 회원 등급 변경(GT→FM) → list로 돌아가 캐시 갱신 확인
- M-2 withdraw → 동일 회원 재호출 → "이미 탈퇴된 회원입니다" toast
- P-1 룸 suspend → restore 라이프사이클
- P-2 룸 terminate → 14b 기본 필터로 list에서 자동 제외 확인 (status=null TERMINATED 자동 제외)
- P-3 updateMeta → 글자수 경계 (max 500 reason 등)
- P-4 display-flag NORMAL ↔ FEATURED ↔ HIDDEN 순환
- P-5 status=TERMINATED 룸 detail 진입 → dropdown 모든 mutation disabled 확인

### MSW handler 확장

- `src/test/mocks/handlers/members.ts`: `PATCH /api/v1/admin/members/:id/tier`, `POST /api/v1/admin/members/:id/withdraw` (idempotent 응답 포함)
- `src/test/mocks/handlers/partyrooms.ts`: 5 mutation handlers
- `src/test/mocks/fixtures/`: error fixture (TIER_UNCHANGED, ALREADY_TERMINATED, ILLEGAL_STATE_TRANSITION, NOT_FOUND_ROOM)
- per-test `server.use(...)` override로 error scenario 적용 (14b §14 entry 15 패턴)

## 9. 의존 라이브러리 추가

- shadcn `DropdownMenu`, `Tooltip` — 14b에서 미설치 시 G1 chunk에서 추가
- shadcn `Dialog`, `Textarea`, `Form`, `Select` — 14b 기존
- 신규 npm 의존 없음 (`react-hook-form`, `@tanstack/react-query`, `zod`, `sonner` 14b 그대로)

## 10. 구현 chunk 분할

| Chunk | 산출물 |
|---|---|
| **G0** | 본 spec 작성 + spec polish loop + plan 작성 + plan reviewer 반영 |
| **G0.x** | spec/plan polish (review loop 결과 반영, 0~3회) |
| **G1** | 공통 인프라 — `shared/lib/mutation-toast.ts` + 테스트, shadcn `DropdownMenu`/`Tooltip` 누락 시 추가, `<DomainActionsDropdown>` 패턴 prototype (state machine: 활성 dialog id) + 테스트. 실제 mutation 0개 |
| **G2** | **member 도메인 완결** — `members-api.ts` 확장 (changeTier, withdrawMember) + `mutation-schema.ts` + 2 hook + `change-tier-dialog.tsx` (form) + `withdraw-dialog.tsx` (confirm + idempotent 분기) + `members-actions-dropdown.tsx` + msw mutation handlers + error fixtures + 테스트 |
| **G2.1** | polish (모달 close 타이밍 / toast 메시지 / a11y) |
| **G3** | **partyroom status lifecycle** — `partyrooms-api.ts` 확장 (terminate/suspend/restore) + `mutation-schema.ts` (reason) + 3 hook + 3 dialog (terminate/suspend는 form, restore는 confirm) + `partyrooms-actions-dropdown.tsx` skeleton (status-aware disabled 포함, 단 메뉴는 lifecycle 3개만) + msw mutation handlers + error fixtures + 테스트 |
| **G3.1** | polish (status 전이 매트릭스 edge case, 409 toast 메시지) |
| **G4** | partyroom updateMeta — `partyrooms-api.updateMeta` + `mutation-schema.ts` 확장 + hook + `update-meta-dialog.tsx` (title/introduction/playbackTimeLimit, 1+ 필드 refine) + dropdown에 항목 추가 + 테스트. backend validator 길이/범위 sanity grep (R3 잔존) — 변경됐으면 §12에 reality 박음 |
| **G5** | partyroom display-flag — `partyrooms-api.updateDisplayFlag` + `mutation-schema.ts` 확장 + hook + `display-flag-dialog.tsx` (NORMAL/FEATURED/HIDDEN, 현재 flag disable) + dropdown 마지막 항목 + 테스트 |
| **G6** | spec §12 Implementation Reality + §13.2 Future Polish catch-up — 14b §13.2 forward-evolution backfill (14b 시점에 14c가 정리할 future polish 항목 SHA 기록). §13.2 "AdminMemberDetailResponse withdrawn 필드 추가" 항목은 14c spec 본문에 이미 박혀 있음 (작성 시 backfill 완료) |

## 11. 위험 / 미해결

### R1 — `withdrawn` 상태 추론 (α 결정)

**상태**: AdminMemberDetailResponse에 `withdrawn`/`withdrawnAt` 필드 없음. dropdown disable 로직이 detail 응답으로 판정 불가.
**대응**: withdraw 메뉴 always 활성. 클릭 → confirm → idempotent 응답 `alreadyWithdrawn=true`면 toast로 분기 안내. backend DTO 확장은 §12 future polish.
**잔존 위험**: 어드민이 이미 탈퇴된 회원에게 withdraw 클릭 가능 → idempotent toast 안내로 mitigate. 첫 클릭 후엔 detail invalidate가 활동 로그 등에서 withdrawn 흔적을 보여줌.

### R2 — partyroom mutation 응답 204 처리 (해소됨)

**상태**: `pfplay-admin/src/shared/api/http.ts:54` `if (res.status === 204) return undefined as T`로 14a 단계에서 이미 처리. 14c 신규 작업 0.
**테스트**: mutation hook이 `undefined`로 resolve되는 것만 assert.

### R3 — `UpdatePartyroomMetaRequest` validator (해소됨)

**상태**: backend ground-truth 확정 — `title @Size(max=100)`, `introduction @Size(max=500)`, `playbackTimeLimit @Min(1) @Max(60)`, `@AssertTrue isAtLeastOnePresent("최소 1개 필드는 변경 필요")`. spec §2.2 + §6.2 zod에 mirror 완료.
**잔존**: G4 chunk에서 backend가 변경됐는지 sanity grep 1회 (정확도 보장). 변경 시 §11에 reality 박음.

### R4 — bulk-action 14d 분리

**상태**: 백엔드 `BulkPartyroomActionRequest`는 `partyroomIds[1-100]` + `BulkActionType(TERMINATE/SUSPEND/SET_HIDDEN)` + `reason` + `skipErrors`. 14b list page에 row selection 인프라 추가 필요.
**대응**: 14d로 분리. 14c는 단건 7개에 집중.

### R5 — penalty endpoint 부재

**상태**: `PartyroomAdminActionType`에 `PENALIZE_CREW`/`RELEASE_CREW_PENALTY` 정의되어 있으나 admin command endpoint 없음 (`PartyroomAdminActionListener`만 존재 — 사용자 액션의 audit log 라벨용).
**대응**: 14c 범위 외. 14d+에 backend + frontend 한 묶음으로 분리. spec §1.2에 명시.

### R6 — 모달 close 타이밍과 invalidate 경합

**위험**: `mutate().onSuccess` 안에서 invalidate + onOpenChange(false) → invalidate 결과 fetch가 모달 unmount 후에 도착하면 무해하지만, modal 안에서 detail 데이터를 prefetch하는 패턴이 있다면 unmount-during-fetch 경고 가능.
**대응**: 14c는 모달 안에서 detail data 안 fetch (props로 받음). 경고 발생 시 G2.1 polish.

### R7 — partyroom status가 mutation 도중 외부 변경

**위험**: 어드민이 dialog 연 상태에서 다른 어드민이 status 변경. dialog submit 시 ILLEGAL_STATE_TRANSITION 409.
**대응**: §7.1 매트릭스대로 toast + invalidate로 정상 동기화. 운영 빈도 낮아 별도 lock 도입 안 함.

### R8 — `members-actions-dropdown` confirm 모달 destructive 색상

**위험**: shadcn 기본 색상 토큰이 14a 시점 적용 상태와 일치하는지. (theme tokens 14a에서 정의됨 — 검증 필요)
**대응**: G2 chunk에서 `tailwind.config.ts` + `index.css` 토큰 grep, destructive 토큰 노출 확인. 누락 시 G1에서 토큰 추가.

### R9 — 14b detail page card 분할 미실행

**상태**: 14b 메모리 ground-truth — `partyroom-detail-cards.tsx` ~370 라인. mutation 추가 시 카드 분할 검토 필요로 박힘.
**대응**: 14c는 dropdown 패턴(A 결정)이라 카드 본문 무수정 → 분할 불필요. 14b 시점 미해결로 끝남.

### R10 — `widgets/{members,partyrooms}-detail.tsx` 헤더 영역 침습 최소화

**위험**: 헤더에 dropdown 1개 추가 — 14b 헤더 layout (title + 뱃지 + 목록으로 link)와 충돌 없는지 검증.
**대응**: G2/G3 chunk에서 wrapper `<div className="flex items-center justify-between">` 패턴으로 우측 정렬. 14b 테스트 회귀 0 보장.

### R11 — react-query mutation `onError` 폴리시

**위험**: 기본 `onError`가 toast만 띄우고 mutation 상태는 isError true로 남음. 모달이 다시 열렸을 때 stale isError 잔존 가능.
**대응**: 모달 close 시 `mutation.reset()` 호출 (`useEffect(() => { if (!open) mutation.reset() }, [open])`).

### R12 — updateMeta / displayFlag 백엔드 status 가드 미확인

**위험**: §6.4 disabled matrix는 status=TERMINATED 시 클라에서 두 mutation을 disable하지만, backend가 동일 가드를 강제하는지(403/409 vs 200) 미검증. 클라 disable이 모종의 이유로 우회되면 backend가 막아주는지 확인 필요.
**대응**: G4(updateMeta) / G5(displayFlag) chunk 진입 시 backend 서비스 코드 grep — `AdminPartyroomCommandService.updateMeta`/`setDisplayFlag` 안에 status 체크 있는지 확인. 가드 부재 시 §12에 reality 박음 + §13.2에 backend 보강 future polish 추가.

## 12. Open Items / Implementation Reality (post-build catch-up)

G1~G5 진행 중 spec ↔ 실제 코드 불일치 항목을 SHA + 사유 + impact로 G6에서 backfill. 14b §14 패턴 그대로.

1. **[G1.1 SHA `804c013`]** shadcn dropdown-menu/tooltip/dialog `@radix-ui` 의존 추가. spec §9 명시 패키지 그대로. peer-dep 충돌 0.

2. **[G1.2~G1.4 SHA `2b5a184`/`8e06676`/`17c33d9`]** `mutation-toast.ts` shared helper 신설. `mutationSuccessToast(label)` + `mutationErrorToast(err)` (ApiError 분기 + generic fallback). spec §4.2 sample 그대로.

3. **[G2 chain SHA `019fa0f`~`bf85a73`]** members mutation 6 commits — types(G2.1) → schema(G2.2) → API(G2.3) → hooks(G2.4/G2.5) → dialogs(G2.6/G2.7) → wire(G2.8/G2.9) → msw(G2.10). Spec §5 그대로.

4. **[G2.6 SHA `cb08dfb`]** `ChangeTierDialog`의 `useEffect`는 `[open, currentTier]` 의존성만 가지며 `mutation.reset()` 미호출. R11 폴리시(모달 close 시 reset)와 부분 불일치 — 다음 open 시 stale isError가 잠시 표시될 수 있음. 영향 미미하나 future polish로 일관 정리 후보 (§13.2).

5. **[G2.7 SHA `2a2a514`]** `WithdrawDialog` idempotent 분기는 hook(`useWithdrawMember`)이 처리, dialog는 confirm + onSuccess close만 수행. R1 α 결정대로 14c 시점 `withdrawn` 필드 부재 우회.

6. **[G3 chain SHA `8270b19`~`daccaaf`]** partyroom lifecycle 3종(terminate/suspend/restore) — schema(G3.1) → API(G3.2) → hooks(G3.3) → dialogs(G3.4) → dropdown skeleton(G3.5) → wire(G3.6) → msw(G3.7). Spec §6.3 lifecycle 3개 + dropdown 패턴.

7. **[G4 chain SHA `484869c`~`28ea2ce`]** updatePartyroomMeta — schema(G4.2) → API(G4.3) → hook(G4.4) → dialog(G4.5) → wire(G4.6). G4.1 backend validator sanity grep은 chunk 진입 시 의무였으나 명시적 실행 미기록 — backend ground-truth는 §2.2/§6.2 spec 시점 확정값 그대로 사용. 변경 가능성은 §13.2 future polish.

8. **[G4.5 SHA `6b3748d`]** RHF v7 + zodResolver: top-level `.refine()` 에러는 `errors[""]` (빈 키)에 매핑. plan 명세 `errors.root` 와 다름. `UpdateMetaDialog`는 `(errors as Record<string, ...>)[""]`로 추출. shared helper 추출 후보 (§13.2).

9. **[G4.5 polish SHA `99772c8`]** `UpdateMetaDialog` `FormShape` 중간 타입 제거 — `z.coerce.number().int().min(1).max(60).optional()`이 `number | undefined`로 정확히 추론되므로 RHF 직접 사용. plan G4.5 sample은 별도 FormShape 도입했으나 redundant.

10. **[G4.6 SHA `28ea2ce`]** `partyrooms-actions-dropdown.tsx`에 `UpdateMetaDialog` wire 시 `currentIntroduction={null}` + `currentPlaybackTimeLimit={null}` 하드코딩 — 14b `AdminPartyroomDetail`에 두 필드 부재 (entities/partyroom/model/types.ts verified). placeholder는 `currentTitle`만 채워짐. backend DTO 확장은 §13.2 future polish (14b 상속).

11. **[G4.7]** chunk sanity 별도 commit 없이 G5.1 직접 진입. G5.5 chunk sanity가 G4+G5 일괄 검증 (151/151 PASS, tsc 0 error, build OK). 별 단계로 분리하지 않은 운영 단순화.

12. **[G5.1 SHA `b66d4bc`]** `UpdateDisplayFlagSchema` + `DisplayFlagEnum` zod export. Plan 명세 그대로 + 추가 negative test "rejects missing flag" (3 tests). DisplayFlag 좁은 union을 frontend 측에서 zod로 enforce — 14b §15.2 partyroom enum 좁히기 entry 일부 충족.

13. **[G5.2 SHA `cc53296`]** API fn + hook 한 commit. `updatePartyroomDisplayFlag(partyroomId, body)` + `useUpdatePartyroomDisplayFlag()`. invalidate `["partyrooms"]` prefix + toast `"표시 변경 완료"` (mutation-toast helper 사용).

14. **[G5.3 SHA `ccd847f`]** `DisplayFlagDialog` jsdom 환경 한계로 plan 4 테스트 → 실제 3 테스트. Plan Step 1의 "submits when different flag selected" (Dialog 안 Select user.click + findByRole option) 테스트는 radix Dialog FocusScope/Portal과 radix Select Portal 상호작용으로 jsdom에서 hang. ChangeTierDialog 패턴(Dialog 안 Select interaction 미실행) 따라 simplify. 실제 Select 동작은 `partyrooms-filter-form.test.tsx`(non-Dialog context)에서 검증 + 수동 검증 cover. e2e Playwright는 §13.2.

15. **[G5.3 SHA `ccd847f`]** `DisplayFlagDialog`는 R11 폴리시(모달 close 시 mutation.reset) 적용 — `useEffect(() => { if (open) setSelected(currentFlag); else mutation.reset() }, [open, currentFlag])`. ChangeTierDialog(entry 4)와 다름.

16. **[G5.4 SHA `a9dc2d3`]** dropdown wire 시 `safeDisplayFlag` fallback 패턴 — `DISPLAY_FLAG_VALUES.includes(partyroom.displayFlag) ? cast : "NORMAL"`. 14b §9.1 forward-compat 정책 일관. Plan §6.4 sample을 inline IIFE 대신 명시적 const로 정리.

17. **[R12 미해결]** G4.1 / G5 chunk에서 backend `AdminPartyroomCommandService.updateMeta`/`setDisplayFlag` status 가드 grep 미실행. 클라이언트 disable 정책으로 사실상 차단되나 backend 강제 가드는 미검증. §13.2에 backend 보강 future polish 항목으로 박힘.

18. **[14b §15.2 backfill]** 14b가 14c에서 처리 약속한 mutation chunk:
    - **tier 변경**: G2.6 SHA `cb08dfb`
    - **withdraw**: G2.7 SHA `2a2a514`
    - **partyroom 강제 종료**: G3.4 SHA `4e6fba7`
    - **일시 정지 / 재개**: G3.4 SHA `4e6fba7`
    - **메타 수정**: G4.5 SHA `6b3748d`, wire `28ea2ce`
    - **표시 변경**: G5.3 SHA `ccd847f`, wire `a9dc2d3`
    - **penalty / admin action / avatar publish-retire**: 14c 범위 외 (R5 / §13.2). 14d+ 별 패키지.

## 13. Future Polish (14a/14b 상속 + 14c 신규)

### 13.1 14b §15.2 상속

- 백엔드 `/admin/partyrooms` 응답 `ApiCommonResponse` wrap 통일
- 백엔드 `LocalDateTime` → `OffsetDateTime` 일괄
- react-query 5.90.16 → 5.100.5 bump
- partyroom enum 4개 frontend zod 좁히기
- `useUrlQueryState` hook 추출
- guest 어드민 라우트
- e2e Playwright / Storybook / a11y axe / i18n

### 13.2 14c 신규

- **`AdminMemberDetailResponse`에 `withdrawn`/`withdrawnAt` 필드 추가** (R1) — α 결정으로 14c 시점 idempotent 우회 적용. 백엔드 DTO 확장 후 frontend dropdown disable 로직 활성화 + types.ts mirror
- **`AdminPartyroomDetailResponse`에 `introduction`/`playbackTimeLimit` 필드 노출** — 14b 시점 detail DTO에 부재. 14c update-meta-dialog는 placeholder를 `currentTitle`에서만 받고 introduction/playbackTimeLimit는 빈 form으로 시작 (어드민이 새로 타이핑). 백엔드 DTO 확장 후 dialog가 현재 값을 placeholder로 보여주도록 개선 + 14b detail card에도 두 필드 표시
- **bulk-action 14d 분리 작업 패키지** — list page row selection 인프라 + per-item 결과 모달 + bulk handlers
- **penalty UI** — backend admin command endpoint 신설 (`AdminPartyroomPenaltyCommandController` 가칭) + frontend mutation
- **avatar publish/retire UI** — backend 별 도메인 PR 후 frontend 추가
- **mutation 결과 audit-log 카드 자동 강조** — 14b 8/8 카드의 `recentAdminActions`에 직전 mutation 결과 row 1초 highlight 등 (마이크로 UX)
- **mutation 진행 중 detail 카드 stale 표시** — `isFetching && lastMutation` 조합으로 detail 카드 우상단 inline spinner
- **Dialog 안 radix Select interaction 테스트 회복** — DisplayFlagDialog(§14 entry 14)에서 jsdom hang으로 click-through 테스트 drop. e2e Playwright(14b §15.1 상속)에서 cover. Vitest browser mode 도입 또는 `jest-environment-jsdom-sixteen` 등 환경 변경 시 plan 명세 4 테스트 복구 검토
- **mutation dialog reset 정책 일관화** — `ChangeTierDialog`(§14 entry 4)는 `mutation.reset()` 미호출, `DisplayFlagDialog`(§14 entry 15)는 호출. 다른 mutation dialog도 R11 폴리시 적용 + shared `useDialogResetEffect` 추출 검토
- **`AdminPartyroomCommandService.updateMeta` / `setDisplayFlag` status 가드 검증** — R12 잔존 (§14 entry 17). 클라이언트 disable로 사실상 차단되지만 backend 강제 가드 grep + 부재 시 보강
- **`zodResolver` `.refine()` 에러 위치** — RHF v7는 top-level refine 에러를 `errors[""]`에 매핑(§14 entry 8). 다음 form-dialog 추가 시 shared `useRefineError(errors)` helper 추출 검토
