"use client";

import { AlertTriangle, LoaderCircle, Pencil, Plus, Power, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog, DataTable, PageHeader, ResponsiveInspector } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { EDGE_FUNCTIONS } from "@/config/edge-functions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CreateManagerUserResponse } from "@/types/edge-functions";

import { buildManagerPayload, getManagerStatusLabel, loadUsersSettingsData, updateManagerStatus, validateManagerDraft, type BranchOption, type ManagerDraft, type ManagerDraftErrors, type ManagerUserItem } from "./users-settings-data";

type Modal = { mode: "create" } | { mode: "edit"; manager: ManagerUserItem };
type Message = { tone: "success" | "error"; text: string };

const EMPTY_DRAFT: ManagerDraft = { fullName: "", email: "", branchIds: [] };
const FUNCTION_ERRORS: Record<string, string> = {
  invalid_payload: "Revisa nombre, email y sucursales.",
  unauthorized: "Tu sesión expiró. Vuelve a iniciar sesión.",
  forbidden: "No tienes permiso para administrar gerentes.",
  branch_not_found: "Una sucursal seleccionada no está disponible.",
  email_conflict: "Ese email ya pertenece a otro usuario o rol.",
  server_error: "No pudimos guardar el gerente. Intenta de nuevo.",
};

export function UsersSettingsClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [managers, setManagers] = useState<ManagerUserItem[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [modal, setModal] = useState<Modal | null>(null);
  const [draft, setDraft] = useState<ManagerDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<ManagerDraftErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [pendingManager, setPendingManager] = useState<ManagerUserItem | null>(null);

  const loadData = useCallback(async (loading = true) => {
    if (loading) setStatus("loading");
    try {
      const data = await loadUsersSettingsData(supabase);
      setManagers(data.managers);
      setBranches(data.branches);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [supabase]);

  useEffect(() => { void loadData(); }, [loadData]);

  const activeBranches = branches.filter((branch) => branch.status === "active");
  const summary = {
    total: managers.length,
    active: managers.filter((manager) => manager.status === "active").length,
    invited: managers.filter((manager) => manager.status === "invited").length,
    inactive: managers.filter((manager) => manager.status === "inactive").length,
  };

  function openCreate() { setDraft(EMPTY_DRAFT); setErrors({}); setModal({ mode: "create" }); setMessage(null); }
  function openEdit(manager: ManagerUserItem) { setDraft({ fullName: manager.fullName, email: manager.email, branchIds: manager.activeBranchIds.filter((id) => activeBranches.some((branch) => branch.id === id)) }); setErrors({}); setModal({ mode: "edit", manager }); setMessage(null); }
  function closeModal() { if (!isSaving) { setModal(null); setDraft(EMPTY_DRAFT); setErrors({}); } }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!modal || isSaving) return;
    const nextErrors = validateManagerDraft(draft, branches);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = buildManagerPayload(draft, modal.mode === "edit" ? modal.manager.email : undefined);
      const { data, error } = await supabase.functions.invoke<CreateManagerUserResponse>(EDGE_FUNCTIONS.CREATE_MANAGER_USER, { body: payload });
      if (error || data?.ok !== true) { const body = await readFunctionError(error); throw new Error(body?.error?.code ?? "server_error"); }
      setModal(null);
      await loadData(false);
      setMessage({ tone: "success", text: modal.mode === "create" ? "Gerente creado correctamente." : "Gerente actualizado correctamente." });
    } catch (error) {
      const code = error instanceof Error ? error.message : "server_error";
      setMessage({ tone: "error", text: FUNCTION_ERRORS[code] ?? FUNCTION_ERRORS.server_error });
    } finally { setIsSaving(false); }
  }

  async function toggle(manager: ManagerUserItem) {
    if (busyId) return;
    setPendingManager(null);
    const next = manager.status === "active" ? "inactive" : "active";
    setBusyId(manager.id);
    setMessage(null);
    try {
      await updateManagerStatus(supabase, manager.id, next);
      await loadData(false);
      setMessage({ tone: "success", text: `Gerente ${next === "active" ? "activado" : "desactivado"}.` });
    } catch {
      setMessage({ tone: "error", text: "No se pudo cambiar el estado del gerente." });
    } finally { setBusyId(null); }
  }

  if (status === "loading") return <LoadingState title="Cargando usuarios" description="Consultando gerentes y sucursales asignadas." />;
  if (status === "error") return <EmptyState title="No se pudieron cargar los usuarios" description="Verifica tu conexión e intenta nuevamente." icon={<AlertTriangle className="size-6" />} action={<Button onClick={() => void loadData()}><RefreshCw />Reintentar</Button>} />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Equipo" title="Usuarios y gerentes" description="Administra quién puede entrar al panel y qué sucursales puede consultar." actions={<Button onClick={openCreate} disabled={!activeBranches.length} className="bg-[var(--sq-aubergine)] text-white hover:bg-[#3c1949]"><Plus />Nuevo gerente</Button>} />
      {message ? <p role="status" className={message.tone === "success" ? "text-sm font-medium text-[var(--sq-olive)]" : "text-sm font-medium text-red-700"}>{message.text}</p> : null}
      <div className="grid overflow-hidden rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)] sm:grid-cols-4">
        {Object.entries(summary).map(([key, value]) => <div key={key} className="border-l border-[var(--sq-line)] p-5 first:border-l-0"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--sq-muted)]">{{ total: "Total", active: "Activos", invited: "Invitados", inactive: "Inactivos" }[key]}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--sq-ink)]">{value}</p></div>)}
      </div>
      <DataTable columns={[{ key: "name", header: "Nombre" }, { key: "email", header: "Email" }, { key: "role", header: "Rol" }, { key: "branches", header: "Sucursales" }, { key: "status", header: "Estado" }]} rows={managers.map((manager) => ({ id: manager.id, cells: { name: <span className="font-medium text-[var(--sq-ink)]">{manager.fullName}</span>, email: manager.email, role: "Gerente", branches: manager.assignedBranches.length ? manager.assignedBranches.map((branch) => branch.name).join(", ") : "Sin sucursales", status: <StatusBadge status={manager.status === "invited" ? "pending" : manager.status} label={getManagerStatusLabel(manager.status)} /> }, actions: <div className="flex justify-end gap-2"><Button variant="ghost" size="icon" aria-label={`Editar ${manager.fullName}`} onClick={() => openEdit(manager)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`${manager.status === "active" ? "Desactivar" : "Activar"} ${manager.fullName}`} disabled={Boolean(busyId)} onClick={() => setPendingManager(manager)}>{busyId === manager.id ? <LoaderCircle className="animate-spin" /> : <Power />}</Button></div> }))} emptyState={<EmptyState title="Aún no hay gerentes" description="Crea el primer gerente y asigna sus sucursales." icon={<Users className="size-6" />} />} actionsHeader="Acciones" />
      {modal ? <ManagerInspector modal={modal} draft={draft} errors={errors} branches={activeBranches} isSaving={isSaving} onChange={setDraft} onClose={closeModal} onSubmit={save} /> : null}
      <ConfirmDialog open={Boolean(pendingManager)} onOpenChange={(open) => { if (!open) setPendingManager(null); }} title={pendingManager?.status === "active" ? "Desactivar gerente" : "Activar gerente"} description={pendingManager?.status === "active" ? "El gerente perderá acceso al panel hasta que sea reactivado." : "El gerente recuperará el acceso a las sucursales asignadas."} confirmLabel={pendingManager?.status === "active" ? "Desactivar" : "Activar"} pending={Boolean(busyId)} onConfirm={() => pendingManager ? toggle(pendingManager) : undefined} />
    </div>
  );
}

