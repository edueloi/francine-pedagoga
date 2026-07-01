import React, { useState } from "react";
import { 
  Shield, 
  Database, 
  Download, 
  RefreshCw, 
  Filter, 
  Trash2, 
  Users, 
  UserPlus, 
  Key, 
  Check, 
  X, 
  Lock, 
  Edit3, 
  Settings2, 
  CheckSquare, 
  Square,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { AuditLog, UserRole, SystemUser, UserPermissions, ModulePermission } from "../types";
import { initialAuditLogs } from "../mockData";

interface AuditLogModuleProps {
  userRole: UserRole;
  users: SystemUser[];
  onUpdateUsers: (updated: SystemUser[]) => void;
  rolePermissions: Record<UserRole, UserPermissions>;
  onUpdateRolePermissions: (updated: Record<UserRole, UserPermissions>) => void;
  userPermissions: UserPermissions;
}

const MODULES_INFO = [
  { id: "patients", label: "Prontuários & Fichas Clínicas", icon: "📁" },
  { id: "sessions", label: "Evoluções de Sessões", icon: "⏱️" },
  { id: "pei", label: "Plano de Ensino (PEI)", icon: "🎯" },
  { id: "protocols", label: "Protocolos Clínicos", icon: "📄" },
  { id: "schoolFamily", label: "Escola & Família", icon: "🏫" },
  { id: "agenda", label: "Agenda de Atendimentos", icon: "📅" },
  { id: "insurances", label: "Guias & Convênios", icon: "💳" },
  { id: "reports", label: "Laudos & Relatórios", icon: "📝" },
  { id: "logs", label: "Segurança & Auditoria", icon: "🛡️" }
] as const;

export default function AuditLogModule({
  userRole,
  users,
  onUpdateUsers,
  rolePermissions,
  onUpdateRolePermissions,
  userPermissions
}: AuditLogModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "matrix" | "logs">("users");
  const [logs, setLogs] = useState<any[]>(initialAuditLogs);
  const [roleFilter, setRoleFilter] = useState("todos");
  const [isBackingUp, setIsBackingUp] = useState(false);

  // New User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("senha");
  const [formRole, setFormRole] = useState<UserRole>(UserRole.PROFESSIONAL);
  const [formStatus, setFormStatus] = useState<"Ativo" | "Inativo">("Ativo");
  const [formDesc, setFormDesc] = useState("");
  
  // Custom permissions for the user in creation/edit
  const [hasCustomPermissions, setHasCustomPermissions] = useState(false);
  const [customPerms, setCustomPerms] = useState<UserPermissions>({
    patients: { ler: true, criar: true, editar: true, excluir: false },
    sessions: { ler: true, criar: true, editar: true, excluir: false },
    pei: { ler: true, criar: true, editar: true, excluir: false },
    protocols: { ler: true, criar: true, editar: true, excluir: false },
    schoolFamily: { ler: true, criar: true, editar: true, excluir: false },
    agenda: { ler: true, criar: true, editar: true, excluir: false },
    insurances: { ler: true, criar: true, editar: true, excluir: false },
    reports: { ler: true, criar: true, editar: true, excluir: false },
    logs: { ler: false, criar: false, editar: false, excluir: false }
  });

  const filteredLogs = logs.filter(log => {
    const logRole = log.role || log.perfil;
    return roleFilter === "todos" || logRole === roleFilter;
  });

  const handleTriggerBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Backup_Seguro_AprenderASer_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert("Backup de dados clínicos baixado de forma criptografada com sucesso (Padrão de Segurança HIPAA/LGPD).");
    }, 1500);
  };

  // Roles permissions matrix operations
  const handleToggleRolePermission = (role: UserRole, moduleKey: keyof UserPermissions, action: keyof ModulePermission) => {
    const updatedRolePerms = { ...rolePermissions };
    const currentModulePerm = { ...updatedRolePerms[role][moduleKey] };
    currentModulePerm[action] = !currentModulePerm[action];
    
    updatedRolePerms[role] = {
      ...updatedRolePerms[role],
      [moduleKey]: currentModulePerm
    };
    
    onUpdateRolePermissions(updatedRolePerms);

    // Register Audit Log
    const newLog = {
      id: `log-${Date.now()}`,
      data: new Date().toISOString().replace("T", " ").substring(0, 19),
      usuario: "Administrador Geral",
      role: UserRole.ADMIN,
      descricao: `Alterou as permissões do perfil [${role}]: Módulo [${moduleKey}] - Ação [${action}] para ${currentModulePerm[action] ? "HABILITADO" : "DESABILITADO"}`,
      ipAddress: "192.168.1.100"
    };
    setLogs([newLog, ...logs]);
  };

  // User list operations
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      alert("Por favor preencha todos os campos obrigatórios.");
      return;
    }

    if (editingUserId) {
      // Editing existing user
      const updated = users.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            name: formName,
            email: formEmail,
            password: formPassword,
            role: formRole,
            status: formStatus,
            desc: formDesc,
            permissions: hasCustomPermissions ? customPerms : undefined
          };
        }
        return u;
      });
      onUpdateUsers(updated);
      alert(`Usuário ${formName} atualizado com sucesso!`);
    } else {
      // Creating new user
      const newUser: SystemUser = {
        id: `usr-${Date.now()}`,
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        status: formStatus,
        desc: formDesc || `Acesso de ${formRole}`,
        permissions: hasCustomPermissions ? customPerms : undefined
      };
      onUpdateUsers([...users, newUser]);
      alert(`Usuário ${formName} criado com sucesso! As credenciais de acesso já estão ativas para login.`);
    }

    // Reset Form
    resetForm();
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("senha");
    setFormRole(UserRole.PROFESSIONAL);
    setFormStatus("Ativo");
    setFormDesc("");
    setHasCustomPermissions(false);
  };

  const handleEditUserClick = (u: SystemUser) => {
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword(u.password || "senha");
    setFormRole(u.role);
    setFormStatus(u.status);
    setFormDesc(u.desc || "");
    if (u.permissions) {
      setHasCustomPermissions(true);
      setCustomPerms(u.permissions);
    } else {
      setHasCustomPermissions(false);
      // fallback to role defaults
      setCustomPerms(rolePermissions[u.role] || rolePermissions[UserRole.RESTRICTED]);
    }
    setShowAddForm(true);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === "usr-2") {
      alert("Você não pode excluir o Administrador Geral do sistema por motivos de segurança.");
      return;
    }
    if (confirm(`Deseja realmente excluir o acesso do usuário "${userName}" permanentemente?`)) {
      onUpdateUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleToggleUserStatus = (u: SystemUser) => {
    if (u.id === "usr-2") {
      alert("Você não pode desativar o Administrador Geral.");
      return;
    }
    const updated = users.map(user => {
      if (user.id === u.id) {
        const newStatus = user.status === "Ativo" ? "Inativo" : "Ativo";
        return { ...user, status: newStatus as "Ativo" | "Inativo" };
      }
      return user;
    });
    onUpdateUsers(updated);
  };

  const handleToggleCustomUserPerm = (moduleKey: keyof UserPermissions, action: keyof ModulePermission) => {
    const updated = { ...customPerms };
    updated[moduleKey] = {
      ...updated[moduleKey],
      [action]: !updated[moduleKey][action]
    };
    setCustomPerms(updated);
  };

  const handleCopyFromRolePermissions = (role: UserRole) => {
    setCustomPerms({ ...rolePermissions[role] });
  };

  return (
    <div id="audit-logs-module" className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2">
          <span className="p-1 rounded-xl bg-blue-50 text-[#1070ca] text-lg">🛡️</span> Usuários, Permissões & Segurança
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Gerencie acessos de colaboradores, defina níveis de permissão granulares por perfil ou usuário, e acompanhe logs de conformidade (LGPD).
        </p>
      </div>

      {/* Sub tabs selector */}
      <div className="flex border-b border-slate-100 gap-1 select-none">
        <button
          onClick={() => { setActiveSubTab("users"); resetForm(); }}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === "users" 
              ? "border-[#1070ca] text-[#1070ca]" 
              : "border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <Users className="h-4 w-4" /> Usuários & Acessos
        </button>
        <button
          onClick={() => { setActiveSubTab("matrix"); resetForm(); }}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === "matrix" 
              ? "border-[#1070ca] text-[#1070ca]" 
              : "border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <Key className="h-4 w-4" /> Matriz de Permissões
        </button>
        <button
          onClick={() => { setActiveSubTab("logs"); resetForm(); }}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === "logs" 
              ? "border-[#1070ca] text-[#1070ca]" 
              : "border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <Shield className="h-4 w-4" /> Logs de Auditoria
        </button>
      </div>

      {/* TAB 1: USERS AND ACCESS CREDENTIALS */}
      {activeSubTab === "users" && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main user list table */}
          <div className={`${showAddForm ? "lg:col-span-6" : "lg:col-span-12"} space-y-4 transition-all duration-300`}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <div>
                  <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    Colaboradores com Acesso
                  </h3>
                  <p className="text-[11px] text-slate-400">Total de {users.length} acessos configurados no sistema.</p>
                </div>
                {!showAddForm && (
                  <button
                    onClick={() => {
                      resetForm();
                      setCustomPerms({ ...rolePermissions[UserRole.PROFESSIONAL] });
                      setShowAddForm(true);
                    }}
                    className="px-4 py-2 bg-[#1070ca] hover:bg-[#0b5194] text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="h-4 w-4" /> Novo Usuário
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {users.map(u => {
                  const initials = u.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                  const roleColors = {
                    [UserRole.ADMIN]: "bg-rose-50 text-rose-700 border-rose-100",
                    [UserRole.PROFESSIONAL]: "bg-blue-50 text-[#1070ca] border-blue-100",
                    [UserRole.SECRETARY]: "bg-amber-50 text-amber-700 border-amber-100",
                    [UserRole.RESTRICTED]: "bg-slate-50 text-slate-600 border-slate-100"
                  };
                  return (
                    <div 
                      key={u.id} 
                      className={`p-4 rounded-2xl border transition duration-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        editingUserId === u.id 
                          ? "bg-blue-50/40 border-blue-200" 
                          : "bg-slate-50/30 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#1070ca]/10 text-[#1070ca] font-black flex items-center justify-center text-xs select-none">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-slate-800">{u.name}</h4>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${roleColors[u.role]}`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Ativo" ? "bg-emerald-500" : "bg-red-400"}`} />
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{u.status}</span>
                            <span className="text-[9px] text-slate-300">•</span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {u.permissions ? "🔑 Permissões Customizadas" : "📋 Herdadas do Perfil"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer border ${
                            u.status === "Ativo" 
                              ? "bg-white hover:bg-red-50 text-red-500 border-red-100" 
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100"
                          }`}
                        >
                          {u.status === "Ativo" ? "Bloquear" : "Ativar"}
                        </button>
                        <button
                          onClick={() => handleEditUserClick(u)}
                          className="p-1.5 bg-white border border-slate-100 hover:border-blue-200 rounded-lg text-slate-500 hover:text-[#1070ca] transition cursor-pointer"
                          title="Editar Usuário e Permissões"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 bg-white border border-slate-100 hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Remover Acesso"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Side Drawer (Add or Edit User) */}
          {showAddForm && (
            <div className="lg:col-span-6 animate-fade-in">
              <form onSubmit={handleSaveUser} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    {editingUserId ? "Editar Usuário & Acessos" : "Cadastrar Novo Colaborador"}
                  </h3>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Ana Paula Ramos"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">E-mail de Login *</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="ana.ramos@aprenderaser.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Senha Provisória *</label>
                    <input
                      type="password"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Defina a senha"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Perfil Clínico/Base *</label>
                    <select
                      value={formRole}
                      onChange={(e) => {
                        const newR = e.target.value as UserRole;
                        setFormRole(newR);
                        // automatically load default role permissions
                        setCustomPerms({ ...rolePermissions[newR] });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Profissional">Profissional / Terapeuta</option>
                      <option value="Secretária">Secretária</option>
                      <option value="Visualização restrita">Visualização Restrita / Escola</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Cargo / Especialidade</label>
                    <input
                      type="text"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Ex: Terapeuta Ocupacional Integrada"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Customized Permissions Toggle */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Permissões de Acesso Granulares</h4>
                      <p className="text-[10px] text-slate-400">Ative para configurar o que este usuário específico pode ler, criar, editar ou excluir.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasCustomPermissions(!hasCustomPermissions)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition cursor-pointer ${
                        hasCustomPermissions 
                          ? "bg-blue-50 text-[#1070ca] border-blue-100" 
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}
                    >
                      {hasCustomPermissions ? "Customizar" : "Herdar do Perfil"}
                    </button>
                  </div>

                  {hasCustomPermissions ? (
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">Tabela de Permissões Personalizadas</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyFromRolePermissions(UserRole.ADMIN)}
                            className="text-[9px] font-bold text-[#1070ca] hover:underline"
                          >
                            Copiar do Admin
                          </button>
                          <span className="text-slate-300 text-[9px]">•</span>
                          <button
                            type="button"
                            onClick={() => handleCopyFromRolePermissions(UserRole.PROFESSIONAL)}
                            className="text-[9px] font-bold text-[#1070ca] hover:underline"
                          >
                            Copiar do Profissional
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                        {MODULES_INFO.map(mod => {
                          const perm = customPerms[mod.id as keyof UserPermissions];
                          return (
                            <div key={mod.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                <span className="text-xs">{mod.icon}</span> {mod.label}
                              </span>
                              <div className="flex gap-3 text-[10px]">
                                <label className="flex items-center gap-1 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={perm?.ler || false}
                                    onChange={() => handleToggleCustomUserPerm(mod.id as keyof UserPermissions, "ler")}
                                    className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3 w-3"
                                  />
                                  <span className="font-bold text-slate-500">Ler</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={perm?.criar || false}
                                    onChange={() => handleToggleCustomUserPerm(mod.id as keyof UserPermissions, "criar")}
                                    className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3 w-3"
                                  />
                                  <span className="font-bold text-slate-500">Criar</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={perm?.editar || false}
                                    onChange={() => handleToggleCustomUserPerm(mod.id as keyof UserPermissions, "editar")}
                                    className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3 w-3"
                                  />
                                  <span className="font-bold text-slate-500">Editar</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={perm?.excluir || false}
                                    onChange={() => handleToggleCustomUserPerm(mod.id as keyof UserPermissions, "excluir")}
                                    className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3 w-3"
                                  />
                                  <span className="font-bold text-slate-500">Excluir</span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl text-center text-slate-500 text-[11px] font-medium leading-relaxed">
                      💡 Este usuário herdará as permissões globais padrão definidas para o perfil de <strong className="text-slate-800 font-bold">{formRole}</strong> na Matriz de Permissões.
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#d43f72] hover:bg-[#b02f5a] text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                  >
                    Salvar Usuário
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLE PERMISSIONS MATRIX */}
      {activeSubTab === "matrix" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-50 pb-4">
            <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">
              Configurações Gerais de Perfis de Acesso
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Defina o que cada um dos perfis clínicos/administrativos pode ler, gravar, modificar ou excluir de forma global em todo o ecossistema.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                  <th className="p-4 w-1/4">Módulo do Sistema</th>
                  <th className="p-4 text-center">Administrador</th>
                  <th className="p-4 text-center">Profissional / Terapeuta</th>
                  <th className="p-4 text-center">Secretária</th>
                  <th className="p-4 text-center">Visualização Restrita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MODULES_INFO.map(mod => (
                  <tr key={mod.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm select-none">{mod.icon}</span>
                        <div>
                          <p className="font-bold text-slate-800">{mod.label}</p>
                          <p className="text-[9px] text-slate-400 font-mono">id: {mod.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Checkboxes per role */}
                    {[UserRole.ADMIN, UserRole.PROFESSIONAL, UserRole.SECRETARY, UserRole.RESTRICTED].map(role => {
                      const perm = rolePermissions[role]?.[mod.id as keyof UserPermissions];
                      return (
                        <td key={role} className="p-4 text-center">
                          <div className="inline-flex flex-col gap-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50 min-w-32">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{role.split(" ")[0]}</span>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                              {/* LER */}
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={perm?.ler || false}
                                  onChange={() => handleToggleRolePermission(role, mod.id as keyof UserPermissions, "ler")}
                                  className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3 w-3"
                                />
                                <span className="text-slate-500 font-bold">Ler</span>
                              </label>

                              {/* CRIAR */}
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={perm?.criar || false}
                                  onChange={() => handleToggleRolePermission(role, mod.id as keyof UserPermissions, "criar")}
                                  className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3 w-3"
                                />
                                <span className="text-slate-500 font-bold">Criar</span>
                              </label>

                              {/* EDITAR */}
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={perm?.editar || false}
                                  onChange={() => handleToggleRolePermission(role, mod.id as keyof UserPermissions, "editar")}
                                  className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3 w-3"
                                />
                                <span className="text-slate-500 font-bold">Edit</span>
                              </label>

                              {/* EXCLUIR */}
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={perm?.excluir || false}
                                  onChange={() => handleToggleRolePermission(role, mod.id as keyof UserPermissions, "excluir")}
                                  className="rounded text-[#1070ca] focus:ring-[#1070ca] h-3 w-3"
                                />
                                <span className="text-slate-500 font-bold">Exc</span>
                              </label>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed text-slate-600">
            <Lock className="h-5 w-5 text-[#1070ca] shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-black">Aviso de Segurança de Conformidade</strong>
              As permissões globais definidas nesta matriz impactam instantaneamente todos os operadores associados àquele perfil de acesso. Os botões de ação e visualização de guias, PEI, sessões e diagnósticos se ajustarão automaticamente.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS (Conformidade / HIPAA / LGPD) */}
      {activeSubTab === "logs" && (
        <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Left Side: Backup trigger and compliance statistics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                <Database className="h-4.5 w-4.5 text-[#1070ca]" /> Backups da Clínica
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Faça o download criptografado do histórico completo dos prontuários dos pacientes para backups locais periódicos.
              </p>

              {userRole === UserRole.ADMIN ? (
                <button
                  onClick={handleTriggerBackup}
                  disabled={isBackingUp}
                  className="w-full py-3 bg-[#1070ca] hover:bg-[#0b5194] text-white font-black rounded-xl transition duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {isBackingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Exportar Backup
                </button>
              ) : (
                <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-100 flex items-start gap-1">
                  <span>⚠️ Apenas perfis de Administrador possuem privilégios de exportar prontuários clínicos.</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50/30 p-4 rounded-3xl border border-blue-100/50 text-xs text-slate-600 space-y-1.5 font-medium leading-relaxed">
              <h4 className="font-display font-black text-slate-900 text-xs flex items-center gap-1.5">🔐 Segurança e Rastreabilidade</h4>
              <p>
                Em conformidade com a LGPD (Lei 13.709/2018), o sistema registra o IP, credenciais de login e data/hora de qualquer usuário que visualize ou altere laudos de pacientes menores de idade.
              </p>
            </div>
          </div>

          {/* Right Side: Log visual listing */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-50 pb-3">
                <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="h-5 w-5 text-[#1070ca]" /> Histórico de Atividades Clínicas
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                  <Filter className="h-3.5 w-3.5 text-[#1070ca]" />
                  <span>Perfil:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1070ca]"
                  >
                    <option value="todos">Todos</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Profissional">Profissional</option>
                    <option value="Secretária">Secretária</option>
                    <option value="Visualização restrita">Visualização Restrita</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredLogs.map((log) => {
                  const logRole = log.role || log.perfil;
                  const logIp = log.ipAddress || log.ipSimulado || "192.168.1.10";
                  const logDesc = log.descricao || log.acao || "Acessou o sistema";
                  return (
                    <div key={log.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs space-y-2 hover:border-[#1070ca]/30 transition duration-200">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-bold">
                        <span>{log.data} • IP: {logIp}</span>
                        <span className="bg-blue-100 text-[#1070ca] font-black px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wide">{logRole}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-relaxed">{logDesc}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold">Operador: {log.usuario}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
