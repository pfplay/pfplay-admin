import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { PersonaListItem } from "@/entities/virtual-crew"

interface Props {
  rows: PersonaListItem[]
  isLoading: boolean
  isEmpty: boolean
  onEditClick: (persona: PersonaListItem) => void
  onDeleteClick: (persona: PersonaListItem) => void
}

export function PersonasList({
  rows,
  isLoading,
  isEmpty,
  onEditClick,
  onDeleteClick,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }
  if (isEmpty) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 페르소나가 없습니다
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-sm">#{row.id}</TableCell>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>
              {row.active ? (
                <Badge variant="success">활성</Badge>
              ) : (
                <Badge variant="secondary">비활성</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditClick(row)}
                  aria-label={`페르소나 #${row.id} 수정`}
                >
                  수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteClick(row)}
                  aria-label={`페르소나 #${row.id} 삭제`}
                >
                  삭제
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
