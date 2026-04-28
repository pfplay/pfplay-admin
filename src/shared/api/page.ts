export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number // 0-based page index
  size: number
  first: boolean
  last: boolean
  empty: boolean
  numberOfElements: number
}

export interface ApiCommonResponse<T> {
  data: T
}

export const unwrap = <T>(res: ApiCommonResponse<T>): T => res.data
