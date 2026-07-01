import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Heart,
  LayoutDashboard,
  Users,
  Clock,
  Target,
  FileText,
  BookOpen,
  Calendar,
  CreditCard,
  Shield,
  LogOut,
  Menu,
  X,
  User,
  GraduationCap
} from "lucide-react";
import LandingPage, { LogoSVG } from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
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

import { UserRole, Patient, Session, Insurance, SystemUser, UserPermissions } from "./types";
import { initialPatients, initialSessions, initialInsurances } from "./mockData";

export default function App() {
  // Navigation States
  const [screen, setScreen] = useState<"landing" | "login" | "app">("login");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authenticated User State
  const [userRole, setUserRole] = useState<UserRole>(UserRole.PROFESSIONAL);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Francine Maria Tersi");

  // System users list with passwords and active statuses (allowing dynamic addition and login)
  const [users, setUsers] = useState<SystemUser[]>([
    {
      id: "usr-1",
      name: "Francine Maria Tersi",
      email: "francine.tersi@aprenderaser.com",
      password: "senha",
      role: UserRole.PROFESSIONAL,
      status: "Ativo",
      desc: "Acesso Total Clínico & Gestão"
    },
    {
      id: "usr-2",
      name: "Administrador Geral",
      email: "adm.geral@aprenderaser.com",
      password: "senha",
      role: UserRole.ADMIN,
      status: "Ativo",
      desc: "Gestão Financeira & Usuários"
    },
    {
      id: "usr-3",
      name: "Luciana Fonseca",
      email: "secretaria.luciana@aprenderaser.com",
      password: "senha",
      role: UserRole.SECRETARY,
      status: "Ativo",
      desc: "Acesso à Agenda & Cadastros"
    },
    {
      id: "usr-4",
      name: "Mediadora Escolar",
      email: "escola.alinhamento@aprenderaser.com",
      password: "senha",
      role: UserRole.RESTRICTED,
      status: "Ativo",
      desc: "Visualização do P.E.I."
    }
  ]);

  // Roles global permissions matrix
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, UserPermissions>>({
    [UserRole.ADMIN]: {
      patients: { ler: true, criar: true, editar: true, excluir: true },
      sessions: { ler: true, criar: true, editar: true, excluir: true },
      pei: { ler: true, criar: true, editar: true, excluir: true },
      protocols: { ler: true, criar: true, editar: true, excluir: true },
      schoolFamily: { ler: true, criar: true, editar: true, excluir: true },
      agenda: { ler: true, criar: true, editar: true, excluir: true },
      insurances: { ler: true, criar: true, editar: true, excluir: true },
      reports: { ler: true, criar: true, editar: true, excluir: true },
      logs: { ler: true, criar: true, editar: true, excluir: true },
    },
    [UserRole.PROFESSIONAL]: {
      patients: { ler: true, criar: true, editar: true, excluir: false },
      sessions: { ler: true, criar: true, editar: true, excluir: false },
      pei: { ler: true, criar: true, editar: true, excluir: false },
      protocols: { ler: true, criar: true, editar: true, excluir: false },
      schoolFamily: { ler: true, criar: true, editar: true, excluir: false },
      agenda: { ler: true, criar: true, editar: true, excluir: false },
      insurances: { ler: true, criar: true, editar: true, excluir: false },
      reports: { ler: true, criar: true, editar: true, excluir: false },
      logs: { ler: false, criar: false, editar: false, excluir: false },
    },
    [UserRole.SECRETARY]: {
      patients: { ler: true, criar: true, editar: true, excluir: false },
      sessions: { ler: false, criar: false, editar: false, excluir: false },
      pei: { ler: false, criar: false, editar: false, excluir: false },
      protocols: { ler: false, criar: false, editar: false, excluir: false },
      schoolFamily: { ler: false, criar: false, editar: false, excluir: false },
      agenda: { ler: true, criar: true, editar: true, excluir: true },
      insurances: { ler: true, criar: true, editar: true, excluir: true },
      reports: { ler: false, criar: false, editar: false, excluir: false },
      logs: { ler: false, criar: false, editar: false, excluir: false },
    },
    [UserRole.RESTRICTED]: {
      patients: { ler: true, criar: false, editar: false, excluir: false },
      sessions: { ler: false, criar: false, editar: false, excluir: false },
      pei: { ler: true, criar: false, editar: false, excluir: false },
      protocols: { ler: true, criar: false, editar: false, excluir: false },
      schoolFamily: { ler: true, criar: false, editar: false, excluir: false },
      agenda: { ler: false, criar: false, editar: false, excluir: false },
      insurances: { ler: false, criar: false, editar: false, excluir: false },
      reports: { ler: false, criar: false, editar: false, excluir: false },
      logs: { ler: false, criar: false, editar: false, excluir: false },
    }
  });

  // Compute permissions for logged-in operator
  const currentUser = users.find(u => u.email === userEmail) || users.find(u => u.role === userRole) || users[0];
  const activePermissions = currentUser?.permissions || rolePermissions[userRole] || rolePermissions[UserRole.RESTRICTED];

  // Synchronized Core Clinical States (allowing real-time updates within the mock database)
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [insurances, setInsurances] = useState<Insurance[]>(initialInsurances);

  // Cross-navigation auxiliary patient selector state
  const [selectedPatientIdForDirectView, setSelectedPatientIdForDirectView] = useState<string | undefined>(undefined);

  const handleLoginSuccess = (role: UserRole, email: string, name: string) => {
    setUserRole(role);
    setUserEmail(email);
    setUserName(name);
    setScreen("app");
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setScreen("login");
    setMobileMenuOpen(false);
  };

  // Sidebar Menu configuration based on dynamic granular permissions
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, permissionKey: null },
    { id: "patients", label: "Prontuários", icon: Users, permissionKey: "patients" },
    { id: "evolution", label: "Evolução de Sessão", icon: Clock, permissionKey: "sessions" },
    { id: "pei", label: "P.E.I. (Plano)", icon: Target, permissionKey: "pei" },
    { id: "aba", label: "Módulo ABA", icon: Target, permissionKey: "pei" },
    { id: "protocols", label: "Protocolos Clínicos", icon: FileText, permissionKey: "protocols" },
    { id: "school-family", label: "Escola & Família", icon: GraduationCap, permissionKey: "schoolFamily" },
    { id: "activities", label: "Atividades", icon: BookOpen, permissionKey: "patients" },
    { id: "agenda", label: "Agenda", icon: Calendar, permissionKey: "agenda" },
    { id: "convenios", label: "Guias & Convênios", icon: CreditCard, permissionKey: "insurances" },
    { id: "reports", label: "Laudos & Relatórios", icon: FileText, permissionKey: "reports" },
    { id: "logs", label: "Acessos & Segurança", icon: Shield, permissionKey: "logs" }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permissionKey) return true;
    const key = item.permissionKey as keyof UserPermissions;
    return activePermissions[key]?.ler;
  });

  const handleDashboardNavigateToProntuario = (patientId: string) => {
    setSelectedPatientIdForDirectView(patientId);
    setActiveTab("patients");
  };

  if (screen === "landing") {
    return <LandingPage onEnterSystem={() => setScreen("login")} />;
  }

  if (screen === "login") {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setScreen("landing")}
        users={users}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#fcfbfa] flex text-slate-800 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 h-screen bg-white border-r border-slate-100 shadow-sm shrink-0 select-none">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="h-14 w-16 flex items-center justify-center shrink-0">
            <LogoSVG className="h-full w-full" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-tight">
              Espaço <span className="text-[#1070ca]">Aprender a Ser</span>
            </h1>
            <p className="text-[9px] text-[#ebb448] mt-0.5 uppercase tracking-wider font-mono font-black">CLÍNICA MULTI</p>
          </div>
        </div>

        {/* User profile widget inside sidebar */}
        <div className="p-5 bg-blue-50/30 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 text-[#1070ca] flex items-center justify-center font-black">
            {userName.charAt(0)}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-slate-800 truncate">{userName}</h4>
            <span className="inline-block text-[9px] bg-[#1070ca]/10 text-[#1070ca] font-black px-1.5 py-0.5 rounded mt-0.5 font-mono uppercase border border-[#1070ca]/15">
              {userRole}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== "patients") {
                    setSelectedPatientIdForDirectView(undefined); // Clean selector for others
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-[#1070ca] text-white shadow-sm shadow-blue-500/10"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <IconComponent className={`h-4.5 w-4.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Desconectar / Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header / Navbar Drawer */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="sticky top-0 z-30 lg:hidden bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between shadow-sm select-none shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-10 w-12 flex items-center justify-center shrink-0">
              <LogoSVG className="h-full w-full" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-tight">
                Espaço <span className="text-[#1070ca]">Aprender a Ser</span>
              </h1>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-500 hover:text-[#1070ca] cursor-pointer rounded-lg hover:bg-slate-50"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile menu navigation panel */}
        {mobileMenuOpen && (
          <div className="absolute top-[65px] left-0 right-0 lg:hidden bg-white border-b border-slate-100 p-4 space-y-1 z-30 shadow-lg max-h-[calc(100vh-65px)] overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const IconComponent = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isSelected ? "bg-[#1070ca] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <IconComponent className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition cursor-pointer pt-3 border-t border-slate-100"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Desconectar / Sair</span>
            </button>
          </div>
        )}

        {/* Master Content Stage Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === "dashboard" && (
            <Dashboard
              patients={patients}
              sessions={sessions}
              insurances={insurances}
              userName={userName}
              userRole={userRole}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectPatient={handleDashboardNavigateToProntuario}
            />
          )}

          {activeTab === "patients" && (
            <PatientsModule
              patients={patients}
              userRole={userRole}
              onUpdatePatients={(updated) => setPatients(updated)}
              selectedPatientId={selectedPatientIdForDirectView}
              userPermissions={activePermissions}
            />
          )}

          {activeTab === "evolution" && (
            <SessionEvolution
              patients={patients}
              userRole={userRole}
              onUpdateSessions={(updated) => setSessions(updated)}
              sessions={sessions}
              userPermissions={activePermissions}
            />
          )}

          {activeTab === "pei" && (
            <PeiModule patients={patients} userRole={userRole} userPermissions={activePermissions} />
          )}

          {activeTab === "aba" && (
            <AbaModule patients={patients} userRole={userRole} userPermissions={activePermissions} />
          )}

          {activeTab === "protocols" && (
            <ProtocolsModule patients={patients} userRole={userRole} userPermissions={activePermissions} />
          )}

          {activeTab === "school-family" && (
            <SchoolFamilyModule patients={patients} userRole={userRole} userPermissions={activePermissions} />
          )}

          {activeTab === "activities" && (
            <ActivityBankModule />
          )}

          {activeTab === "agenda" && (
            <AgendaModule patients={patients} userRole={userRole} userPermissions={activePermissions} />
          )}

          {activeTab === "convenios" && (
            <InsurancesModule patients={patients} userRole={userRole} userPermissions={activePermissions} />
          )}

          {activeTab === "reports" && (
            <ReportGeneration patients={patients} userRole={userRole} userPermissions={activePermissions} />
          )}

          {activeTab === "logs" && (
            <AuditLogModule 
              userRole={userRole} 
              users={users}
              onUpdateUsers={setUsers}
              rolePermissions={rolePermissions}
              onUpdateRolePermissions={setRolePermissions}
              userPermissions={activePermissions}
            />
          )}
        </main>
      </div>
    </div>
  );
}
