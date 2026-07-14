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
  getSettingsValidationMessage,
  QUESTION_DEFINITIONS,
  saveQuestionsSettingsData,
  validateQuestionValues,
  validateSurveyVisualValues,
  type QuestionErrors,
  type QuestionField,
  type QuestionsSettingsData,
  type QuestionValues,
  type SurveyVisualValues,
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
  const [visuals, setVisuals] = useState<SurveyVisualValues | null>(null);
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
      setVisuals(nextData.visuals);
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
    if (!settingsData || !values || !visuals) {
      return false;
    }

    return (
      !settingsData.settingsId ||
      QUESTION_DEFINITIONS.some(
        ({ field }) => values[field] !== settingsData.values[field],
      ) || Object.keys(visuals).some((field) => visuals[field as keyof SurveyVisualValues] !== settingsData.visuals[field as keyof SurveyVisualValues])
    );
  }, [settingsData, values, visuals]);

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
    if (!settingsData || !values || !visuals || isSaving) {
      return;
    }

    const nextErrors = validateQuestionValues(values);
    const visualErrors = validateSurveyVisualValues(visuals);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || Object.keys(visualErrors).length > 0) {
      setSaveMessage(null);
      setSaveError(getSettingsValidationMessage(nextErrors, visualErrors));
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
        visuals,
      );
      setSettingsData(nextData);
      setValues(nextData.values);
      setVisuals(nextData.visuals);
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

  if (loadStatus === "error" || !settingsData || !values || !visuals) {
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
        eyebrow="Restaurante"
        title="ConfiguraciÃ³n de encuesta"
        description="Ajusta los textos y preguntas que verán tus clientes durante la captura."
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
        <SectionCard title="Branding bÃ¡sico">
          <div className="grid gap-4 md:grid-cols-3">
            {(["logo_url", "primary_color", "secondary_color"] as const).map((field) => (
              <label key={field} className="space-y-2 text-sm font-semibold text-slate-900">
                {field === "logo_url" ? "Logo URL (https://)" : field === "primary_color" ? "Color principal" : "Color secundario"}
                <input type={field === "logo_url" ? "url" : "color"} value={visuals[field]} onChange={(e) => setVisuals({ ...visuals, [field]: e.target.value })} className="h-11 w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] px-3 outline-none focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15" />
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Textos de experiencia">
          <div className="grid gap-4 lg:grid-cols-3">
            {(["survey_welcome_text", "survey_thank_you_text", "contact_consent_text"] as const).map((field) => (
              <label key={field} className="space-y-2 text-sm font-semibold text-slate-900">
                {field === "survey_welcome_text" ? "Bienvenida" : field === "survey_thank_you_text" ? "Agradecimiento" : "Consentimiento"}
                <textarea rows={4} value={visuals[field]} onChange={(e) => setVisuals({ ...visuals, [field]: e.target.value })} className="w-full rounded-xl border border-[var(--sq-line)] bg-[var(--sq-surface)] p-3 font-normal outline-none focus:border-[var(--sq-coral)] focus:ring-2 focus:ring-[var(--sq-coral)]/15" />
              </label>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Preguntas base</h2>
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
                          : "border-[var(--sq-line)] focus:border-[var(--sq-coral)] focus:ring-[var(--sq-coral)]/15",
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
        </div>
          <div className="xl:sticky xl:top-28"><SectionCard title="Vista previa">
        <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="p-5 text-white" style={{ backgroundColor: visuals.primary_color }}>
            {visuals.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={visuals.logo_url} alt="Logo" className="mb-3 size-12 rounded-full bg-white object-cover" />
            ) : null}
            <p>{visuals.survey_welcome_text}</p>
          </div>
          <div className="space-y-3 p-5">{QUESTION_DEFINITIONS.map(({ field }, i) => <p key={field} className="text-sm font-semibold">{i + 1}. {values[field]}</p>)}<p className="text-xs text-slate-500">{visuals.contact_consent_text}</p><button type="button" className="w-full rounded-lg p-3 font-semibold text-white" style={{ backgroundColor: visuals.secondary_color }}>Enviar respuesta</button><p className="text-center text-sm">{visuals.survey_thank_you_text}</p></div>
        </div>
          </SectionCard></div>
      </div>

      <div className="sticky bottom-4 z-20 rounded-2xl border border-[var(--sq-line)] bg-[var(--sq-surface)]/95 p-4 shadow-xl backdrop-blur">
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
            className="bg-[var(--sq-aubergine)] px-4 text-white hover:bg-[#3c1949]"
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
