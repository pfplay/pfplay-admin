import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { BulkActionResult } from "@/features/partyrooms/model/bulk-schema"
import type { Page } from "@/shared/api/page"
import type { AdminPartyroomListItem } from "@/entities/partyroom"

interface Props {
  results: BulkActionResult[]
  /** request.partyroomIds.length — skipErrors=false break 시 results.length 미만 가능 */
  attemptedCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * react-query cache의 ["partyrooms", ...] entry들을 모두 순회해 partyroomId → title 매핑.
 * 14b list cache에서 lookup, 미존재 시 "(N/A)" fallback (R4).
 */
function useTitleLookup() {
  const qc = useQueryClient()
  return (partyroomId: number): string => {
    const queries = qc.getQueriesData<Page<AdminPartyroomListItem>>({ queryKey: ["partyrooms"] })
    for (const [, data] of queries) {
      if (!data || !Array.isArray(data.content)) continue
      const hit = data.content.find((r) => r.partyroomId === partyroomId)
      if (hit) return hit.title
    }
    return "(N/A)"
  }
}

export function BulkActionResultDialog({
  results,
  attemptedCount,
  open,
  onOpenChange,
}: Props) {
  const lookupTitle = useTitleLookup()
  const failures = results.filter((r) => !r.success)
  const okCount = results.length - failures.length
  const ngCount = failures.length
  const missedCount = Math.max(0, attemptedCount - results.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>일괄 처리 결과</DialogTitle>
          <DialogDescription>
            성공 {okCount}건 / 실패 {ngCount}건
            {missedCount > 0 && ` / 미시도 ${missedCount}건`}
          </DialogDescription>
        </DialogHeader>
        {failures.length > 0 && (
          <div className="max-h-[50vh] overflow-y-auto py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>오류</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failures.map((f) => (
                  <TableRow key={f.partyroomId}>
                    <TableCell>{f.partyroomId}</TableCell>
                    <TableCell>{lookupTitle(f.partyroomId)}</TableCell>
                    <TableCell className="text-destructive text-sm">
                      {f.error ?? "(없음)"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
