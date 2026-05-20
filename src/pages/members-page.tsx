import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MembersListWidget } from "@/widgets/members-list"
import { GuestsListWidget } from "@/widgets/guests-list"

const VALID_TABS = ["member", "guest"] as const
type Tab = (typeof VALID_TABS)[number]
const DEFAULT_TAB: Tab = "member"

function parseTab(raw: string | null): Tab {
  return raw && (VALID_TABS as readonly string[]).includes(raw)
    ? (raw as Tab)
    : DEFAULT_TAB
}

export function MembersPage() {
  const [params, setParams] = useSearchParams()
  const tab = parseTab(params.get("tab"))

  const handleChange = (next: string) => {
    const nextParams = new URLSearchParams(params)
    nextParams.set("tab", next)
    setParams(nextParams, { replace: false })
  }

  return (
    <Tabs value={tab} onValueChange={handleChange} className="p-6 lg:p-8">
      <TabsList>
        <TabsTrigger value="member">정회원</TabsTrigger>
        <TabsTrigger value="guest">GUEST</TabsTrigger>
      </TabsList>
      {/* shadcn/Radix Tabs: inactive TabsContent 는 default 로 unmount → 두 widget 동시 마운트 없음 (이중 fetch 방지) */}
      <TabsContent value="member">
        <MembersListWidget />
      </TabsContent>
      <TabsContent value="guest">
        <GuestsListWidget />
      </TabsContent>
    </Tabs>
  )
}
