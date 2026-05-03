import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { AvatarsTable } from "../avatars-table"
import { AvatarDetailCards } from "../avatar-detail-cards"
import {
  bodyDraftFixture,
  bodyNullIconFixture,
  faceNullIconFixture,
} from "@/test/mocks/fixtures/avatars"

describe("iconUri=null 렌더링 — backend 스펙 'NULL이면 placeholder 표시' 정합", () => {
  it("AvatarsTable: iconUri null 행은 img 대신 '—' placeholder", () => {
    render(
      <MemoryRouter>
        <AvatarsTable
          resourceType="body"
          rows={[bodyDraftFixture, bodyNullIconFixture]}
          isLoading={false}
          isEmpty={false}
        />
      </MemoryRouter>,
    )
    // 정상 행은 img alt가 fixture name으로 박힘
    expect(screen.getByAltText(bodyDraftFixture.name)).toBeInTheDocument()
    // null 행은 img 미사용 + 접근성 라벨로 placeholder 식별 가능
    expect(screen.queryByAltText(bodyNullIconFixture.name)).toBeNull()
    expect(screen.getByLabelText("아이콘 없음")).toBeInTheDocument()
  })

  it("AvatarDetailCards (body): iconUri null이면 빈 박스 표시", () => {
    render(<AvatarDetailCards detail={bodyNullIconFixture} />)
    expect(screen.getByLabelText("아이콘 없음")).toBeInTheDocument()
    expect(screen.queryByAltText(/icon$/)).toBeNull()
  })

  it("AvatarDetailCards (face): iconUri null이면 빈 박스 표시", () => {
    render(<AvatarDetailCards detail={faceNullIconFixture} />)
    expect(screen.getByLabelText("아이콘 없음")).toBeInTheDocument()
  })
})
