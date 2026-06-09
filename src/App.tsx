import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import { AppLayout } from './layouts/AppLayout';
import { Skeleton } from './components/Skeleton';

const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage').then(m => ({ default: m.CalculatorPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const FreeAgencyPage = lazy(() => import('./pages/FreeAgencyPage').then(m => ({ default: m.FreeAgencyPage })));
const ImportReviewPage = lazy(() => import('./pages/ImportReviewPage').then(m => ({ default: m.ImportReviewPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const PlayerStatsPage = lazy(() => import('./pages/PlayerStatsPage').then(m => ({ default: m.PlayerStatsPage })));
const InjuriesPage = lazy(() => import('./pages/InjuriesPage').then(m => ({ default: m.InjuriesPage })));
const LeaguePage = lazy(() => import('./pages/LeaguePage').then(m => ({ default: m.LeaguePage })));
const MyPlayerPage = lazy(() => import('./pages/MyPlayerPage').then(m => ({ default: m.MyPlayerPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage').then(m => ({ default: m.PlayerProfilePage })));
const RosterManagementPage = lazy(() => import('./pages/RosterManagementPage').then(m => ({ default: m.RosterManagementPage })));
const SalaryCapPage = lazy(() => import('./pages/SalaryCapPage').then(m => ({ default: m.SalaryCapPage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const StandingsPage = lazy(() => import('./pages/StandingsPage').then(m => ({ default: m.StandingsPage })));
const TeamDetailPage = lazy(() => import('./pages/TeamDetailPage').then(m => ({ default: m.TeamDetailPage })));
const TeamIdentityPage = lazy(() => import('./pages/TeamIdentityPage').then(m => ({ default: m.TeamIdentityPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then(m => ({ default: m.TeamsPage })));
const TradesPage = lazy(() => import('./pages/TradesPage').then(m => ({ default: m.TradesPage })));

function PageFallback() {
  return (
    <div className="grid gap-5">
      <div className="premium-card premium-glass rounded-[1.85rem] p-5 sm:p-7">
        <Skeleton className="mb-3 h-3 w-20" />
        <Skeleton className="mb-2 h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="premium-card premium-glass rounded-[1.85rem] p-5">
            <Skeleton className="mb-3 h-3 w-16" />
            <Skeleton className="mb-2 h-10 w-20" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="auth/callback" element={<Suspense fallback={<PageFallback />}><AuthCallbackPage /></Suspense>} />
      <Route element={<AppLayout />}>
        <Route index element={<Suspense fallback={<PageFallback />}><DashboardPage /></Suspense>} />
        <Route path="player-profile" element={<Suspense fallback={<PageFallback />}><PlayerProfilePage /></Suspense>} />
        <Route path="player-profile/:slug" element={<Suspense fallback={<PageFallback />}><PlayerProfilePage /></Suspense>} />
        <Route path="my-player" element={<Suspense fallback={<PageFallback />}><MyPlayerPage /></Suspense>} />
        <Route path="teams" element={<Suspense fallback={<PageFallback />}><TeamsPage /></Suspense>} />
        <Route path="teams/:teamId" element={<Suspense fallback={<PageFallback />}><TeamDetailPage /></Suspense>} />
        <Route path="team-identity" element={<Suspense fallback={<PageFallback />}><TeamIdentityPage /></Suspense>} />
        <Route path="leaderboard" element={<Suspense fallback={<PageFallback />}><LeaderboardPage /></Suspense>} />
        <Route path="stats" element={<Suspense fallback={<PageFallback />}><PlayerStatsPage /></Suspense>} />
        <Route path="import-review" element={<Suspense fallback={<PageFallback />}><ImportReviewPage /></Suspense>} />
        <Route path="league" element={<Suspense fallback={<PageFallback />}><LeaguePage /></Suspense>} />
        <Route path="standings" element={<Suspense fallback={<PageFallback />}><StandingsPage /></Suspense>} />
        <Route path="announcements" element={<Suspense fallback={<PageFallback />}><AnnouncementsPage /></Suspense>} />
        <Route path="calculator" element={<Suspense fallback={<PageFallback />}><CalculatorPage /></Suspense>} />
        <Route path="schedule" element={<Suspense fallback={<PageFallback />}><SchedulePage /></Suspense>} />
        <Route path="trades" element={<Suspense fallback={<PageFallback />}><TradesPage /></Suspense>} />
        <Route path="free-agency" element={<Suspense fallback={<PageFallback />}><FreeAgencyPage /></Suspense>} />
        <Route path="salary-cap" element={<Suspense fallback={<PageFallback />}><SalaryCapPage /></Suspense>} />
        <Route path="roster-management" element={<Suspense fallback={<PageFallback />}><RosterManagementPage /></Suspense>} />
        <Route path="injuries" element={<Suspense fallback={<PageFallback />}><InjuriesPage /></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<PageFallback />}><NotificationsPage /></Suspense>} />
        <Route path="admin" element={<Suspense fallback={<PageFallback />}><AdminPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageFallback />}><SettingsPage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense>} />
      </Route>
    </Routes>
  );
}

export default App;
