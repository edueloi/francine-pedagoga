import { UserRole, UserPermissions } from "../types";

// Default granular permissions matrix per role.
// This is the single source of truth shared by App.tsx (module gating,
// AuditLogModule editable matrix) and Sidebar.tsx (nav item visibility).
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
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
    forms: { ler: true, criar: true, editar: true, excluir: true },
    clinicSettings: { ler: true, criar: true, editar: true, excluir: true },
    services: { ler: true, criar: true, editar: true, excluir: true },
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
    forms: { ler: true, criar: true, editar: true, excluir: false },
    clinicSettings: { ler: true, criar: false, editar: false, excluir: false },
    services: { ler: true, criar: true, editar: true, excluir: false },
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
    forms: { ler: false, criar: false, editar: false, excluir: false },
    clinicSettings: { ler: false, criar: false, editar: false, excluir: false },
    services: { ler: true, criar: true, editar: true, excluir: true },
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
    forms: { ler: false, criar: false, editar: false, excluir: false },
    clinicSettings: { ler: false, criar: false, editar: false, excluir: false },
    services: { ler: false, criar: false, editar: false, excluir: false },
  },
};

export function getActivePermissions(
  rolePermissions: Record<UserRole, UserPermissions>,
  role: UserRole
): UserPermissions {
  return rolePermissions[role] || rolePermissions[UserRole.RESTRICTED];
}
