import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import DashboardPage from './pages/patient/DashboardPage';
import RecordsPage from './pages/patient/RecordsPage';
import AppointmentsPage from './pages/patient/AppointmentsPage';
import ExportPage from './pages/patient/ExportPage';
import SettingsPage from './pages/patient/SettingsPage';
import ObservationsPage from './pages/patient/ObservationsPage';
import TeleconsultaPage from './pages/patient/TeleconsultaPage';
import WearablesPage from './pages/patient/WearablesPage';
import ConsentManagePage from './pages/patient/ConsentManagePage';
import PatientsPage from './pages/doctor/PatientsPage';
import PatientSummaryPage from './pages/doctor/PatientSummaryPage';
import DoctorConsentPage from './pages/doctor/ConsentPage';
import AgendaPage from './pages/doctor/AgendaPage';

export function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <Navigate to="/doctor/patients" replace />;
  return <Navigate to="/dashboard" replace />;
}

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center text-gray-400">Carregando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireDoctor() {
  const { user } = useAuth();
  if (user?.role !== 'doctor') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function RequirePatient() {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <Navigate to="/doctor/patients" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <RoleRedirect /> },
          {
            element: <RequirePatient />,
            children: [{ path: '/dashboard', element: <DashboardPage /> }],
          },
          { path: '/records', element: <RecordsPage /> },
          { path: '/appointments', element: <AppointmentsPage /> },
          { path: '/observations', element: <ObservationsPage /> },
          { path: '/appointments/:id/room', element: <TeleconsultaPage /> },
          { path: '/wearables', element: <WearablesPage /> },
          { path: '/export', element: <ExportPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/onboarding', element: <OnboardingPage /> },
          { path: '/consent', element: <ConsentManagePage /> },
          {
            element: <RequireDoctor />,
            children: [
              { path: '/doctor/patients', element: <PatientsPage /> },
              { path: '/doctor/patients/:patientId', element: <PatientSummaryPage /> },
              { path: '/doctor/consent', element: <DoctorConsentPage /> },
              { path: '/doctor/agenda', element: <AgendaPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
