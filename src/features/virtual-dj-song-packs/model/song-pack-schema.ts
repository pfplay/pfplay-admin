import { z } from "zod"

// backend CreateSongPackRequest = name @NotBlank @Size(max=100), description @Size(max=500).
// description 은 빈 문자열을 null 로 정규화하여 보낸다 (선택 입력).
export const createSongPackSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(100, "100자 이내"),
  description: z.string().max(500, "500자 이내").optional().nullable(),
})

export type CreateSongPackRequest = z.infer<typeof createSongPackSchema>

// backend RenameSongPackRequest = name @NotBlank @Size(max=100).
export const renameSongPackSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(100, "100자 이내"),
})

export type RenameSongPackRequest = z.infer<typeof renameSongPackSchema>

// backend AddPackTrackRequest = name @NotBlank @Size(max=200), linkId @NotBlank @Size(max=100),
// duration @NotBlank, thumbnailImage @Size(max=1000) (선택).
export const addTrackSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(200, "200자 이내"),
  linkId: z.string().min(1, "linkId 는 필수입니다").max(100, "100자 이내"),
  duration: z.string().min(1, "duration 은 필수입니다"),
  thumbnailImage: z.string().max(1000, "1000자 이내").optional().nullable(),
})

export type AddTrackRequest = z.infer<typeof addTrackSchema>
