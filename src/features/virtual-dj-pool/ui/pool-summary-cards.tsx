import { Link } from "react-router-dom"
import { Bot, BedDouble, MapPin } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PoolSummary } from "@/entities/virtual-dj"

interface Props {
  summary: PoolSummary
}

const METRICS = [
  {
    key: "total" as const,
    label: "전체 봇",
    description: "풀에 등록된 봇 계정 수",
    icon: Bot,
  },
  {
    key: "idle" as const,
    label: "유휴 봇",
    description: "파티룸에 배치되지 않은 봇",
    icon: BedDouble,
  },
]

export function PoolSummaryCards({ summary }: Props) {
  const placedCount = summary.placed.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {METRICS.map((m) => (
          <Card key={m.key}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <m.icon className="h-4 w-4" />
                {m.label}
              </CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {summary[m.key]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{m.description}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              배치 파티룸
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{placedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">봇이 배치된 파티룸 수</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">파티룸별 배치 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {placedCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              배치된 봇이 없습니다.
            </p>
          ) : (
            <ul className="divide-y">
              {summary.placed.map((p) => (
                <li
                  key={p.partyroomId}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <Link
                    to={`/partyrooms/${p.partyroomId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {p.partyroomTitle}
                  </Link>
                  <span className="tabular-nums text-muted-foreground">
                    봇 {p.botCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
