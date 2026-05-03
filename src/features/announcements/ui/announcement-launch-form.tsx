import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/shared/lib/utils"
import { useCreateAnnouncement } from "../api/use-create-announcement"
import {
  createAnnouncementRequestSchema,
  type CreateAnnouncementRequest,
} from "../model/mutation-schema"
import type {
  AnnouncementType,
  AnnouncementSeverity,
} from "@/entities/announcement"

const TYPE_OPTIONS: { value: AnnouncementType; label: string; hint: string }[] = [
  { value: "MAINTENANCE_NOTICE", label: "점검 공지", hint: "점검 시작·종료 시각 지정" },
  { value: "EVENT", label: "이벤트", hint: "선택적 만료 시각" },
  { value: "EMERGENCY", label: "긴급 공지", hint: "선택적 만료 시각" },
]

const SEVERITY_OPTIONS: { value: AnnouncementSeverity; label: string }[] = [
  { value: "INFO", label: "정보" },
  { value: "WARN", label: "경고" },
  { value: "CRITICAL", label: "위급" },
]

interface FormState {
  type: AnnouncementType
  severity: AnnouncementSeverity
  titleKo: string
  titleEn: string
  messageKo: string
  messageEn: string
  scheduledStartAt: string
  scheduledEndAt: string
  expiresAt: string
}

const INITIAL: FormState = {
  type: "MAINTENANCE_NOTICE",
  severity: "WARN",
  titleKo: "",
  titleEn: "",
  messageKo: "",
  messageEn: "",
  scheduledStartAt: "",
  scheduledEndAt: "",
  expiresAt: "",
}

export function AnnouncementLaunchForm() {
  const [state, setState] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const mutation = useCreateAnnouncement()

  const isMaintenance = state.type === "MAINTENANCE_NOTICE"

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }))

  // type 전환 시 비호환 schedule 필드는 자동 비움 — 사용자가 다시 선택 시 stale 값 노출 방지.
  const handleTypeChange = (next: AnnouncementType) => {
    setState((s) => ({
      ...s,
      type: next,
      ...(next === "MAINTENANCE_NOTICE"
        ? { expiresAt: "" }
        : { scheduledStartAt: "", scheduledEndAt: "" }),
    }))
    setErrors({})
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const body: CreateAnnouncementRequest = {
      type: state.type,
      severity: state.severity,
      titleKo: state.titleKo.trim(),
      titleEn: state.titleEn.trim(),
      messageKo: state.messageKo.trim(),
      messageEn: state.messageEn.trim(),
      scheduledStartAt: state.scheduledStartAt || null,
      scheduledEndAt: state.scheduledEndAt || null,
      expiresAt: state.expiresAt || null,
    }
    const parsed = createAnnouncementRequestSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    mutation.mutate(parsed.data, {
      onSuccess: (response) => {
        toast.success("공지가 발사되었습니다", {
          description: `공지 #${response.announcementId}`,
        })
        navigate("/announcements/history")
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none mb-2">공지 종류</legend>
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={state.type === opt.value}
              onClick={() => handleTypeChange(opt.value)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-md border px-4 py-3 text-left transition-colors",
                state.type === opt.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-input text-muted-foreground hover:bg-accent",
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs">{opt.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none mb-2">심각도</legend>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={state.severity === opt.value}
              onClick={() => set("severity", opt.value)}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                state.severity === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-input text-muted-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="ann-title-ko">제목 (한국어)</Label>
          <Input
            id="ann-title-ko"
            value={state.titleKo}
            onChange={(e) => set("titleKo", e.target.value)}
            maxLength={200}
          />
          {errors.titleKo && <p className="text-xs text-destructive">{errors.titleKo}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="ann-title-en">제목 (English)</Label>
          <Input
            id="ann-title-en"
            value={state.titleEn}
            onChange={(e) => set("titleEn", e.target.value)}
            maxLength={200}
          />
          {errors.titleEn && <p className="text-xs text-destructive">{errors.titleEn}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="ann-msg-ko">본문 (한국어)</Label>
          <Textarea
            id="ann-msg-ko"
            rows={5}
            value={state.messageKo}
            onChange={(e) => set("messageKo", e.target.value)}
            maxLength={2000}
          />
          {errors.messageKo && (
            <p className="text-xs text-destructive">{errors.messageKo}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="ann-msg-en">본문 (English)</Label>
          <Textarea
            id="ann-msg-en"
            rows={5}
            value={state.messageEn}
            onChange={(e) => set("messageEn", e.target.value)}
            maxLength={2000}
          />
          {errors.messageEn && (
            <p className="text-xs text-destructive">{errors.messageEn}</p>
          )}
        </div>
      </div>

      {isMaintenance ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="ann-start">점검 시작</Label>
            <Input
              id="ann-start"
              type="datetime-local"
              value={state.scheduledStartAt}
              onChange={(e) => set("scheduledStartAt", e.target.value)}
            />
            {errors.scheduledStartAt && (
              <p className="text-xs text-destructive">{errors.scheduledStartAt}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="ann-end">점검 종료</Label>
            <Input
              id="ann-end"
              type="datetime-local"
              value={state.scheduledEndAt}
              onChange={(e) => set("scheduledEndAt", e.target.value)}
            />
            {errors.scheduledEndAt && (
              <p className="text-xs text-destructive">{errors.scheduledEndAt}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Label htmlFor="ann-expires">만료 시각 (선택)</Label>
          <Input
            id="ann-expires"
            type="datetime-local"
            value={state.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            지정 시 사용자 화면에서 해당 시각까지 노출됩니다. 미지정 시 admin 이 명시 취소할 때까지 유지됩니다.
          </p>
          {errors.expiresAt && (
            <p className="text-xs text-destructive">{errors.expiresAt}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "발사 중..." : "공지 발사"}
        </Button>
      </div>
    </form>
  )
}
