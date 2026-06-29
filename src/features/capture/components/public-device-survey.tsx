"use client";

import { MessageSquare, RotateCcw, Send, Smartphone, Store } from "lucide-react";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { PhoneConsentField } from "@/components/feedback/phone-consent-field";
import { RatingScale } from "@/components/feedback/rating-scale";
import { SurveyQuestion } from "@/components/feedback/survey-question";
import { ThankYouMessage } from "@/components/feedback/thank-you-message";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import {
  getPublicSurveyConfig,
  PublicSurveyFunctionError,
  submitPublicFeedback,
} from "@/features/capture/api/public-survey";
import type { PublicSurveyConfig, RatingValue } from "@/types/domain";
import { getSurveyTheme } from "@/features/capture/survey-theme";

const INVALID_LINK_MESSAGE = "Este enlace no está disponible. Solicita apoyo al restaurante.";
const COMMENT_MAX_LENGTH = 500;
const PHONE_MIN_DIGITS = 8;
const PHONE_MAX_DIGITS = 15;
const RESET_DELAY_MS = 4000;

type PublicDeviceSurveyProps = {
  token: string | null;
};

type FormState = {
  general_experience?: RatingValue;
  service_attention?: RatingValue;
  food_quality?: RatingValue;
  service_speed?: RatingValue;
  comment: string;
  customer_phone: string;
  consent_to_contact: boolean;
};

type FormErrors = Partial<Record<keyof FormState | "submit", string>>;

const initialForm: FormState = {
  comment: "",
  customer_phone: "",
  consent_to_contact: false,
};

const ratingFields = [
  {
    key: "general_experience",
    getTitle: (config: PublicSurveyConfig) => config.question_general_text,
  },
  {
    key: "service_attention",
    getTitle: (config: PublicSurveyConfig) => config.question_attention_text,
  },
  {
    key: "food_quality",
    getTitle: (config: PublicSurveyConfig) => config.question_food_text,
  },
  {
    key: "service_speed",
    getTitle: (config: PublicSurveyConfig) => config.question_speed_text,
  },
] as const;

