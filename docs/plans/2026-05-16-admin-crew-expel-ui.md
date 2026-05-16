# 크루 ONE_TIME 강퇴 UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pfplay-admin 파티룸 상세 화면 크루 카드의 각 크루 행에서 ONE_TIME 강퇴를 실행할 수 있게 한다.

**Architecture:** 기존 백엔드 엔드포인트 `POST /api/v1/admin/partyrooms/{id}/penalties` 를 공유 `http` 클라이언트(CSRF/Origin 자동 처리)로 호출. 기존 terminate 흐름(zod schema → api fn → react-query mutation hook → RHF+zodResolver dialog → detail card 액션)을 1:1 미러. 크루 테이블을 `partyroom-detail-cards.tsx` 에서 `crew-card.tsx` 로 추출하고 액션 컬럼을 추가.

**Tech Stack:** React 18, TypeScript, @tanstack/react-query, react-hook-form + @hookform/resolvers/zod, zod, shadcn/ui, vitest + @testing-library/react + MSW, sonner(toast).

**Spec:** `docs/specs/2026-05-16-admin-crew-expel-ui-design.md`

**Branch:** `feature/admin-crew-expel-ui` (base `origin/develop`).

---

## Chunk 1: 크루 ONE_TIME 강퇴 UI

### Task 1: zod schema

**Files:**
- Modify: `src/features/partyrooms/model/mutation-schema.ts`
- Test: `src/features/partyrooms/model/__tests__/expel-crew-schema.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest"
import { ExpelCrewSchema } from "@/features/partyrooms/model/mutation-schema"

describe("ExpelCrewSchema", () => {
  it("accepts valid crewId + reason", () => {
    const r = ExpelCrewSchema.safeParse({ crewId: 14, reason: "bug cleanup" })
    expect(r.success).toBe(true)
  })
  it("rejects empty/whitespace reason", () => {
    expect(ExpelCrewSchema.safeParse({ crewId: 14, reason: "" }).success).toBe(false)
    expect(ExpelCrewSchema.safeParse({ crewId: 14, reason: "   " }).success).toBe(false)
  })
  it("rejects reason > 255", () => {
    expect(
      ExpelCrewSchema.safeParse({ crewId: 14, reason: "x".repeat(256) }).success,
    ).toBe(false)
  })
  it("rejects non-positive / non-int crewId", () => {
    expect(ExpelCrewSchema.safeParse({ crewId: 0, reason: "a" }).success).toBe(false)
    expect(ExpelCrewSchema.safeParse({ crewId: 1.5, reason: "a" }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/partyrooms/model/__tests__/expel-crew-schema.test.ts`
Expected: FAIL — `ExpelCrewSchema` is not exported.

- [ ] **Step 3: Add schema** (append to `mutation-schema.ts`, after `UpdateDisplayFlagSchema` block)

```ts
// backend ground-truth: AdminApplyPenaltyRequest — crewId @NotNull,
// reason @NotBlank @Size(1..255). penaltyType 은 api fn 에서 ONE_TIME_EXPULSION 고정.
export const ExpelCrewSchema = z.object({
  crewId: z.number().int().positive(),
  reason: z.string().trim().min(1, "사유를 입력해주세요").max(255),
})
export type ExpelCrewRequest = z.infer<typeof ExpelCrewSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/partyrooms/model/__tests__/expel-crew-schema.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/partyrooms/model/mutation-schema.ts src/features/partyrooms/model/__tests__/expel-crew-schema.test.ts
git commit -m "feat(partyrooms): ExpelCrewSchema (crewId + reason 1..255)"
```

---

### Task 2: api fn `applyCrewPenalty`

**Files:**
- Modify: `src/features/partyrooms/api/partyrooms-api.ts`
- Test: `src/features/partyrooms/api/__tests__/partyrooms-api.test.ts` (existing — append)

- [ ] **Step 1: Write the failing test** (append a new `describe` block)

