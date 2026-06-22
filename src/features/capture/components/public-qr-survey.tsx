"use client";

import { Send, Store } from "lucide-react";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  getPublicSurveyConfig,
  PublicSurveyFunctionError,
  submitPublicFeedback,
} from "@/features/capture/api/public-survey";
import { PhoneConsentField } from "@/components/feedback/phone-consent-field";
import { RatingScale } from "@/components/feedback/rating-scale";
import { SurveyQuestion } from "@/components/feedback/survey-question";
import { ThankYouMessage } from "@/components/feedback/thank-you-message";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { getSurveyTheme } from "@/features/capture/survey-theme";
import type { PublicSurveyConfig, RatingValue } from "@/types/domain";

const INVALID_LINK_MESSAGE = "Este enlace no está disponible. Solicita apoyo al restaurante.";
const COMMENT_MAX_LENGTH = 500;
const PHONE_MIN_DIGITS = 8;
const PHONE_MAX_DIGITS = 15;

type PublicQrSurveyProps = {
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

export function PublicQrSurvey({ token }: PublicQrSurveyProps) {
  const [config, setConfig] = useState<PublicSurveyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [configFailed, setConfigFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({
    comment: "",
    customer_phone: "",
    consent_to_contact: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let isActive = true;

    if (!token) {
      setIsLoading(false);
      setConfigFailed(true);
      return;
    }

    setIsLoading(true);
    setConfigFailed(false);

    getPublicSurveyConfig(token, "qr")
      .then((nextConfig) => {
        if (!isActive || nextConfig.source !== "qr") {
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

  const progressText = useMemo(() => {
    const answered = ratingFields.filter(({ key }) => form[key]).length;
    return `${answered} de ${ratingFields.length}`;
  }, [form]);

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState
          title="Preparando encuesta"
          description="Estamos cargando la encuesta del restaurante."
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
        <ThankYouMessage mode="qr" description={config.survey_thank_you_text ?? undefined} className="shadow-sm" />
      </PageShell>
    );
  }

  const activeToken = token;

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
      nextErrors.customer_phone = "Ingresa un telefono valido de 8 a 15 digitos.";
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
        source: "qr",
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <header className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 bg-teal-50 px-4 py-4">
            <RestaurantLogo logoUrl={config.logo_url} restaurantName={config.restaurant_name} />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-teal-950">
                {config.restaurant_name}
              </h1>
              <p className="truncate text-sm font-medium text-slate-600">{config.branch_name}</p>
            </div>
          </div>
          <div className="space-y-4 px-4 py-4">
            <p className="text-sm leading-6 text-slate-700">
              {config.survey_welcome_text ??
                "Gracias por elegirnos. Tu opinión nos ayuda a mejorar cada día."}
            </p>
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

        {ratingFields.map(({ key, getTitle }, index) => (
          <SurveyQuestion
            key={key}
            number={index + 1}
            title={getTitle(config)}
            required
            error={errors[key]}
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

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label htmlFor="comment" className="text-sm font-semibold text-slate-800">
            Comentario opcional
          </label>
          <textarea
            id="comment"
            value={form.comment}
            maxLength={COMMENT_MAX_LENGTH}
            disabled={isSubmitting}
            onChange={(event) => {
              setForm((current) => ({ ...current, comment: event.target.value }));
              setErrors((current) => ({ ...current, comment: undefined, submit: undefined }));
            }}
            className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
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
              setErrors((current) => ({ ...current, consent_to_contact: undefined, submit: undefined }));
            }}
          />
        </section>

        {errors.submit && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.submit}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-12 w-full text-base font-semibold text-white shadow-sm"
          style={{ backgroundColor: getSurveyTheme(config).secondaryColor }}
        >
          <Send className="size-5" aria-hidden="true" />
          {isSubmitting ? "Enviando..." : "Enviar opinión"}
        </Button>

        <p className="px-2 text-center text-xs leading-5 text-slate-500">
          Tu información está segura y será tratada con confidencialidad. Consulta nuestro{" "}
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:py-10">
      <div className="mx-auto w-full max-w-md">{children}</div>
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
        width={48}
        height={48}
        className="size-12 rounded-full border border-teal-200 bg-white object-cover"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-teal-300 bg-white text-teal-700">
      <Store className="size-6" aria-hidden="true" />
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
