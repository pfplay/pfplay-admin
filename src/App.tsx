import { Routes, Route, Navigate } from "react-router-dom"
import AppLayout from "@/app/layout"
import { LoginPage } from "@/pages/login-page"
import { ChangePasswordPage } from "@/pages/change-password-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { MembersPage } from "@/pages/members-page"
import { MemberDetailPage } from "@/pages/member-detail-page"
import { GuestDetailPage } from "@/pages/guest-detail-page"
import { PartyroomsPage } from "@/pages/partyrooms-page"
import { PartyroomDetailPage } from "@/pages/partyroom-detail-page"
import { ReportsPage } from "@/pages/reports-page"
import { ReportDetailPage } from "@/pages/report-detail-page"
import { AvatarsPage } from "@/pages/avatars-page"
import { AvatarDetailPage } from "@/pages/avatar-detail-page"
import { AnnouncementsPage } from "@/pages/announcements-page"
import { AnnouncementsHistoryPage } from "@/pages/announcements-history-page"
import { AdministratorsPage } from "@/pages/administrators-page"
import { AdministratorDetailPage } from "@/pages/administrator-detail-page"
import { BugReportsPage } from "@/pages/bug-reports-page"
import { BugReportDetailPage } from "@/pages/bug-report-detail-page"
import { ProtectedRoute } from "@/widgets/protected-route"

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/password/change" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/members/:memberId" element={<MemberDetailPage />} />
        <Route path="/guests/:guestId" element={<GuestDetailPage />} />
        <Route path="/partyrooms" element={<PartyroomsPage />} />
        <Route path="/partyrooms/:partyroomId" element={<PartyroomDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:reportId" element={<ReportDetailPage />} />
        <Route path="/avatars" element={<Navigate to="/avatars/bodies" replace />} />
        <Route path="/avatars/:resourceType" element={<AvatarsPage />} />
        <Route path="/avatars/:resourceType/:id" element={<AvatarDetailPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/history" element={<AnnouncementsHistoryPage />} />
        <Route path="/administrators" element={<AdministratorsPage />} />
        <Route path="/administrators/:administratorId" element={<AdministratorDetailPage />} />
        <Route path="/voc/bug-reports" element={<BugReportsPage />} />
        <Route path="/voc/bug-reports/:bugReportId" element={<BugReportDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