function ManagerInspector({ modal, draft, errors, branches, isSaving, onChange, onClose, onSubmit }: { modal: Modal; draft: ManagerDraft; errors: ManagerDraftErrors; branches: BranchOption[]; isSaving: boolean; onChange: React.Dispatch<React.SetStateAction<ManagerDraft>>; onClose: () => void; onSubmit: (event: React.FormEvent) => Promise<void> }) {
  return <ResponsiveInspector open onOpenChange={(open) => { if (!open) onClose(); }} title={modal.mode === "create" ? "Nuevo gerente" : "Editar gerente"} description="Define sus datos y el alcance por sucursal." footer={<div className="flex gap-2"><Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>Cancelar</Button><Button type="submit" form="manager-form" className="flex-1 bg-[var(--sq-aubergine)] text-white hover:bg-[#3c1949]" disabled={isSaving}>{isSaving ? <LoaderCircle className="animate-spin" /> : null}{isSaving ? "Guardando..." : "Guardar"}</Button></div>}><form id="manager-form" className="space-y-5" onSubmit={onSubmit} noValidate><Field label="Nombre" error={errors.fullName}><input autoFocus value={draft.fullName} onChange={(event) => onChange((current) => ({ ...current, fullName: event.target.value }))} disabled={isSaving} className={inputClassName} /></Field><Field label="Email" error={errors.email}><input type="email" value={draft.email} onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))} disabled={isSaving || modal.mode === "edit"} className={inputClassName} /></Field><fieldset><legend className="text-sm font-semibold text-[var(--sq-ink)]">Sucursales</legend><div className="mt-2 grid gap-2">{branches.map((branch) => <label key={branch.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--sq-line)] p-3 text-sm"><input type="checkbox" checked={draft.branchIds.includes(branch.id)} disabled={isSaving} onChange={(event) => onChange((current) => ({ ...current, branchIds: event.target.checked ? [...current.branchIds, branch.id] : current.branchIds.filter((id) => id !== branch.id) }))} />{branch.name}</label>)}</div>{errors.branchIds ? <p className="mt-2 text-xs font-medium text-red-700">{errors.branchIds}</p> : null}</fieldset></form></ResponsiveInspector>;
}

const inputClassName = "h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 text-sm text-[var(--sq-ink)] outline-none focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15 disabled:bg-[var(--sq-soft)]";
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block space-y-2 text-sm font-semibold text-[var(--sq-ink)]"><span>{label}</span>{children}{error ? <span className="block text-xs font-medium text-red-700">{error}</span> : null}</label>; }
async function readFunctionError(error: unknown): Promise<{ error?: { code?: string } } | null> { const context = (error as { context?: { json?: () => Promise<unknown> } })?.context; if (!context?.json) return null; try { return await context.json() as { error?: { code?: string } }; } catch { return null; } }
