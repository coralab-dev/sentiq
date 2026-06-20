"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader, SectionCard } from "@/components/panel";
import { EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import {
  loadQuestionsSettingsData,
  QUESTION_DEFINITIONS,
  saveQuestionsSettingsData,
  validateQuestionValues,
  type QuestionErrors,
  type QuestionField,
  type QuestionsSettingsData,
  type QuestionValues,
} from "./questions-settings-data";

type LoadStatus = "loading" | "success" | "error";

const metricLabels = {
  general_experience: "Experiencia general",
  service_attention: "Atencion recibida",
  food_quality: "Alimentos o bebidas",
  service_speed: "Rapidez del servicio",
} as const;

export function QuestionsSettingsClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [settingsData, setSettingsData] = useState<QuestionsSettingsData | null>(null);
  const [values, setValues] = useState<QuestionValues | null>(null);
  const [errors, setErrors] = useState<QuestionErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadStatus("loading");
    setSaveError(null);

    try {
      const nextData = await loadQuestionsSettingsData(supabase);
      setSettingsData(nextData);
      setValues(nextData.values);
      setErrors({});
      setSaveMessage(null);
      setLoadStatus("success");
    } catch {
      setLoadStatus("error");
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const isDirty = useMemo(() => {
    if (!settingsData || !values) {
      return false;
    }

    return (
      !settingsData.settingsId ||
      QUESTION_DEFINITIONS.some(
        ({ field }) => values[field] !== settingsData.values[field],
      )
    );
  }, [settingsData, values]);

  function updateValue(field: QuestionField, value: string) {
    setValues((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSaveMessage(null);
    setSaveError(null);
  }

  function validateField(field: QuestionField) {
    if (!values) {
      return;
    }

    const nextErrors = validateQuestionValues(values);
    setErrors((current) => {
      const next = { ...current };

      if (nextErrors[field]) {
        next[field] = nextErrors[field];
      } else {
        delete next[field];
      }

      return next;
    });
  }

  async function saveChanges() {
    if (!settingsData || !values || isSaving) {
      return;
    }

    const nextErrors = validateQuestionValues(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSaveMessage(null);
      setSaveError("Completa las cuatro preguntas antes de guardar.");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const nextData = await saveQuestionsSettingsData(
        supabase,
        settingsData,
        values,
      );
      setSettingsData(nextData);
      setValues(nextData.values);
      setSaveMessage("Cambios guardados correctamente.");
    } catch {
      setSaveError(
        "No se pudieron guardar los cambios. Verifica tus permisos e intenta de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loadStatus === "loading") {
    return (
      <LoadingState
        title="Cargando preguntas"
        description="Consultando la configuracion visible para tu restaurante."
      />
    );
  }

  if (loadStatus === "error" || !settingsData || !values) {
    return (
      <EmptyState
        title="No se pudo cargar la configuracion"
        description="Verifica tu sesion y vuelve a intentar."
        icon={<AlertTriangle className="size-6" aria-hidden="true" />}
        action={
          <Button type="button" onClick={() => void loadData()}>
            <RefreshCw aria-hidden="true" />
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuracion"
        title="Configuracion de preguntas"
        description="Edita los textos visibles sin cambiar las metricas internas de la encuesta."
        actions={
          <Link
            href={ROUTES.APP_SETTINGS}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver
          </Link>
        }
      />

      <div className="space-y-4">
        {QUESTION_DEFINITIONS.map(({ field, metric }, index) => {
          const error = errors[field];

          return (
            <SectionCard
              key={field}
              title={`${index + 1}. ${metricLabels[metric]}`}
              actions={<StatusBadge status="pending" label="Obligatoria" />}
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-2">
                  <label
                    htmlFor={field}
                    className="text-sm font-semibold text-slate-950"
                  >
                    Texto visible
                  </label>
                  <textarea
                    id={field}
                    value={values[field]}
                    rows={3}
                    disabled={isSaving}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${field}-error` : `${field}-metric`}
                    onBlur={() => validateField(field)}
                    onChange={(event) => updateValue(field, event.target.value)}
                    className={cn(
                      "w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500",
                      error
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                        : "border-slate-200 focus:border-teal-600 focus:ring-teal-600/15",
                    )}
                  />
                  <p
                    id={`${field}-metric`}
                    className="font-mono text-xs text-slate-500"
                  >
                    Clave interna: {metric}
                  </p>
                  {error ? (
                    <p id={`${field}-error`} className="text-sm font-medium text-red-700">
                      {error}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Vista previa
                  </p>
                  <p className="mt-3 min-h-10 text-sm font-semibold leading-5 text-slate-950">
                    {values[field].trim() || "Escribe el texto de la pregunta."}
                  </p>
                  <div className="mt-4 grid grid-cols-5 gap-2" aria-label="Escala de 1 a 5">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        disabled
                        className="grid aspect-square place-items-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-500"
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

      <div className="sticky bottom-4 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            {saveMessage ? (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {saveMessage}
              </p>
            ) : saveError ? (
              <p className="text-sm font-medium text-red-700">{saveError}</p>
            ) : (
              <p className="text-sm text-slate-500">
                {isDirty ? "Hay cambios sin guardar." : "No hay cambios pendientes."}
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={() => void saveChanges()}
            disabled={isSaving || !isDirty}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
