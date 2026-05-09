import { z } from "zod"

export const PartyroomStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "TERMINATED"])
export type PartyroomStatus = z.infer<typeof PartyroomStatusEnum>

export const StageTypeEnum = z.enum(["MAIN", "GENERAL"])
export type StageType = z.infer<typeof StageTypeEnum>

export const PartyroomSortEnum = z.enum([
  "createdAt,desc",
  "createdAt,asc",
  "lastActivityAt,desc",
  "lastActivityAt,asc",
  "crewCount,desc",
  "crewCount,asc",
  "title,desc",
  "title,asc",
  "hostNickname,desc",
  "hostNickname,asc",
])
export type PartyroomSort = z.infer<typeof PartyroomSortEnum>

export const partyroomsListQuerySchema = z
  .object({
    status: PartyroomStatusEnum.optional(),
    stageType: StageTypeEnum.optional(),
    createdFrom: z.string().datetime().optional(),
    createdTo: z.string().datetime().optional(),
    host: z.string().min(2).max(50).optional(),
    page: z.coerce.number().int().min(0).default(0),
    size: z.coerce.number().int().min(1).max(200).default(50),
    sort: PartyroomSortEnum.default("createdAt,desc"),
  })
  .superRefine((v, ctx) => {
    if (v.createdFrom && v.createdTo && v.createdFrom > v.createdTo) {
      ctx.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "생성일 종료가 시작보다 빨라요",
      })
    }
  })

export type PartyroomsListQuery = z.infer<typeof partyroomsListQuerySchema>
