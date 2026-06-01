import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProvisionPool } from "../api/use-provision-pool"
import { provisionPoolSchema } from "../model/provision-schema"

const DEFAULT_COUNT = "10"

export function ProvisionPoolForm() {
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [error, setError] = useState<string | null>(null)
  const mutation = useProvisionPool()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = provisionPoolSchema.safeParse({ count })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "유효하지 않은 값입니다")
      return
    }
    setError(null)
    mutation.mutate(parsed.data.count, {
      onSuccess: () => {
        toast.success("봇 풀이 충원되었습니다", {
          description: `${parsed.data.count}개 봇 계정 요청`,
        })
        setCount(DEFAULT_COUNT)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div className="space-y-1">
        <Label htmlFor="provision-count">충원할 봇 수</Label>
        <Input
          id="provision-count"
          type="number"
          min={1}
          max={500}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="max-w-40"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          1 이상 500 이하. 봇 계정을 새로 생성하여 풀에 추가합니다.
        </p>
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "충원 중..." : "봇 충원"}
      </Button>
    </form>
  )
}