```ts
import { applyCrewPenalty } from "../partyrooms-api"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"

describe("applyCrewPenalty", () => {
  it("POSTs penalties with ONE_TIME_EXPULSION + crewId + reason", async () => {
    let captured: unknown
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json({ data: { penaltyId: null } }, { status: 201 })
      }),
    )
    await applyCrewPenalty(3, { crewId: 14, reason: "cleanup" })
    expect(captured).toEqual({
      crewId: 14,
      penaltyType: "ONE_TIME_EXPULSION",
      reason: "cleanup",
    })
  })
})
```

(Use the existing test file's import style; only add the symbols not already imported.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/partyrooms/api/__tests__/partyrooms-api.test.ts -t applyCrewPenalty`
Expected: FAIL — `applyCrewPenalty` not exported.

- [ ] **Step 3: Add api fn** (append to `partyrooms-api.ts`)

```ts
import type { ExpelCrewRequest } from "../model/mutation-schema"

export async function applyCrewPenalty(
  partyroomId: number,
  vars: ExpelCrewRequest,
): Promise<void> {
  // 성공은 항상 201 + { data: { penaltyId: null } } (ONE_TIME). 응답 바디는
  // 사용하지 않으므로 http<void> 로 받아 discard (terminate 는 204라 바디 없음 —
  // 여기는 201+JSON 이지만 penaltyId 불필요. 의도된 차이).
  await http<void>(`/api/v1/admin/partyrooms/${partyroomId}/penalties`, {
    method: "POST",
    body: {
      crewId: vars.crewId,
      penaltyType: "ONE_TIME_EXPULSION",
      reason: vars.reason,
    },
  })
}
```

(Add the `import type { ExpelCrewRequest }` to the existing import group from `../model/mutation-schema`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/partyrooms/api/__tests__/partyrooms-api.test.ts -t applyCrewPenalty`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/partyrooms/api/partyrooms-api.ts src/features/partyrooms/api/__tests__/partyrooms-api.test.ts
git commit -m "feat(partyrooms): applyCrewPenalty api fn (ONE_TIME_EXPULSION)"
```

---

### Task 3: `useExpelCrew` mutation hook

**Files:**
- Create: `src/features/partyrooms/api/use-expel-crew.ts`
- Test: `src/features/partyrooms/api/__tests__/use-expel-crew.test.tsx` (create)

- [ ] **Step 1: Write the failing test** (mirror `use-terminate-partyroom.test.tsx`)

```tsx
import { describe, expect, it, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { toast } from "sonner"
import { useExpelCrew } from "@/features/partyrooms/api/use-expel-crew"

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

describe("useExpelCrew", () => {
  afterEach(() => vi.restoreAllMocks())

  it("on success: invalidates ['partyrooms'] prefix, toast.success", async () => {
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", () =>
        HttpResponse.json({ data: { penaltyId: null } }, { status: 201 }),
      ),
    )

    const { result } = renderHook(() => useExpelCrew(), { wrapper })
    result.current.mutate({ partyroomId: 3, crewId: 14, reason: "cleanup" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["partyrooms"] })
    expect(successSpy).toHaveBeenCalledWith("크루 강퇴 완료")
  })

  it("on 403: mutationErrorToast", async () => {
    const { wrapper } = makeWrapper()
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", () =>
        HttpResponse.json(
          { status: 403, errorCode: "ALREADY_TERMINATED", message: "이미 종료됨" },
          { status: 403 },
        ),
      ),
    )

    const { result } = renderHook(() => useExpelCrew(), { wrapper })
    result.current.mutate({ partyroomId: 3, crewId: 14, reason: "x" })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(errorSpy).toHaveBeenCalledWith(
      "이미 종료됨",
      expect.objectContaining({
        description: expect.stringContaining("ALREADY_TERMINATED"),
      }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/partyrooms/api/__tests__/use-expel-crew.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement hook** (mirror `use-terminate-partyroom.ts`)

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { applyCrewPenalty } from "./partyrooms-api"
import { mutationSuccessToast, mutationErrorToast } from "@/shared/lib/mutation-toast"

export function useExpelCrew() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { partyroomId: number; crewId: number; reason: string }) =>
      applyCrewPenalty(vars.partyroomId, { crewId: vars.crewId, reason: vars.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partyrooms"] })
      mutationSuccessToast("크루 강퇴 완료")
    },
    onError: mutationErrorToast,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/partyrooms/api/__tests__/use-expel-crew.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/partyrooms/api/use-expel-crew.ts src/features/partyrooms/api/__tests__/use-expel-crew.test.tsx
git commit -m "feat(partyrooms): useExpelCrew hook (invalidate + toast)"
```

---

### Task 4: `ExpelCrewDialog`

**Files:**
- Create: `src/features/partyrooms/ui/mutation-dialogs/expel-crew-dialog.tsx`
- Test: `src/features/partyrooms/ui/__tests__/expel-crew-dialog.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"
import { server } from "@/test/mocks/server"
import { ExpelCrewDialog } from "@/features/partyrooms/ui/mutation-dialogs/expel-crew-dialog"

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
}

describe("ExpelCrewDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("submit disabled until valid reason", async () => {
    const u = userEvent.setup()
    render(
      wrap(
        <ExpelCrewDialog
          partyroomId={3}
          crewId={14}
          crewLabel="#14 회원 #99"
          open
          onOpenChange={() => {}}
        />,
      ),
    )
    const submit = screen.getByRole("button", { name: "강퇴" })
    expect(submit).toBeDisabled()
    await u.type(screen.getByLabelText("사유"), "cleanup")
    await waitFor(() => expect(submit).toBeEnabled())
  })

  it("on success calls onOpenChange(false) with correct payload", async () => {
    const u = userEvent.setup()
    let body: unknown
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { penaltyId: null } }, { status: 201 })
      }),
    )
    const onOpenChange = vi.fn()
    render(
      wrap(
        <ExpelCrewDialog
          partyroomId={3}
          crewId={14}
          crewLabel="#14 회원 #99"
          open
          onOpenChange={onOpenChange}
        />,
      ),
    )
    await u.type(screen.getByLabelText("사유"), "cleanup")
    await u.click(screen.getByRole("button", { name: "강퇴" }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(body).toEqual({
      crewId: 14,
      penaltyType: "ONE_TIME_EXPULSION",
      reason: "cleanup",
    })
  })

  it("on error keeps dialog open (onOpenChange not called with false)", async () => {
    const u = userEvent.setup()
    vi.spyOn((await import("sonner")).toast, "error").mockImplementation(() => "")
    server.use(
      http.post("*/api/v1/admin/partyrooms/3/penalties", () =>
        HttpResponse.json(
          { status: 403, errorCode: "NOT_FOUND_ROOM", message: "없음" },
          { status: 403 },
        ),
      ),
    )
    const onOpenChange = vi.fn()
    render(
      wrap(
        <ExpelCrewDialog
          partyroomId={3}
          crewId={14}
          crewLabel="#14 회원 #99"
          open
          onOpenChange={onOpenChange}
        />,
      ),
    )
    await u.type(screen.getByLabelText("사유"), "x")
    await u.click(screen.getByRole("button", { name: "강퇴" }))
    await waitFor(() =>
      expect(onOpenChange).not.toHaveBeenCalledWith(false),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/partyrooms/ui/__tests__/expel-crew-dialog.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement dialog** (mirror `terminate-dialog.tsx`)

> **의도된 차이 (reviewer 가 되돌리지 말 것):** `terminate-dialog.tsx` 는 `isValid`/`mode` 미사용(항상 submit 허용 후 resolver 차단). 본 다이얼로그는 spec §1.1.3 + 테스트 (a)"빈 사유 submit 비활성" 충족을 위해 `mode: "onChange"` + `disabled={!isValid || mutation.isPending}` 를 **의도적으로 추가**. 이는 템플릿 대비 의도된 강화이지 실수가 아님.

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDialogResetEffect } from "@/shared/lib/use-dialog-reset-effect"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ExpelCrewSchema,
  type ExpelCrewRequest,
} from "@/features/partyrooms/model/mutation-schema"
import { useExpelCrew } from "@/features/partyrooms/api/use-expel-crew"

interface Props {
  partyroomId: number
  crewId: number
  crewLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpelCrewDialog({
  partyroomId,
  crewId,
  crewLabel,
  open,
  onOpenChange,
}: Props) {
  const mutation = useExpelCrew()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ExpelCrewRequest>({
    resolver: zodResolver(ExpelCrewSchema),
    mode: "onChange",
    defaultValues: { crewId, reason: "" },
  })

  useDialogResetEffect(open, () => {
    mutation.reset()
    reset({ crewId, reason: "" })
  })

  const onSubmit = (data: ExpelCrewRequest) =>
    mutation.mutate(
      { partyroomId, crewId, reason: data.reason },
      { onSuccess: () => onOpenChange(false) },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>크루 강퇴</DialogTitle>
            <DialogDescription>
              {crewLabel} 를 이 파티룸에서 강퇴합니다 (1회성, 영구 밴 아님).
              사유는 audit log에 기록됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="expel-reason">
              사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="expel-reason"
              aria-label="사유"
              {...register("reason")}
              maxLength={255}
              rows={4}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || mutation.isPending}
            >
              {mutation.isPending ? "처리 중..." : "강퇴"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/partyrooms/ui/__tests__/expel-crew-dialog.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/partyrooms/ui/mutation-dialogs/expel-crew-dialog.tsx src/features/partyrooms/ui/__tests__/expel-crew-dialog.test.tsx
git commit -m "feat(partyrooms): ExpelCrewDialog (reason-required confirm)"
```

---

### Task 5: `CrewCard` (extract section 4 + action column)

**Files:**
- Create: `src/features/partyrooms/ui/crew-card.tsx`
- Test: `src/features/partyrooms/ui/__tests__/crew-card.test.tsx` (create)

**Note:** copy the crew `Card`+`Table` markup verbatim from `partyroom-detail-cards.tsx` section `{/* 4. Crews */}` (do not restyle). Add one `<TableHead>액션</TableHead>` and a trailing `<TableCell>` per row.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CrewCard } from "@/features/partyrooms/ui/crew-card"
import type { CrewSummary } from "@/entities/partyroom"

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient()
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
}
const crew = (over: Partial<CrewSummary>): CrewSummary => ({
  crewId: 14,
  memberId: 99,
  gradeType: "LISTENER",
  nickname: "dj-kim",
  enteredAt: "2026-05-16T00:00:00",
  ...over,
})

