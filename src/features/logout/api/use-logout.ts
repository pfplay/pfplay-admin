import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { sessionApi, useSessionStore } from "@/entities/session"

export function useLogout() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => sessionApi.logout(),
    // 백엔드 응답 성공/실패와 무관하게 클라 cleanup
    onSettled: () => {
      useSessionStore.getState().clear()
      navigate("/login", { replace: true })
    },
  })
}
