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
import type { AdminMemberDetail } from "@/entities/member"

// G3.1과 동일한 null/invalid 가드 패턴 (members-table.tsx 참조).
// 두 곳에서 사용 중이지만 G4 시점엔 shared 추출 미실시 — G9 catch-up 후보.
function formatKst(iso: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("ko-KR", { hour12: false })
}

interface Props {
  detail: AdminMemberDetail
  withdrawn?: boolean
  withdrawnAt?: string | null
}

export function MemberDetailCards({ detail, withdrawn, withdrawnAt }: Props) {
  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">
          #{detail.memberId} {detail.profile.nickname ?? "-"}
        </h2>
        {withdrawn && (
          <Badge variant="secondary" title={withdrawnAt ?? ""}>
            탈퇴 회원
          </Badge>
        )}
      </div>

      {/* 2. UserAccount */}
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">이메일</span>
            <div>{detail.userAccount.email}</div>
          </div>
          <div>
            <span className="text-muted-foreground">provider</span>
            <div>{detail.userAccount.providerType}</div>
          </div>
          <div>
            <span className="text-muted-foreground">user_account_id</span>
            <div>{detail.userAccount.userAccountId}</div>
          </div>
          <div>
            <span className="text-muted-foreground">계정 생성일</span>
            <div>{formatKst(detail.userAccount.createdAt)}</div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Profile */}
      <Card>
        <CardHeader>
          <CardTitle>프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">닉네임</span>
            <div>{detail.profile.nickname ?? "-"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">소개</span>
            <div className="whitespace-pre-line">
              {detail.profile.introduction ?? "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tier + meta */}
      <Card>
        <CardHeader>
          <CardTitle>권한 + 메타</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm">
          <Badge
            variant={detail.authorityTier === "GT" ? "destructive" : "default"}
          >
            {detail.authorityTier}
            {detail.authorityTier === "GT" ? " (강등)" : ""}
          </Badge>
          <span className="text-muted-foreground">멤버 생성일</span>
          <span>{formatKst(detail.createdAt)}</span>
        </CardContent>
      </Card>

      {/* 5. Recent activity log */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동 (top 30)</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.recentActivityLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">최근 활동 없음</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시각</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>요약</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.recentActivityLog.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatKst(row.occurredAt)}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.summary}</TableCell>
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
