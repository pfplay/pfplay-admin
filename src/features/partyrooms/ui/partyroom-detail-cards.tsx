import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminPartyroomDetail } from "@/entities/partyroom"

// G3.1과 동일한 null/invalid 가드 패턴 (members detail-cards 참조).
// 두 곳 이상에서 사용 중이지만 G7 시점엔 shared 추출 미실시 — G9 catch-up 후보.
function formatKst(iso: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("ko-KR", { hour12: false })
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  SUSPENDED: "secondary",
  TERMINATED: "destructive",
}

interface Props {
  detail: AdminPartyroomDetail
}

export function PartyroomDetailCards({ detail }: Props) {
  return (
    <div className="space-y-4">
      {/* 1. Header — 목록 링크는 spec §6.2에 따라 header 카드 내부에 배치 */}
      <div className="flex items-center gap-3">
        <Link
          to="/partyrooms"
          className="text-sm text-muted-foreground"
        >
          ← 목록으로
        </Link>
        <h2 className="text-2xl font-bold">
          #{detail.partyroomId} {detail.title}
        </h2>
        <Badge variant={STATUS_VARIANT[detail.status] ?? "outline"}>
          {detail.status}
        </Badge>
        <Badge variant="outline">{detail.displayFlag}</Badge>
      </div>

      {/* 2. Top-level meta */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">스테이지</span>
            <div>{detail.stageType}</div>
          </div>
          <div>
            <span className="text-muted-foreground">호스트</span>
            <div>
              {detail.hostNickname ?? "-"} ({detail.hostEmail ?? "-"}) #
              {detail.hostUserAccountId}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">크루 수</span>
            <div>{detail.crewCount}</div>
          </div>
          <div>
            <span className="text-muted-foreground">마지막 활동</span>
            <div>{formatKst(detail.lastActivityAt)}</div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Playback */}
      <Card>
        <CardHeader>
          <CardTitle>재생 상태</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">활성</span>
            <div>{detail.playback.activated ? "ON" : "OFF"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">현재 트랙</span>
            <div>{detail.playback.currentTrackName ?? "-"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">현재 DJ crew</span>
            <div>{detail.playback.currentDjCrewId ?? "-"}</div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Crews */}
      <Card>
        <CardHeader>
          <CardTitle>크루 ({detail.crews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.crews.length === 0 ? (
            <p className="text-sm text-muted-foreground">크루 없음</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>crewId</TableHead>
                  <TableHead>memberId</TableHead>
                  <TableHead>등급</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead>입장 시각</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.crews.map((c) => (
                  <TableRow key={c.crewId}>
                    <TableCell>{c.crewId}</TableCell>
                    <TableCell>{c.memberId}</TableCell>
                    <TableCell>{c.gradeType}</TableCell>
                    <TableCell>{c.nickname ?? "-"}</TableCell>
                    <TableCell>{formatKst(c.enteredAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 5. DJ queue */}
      <Card>
        <CardHeader>
          <CardTitle>DJ 큐 ({detail.djQueue.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.djQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">DJ 없음</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>djId</TableHead>
                  <TableHead>crewId</TableHead>
                  <TableHead>플레이리스트</TableHead>
                  <TableHead>순서</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.djQueue.map((d) => (
                  <TableRow key={d.djId}>
                    <TableCell>{d.djId}</TableCell>
                    <TableCell>{d.crewId}</TableCell>
                    <TableCell>{d.playlistName ?? "-"}</TableCell>
                    <TableCell>{d.orderNumber}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 6/7/8 카드 (penalties / reports / admin actions) — G8에서 추가 */}
    </div>
  )
}
