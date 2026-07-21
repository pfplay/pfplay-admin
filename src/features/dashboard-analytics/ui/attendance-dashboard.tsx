import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAttendanceAnalytics } from "../api/use-attendance-analytics"
import type { AttendanceDaily } from "../model/types"

const DAY_OPTIONS = [7, 14, 30] as const

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** 일별 입장/퇴장/순방문자 미니바 — 파티룸 상세 행동분석(#33)과 동일한 CSS 비율 방식. */
function DailyTrend({ daily }: { daily: AttendanceDaily[] }) {
  if (daily.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        기간 내 입퇴장 데이터가 없습니다.
      </p>
    )
  }
  const max = Math.max(
    1,
    ...daily.map((d) => Math.max(d.entered, d.exited, d.uniqueVisitors)),
  )
  const Bar = ({ value, color, label }: { value: number; color: string; label: string }) => (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-2.5 rounded-sm ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
        aria-hidden
      />
      <span className="tabular-nums text-muted-foreground">
        {label} {value}
      </span>
    </div>
  )
  return (
    <div className="space-y-2">
      {daily.map((d) => (
        <div key={d.date} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
            {d.date.slice(5)}
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <Bar value={d.entered} color="bg-emerald-500" label="입장" />
            <Bar value={d.exited} color="bg-rose-400" label="퇴장" />
            <Bar value={d.uniqueVisitors} color="bg-sky-500" label="순방문" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AttendanceDashboard() {
  const [days, setDays] = useState<number>(7)
  const [excludeBots, setExcludeBots] = useState(true)

  const { data, isLoading, isError } = useAttendanceAnalytics(days, excludeBots)

  const rate = data?.summary.exitRecordRate
  const rateText = rate === null || rate === undefined ? "—" : `${Math.round(rate * 100)}%`

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>전역 입퇴장 분석</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            서비스 전체 일별 입장·퇴장·순 방문자 (Asia/Seoul 달력일)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dash-exclude-bots"
              checked={excludeBots}
              onCheckedChange={(c) => setExcludeBots(c === true)}
              aria-label="봇 제외"
            />
            <Label
              htmlFor="dash-exclude-bots"
              className="cursor-pointer text-xs font-normal text-muted-foreground"
            >
              봇 제외
            </Label>
          </div>
          <div className="flex gap-1">
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-40 w-full" data-testid="dash-loading" />}
        {isError && (
          <p className="py-6 text-center text-sm text-destructive">
            분석 데이터를 불러오지 못했습니다.
          </p>
        )}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="총 입장" value={String(data.summary.totalEntered)} />
              <Tile label="순 방문자" value={String(data.summary.uniqueVisitors)} />
              <Tile label="활성 방" value={String(data.summary.activeRoomCount)} />
              <Tile
                label="퇴장 기록률"
                value={rateText}
                hint="퇴장 이벤트 유실 시 100% 미만 — 급락은 품질 신호"
              />
            </div>
            <DailyTrend daily={data.daily} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
