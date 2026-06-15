import { z } from "zod"

// backend CreatePersonaRequest = name @NotBlank @Size(max=64), instruction @NotBlank @Size(max=4000).
export const createPersonaSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(64, "64자 이내"),
  instruction: z
    .string()
    .min(1, "지시문은 필수입니다")
    .max(4000, "4000자 이내"),
})

export type CreatePersonaRequest = z.infer<typeof createPersonaSchema>

// backend UpdatePersonaRequest = name @NotBlank @Size(max=64), instruction @NotBlank @Size(max=4000),
// active boolean (활성 여부 토글).
export const updatePersonaSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(64, "64자 이내"),
  instruction: z
    .string()
    .min(1, "지시문은 필수입니다")
    .max(4000, "4000자 이내"),
  active: z.boolean(),
})

export type UpdatePersonaRequest = z.infer<typeof updatePersonaSchema>
