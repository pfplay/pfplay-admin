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
import type { AdminPartyroomDetail, PartyroomStatus } from "@/entities/partyroom"
import { formatKst } from "@/shared/lib/format-kst"
import {
  PARTYROOM_STATUS,
  STAGE_TYPE,
  DISPLAY_FLAG_LABEL,
  DISPLAY_FLAG_VARIANT,
  REPORT_STATUS,
  REPORT_CATEGORY_LABEL,
} from "@/shared/lib/labels"
import type { ReportStatus, ReportCategory } from "@/entities/report"

function formatPlaybackTimeLimit(minutes: number | null): string {
  if (minutes === null) return "-"
  if (minutes <= 0) return "무제한"
  return `${minutes}분`
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
        <Badge
          variant={
            PARTYROOM_STATUS.variant[detail.status as PartyroomStatus] ??
            "outline"
          }
        >
          {PARTYROOM_STATUS.label[detail.status as PartyroomStatus] ?? detail.status}
        </Badge>
        <Badge
          variant={DISPLAY_FLAG_VARIANT[detail.displayFlag] ?? "outline"}
        >
          {DISPLAY_FLAG_LABEL[detail.displayFlag] ?? detail.displayFlag}
        </Badge>
      </div>

      {/* 2. Top-level meta */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">스테이지</span>
            <div>{STAGE_TYPE.label[detail.stageType] ?? detail.stageType}</div>
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
          <div className="col-span-2">
            <span className="text-muted-foreground">소개</span>
            <div className="whitespace-pre-line">
              {detail.introduction ?? "-"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">재생 시간 제한</span>
            <div>{formatPlaybackTimeLimit(detail.playbackTimeLimit)}</div>
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
                  <TableHead>크루 ID</TableHead>
                  <TableHead>회원 ID</TableHead>
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
                  <TableHead>DJ ID</TableHead>
                  <TableHead>크루 ID</TableHead>
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

      {/* 6. Recent penalties */}
      <Card>
        <CardHeader>
          <CardTitle>최근 페널티 (top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.recentPenalties.length === 0 ? (
            <p className="text-sm text-muted-foreground">최근 페널티 없음</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>크루 ID</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>가한 주체</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.recentPenalties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.crewId}</TableCell>
                    <TableCell>{p.penaltyType}</TableCell>
                    <TableCell>{p.punisherType}</TableCell>
                    <TableCell className="max-w-xs truncate" title={p.reason}>
                      {p.reason}
                    </TableCell>
                    <TableCell>{formatKst(p.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 7. Recent reports */}
      <Card>
        <CardHeader>
          <CardTitle>최근 신고</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.recentReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">신고 내역 없음</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>분류</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>신고자</TableHead>
                  <TableHead>일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.recentReports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>
                      {REPORT_CATEGORY_LABEL[r.category as ReportCategory] ??
                        r.category}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          REPORT_STATUS.variant[r.status as ReportStatus] ??
                          "outline"
                        }
                      >
                        {REPORT_STATUS.label[r.status as ReportStatus] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>#{r.reporterUserAccountId}</TableCell>
                    <TableCell>{formatKst(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 8. Recent admin actions */}
      <Card>
        <CardHeader>
          <CardTitle>최근 관리자 액션</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.recentAdminActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              최근 관리자 액션 없음
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>액션 ID</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>관리자</TableHead>
                  <TableHead>일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.recentAdminActions.map((a) => (
                  <TableRow key={a.actionId}>
                    <TableCell>{a.actionId}</TableCell>
                    <TableCell>{a.actionType}</TableCell>
                    <TableCell>#{a.administratorId}</TableCell>
                    <TableCell>{formatKst(a.occurredAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
