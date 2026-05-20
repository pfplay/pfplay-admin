import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatKst } from "@/shared/lib/format-kst"
import type { AdminGuestDetail } from "@/entities/guest"

interface Props {
  detail: AdminGuestDetail
}

export function GuestDetailCards({ detail }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>계정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>이메일: {detail.userAccount.email}</div>
          <div>가입 경로: {detail.userAccount.providerType}</div>
          <div>마지막 로그인: {formatKst(detail.userAccount.lastLoginAt)}</div>
          <div>
            상태:{" "}
            {detail.withdrawn ? (
              <Badge variant="muted">
                탈퇴됨 ({formatKst(detail.withdrawnAt)})
              </Badge>
            ) : (
              <Badge variant="outline">활동 중</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>게스트 프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>닉네임: {detail.profile.nickname ?? "-"}</div>
          <div>소개: {detail.profile.introduction ?? "-"}</div>
          <div className="break-all">agent: {detail.agent ?? "-"}</div>
          <div>프로필 완료 여부: {detail.isProfileUpdated ? "Y" : "N"}</div>
          <div>가입일: {formatKst(detail.createdAt)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 활동 로그 (상위 30건)</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.recentActivityLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">활동 기록 없음</p>
          ) : (
            <ul className="text-sm space-y-1">
              {detail.recentActivityLog.map((log, i) => (
                <li key={i}>
                  <span className="font-medium">{log.eventType}</span>
                  {log.partyroomId !== null && (
                    <span> · partyroom #{log.partyroomId}</span>
                  )}
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatKst(log.occurredAt)}
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
