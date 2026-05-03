import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatKst } from "@/shared/lib/format-kst"
import { ADMIN_ROLE } from "@/shared/lib/labels"
import type { AdministratorView } from "@/entities/administrator"

interface Props {
  detail: AdministratorView
}

export function AdministratorDetailCards({ detail }: Props) {
  const isRevoked = detail.revokedAt !== null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/administrators" className="text-sm text-muted-foreground">
          ← 목록으로
        </Link>
        <h2 className="text-2xl font-bold">
          #{detail.administratorId} {detail.nickname ?? detail.email}
        </h2>
        <Badge variant={ADMIN_ROLE.variant[detail.role]}>
          {ADMIN_ROLE.label[detail.role]}
        </Badge>
        {isRevoked ? (
          <Badge variant="muted">회수됨</Badge>
        ) : (
          <Badge variant="success">활성</Badge>
        )}
        {detail.mustChangePassword && <Badge variant="warning">비번 변경 필요</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">이메일</span>
            <div>{detail.email}</div>
          </div>
          <div>
            <span className="text-muted-foreground">닉네임</span>
            <div>{detail.nickname ?? "—"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">user_account_id</span>
            <div>#{detail.userAccountId}</div>
          </div>
          <div>
            <span className="text-muted-foreground">멤버 프로필</span>
            <div>
              {detail.memberId ? (
                <Link
                  to={`/members/${detail.memberId}`}
                  className="text-primary underline"
                >
                  #{detail.memberId} 멤버 상세
                </Link>
              ) : (
                <span className="text-muted-foreground">미연결</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">최근 로그인</span>
            <div>{formatKst(detail.lastLoginAt)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>권한 부여 기록</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">부여일</span>
            <div>{formatKst(detail.grantedAt)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">부여한 어드민</span>
            <div>
              {detail.grantedByAdministratorId
                ? `#${detail.grantedByAdministratorId}`
                : <span className="text-muted-foreground">초기 시드</span>}
            </div>
          </div>
          {isRevoked && (
            <div className="col-span-2">
              <span className="text-muted-foreground">회수일</span>
              <div>{formatKst(detail.revokedAt)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
