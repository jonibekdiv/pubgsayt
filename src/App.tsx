import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppShell } from '@/components/layout/app-shell';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { TournamentsPage } from '@/pages/TournamentsPage';
import { TournamentDetailPage } from '@/pages/TournamentDetailPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { TeamDetailPage } from '@/pages/TeamDetailPage';
import { TeamCreatePage } from '@/pages/TeamCreatePage';
import { TeamJoinPage } from '@/pages/TeamJoinPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProfileEditPage } from '@/pages/ProfileEditPage';
import { WalletPage } from '@/pages/WalletPage';
import { WalletTopUpPage } from '@/pages/WalletTopUpPage';
import { AdminTopUpRequests } from '@/pages/admin/AdminTopUpRequests';
import { AdminPaymentSettings } from '@/pages/admin/AdminPaymentSettings';
import { DashboardPage } from '@/pages/DashboardPage';
import { MyTeamPage } from '@/pages/MyTeamPage';
import { LivePage } from '@/pages/LivePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { OrganizerDashboard } from '@/pages/organizer/OrganizerDashboard';
import { OrganizerTournaments } from '@/pages/organizer/OrganizerTournaments';
import { OrganizerApplyPage } from '@/pages/organizer/OrganizerApplyPage';
import { OrganizerTournamentCreate } from '@/pages/organizer/OrganizerTournamentCreate';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminRoles } from '@/pages/admin/AdminRoles';
import { AdminOrganizers } from '@/pages/admin/AdminOrganizers';
import { AdminAuditLogs } from '@/pages/admin/AdminAuditLogs';
import { HostDashboard } from '@/pages/host/HostDashboard';
import { HostTournaments } from '@/pages/host/HostTournaments';
import { HostMatchPage } from '@/pages/host/HostMatchPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<Navigate to="/forgot-password" replace />} />

            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="tournaments" element={<TournamentsPage />} />
              <Route path="tournaments/:id" element={<TournamentDetailPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="teams/:id" element={<TeamDetailPage />} />
              <Route path="team/create" element={<TeamCreatePage />} />
              <Route path="team/join/:code" element={<TeamJoinPage />} />
              <Route path="live" element={<LivePage />} />
              <Route path="profile" element={<ProfilePage />} />`n              <Route path="profile/edit" element={<ProfileEditPage />} />`n              <Route path="wallet" element={<WalletPage />} />`n              <Route path="wallet/topup" element={<WalletTopUpPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="my-team" element={<MyTeamPage />} />

              <Route path="organizer" element={<OrganizerDashboard />} />
              <Route path="organizer/tournaments" element={<OrganizerTournaments />} />
              <Route path="organizer/tournaments/create" element={<OrganizerTournamentCreate />} />
              <Route path="organizer/hosts" element={<OrganizerDashboard />} />
              <Route path="organizer/apply" element={<OrganizerApplyPage />} />

              <Route path="host" element={<HostDashboard />} />
              <Route path="host/tournaments" element={<HostTournaments />} />
              <Route path="host/matches/:matchId" element={<HostMatchPage />} />

              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/roles" element={<AdminRoles />} />
              <Route path="admin/organizers" element={<AdminOrganizers />} />`n              <Route path="admin/topup-requests" element={<AdminTopUpRequests />} />`n              <Route path="admin/payment-settings" element={<AdminPaymentSettings />} />
              <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
              <Route path="admin/tournaments" element={<TournamentsPage />} />
              <Route path="admin/statistics" element={<AdminDashboard />} />
              <Route path="admin/settings" element={<AdminDashboard />} />

              <Route path="403" element={<ForbiddenPage />} />
              <Route path="404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}