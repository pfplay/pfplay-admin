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
