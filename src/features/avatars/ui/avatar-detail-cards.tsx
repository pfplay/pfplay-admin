import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatKst } from "@/shared/lib/format-kst"
import { isBodyView } from "@/entities/avatar"
import type {
  AdminAvatarBodyView,
  AdminAvatarFaceView,
  LifecycleStatus,
} from "@/entities/avatar"

const STATUS_VARIANT: Record<LifecycleStatus, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  RETIRED: "outline",
}

interface Props {
  detail: AdminAvatarBodyView | AdminAvatarFaceView
}

export function AvatarDetailCards({ detail }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            #{detail.id} {detail.name}
            <Badge variant={STATUS_VARIANT[detail.lifecycleStatus]}>
              {detail.lifecycleStatus}
            </Badge>
            <Badge variant="outline">{detail.obtainableType}</Badge>
            {isBodyView(detail) && (
              <Badge variant="outline">score: {detail.obtainableScore}</Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>메타</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>id: {detail.id}</p>
          <p>name: {detail.name}</p>
          <p>obtainableType: {detail.obtainableType}</p>
          {isBodyView(detail) && (
            <>
              <p>obtainableScore: {detail.obtainableScore}</p>
              <p>isCombinable: {detail.isCombinable ? "true" : "false"}</p>
              <p>isDefaultSetting: {detail.isDefaultSetting ? "true" : "false"}</p>
              <p>
                combinePosition: ({detail.combinePositionX},{" "}
                {detail.combinePositionY})
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>이미지 미리보기</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 items-start">
          <div>
            <p className="text-xs text-muted-foreground mb-1">아이콘</p>
            {detail.iconUri ? (
              <img
                src={detail.iconUri}
                alt={`${detail.name} icon`}
                className="w-24 h-24 object-contain rounded border bg-muted"
              />
            ) : (
              <div
                aria-label="아이콘 없음"
                className="w-24 h-24 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground"
              >
                아이콘 없음
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">리소스</p>
            <img
              src={detail.resourceUri}
              alt={`${detail.name} resource`}
              className="w-48 h-48 object-contain rounded border bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>감사 로그</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>
            생성: {formatKst(detail.createdAt)} (#{detail.createdBy})
          </p>
          <p>
            마지막 수정: {formatKst(detail.updatedAt)} (#{detail.updatedBy})
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw URI</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 break-all">
          <p>
            <span className="text-muted-foreground">resourceUri: </span>
            <code className="text-xs">{detail.resourceUri}</code>
          </p>
          <p>
            <span className="text-muted-foreground">iconUri: </span>
            {detail.iconUri ? (
              <code className="text-xs">{detail.iconUri}</code>
            ) : (
              <span className="text-xs italic text-muted-foreground">null</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
