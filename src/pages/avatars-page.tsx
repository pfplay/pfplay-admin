import { useParams } from "react-router-dom"

// G1.2 placeholder — G4에서 AvatarsListWidget으로 교체
export function AvatarsPage() {
  const { resourceType } = useParams<{ resourceType: "bodies" | "faces" }>()
  return <div className="p-6 lg:p-8">아바타 — {resourceType} (구현 예정)</div>
}