export function PublicDeviceSurvey({ token }: PublicDeviceSurveyProps) {
  const [config, setConfig] = useState<PublicSurveyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [configFailed, setConfigFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setIsLoading(false);
      setConfigFailed(true);
      setConfig(null);
      return;
    }

    setIsLoading(true);
    setConfigFailed(false);
    setConfig(null);

    getPublicSurveyConfig(token, "device")
      .then((nextConfig) => {
        if (!isActive) {
          return;
        }

        if (nextConfig.source !== "device") {
          setConfigFailed(true);
          return;
        }

        setConfig(nextConfig);
      })
      .catch(() => {
        if (isActive) {
          setConfigFailed(true);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!submitted) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resetSurvey();
    }, RESET_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [submitted]);

  const progressText = useMemo(() => {
    const answered = ratingFields.filter(({ key }) => form[key]).length;
    return `${answered} de ${ratingFields.length}`;
  }, [form]);

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState
          title="Preparando encuesta"
          description="Estamos cargando la encuesta del dispositivo."
        />
      </PageShell>
    );
  }

  if (configFailed || !config || !token) {
    return (
      <PageShell>
        <ErrorState
          title="Enlace no disponible"
          description={INVALID_LINK_MESSAGE}
          className="border-slate-200 bg-white"
        />
      </PageShell>
    );
  }

  if (submitted) {
    return (
      <PageShell>
        <ThankYouMessage
          mode="device"
          title="Gracias por tu opinión"
          description={config.survey_thank_you_text ?? undefined}
          actionLabel="Nueva encuesta"
          onAction={resetSurvey}
          className="max-w-xl shadow-sm"
        />
      </PageShell>
    );
  }

  const activeToken = token;

  function resetSurvey() {
    setForm(initialForm);
    setErrors({});
    setIsSubmitting(false);
    setSubmitted(false);
  }

  function setRating(field: (typeof ratingFields)[number]["key"], value: number) {
    setForm((current) => ({ ...current, [field]: value as RatingValue }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
  }

  function validateForm(): FormErrors {
    const nextErrors: FormErrors = {};

    for (const { key } of ratingFields) {
      if (!isRatingValue(form[key])) {
        nextErrors[key] = "Selecciona una calificación del 1 al 5.";
      }
    }

    if (form.comment.length > COMMENT_MAX_LENGTH) {
      nextErrors.comment = "El comentario debe tener máximo 500 caracteres.";
    }

    const normalizedPhone = normalizePhoneDigits(form.customer_phone);

    if (normalizedPhone && !isReasonablePhoneNumber(normalizedPhone)) {
      nextErrors.customer_phone = "Ingresa un teléfono válido de 8 a 15 dígitos.";
    }

    if (normalizedPhone && !form.consent_to_contact) {
      nextErrors.consent_to_contact = "Autoriza el contacto para poder dejar tu teléfono.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitPublicFeedback({
        token: activeToken,
        source: "device",
        general_experience: form.general_experience!,
        service_attention: form.service_attention!,
        food_quality: form.food_quality!,
        service_speed: form.service_speed!,
        comment: form.comment.trim() || null,
        customer_phone: normalizePhoneDigits(form.customer_phone) || null,
        consent_to_contact: normalizePhoneDigits(form.customer_phone)
          ? form.consent_to_contact
          : false,
      });
      setSubmitted(true);
    } catch (error) {
      const status = error instanceof PublicSurveyFunctionError ? error.status : undefined;
      setErrors({
        submit:
          status === 429
            ? "Recibimos varias respuestas recientemente. Intenta de nuevo más tarde."
            : "No pudimos enviar tu opinión. Intenta de nuevo en unos segundos.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm">
          <div className="flex flex-col gap-5 bg-teal-50/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <RestaurantLogo logoUrl={config.logo_url} restaurantName={config.restaurant_name} />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold leading-tight text-teal-950">
                  {config.restaurant_name}
                </h1>
                <p className="mt-1 truncate text-base font-medium text-slate-700">
                  {config.branch_name}
                </p>
                {config.zone_name && (
                  <p className="mt-2 inline-flex rounded-md border border-teal-200 bg-white px-2.5 py-1 text-sm font-semibold text-teal-800">
                    Zona {config.zone_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm font-semibold text-teal-800">
                <Smartphone className="size-4" aria-hidden="true" />
                Modo dispositivo
              </p>
              {config.device_name && (
                <p className="text-sm font-medium text-slate-600">{config.device_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 text-center md:px-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Cuéntanos sobre tu experiencia
              </h2>
              <p className="mt-2 text-base leading-7 text-slate-600">
                {config.survey_welcome_text ??
                  "Tu opinión nos ayuda a seguir mejorando cada día."}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(ratingFields.filter(({ key }) => form[key]).length / ratingFields.length) * 100}%`,
                    backgroundColor: getSurveyTheme(config).primaryColor,
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-teal-800">{progressText}</span>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-4">
          {ratingFields.map(({ key, getTitle }, index) => (
            <SurveyQuestion
              key={key}
              number={index + 1}
              title={getTitle(config)}
              required
              error={errors[key]}
              className="min-w-0"
            >
              <RatingScale
                name={key}
                value={form[key]}
                onChange={(value) => setRating(key, value)}
                disabled={isSubmitting}
                error={errors[key]}
              />
            </SurveyQuestion>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <MessageSquare className="size-5 text-slate-500" aria-hidden="true" />
              <label htmlFor="device-comment" className="text-sm font-semibold text-slate-800">
                Comentario opcional
              </label>
            </div>
            <textarea
              id="device-comment"
              value={form.comment}
              maxLength={COMMENT_MAX_LENGTH}
              disabled={isSubmitting}
              onChange={(event) => {
                setForm((current) => ({ ...current, comment: event.target.value }));
                setErrors((current) => ({ ...current, comment: undefined, submit: undefined }));
              }}
              className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Cuéntanos algo más (opcional)"
            />
            <div className="mt-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-red-600">{errors.comment}</span>
              <span className="ml-auto text-slate-500">
                {form.comment.length}/{COMMENT_MAX_LENGTH}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <PhoneConsentField
              value={form.customer_phone}
              disabled={isSubmitting}
              label="Teléfono para seguimiento (opcional)"
              consentText={config.contact_consent_text}
              consent={form.consent_to_contact}
              error={errors.customer_phone}
              consentError={errors.consent_to_contact}
              onChange={(event) => {
                setForm((current) => ({ ...current, customer_phone: event.target.value }));
                setErrors((current) => ({
                  ...current,
                  customer_phone: undefined,
                  consent_to_contact: undefined,
                  submit: undefined,
                }));
              }}
              onConsentChange={(consent) => {
                setForm((current) => ({ ...current, consent_to_contact: consent }));
                setErrors((current) => ({
                  ...current,
                  consent_to_contact: undefined,
                  submit: undefined,
                }));
              }}
            />
          </section>
        </div>

        {errors.submit && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {errors.submit}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-14 w-full text-lg font-semibold text-white shadow-sm"
          style={{ backgroundColor: getSurveyTheme(config).secondaryColor }}
        >
          <Send className="size-5" aria-hidden="true" />
          {isSubmitting ? "Enviando..." : "Enviar y reiniciar"}
        </Button>

        <div className="flex flex-col items-center justify-center gap-3 px-2 text-center text-sm leading-6 text-slate-500 sm:flex-row">
          <p>Esta pantalla se reiniciará automáticamente después de enviar.</p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 font-medium text-teal-800 underline-offset-4 hover:underline"
            onClick={resetSurvey}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Nueva encuesta
          </button>
        </div>

        <p className="px-2 text-center text-xs leading-5 text-slate-500">
          Consulta nuestro{" "}
          <Link href="/privacidad" className="font-medium text-teal-800 underline-offset-4 hover:underline">
            aviso de privacidad
          </Link>
          .
        </p>
      </form>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  );
}

function RestaurantLogo({
  logoUrl,
  restaurantName,
}: {
  logoUrl: string | null;
  restaurantName: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`Logo de ${restaurantName}`}
        width={64}
        height={64}
        className="size-16 rounded-full border border-teal-200 bg-white object-cover"
      />
    );
  }

  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-teal-300 bg-white text-teal-700">
      <Store className="size-8" aria-hidden="true" />
    </div>
  );
}

function isRatingValue(value: unknown): value is RatingValue {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isReasonablePhoneNumber(phoneDigits: string): boolean {
  return phoneDigits.length >= PHONE_MIN_DIGITS && phoneDigits.length <= PHONE_MAX_DIGITS;
}
