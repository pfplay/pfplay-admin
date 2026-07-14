import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { hideBrokenImage } from "@/shared/lib/hide-broken-image"
import { formatKst } from "@/shared/lib/format-kst"
import { usePartyroomAnalytics } from "../api/use-partyroom-analytics"
import { usePartyroomDjHistory } from "../api/use-partyroom-dj-history"
import type { DailyAttendanceBucket } from "../model/types"

const DAY_OPTIONS = [7, 20, 30] as const

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

/** 일별 입퇴장 미니바 — 차트 라이브러리 없이 CSS width 비율로 그린다. */
function DailyTrend({ daily }: { daily: DailyAttendanceBucket[] }) {
  if (daily.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        기간 내 입퇴장 데이터가 없습니다.
      </p>
    )
  }
  const max = Math.max(
    1,
    ...daily.map((d) => Math.max(d.entered, d.exited)),
  )
  return (
    <div className="space-y-1.5">
      {daily.map((d) => (
        <div key={d.date} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
            {d.date.slice(5)}
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 rounded-sm bg-emerald-500"
                style={{ width: `${(d.entered / max) * 100}%` }}
                aria-hidden
              />
              <span className="tabular-nums text-muted-foreground">
                입장 {d.entered}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 rounded-sm bg-rose-400"
                style={{ width: `${(d.exited / max) * 100}%` }}
                aria-hidden
              />
              <span className="tabular-nums text-muted-foreground">
                퇴장 {d.exited}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const DJ_PAGE_SIZE = 10

export function PartyroomAnalyticsSection({
  partyroomId,
}: {
  partyroomId: number
}) {
  const [days, setDays] = useState<number>(20)
  const [djPage, setDjPage] = useState(0)

  const { data, isLoading, isError } = usePartyroomAnalytics(partyroomId, days)
  const {
    data: djHistory,
    isLoading: djLoading,
    isError: djError,
  } = usePartyroomDjHistory(partyroomId, djPage, DJ_PAGE_SIZE)

  const ratio = data?.silenceExit.silenceExitRatio
  const ratioText =
    ratio === null || ratio === undefined ? "—" : `${Math.round(ratio * 100)}%`

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>행동 분석</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            입퇴장 추이 + 무음 이탈(근사) · 디제잉 이력
          </p>
        </div>
        <div className="flex items-center gap-1">
          {DAY_OPTIONS.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              onClick={() => setDays(d)}
            >
              {d}일
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 입퇴장 집계 + 무음 이탈 */}
        {isError ? (
          <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            행동 분석을 불러오지 못했습니다.
          </p>
        ) : isLoading || !data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile
                label="총 입장"
                value={data.attendance.totalEntered.toLocaleString()}
              />
              <Tile
                label="총 퇴장"
                value={data.attendance.totalExited.toLocaleString()}
              />
              <Tile
                label="순 방문자"
                value={data.attendance.uniqueVisitors.toLocaleString()}
              />
              <Tile label="무음 중 이탈 비율" value={ratioText} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">일별 입퇴장</h4>
                <span className="text-xs text-muted-foreground">
                  무음 이탈 {data.silenceExit.exitsDuringSilence}/
                  {data.silenceExit.totalExits} · 근사치
                </span>
              </div>
              <DailyTrend daily={data.attendance.daily} />
            </div>
          </>
        )}

        {/* 디제잉 이력 */}
        <div>
          <h4 className="mb-2 text-sm font-medium">디제잉 이력</h4>
          {djError ? (
            <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              디제잉 이력을 불러오지 못했습니다.
            </p>
          ) : djLoading || !djHistory ? (
            <Skeleton className="h-40 w-full" />
          ) : djHistory.content.length === 0 ? (
            <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              디제잉 이력이 없습니다.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>트랙</TableHead>
                    <TableHead>DJ</TableHead>
                    <TableHead>재생 시각</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {djHistory.content.map((item) => (
                    <TableRow key={item.playbackId}>
                      <TableCell className="max-w-[280px]">
                        <div className="flex items-center gap-2">
                          {item.thumbnailImage ? (
                            <img
                              src={item.thumbnailImage}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded object-cover"
                              onError={hideBrokenImage}
                            />
                          ) : null}
                          <span className="truncate">{item.trackName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.avatarIconUri ? (
                            <img
                              src={item.avatarIconUri}
                              alt=""
                              className="h-6 w-6 shrink-0 rounded-full object-cover"
                              onError={hideBrokenImage}
                            />
                          ) : null}
                          <span className="truncate">{item.djNickname}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatKst(item.playedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {djHistory.number + 1} / {Math.max(1, djHistory.totalPages)} 페이지
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={djHistory.first}
                    onClick={() => setDjPage((p) => Math.max(0, p - 1))}
                  >
                    이전
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={djHistory.last}
                    onClick={() => setDjPage((p) => p + 1)}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
