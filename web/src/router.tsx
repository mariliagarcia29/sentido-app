import { useState, useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { profileApi } from './api';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import LgpdConsentPage from './pages/auth/LgpdConsentPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import DashboardPage from './pages/patient/DashboardPage';
import RecordsPage from './pages/patient/RecordsPage';
import ScalesPage from './pages/patient/ScalesPage';
import MyCarePlanPage from './pages/patient/MyCarePlanPage';
import ExportPage from './pages/patient/ExportPage';
import SettingsPage from './pages/patient/SettingsPage';
import ObservationsPage from './pages/patient/ObservationsPage';
import ConsentManagePage from './pages/patient/ConsentManagePage';
import DocumentsPage from './pages/patient/DocumentsPage';
import ExamTimelinePage from './pages/patient/ExamTimelinePage';
import MeditationPage from './pages/patient/MeditationPage';
import PatientsPage from './pages/doctor/PatientsPage';
import PatientSummaryPage from './pages/doctor/PatientSummaryPage';
import DoctorConsentPage from './pages/doctor/ConsentPage';
import DoctorDashboardPage from './pages/doctor/DashboardPage';
import IntegrationPage from './pages/doctor/IntegrationPage';
import ClinicDashboardPage from './pages/clinic/DashboardPage';
import TeamPage from './pages/clinic/TeamPage';
import AccessMatrixPage from './pages/clinic/AccessMatrixPage';
import IndicatorsPage from './pages/clinic/IndicatorsPage';
import NimSaudePage from './pages/clinic/NimSaudePage';
import ClinicTermsPage from './pages/clinic/TermsPage';
import InstitutionCodePage from './pages/clinic/InstitutionCodePage';
import BillingPage from './pages/clinic/BillingPage';
import AuditPage from './pages/clinic/AuditPage';
import AiAlertsPage from './pages/doctor/AiAlertsPage';
import AiAuditPage from './pages/doctor/AiAuditPage';
import AiPrinciplesPage from './pages/doctor/AiPrinciplesPage';
import AiCompliancePage from './pages/doctor/AiCompliancePage';
import PreConsultationPage from './pages/doctor/PreConsultationPage';
import DoctorDocumentsPage from './pages/doctor/DoctorDocumentsPage';
import SoapEditorPage from './pages/doctor/SoapEditorPage';
import InboxPage from './pages/doctor/InboxPage';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import ClinicalTimelinePage from './pages/doctor/ClinicalTimelinePage';
import PreConsultationFormPage from './pages/patient/PreConsultationFormPage';
import MessagesPage from './pages/patient/MessagesPage';
import ConsultaEmAndamentoPage from './pages/patient/ConsultaEmAndamentoPage';
import TermsPage from './pages/TermsPage';

export function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  if (user?.role === 'clinic') return <Navigate to="/clinic/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export function RequireClinic() {
  const { user } = useAuth();
  if (user?.role !== 'clinic') return <Navigate to="/" replace />;
  return <Outlet />;
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
  if (user?.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  return <Outlet />;
}

export function RequireLgpdConsent() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center text-gray-400">Carregando…</div>;
  if (!user?.lgpdConsentedAt) return <Navigate to="/lgpd-consent" replace />;
  return <Outlet />;
}

export function RequireAiConsent() {
  const { user } = useAuth();
  if (!user?.aiPrinciplesConsentAt) return <Navigate to="/doctor/ai-principles" replace />;
  return <Outlet />;
}

export function RequireOnboarded() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ok' | 'redirect'>('loading');

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      setStatus('ok');
      return;
    }
    profileApi.get()
      .then(res => setStatus(res.data.onboardingCompleted ? 'ok' : 'redirect'))
      .catch(() => setStatus('ok'));
  }, [user?.id, user?.role]);

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center text-gray-400">Carregando…</div>;
  }
  if (status === 'redirect') return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/terms', element: <TermsPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/lgpd-consent', element: <LgpdConsentPage /> },
      {
        element: <RequireLgpdConsent />,
        children: [
          { path: '/onboarding', element: <OnboardingPage /> },
          {
            element: <RequireOnboarded />,
            children: [{
              element: <AppLayout />,
              children: [
                { path: '/', element: <RoleRedirect /> },
                {
                  element: <RequirePatient />,
                  children: [{ path: '/dashboard', element: <DashboardPage /> }],
                },
                { path: '/records', element: <RecordsPage /> },
                { path: '/scales', element: <ScalesPage /> },
                { path: '/meu-plano', element: <MyCarePlanPage /> },
                { path: '/observations', element: <ObservationsPage /> },
                { path: '/export', element: <ExportPage /> },
                { path: '/settings', element: <SettingsPage /> },
                { path: '/consent', element: <ConsentManagePage /> },
                { path: '/documentos', element: <DocumentsPage /> },
                { path: '/exames', element: <ExamTimelinePage /> },
                { path: '/meditacao', element: <MeditationPage /> },
                { path: '/messages', element: <MessagesPage /> },
                { path: '/pre-consulta', element: <PreConsultationFormPage /> },
                { path: '/consulta-em-andamento', element: <ConsultaEmAndamentoPage /> },
                {
                  element: <RequireDoctor />,
                  children: [
                    { path: '/doctor/dashboard', element: <DoctorDashboardPage /> },
                    { path: '/doctor/patients', element: <PatientsPage /> },
                    { path: '/doctor/patients/:patientId', element: <PatientSummaryPage /> },
                    { path: '/doctor/patients/:patientId/soap', element: <SoapEditorPage /> },
                    { path: '/doctor/patients/:patientId/timeline', element: <ClinicalTimelinePage /> },
                    { path: '/doctor/inbox', element: <InboxPage /> },
                    { path: '/doctor/profile', element: <DoctorProfilePage /> },
                    { path: '/doctor/consent', element: <DoctorConsentPage /> },
                    { path: '/doctor/integrations', element: <IntegrationPage /> },
                    { path: '/doctor/ai-principles', element: <AiPrinciplesPage /> },
                    {
                      element: <RequireAiConsent />,
                      children: [
                        { path: '/doctor/ai-alerts', element: <AiAlertsPage /> },
                        { path: '/doctor/ai-audit', element: <AiAuditPage /> },
                        { path: '/doctor/ai-compliance', element: <AiCompliancePage /> },
                        { path: '/doctor/patients/:patientId/pre-consultation', element: <PreConsultationPage /> },
                        { path: '/doctor/patients/:patientId/documents', element: <DoctorDocumentsPage /> },
                      ],
                    },
                  ],
                },
                {
                  element: <RequireClinic />,
                  children: [
                    { path: '/clinic/dashboard', element: <ClinicDashboardPage /> },
                    { path: '/clinic/team', element: <TeamPage /> },
                    { path: '/clinic/access-matrix', element: <AccessMatrixPage /> },
                    { path: '/clinic/indicators', element: <IndicatorsPage /> },
                    { path: '/clinic/nim-saude', element: <NimSaudePage /> },
                    { path: '/clinic/terms', element: <ClinicTermsPage /> },
                    { path: '/clinic/institution-code', element: <InstitutionCodePage /> },
                    { path: '/clinic/billing', element: <BillingPage /> },
                    { path: '/clinic/audit', element: <AuditPage /> },
                  ],
                },
              ],
            }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
