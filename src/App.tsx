import { Routes, Route, Navigate } from "react-router-dom"
import AppLayout from "@/app/layout"
import { ScenariosPage } from "@/pages/scenarios-page"
import { RoomsPage } from "@/pages/rooms-page"
import { UsersPage } from "@/pages/users-page"
import { LoginPage } from "@/pages/login-page"
import { ChangePasswordPage } from "@/pages/change-password-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { ProtectedRoute } from "@/widgets/protected-route"

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/password/change" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
