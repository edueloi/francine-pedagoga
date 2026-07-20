import React from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  Target,
  FileText,
  BookOpen,
  Calendar,
  CreditCard,
  Shield,
  GraduationCap,
  ClipboardList,
  Building2,
  BarChart3,
  Receipt,
} from "lucide-react";
import type { UserPermissions } from "./types";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permissionKey: keyof UserPermissions | null;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Visão Geral",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, permissionKey: null },
    ],
  },
  {
    title: "Clínico",
    items: [
      { label: "Pacientes", path: "/pacientes", icon: Users, permissionKey: "patients" },
      { label: "Evolução de Sessão", path: "/evolucao", icon: Clock, permissionKey: "sessions" },
      { label: "P.E.I. (Plano)", path: "/pei", icon: Target, permissionKey: "pei" },
      { label: "Módulo ABA", path: "/aba", icon: Target, permissionKey: "pei" },
      { label: "Protocolos Clínicos", path: "/protocolos", icon: FileText, permissionKey: "protocols" },
      { label: "Formulários", path: "/formularios", icon: ClipboardList, permissionKey: "forms" },
    ],
  },
  {
    title: "Escola & Agenda",
    items: [
      { label: "Escola & Família", path: "/escola-familia", icon: GraduationCap, permissionKey: "schoolFamily" },
      { label: "Atividades", path: "/atividades", icon: BookOpen, permissionKey: "patients" },
      { label: "Agenda", path: "/agenda", icon: Calendar, permissionKey: "agenda" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Guias & Convênios", path: "/convenios", icon: CreditCard, permissionKey: "insurances" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Serviços e Comandas", path: "/servicos", icon: Receipt, permissionKey: "services" },
    ],
  },
  {
    title: "Documentos",
    items: [
      { label: "Laudos & Relatórios", path: "/relatorios", icon: FileText, permissionKey: "reports" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Minha Clínica", path: "/minha-clinica", icon: Building2, permissionKey: "clinicSettings" },
      { label: "Relatórios Gerenciais", path: "/relatorios-gerenciais", icon: BarChart3, permissionKey: "logs" },
      { label: "Acessos & Segurança", path: "/auditoria", icon: Shield, permissionKey: "logs" },
    ],
  },
];
