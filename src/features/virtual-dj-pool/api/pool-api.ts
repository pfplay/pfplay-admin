import { http } from "@/shared/api/http"
import { unwrap } from "@/shared/api/page"
import type { ApiCommonResponse } from "@/shared/api/page"
import type { PoolSummary } from "@/entities/virtual-dj"

const API = "/api/v1/admin/virtual-dj/pool"

export async function getPoolSummary(): Promise<PoolSummary> {
  const res = await http<ApiCommonResponse<PoolSummary>>(API)
  return unwrap(res)
}

export async function provisionPool(count: number): Promise<void> {
  await http<void>(API, { method: "POST", body: { count } })
}
