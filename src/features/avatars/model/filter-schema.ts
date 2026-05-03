import { z } from "zod"

export const LifecycleStatusEnum = z.enum(["DRAFT", "PUBLISHED", "RETIRED"])
export type LifecycleStatus = z.infer<typeof LifecycleStatusEnum>

export const ObtainmentTypeEnum = z.enum(["BASIC", "DJ_PNT", "REF_LINK", "ROOM_ACT"])
export type ObtainmentType = z.infer<typeof ObtainmentTypeEnum>

export const bodyListQuerySchema = z.object({
  status: LifecycleStatusEnum.optional(),
  obtainableType: ObtainmentTypeEnum.optional(),
})
export type BodyListQuery = z.infer<typeof bodyListQuerySchema>

export const faceListQuerySchema = z.object({
  status: LifecycleStatusEnum.optional(),
})
export type FaceListQuery = z.infer<typeof faceListQuerySchema>
