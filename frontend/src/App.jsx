import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { usePermissions } from './auth/PermissionsContext';
import MaintenancePage from './pages/MaintenancePage';

// Every route below is code-split via React.lazy — each page ships as its
// own chunk, downloaded on first visit instead of all being bundled into
// one multi-megabyte file loaded up front just to show the login screen.
const Institution = lazy(() => import('./pages/Institution'));
const BatchManagement = lazy(() => import('./pages/BatchManagement'));
const EducatorManagement = lazy(() => import('./pages/EducatorManagement'));
const Course = lazy(() => import('./pages/Course'));
const StudentPage = lazy(() => import('./pages/StudentPage'));

const LoginPage = lazy(() => import('./pages/LoginPage'));
const StudentSignupPage = lazy(() => import('./pages/StudentSignupPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const RegisterInstitutionPage = lazy(() => import('./pages/RegisterInstitutionPage'));
const ForgotPasswordPage = lazy(() => import('./auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./auth/VerifyEmailPage'));

const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const EducatorDashboard = lazy(() => import('./pages/EducatorDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentProgress = lazy(() => import('./pages/StudentProgress'));
const StudentCourses = lazy(() => import('./pages/StudentCourses'));
const StudentWorkload = lazy(() => import('./pages/StudentWorkload'));
const BatchChat = lazy(() => import('./pages/BatchChat'));
const DirectMessages = lazy(() => import('./pages/DirectMessages'));
const TimetablePage = lazy(() => import('./pages/TimetablePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const EducatorActivities = lazy(() => import('./pages/EducatorActivities'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));
const Institutions = lazy(() => import('./pages/superadmin/Institutions'));
const Profile = lazy(() => import('./pages/superadmin/Profile'));
const Settings = lazy(() => import('./pages/superadmin/Settings'));
const ManagerManagement = lazy(() => import('./pages/ManagerManagement'));
const Home = lazy(() => import('./pages/Home'));
const RolesPermissions = lazy(() => import('./pages/RolesPermissions'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const Messages = lazy(() => import('./pages/superadmin/Messages'));
const ManagerComplaints = lazy(() => import('./pages/manager/Complaints'));
const ParentPreferences = lazy(() => import('./pages/parent/Preferences'));
const Maintenance = lazy(() => import('./pages/superadmin/Maintenance'));
const OwnerMaintenance = lazy(() => import('./pages/owner/Maintenance'));
const OwnerUsers = lazy(() => import('./pages/owner/Users'));
const Analytics = lazy(() => import('./pages/superadmin/Analytics'));
const SuperAdminRoles = lazy(() => import('./pages/superadmin/Roles'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Announcements = lazy(() => import('./pages/Announcements'));



function App() {
  const { user, platformInfo } = usePermissions();
  const isSuperAdmin = user?.role?.toUpperCase?.() === 'SUPER_ADMIN';
  const isMaintenance = Boolean(platformInfo?.maintenance_mode) && !isSuperAdmin;

  // The real enforcement is the backend's MaintenanceModeMiddleware — this
  // is just so a blocked visitor sees a clean message instead of scattered
  // request failures. /login stays reachable so a SUPER_ADMIN can sign in
  // and turn maintenance mode back off.
  if (isMaintenance && window.location.pathname !== '/login') {
    return <MaintenancePage />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={null}>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
         <Route path="/login" element={<LoginPage />} />
        <Route path="/signup/student" element={<StudentSignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/register-institution" element={<RegisterInstitutionPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />


        {/* DASHBOARD LAYOUT ROUTES */}
        <Route element={<DashboardLayout />}>

          <Route
            path="/dashboard/super-admin"
            element={<SuperAdminDashboard />}
          />

          <Route
            path="/dashboard/manager"
            element={<ManagerDashboard />}
          />

          <Route
            path="/dashboard/educator"
            element={<EducatorDashboard />}
          />

          <Route
            path="/dashboard/student"
            element={<StudentDashboard />}
          />

          <Route
            path="/batch-chat"
            element={<BatchChat />}
          />

          <Route
            path="/messages"
            element={<DirectMessages />}
          />

          <Route
            path="/timetable"
            element={<TimetablePage />}
          />

          <Route path="/dashboard/owner" element={<OwnerDashboard />} />

          <Route
            path="/dashboard/parent"
            element={<ParentDashboard />}
          />

          <Route
            path="/institutions"
            element={<Institution />}
          />

          <Route
            path="/courses"
            element={<Course />}
          />

          <Route
            path="/educators"
            element={<EducatorManagement />}
          />

          <Route
            path="/students"
            element={<StudentPage />}
          />

          <Route
            path="/batches"
            element={<BatchManagement />}
          />

          <Route
            path="/managers"
            element={<ManagerManagement />}
          />

          <Route
            path="/superadmin/institutions"
            element={<Institutions />}
          />

          <Route
            path="/superadmin/profile"
            element={<Profile />}
          />

          <Route
            path="/superadmin/settings"
            element={<Settings />}
          />
          <Route
            path="/profile"
            element={<UserProfile />} />

          <Route path="/roles" element={<RolesPermissions />} />

          <Route path="/progress" element={<StudentProgress />} />

          <Route path="/my-courses" element={<StudentCourses />} />

          <Route path="/workload" element={<StudentWorkload />} />

          <Route path="/calendar" element={<CalendarPage />} />

          <Route path="/educator/activities" element={<EducatorActivities />} />

          <Route path="/help" element={<HelpPage />} />

          <Route path="/superadmin/messages" element={<Messages />} />
          <Route path="/manager/complaints" element={<ManagerComplaints />} />
          <Route path="/parent/preferences" element={<ParentPreferences />} />

          <Route path="/superadmin/maintenance" element={<Maintenance />} />

          <Route path="/owner/maintenance" element={<OwnerMaintenance />} />

          <Route path="/owner/users" element={<OwnerUsers />} />

          <Route path="/superadmin/analytics" element={<Analytics />} />

          <Route path="/superadmin/roles" element={<SuperAdminRoles />} />

          <Route path="/notifications" element={<Notifications />} />

          <Route path="/announcements" element={<Announcements />} />

        </Route>

      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
