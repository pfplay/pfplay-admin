import { Routes, Route, Navigate } from "react-router-dom"
import AppLayout from "@/app/layout"
import { ScenariosPage } from "@/pages/scenarios-page"

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/scenarios" replace />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
      </Route>
    </Routes>
  )
}