describe("CrewCard", () => {
  it("empty state", () => {
    render(wrap(<CrewCard partyroomId={3} crews={[]} />))
    expect(screen.getByText("크루 없음")).toBeInTheDocument()
  })

  it("HOST row: expel button disabled with tooltip text", () => {
    render(
      wrap(<CrewCard partyroomId={3} crews={[crew({ gradeType: "HOST" })]} />),
    )
    const btn = screen.getByRole("button", { name: "강퇴" })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute("title", "HOST 강퇴 불가")
  })

  it("non-HOST row: clicking opens dialog with crew label", async () => {
    const u = userEvent.setup()
    render(wrap(<CrewCard partyroomId={3} crews={[crew({})]} />))
    await u.click(screen.getByRole("button", { name: "강퇴" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(/#14 dj-kim/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/partyrooms/ui/__tests__/crew-card.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `crew-card.tsx`**

```tsx
import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatKst } from "@/shared/lib/format-kst"
import type { CrewSummary } from "@/entities/partyroom"
import { ExpelCrewDialog } from "./mutation-dialogs/expel-crew-dialog"

interface Props {
  partyroomId: number
  crews: CrewSummary[]
}

export function CrewCard({ partyroomId, crews }: Props) {
  const [openCrewId, setOpenCrewId] = useState<number | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>크루 ({crews.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {crews.length === 0 ? (
          <p className="text-sm text-muted-foreground">크루 없음</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>크루 ID</TableHead>
                <TableHead>회원 ID</TableHead>
                <TableHead>등급</TableHead>
                <TableHead>닉네임</TableHead>
                <TableHead>입장 시각</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crews.map((c) => {
                const isHost = c.gradeType === "HOST"
                const label = `#${c.crewId} ${c.nickname ?? `회원 #${c.memberId}`}`
                return (
                  <TableRow key={c.crewId}>
                    <TableCell>{c.crewId}</TableCell>
                    <TableCell>{c.memberId}</TableCell>
                    <TableCell>{c.gradeType}</TableCell>
                    <TableCell>{c.nickname ?? "-"}</TableCell>
                    <TableCell>{formatKst(c.enteredAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isHost}
                        title={isHost ? "HOST 강퇴 불가" : undefined}
                        onClick={() => setOpenCrewId(c.crewId)}
                      >
                        강퇴
                      </Button>
                      {!isHost && (
                        <ExpelCrewDialog
                          partyroomId={partyroomId}
                          crewId={c.crewId}
                          crewLabel={label}
                          open={openCrewId === c.crewId}
                          onOpenChange={(o) =>
                            setOpenCrewId(o ? c.crewId : null)
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
```

(If `CrewSummary` is not the exact exported name in `@/entities/partyroom`, use the name used by `partyroom-detail-cards.tsx` for `detail.crews[]` elements — verify before writing.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/partyrooms/ui/__tests__/crew-card.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/partyrooms/ui/crew-card.tsx src/features/partyrooms/ui/__tests__/crew-card.test.tsx
git commit -m "feat(partyrooms): CrewCard with per-crew ONE_TIME expel action"
```

---

### Task 6: Default MSW penalties handler (spec §6 deliverable)

**Files:**
- Modify: `src/test/mocks/handlers/partyrooms.ts`

**Why:** spec §6 lists a default `penalties` MSW handler as a deliverable. Unit tests use per-test `server.use(...)` overrides, but a default success handler keeps any handler-less render (e.g. future page tests that interact with the action) from emitting MSW "unhandled request" noise and documents the contract centrally.

- [ ] **Step 1: Add handler** to the existing handlers array in `handlers/partyrooms.ts`. Use the file's existing `API` base-path constant (sibling handlers do `http.post(\`${API}/:partyroomId/terminate\`, ...)`), so add:

```ts
http.post(`${API}/:partyroomId/penalties`, () =>
  HttpResponse.json({ data: { penaltyId: null } }, { status: 201 }),
),
```

(`http`, `HttpResponse`, and the `API` constant are already present in that file — used by sibling terminate/suspend/bulk handlers.)

- [ ] **Step 2: Run full partyrooms suite to confirm no handler regressions**

Run: `pnpm vitest run src/features/partyrooms src/test/mocks`
Expected: PASS — adding a handler does not break existing tests.

- [ ] **Step 3: Commit**

```bash
git add src/test/mocks/handlers/partyrooms.ts
git commit -m "test(partyrooms): default MSW handler for penalties endpoint"
```

---

### Task 7: Wire `CrewCard` into detail cards + verified regression

**Files:**
- Modify: `src/features/partyrooms/ui/partyroom-detail-cards.tsx` (replace `{/* 4. Crews */}` block)
- Modify: `src/features/partyrooms/ui/__tests__/partyroom-detail-cards.test.tsx` (add positive integration assertion)

**Verified baseline (do NOT assume — this was checked):** the existing `partyroom-detail-cards.test.tsx` and `pages/__tests__/partyroom-detail-page.test.tsx` assert **no crew-table structure** (only "crews 빈 배열 → '크루 없음'" + unrelated sections). `CrewCard` still renders "크루 없음" for empty crews, so those existing assertions remain green after extraction. The new "액션" column therefore breaks nothing — but Step 3 adds an explicit assertion so the wiring is *tested*, not assumed.

- [ ] **Step 1: Replace section 4**

In `partyroom-detail-cards.tsx`, delete the entire `{/* 4. Crews */}` `<Card>...</Card>` block (the `<Card>` whose `CardTitle` is `크루 ({detail.crews.length})`) and replace with:

```tsx
{/* 4. Crews */}
<CrewCard partyroomId={detail.partyroomId} crews={detail.crews} />
```

Add import near the other feature imports: `import { CrewCard } from "./crew-card"`. Keep all existing `Table*`/`Card*` imports — sections 5–8 still use them.

- [ ] **Step 2: Run regression suite**

Run: `pnpm vitest run src/features/partyrooms src/pages/__tests__/partyroom-detail-page.test.tsx`
Expected: PASS — existing detail-cards / detail-page tests green (no crew-structure assertions to break); new crew-card/dialog/hook/api/schema tests green.

- [ ] **Step 3: Add positive integration assertion** to `partyroom-detail-cards.test.tsx` (new `it` block; `partyroomDetailFixture.crews[0]` is `{crewId:10, gradeType:"DJ", nickname:"alice", ...}` → non-HOST → enabled 강퇴 button)

```tsx
it("크루 카드에 강퇴 액션 컬럼 노출 (CrewCard 통합)", () => {
  render(
    <MemoryRouter>
      <PartyroomDetailCards detail={partyroomDetailFixture} />
    </MemoryRouter>,
  )
  expect(screen.getByRole("columnheader", { name: "액션" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "강퇴" })).toBeEnabled()
})
```

- [ ] **Step 4: Run the updated test file**

Run: `pnpm vitest run src/features/partyrooms/ui/__tests__/partyroom-detail-cards.test.tsx`
Expected: PASS (all prior tests + new integration assertion).

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/partyrooms/ui/partyroom-detail-cards.tsx src/features/partyrooms/ui/__tests__/partyroom-detail-cards.test.tsx
git commit -m "refactor(partyrooms): use CrewCard in detail + integration assertion"
```

---

### Task 8: Manual verification (dev server)

- [ ] **Step 1:** `pnpm dev`, 로그인, 파티룸 상세(크루 있는 룸) 진입
- [ ] **Step 2:** 비-HOST 크루 행 "강퇴" → 다이얼로그 → 빈 사유 submit 비활성 확인 → 사유 입력 → 강퇴 → 성공 토스트 + 크루 목록에서 사라짐 확인
- [ ] **Step 3:** HOST 행 "강퇴" 버튼 disabled + tooltip "HOST 강퇴 불가" 확인
- [ ] **Step 4:** Network 탭 — `POST /api/v1/admin/partyrooms/{id}/penalties` 201, FORBIDDEN_ORIGIN/CSRF 에러 없음 확인 (공유 http 클라이언트 경유)
- [ ] **Step 5:** 결과를 사용자에게 보고 (UI 동작 검증은 코드 정확성과 별개 — 직접 확인했음을 명시)

---

## 완료 기준 (DoD)

- Task 1–7 모든 자동 테스트 PASS, `tsc --noEmit` + `lint` 클린
- Task 8 수동 검증으로 골든패스 + HOST 가드 + CSRF/Origin 무에러 확인
- 기존 `partyroom-detail-cards` / `partyroom-detail-page` 회귀 0
- 범위 밖(PERMANENT/해제/bulk/DJ큐행/T1-3) 미포함 확인
