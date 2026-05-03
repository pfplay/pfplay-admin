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
import { formatKst } from "@/shared/lib/format-kst"
import { TIER, formatActivityEventLabel } from "@/shared/lib/labels"

interface Props {
  detail: AdminMemberDetail
}

export function MemberDetailCards({ detail }: Props) {
  // PR 14g G4.3: detail 자체가 withdrawn/withdrawnAt를 보유 (G3.2 backend root-level).
  // 별도 prop drilling 제거하고 detail 단일 source 사용.
  const withdrawnTooltip = detail.withdrawnAt
    ? `탈퇴 처리: ${formatKst(detail.withdrawnAt)}`
    : ""
  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">
          #{detail.memberId} {detail.profile.nickname ?? "-"}
        </h2>
        {detail.withdrawn && (
          <Badge variant="muted" title={withdrawnTooltip}>
            탈퇴됨
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
            <span className="text-muted-foreground">가입 경로</span>
            <div>{detail.userAccount.providerType}</div>
          </div>
          <div>
            <span className="text-muted-foreground">user_account_id</span>
            <div>{detail.userAccount.userAccountId}</div>
          </div>
          <div>
            <span className="text-muted-foreground">최근 로그인</span>
            <div>
              {detail.userAccount.lastLoginAt
                ? formatKst(detail.userAccount.lastLoginAt)
                : "—"}
            </div>
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
          <Badge variant={TIER.variant[detail.authorityTier]}>
            {TIER.label[detail.authorityTier]}
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
                  <TableHead>이벤트</TableHead>
                  <TableHead>파티룸</TableHead>
                  <TableHead>메타</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.recentActivityLog.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatKst(row.occurredAt)}</TableCell>
                    <TableCell>
                      {formatActivityEventLabel(row.eventType, row.metadata)}
                    </TableCell>
                    <TableCell>{row.partyroomId ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.metadata && Object.keys(row.metadata).length > 0
                        ? JSON.stringify(row.metadata)
                        : "—"}
                    </TableCell>
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
