import { useParams } from "react-router-dom"

// G1.2 placeholder — G5에서 AvatarsDetailWidget으로 교체
export function AvatarDetailPage() {
  const { resourceType, id } = useParams<{
    resourceType: "bodies" | "faces"
    id: string
  }>()
  return (
    <div className="p-6 lg:p-8">
      아바타 상세 — {resourceType}/{id} (구현 예정)
    </div>
  )
}
