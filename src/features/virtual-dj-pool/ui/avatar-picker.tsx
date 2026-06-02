import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/shared/lib/utils"
import { useAvatarCatalog } from "../api/use-avatar-catalog"
import { toAvatarOption, type AvatarOption } from "../model/to-avatar-option"

interface SingleProps {
  mode: "single"
  value: string | null
  onChange: (value: string) => void
}

interface MultiProps {
  mode: "multi"
  value: string[]
  onChange: (value: string[]) => void
}

type AvatarPickerProps = SingleProps | MultiProps

export function AvatarPicker(props: AvatarPickerProps) {
  const { data, isLoading, isError } = useAvatarCatalog()

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        아바타 카탈로그를 불러오지 못했습니다.
      </p>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    )
  }

  const options = data.map(toAvatarOption)

  const isSelected = (value: string) =>
    props.mode === "single"
      ? props.value === value
      : props.value.includes(value)

  const toggle = (value: string) => {
    if (props.mode === "single") {
      props.onChange(value)
      return
    }
    const next = props.value.includes(value)
      ? props.value.filter((v) => v !== value)
      : [...props.value, value]
    props.onChange(next)
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {options.map((opt) => (
        <AvatarTile
          key={opt.value}
          option={opt}
          selected={isSelected(opt.value)}
          onSelect={() => toggle(opt.value)}
        />
      ))}
    </div>
  )
}

interface TileProps {
  option: AvatarOption
  selected: boolean
  onSelect: () => void
}

function AvatarTile({ option, selected, onSelect }: TileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors hover:border-primary/60",
        selected
          ? "border-primary ring-2 ring-primary/40"
          : "border-input",
      )}
    >
      <img
        src={option.thumbnail}
        alt={option.label}
        className="aspect-square w-full rounded-md object-cover"
      />
      <span className="line-clamp-1 w-full text-xs font-medium">
        {option.label}
      </span>
      <Badge variant={option.combinable ? "secondary" : "muted"}>
        {option.combinable ? "합성" : "단독"}
      </Badge>
    </button>
  )
}
