// ── Interação ──────────────────────────────────────────────────────────────
export { Button, IconButton } from './Button';
export { Modal, ModalFooter, ConfirmModal } from './Modal';
export type { ModalProps } from './Modal';

// ── Formulários ────────────────────────────────────────────────────────────
export { Input, Textarea, Select } from './Input';
export { Switch } from './Switch';
export { DatePicker } from './DatePicker';
export { Calendar } from './Calendar';
export { AgendaPlanner } from './AgendaPlanner';
export type {
  AgendaPlannerView,
  AgendaPlannerEventType,
  AgendaPlannerEventStatus,
  AgendaPlannerEvent,
  AgendaPlannerTask,
  WorkScheduleDay,
  AgendaPlannerProps,
} from './AgendaPlanner';
export { Combobox } from './Combobox';
export { RichTextEditor } from './RichTextEditor';

// ── Feedback ───────────────────────────────────────────────────────────────
export { Toast, ToastProvider, useToast } from './Toast';
export type { ToastType } from './Toast';
export { Badge, StatusBadge, PaymentBadge } from './Badge';

// ── Layout / Estrutura ─────────────────────────────────────────────────────
export { PageWrapper, SectionTitle, StatGrid, ContentCard, FormRow, Divider } from './PageWrapper';
export { PageHeader } from './PageHeader';
export { PanelCard } from './PanelCard';
export { AppCard } from './AppCard';
export { EmptyState } from './EmptyState';
export { ActionDrawer } from './ActionDrawer';
export { StatusAlert } from './StatusAlert';

// ── Dados ──────────────────────────────────────────────────────────────────
export { StatCard } from './StatCard';
export { GridTable } from './GridTable';
export type { Column, GridTableProps } from './GridTable';
export { Pagination, usePagination } from './Pagination';
export type { PaginationProps, UsePaginationReturn } from './Pagination';

// ── Filtros / Toolbar ──────────────────────────────────────────────────────
export {
  FilterLine,
  FilterLineSection,
  FilterLineItem,
  FilterLineGroup,
  FilterLineSegmented,
  FilterLineViewToggle,
  FilterLineSearch,
  FilterLineDateRange,
} from './FilterLine';

// ── Utilitários de edição ──────────────────────────────────────────────────
export { TokenTextarea } from './TokenTextarea';
