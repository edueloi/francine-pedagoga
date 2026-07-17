import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SplashScreen from "./components/SplashScreen";
import PublicFormPage from "./components/PublicFormPage";
import PublicAnamnesePage from "./components/PublicAnamnesePage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import AcceptInvitePage from "./components/AcceptInvitePage";
import Dashboard from "./components/Dashboard";
import PatientsModule from "./components/PatientsModule";
import SessionEvolution from "./components/SessionEvolution";
import ReportGeneration from "./components/ReportGeneration";
import PeiModule from "./components/PeiModule";
import ProtocolsModule from "./components/ProtocolsModule";
import SchoolFamilyModule from "./components/SchoolFamilyModule";
import ActivityBankModule from "./components/ActivityBankModule";
import AgendaModule from "./components/AgendaModule";
import InsurancesModule from "./components/InsurancesModule";
import AuditLogModule from "./components/AuditLogModule";
import AbaModule from "./components/AbaModule";
import FormsModule from "./components/FormsModule";
import ClinicSettingsModule from "./components/ClinicSettingsModule";
import ReportsModule from "./components/ReportsModule";
import MyProfilePage from "./components/MyProfilePage";
import { Sidebar } from "./components/Layout/Sidebar";
import { Topbar } from "./components/Layout/Topbar";

import { UserRole, UserPermissions } from "./types";
import { useAuth } from "./contexts/AuthContext";
import { usePatients } from "./hooks/usePatients";
import { useSessions } from "./hooks/useSessions";
import { useInsurances } from "./hooks/useInsurances";
import { useUsers } from "./hooks/useUsers";
import { DEFAULT_ROLE_PERMISSIONS, getActivePermissions } from "./lib/permissions";
import { useDocumentTitle } from "./hooks/useDocumentTitle";

