import type { SyntheticEvent } from "react"

/**
 * `<img onError>` 핸들러 — 외부 URI(아바타 등)가 깨졌을 때 브라우저 기본 broken-image
 * 글리프 대신 이미지를 감춘다. `visibility: hidden` 이라 레이아웃 공간은 유지된다.
 */
export function hideBrokenImage(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.visibility = "hidden"
}
