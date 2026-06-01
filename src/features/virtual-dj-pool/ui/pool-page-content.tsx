import { Bot } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { usePoolSummary } from "../api/use-pool-summary"
import { PoolSummaryCards } from "./pool-summary-cards"
import { ProvisionPoolForm } from "./provision-pool-form"

export function PoolPageContent() {
  const { data, isLoading, isError } = usePoolSummary()

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">봇 풀</h1>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">
          봇 풀 요약을 불러오지 못했습니다.
        </p>
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <PoolSummaryCards summary={data} />
      )}

      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold">봇 충원</h2>
        <ProvisionPoolForm />
      </div>
    </div>
  )
}
