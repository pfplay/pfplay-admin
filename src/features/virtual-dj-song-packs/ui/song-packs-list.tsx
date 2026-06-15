import { useNavigate } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { SongPackListItem } from "@/entities/virtual-dj"

interface Props {
  rows: SongPackListItem[]
  isLoading: boolean
  isEmpty: boolean
  onRenameClick: (pack: SongPackListItem) => void
  onDeleteClick: (pack: SongPackListItem) => void
}

export function SongPacksList({
  rows,
  isLoading,
  isEmpty,
  onRenameClick,
  onDeleteClick,
}: Props) {
  const navigate = useNavigate()

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
        등록된 송팩이 없습니다
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>트랙 수</TableHead>
          <TableHead>설명</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => navigate(`/virtual-dj/song-packs/${row.id}`)}
          >
            <TableCell className="font-mono text-sm">#{row.id}</TableCell>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.trackCount}</TableCell>
            <TableCell className="max-w-xs">
              <div
                className="truncate text-muted-foreground"
                title={row.description ?? ""}
              >
                {row.description ?? "—"}
              </div>
            </TableCell>
            <TableCell
              className="text-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRenameClick(row)}
                  aria-label={`송팩 #${row.id} 이름 변경`}
                >
                  이름 변경
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteClick(row)}
                  aria-label={`송팩 #${row.id} 삭제`}
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
