import { Routes, Route, Navigate } from "react-router-dom"
import AppLayout from "@/app/layout"
import { ScenariosPage } from "@/pages/scenarios-page"
import { LoginPage } from "@/pages/login-page"

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/scenarios" replace />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
      </Route>
    </Routes>
  )
}
