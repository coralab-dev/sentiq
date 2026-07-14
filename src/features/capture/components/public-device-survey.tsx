"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { ThankYouMessage } from "@/components/feedback/thank-you-message";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
  getPublicSurveyConfig,
  PublicSurveyFunctionError,
  submitPublicFeedback,
} from "@/features/capture/api/public-survey";
import {
  SurveyFormLayout,
  SurveyPageShell,
  type SurveyFormViewErrors,
  type SurveyFormViewState,
} from "@/features/capture/components/survey-form-layout";
import {
  SURVEY_RATING_FIELDS,
  type SurveyRatingField,
} from "@/features/capture/survey-form-config";
import type { PublicSurveyConfig, RatingValue } from "@/types/domain";

const INVALID_LINK_MESSAGE = "Este enlace no está disponible. Solicita apoyo al restaurante.";
const COMMENT_MAX_LENGTH = 500;
const PHONE_MIN_DIGITS = 8;
const PHONE_MAX_DIGITS = 15;
const RESET_DELAY_MS = 4000;

type PublicDeviceSurveyProps = {
  token: string | null;
};

const INITIAL_FORM: SurveyFormViewState = {
  general_experience: undefined,
  service_attention: undefined,
  food_quality: undefined,
  service_speed: undefined,
  comment: "",
  customer_phone: "",
  consent_to_contact: false,
};

export function PublicDeviceSurvey({ token }: PublicDeviceSurveyProps) {
  const [config, setConfig] = useState<PublicSurveyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [configFailed, setConfigFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<SurveyFormViewState>(INITIAL_FORM);
  const [errors, setErrors] = useState<SurveyFormViewErrors>({});

  const resetSurvey = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setIsSubmitting(false);
    setSubmitted(false);
  }, []);

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
        if (!isActive) return;

        if (nextConfig.source !== "device") {
          setConfigFailed(true);
          return;
        }

        setConfig(nextConfig);
      })
      .catch(() => {
        if (isActive) setConfigFailed(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!submitted) return;

    const timeoutId = window.setTimeout(() => {
      resetSurvey();
    }, RESET_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resetSurvey, submitted]);

  if (isLoading) {
    return (
      <SurveyPageShell>
        <LoadingState
          title="Preparando encuesta"
          description="Estamos cargando la encuesta del dispositivo."
          className="border-[#ded4c7] bg-[#fffdf8]"
        />
      </SurveyPageShell>
    );
  }

  if (configFailed || !config || !token) {
    return (
      <SurveyPageShell>
        <ErrorState
          title="Enlace no disponible"
          description={INVALID_LINK_MESSAGE}
          className="border-[#ded4c7] bg-[#fffdf8]"
        />
      </SurveyPageShell>
    );
  }

  if (submitted) {
    return (
      <SurveyPageShell>
        <ThankYouMessage
          mode="device"
          title="Gracias por tu opinión"
          description={config.survey_thank_you_text ?? undefined}
          actionLabel="Nueva encuesta"
          onAction={resetSurvey}
        />
      </SurveyPageShell>
    );
  }

  const activeToken = token;

  function setRating(field: SurveyRatingField, value: RatingValue) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
  }

  function validateForm(): SurveyFormViewErrors {
    const nextErrors: SurveyFormViewErrors = {};

    for (const { key } of SURVEY_RATING_FIELDS) {
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

    if (Object.keys(validationErrors).length > 0) return;

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
    <SurveyFormLayout
      mode="device"
      config={config}
      values={form}
      errors={errors}
      isSubmitting={isSubmitting}
      submitLabel="Enviar y reiniciar"
      onSubmit={handleSubmit}
      onRatingChange={setRating}
      onCommentChange={(comment) => {
        setForm((current) => ({ ...current, comment }));
        setErrors((current) => ({ ...current, comment: undefined, submit: undefined }));
      }}
      onPhoneChange={(customerPhone) => {
        setForm((current) => ({ ...current, customer_phone: customerPhone }));
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
      onReset={resetSurvey}
    />
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
