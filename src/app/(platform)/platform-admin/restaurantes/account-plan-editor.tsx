"use client";

import { CheckCircle2, Loader2, Pencil, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EDGE_FUNCTIONS } from "@/config/edge-functions";
import { invokeFunction } from "@/lib/supabase/functions";
import type { UpdateRestaurantAccountResponse } from "@/types/edge-functions";
import { Button } from "@/components/ui/button";
import { buildUpdateRestaurantAccountPayload } from "./detalle/restaurant-detail-data";

const planOptions = [
  ["demo", "Demo"],
  ["basico", "Básico"],
  ["pro", "Pro"],
  ["custom", "Custom"],
] as const;

const statusOptions = [
  ["demo", "Demo"],
  ["pilot", "Piloto"],
  ["active", "Activo"],
  ["paused", "Pausado"],
  ["cancelled", "Cancelado"],
] as const;

type Props = {
  restaurantId: string;
  planCode: string | null;
  accountStatus: string | null;
  onSaved?: (account: UpdateRestaurantAccountResponse) => void;
};

export function AccountPlanEditor({ restaurantId, planCode, accountStatus, onSaved }: Props) {
  const initialPlan = useMemo(() => normalizePlan(planCode), [planCode]);
  const initialStatus = useMemo(() => normalizeStatus(accountStatus), [accountStatus]);
  const [editing, setEditing] = useState(false);
  const [plan, setPlan] = useState(initialPlan);
  const [status, setStatus] = useState(initialStatus);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setSaveState("saving");
    try {
      const payload = buildUpdateRestaurantAccountPayload({ restaurantId, planCode: plan, accountStatus: status });
      const response = await invokeFunction<typeof payload, UpdateRestaurantAccountResponse>(EDGE_FUNCTIONS.UPDATE_RESTAURANT_ACCOUNT, payload);
      onSaved?.(response);
      setSaveState("saved");
      setEditing(false);
    } catch {
      setSaveState("error");
    }
  }

  function cancel() {
    setPlan(initialPlan);
    setStatus(initialStatus);
    setSaveState("idle");
    setEditing(false);
  }

  if (!editing) {
    return <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil />Editar plan/estado</Button>
      {saveState === "saved" ? <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2 className="size-4" />Guardado</span> : null}
    </div>;
  }

  return <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm font-medium text-slate-700">Plan
        <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={plan} onChange={(event) => setPlan(event.target.value)}>
          {planOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">Estado de cuenta
        <select className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </div>
    {saveState === "error" ? <p className="text-sm text-red-700">No pudimos actualizar el plan. Conservamos los datos anteriores.</p> : null}
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={() => void save()} disabled={saveState === "saving"}>{saveState === "saving" ? <Loader2 className="animate-spin" /> : null}Guardar</Button>
      <Button type="button" variant="outline" size="sm" onClick={cancel} disabled={saveState === "saving"}><X />Cancelar</Button>
    </div>
  </div>;
}

function normalizePlan(value: string | null): string {
  return value && planOptions.some(([option]) => option === value) ? value : "demo";
}

function normalizeStatus(value: string | null): string {
  return value && statusOptions.some(([option]) => option === value) ? value : "demo";
}