// Maps legacy tab ids (still used inside Dashboard's onNavigate callback) to real routes.
const TAB_TO_PATH: Record<string, string> = {
  dashboard: "/dashboard",
  patients: "/pacientes",
  evolution: "/evolucao",
  pei: "/pei",
  aba: "/aba",
  protocols: "/protocolos",
  forms: "/formularios",
  "school-family": "/escola-familia",
  activities: "/atividades",
  agenda: "/agenda",
  convenios: "/convenios",
  reports: "/relatorios",
  logs: "/auditoria",
};

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pacientes": "Pacientes",
  "/evolucao": "Evolução de Sessão",
  "/pei": "P.E.I.",
  "/aba": "Módulo ABA",
  "/protocolos": "Protocolos Clínicos",
  "/formularios": "Formulários",
  "/escola-familia": "Escola & Família",
  "/atividades": "Banco de Atividades",
  "/agenda": "Agenda",
  "/convenios": "Convênios",
  "/relatorios": "Relatórios",
  "/auditoria": "Auditoria & Usuários",
  "/minha-clinica": "Minha Clínica",
};

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const { patients, setPatients } = usePatients();
  const { sessions, createSession } = useSessions();
  const { insurances, createInsurance, updateInsurance, deleteInsurance } = useInsurances();
  const { users, createUser, updateUser, deleteUser, inviteUser } = useUsers();

  const navigate = useNavigate();
  const location = useLocation();

  useDocumentTitle(PAGE_TITLES[location.pathname]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, UserPermissions>>(
    DEFAULT_ROLE_PERMISSIONS
  );

  const userRole = user?.role ?? UserRole.RESTRICTED;
  const userName = user?.name ?? "";

  const activePermissions = getActivePermissions(rolePermissions, userRole);

  // Patient id passed via router state when navigating from Dashboard -> Pacientes
  const selectedPatientIdForDirectView = (location.state as { selectedPatientId?: string } | null)
    ?.selectedPatientId;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/", { replace: true });
  };

  const handleDashboardNavigate = (tab: string) => {
    const path = TAB_TO_PATH[tab] ?? "/dashboard";
    navigate(path);
  };

  const handleDashboardNavigateToProntuario = (patientId: string) => {
    navigate("/pacientes", { state: { selectedPatientId: patientId } });
  };

  return (
    <div className="h-screen w-screen bg-[#fcfbfa] flex text-slate-800 overflow-hidden">
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
        userName={userName}
        userRole={userRole}
        activePermissions={activePermissions}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <Topbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} user={user} />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={
                <Dashboard
                  patients={patients}
                  sessions={sessions}
                  insurances={insurances}
                  userName={userName}
                  userRole={userRole}
                  onNavigate={handleDashboardNavigate}
                  onSelectPatient={handleDashboardNavigateToProntuario}
                />
              }
            />

            <Route
              path="/pacientes"
              element={
                <PatientsModule
                  patients={patients}
                  userRole={userRole}
                  onUpdatePatients={(updated) => setPatients(updated)}
                  selectedPatientId={selectedPatientIdForDirectView}
                  userPermissions={activePermissions}
                />
              }
            />

            <Route
              path="/evolucao"
              element={
                <SessionEvolution
                  patients={patients}
                  userRole={userRole}
                  onCreateSession={createSession}
                  sessions={sessions}
                  userPermissions={activePermissions}
                />
              }
            />

            <Route
              path="/pei"
              element={<PeiModule patients={patients} userRole={userRole} userPermissions={activePermissions} />}
            />

            <Route
              path="/aba"
              element={<AbaModule patients={patients} userRole={userRole} userPermissions={activePermissions} />}
            />

            <Route
              path="/protocolos"
              element={
                <ProtocolsModule patients={patients} userRole={userRole} userPermissions={activePermissions} />
              }
            />

            <Route
              path="/formularios"
              element={<FormsModule patients={patients} userRole={userRole} userPermissions={activePermissions} />}
            />

            <Route
              path="/escola-familia"
              element={
                <SchoolFamilyModule patients={patients} userRole={userRole} userPermissions={activePermissions} />
              }
            />

            <Route path="/atividades" element={<ActivityBankModule />} />

            <Route
              path="/agenda"
              element={<AgendaModule patients={patients} userRole={userRole} userPermissions={activePermissions} />}
            />

            <Route
              path="/convenios"
              element={
                <InsurancesModule
                  patients={patients}
                  userRole={userRole}
                  insurances={insurances}
                  onCreateInsurance={createInsurance}
                  onUpdateInsurance={updateInsurance}
                  onDeleteInsurance={deleteInsurance}
                  userPermissions={activePermissions}
                />
              }
            />

            <Route
              path="/relatorios"
              element={
                <ReportGeneration patients={patients} userRole={userRole} userPermissions={activePermissions} />
              }
            />

            <Route
              path="/auditoria"
              element={
                <AuditLogModule
                  userRole={userRole}
                  users={users}
                  onCreateUser={createUser}
                  onUpdateUser={updateUser}
                  onDeleteUser={deleteUser}
                  onInviteUser={inviteUser}
                  rolePermissions={rolePermissions}
                  onUpdateRolePermissions={setRolePermissions}
                  userPermissions={activePermissions}
                />
              }
            />

            <Route
              path="/minha-clinica"
              element={<ClinicSettingsModule userRole={userRole} userPermissions={activePermissions} />}
            />

            <Route path="/relatorios-gerenciais" element={<ReportsModule />} />

            <Route path="/meu-perfil" element={<MyProfilePage />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LandingRoute() {
  const navigate = useNavigate();
  return <LandingPage onEnterSystem={() => navigate("/login")} />;
}

function LoginRoute({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const navigate = useNavigate();
  useDocumentTitle("Entrar");
  return <LoginPage onLoginSuccess={onLoginSuccess} onBackToLanding={() => navigate("/")} />;
}

function PublicApp({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/nosso-espaco" element={<LandingRoute />} />
      <Route path="/especialidades" element={<LandingRoute />} />
      <Route path="/francine-tersi" element={<LandingRoute />} />
      <Route path="/agendamento" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute onLoginSuccess={onLoginSuccess} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSuccess = () => {
    setShowSplash(true);
    navigate("/dashboard", { replace: true });
  };

  // Public, no-login form fill-out page — reachable regardless of auth state, and must never
  // redirect to /login or render the authenticated app shell (Sidebar/Topbar).
  if (location.pathname.startsWith("/f/")) {
    return (
      <Routes>
        <Route path="/f/:token" element={<PublicFormPage />} />
      </Routes>
    );
  }

  // Public, no-login anamnese fill-out page — same treatment as /f/:token above: reachable
  // regardless of auth state, never redirects to /login or renders the authenticated shell.
  if (location.pathname.startsWith("/anamnese/")) {
    return (
      <Routes>
        <Route path="/anamnese/:token" element={<PublicAnamnesePage />} />
      </Routes>
    );
  }

  // Public, no-login password-reset page (link sent by e-mail) — same treatment as
  // /f/:token and /anamnese/:token above: reachable regardless of auth state.
  if (location.pathname.startsWith("/reset-senha")) {
    return (
      <Routes>
        <Route path="/reset-senha" element={<ResetPasswordPage />} />
      </Routes>
    );
  }

  // Public, no-login invite-acceptance page (sign-up link sent by e-mail) — same
  // treatment as the routes above: reachable regardless of auth state.
  if (location.pathname.startsWith("/aceitar-convite")) {
    return (
      <Routes>
        <Route path="/aceitar-convite" element={<AcceptInvitePage />} />
      </Routes>
    );
  }

  if (!user) {
    return <PublicApp onLoginSuccess={handleLoginSuccess} />;
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return <AuthenticatedApp />;
}
