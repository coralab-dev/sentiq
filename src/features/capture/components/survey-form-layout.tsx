"use client";

import {
  MapPin,
  MessageSquareText,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Store,
} from "lucide-react";
import Link from "next/link";
import type {
  CSSProperties,
  FormEventHandler,
  ReactNode,
} from "react";

import { PhoneConsentField } from "@/components/feedback/phone-consent-field";
import { RatingScale } from "@/components/feedback/rating-scale";
import { SurveyQuestion } from "@/components/feedback/survey-question";
import { Button } from "@/components/ui/button";
import {
  SURVEY_RATING_FIELDS,
  type SurveyRatingField,
} from "@/features/capture/survey-form-config";
import { getSurveyTheme } from "@/features/capture/survey-theme";
import type { PublicSurveyConfig, RatingValue } from "@/types/domain";

const COMMENT_MAX_LENGTH = 500;

export type SurveyFormViewState = Record<
  SurveyRatingField,
  RatingValue | undefined
> & {
  comment: string;
  customer_phone: string;
  consent_to_contact: boolean;
};

export type SurveyFormViewErrors = Partial<
  Record<SurveyRatingField | "comment" | "customer_phone" | "consent_to_contact" | "submit", string>
>;

type SurveyFormLayoutProps = {
  mode: "qr" | "device";
  config: PublicSurveyConfig;
  values: SurveyFormViewState;
  errors: SurveyFormViewErrors;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onRatingChange: (field: SurveyRatingField, value: RatingValue) => void;
  onCommentChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onConsentChange: (consent: boolean) => void;
  onReset?: () => void;
};

export function SurveyFormLayout({
  mode,
  config,
  values,
  errors,
  isSubmitting,
  submitLabel,
  onSubmit,
  onRatingChange,
  onCommentChange,
  onPhoneChange,
  onConsentChange,
  onReset,
}: SurveyFormLayoutProps) {
  const theme = getSurveyTheme(config);
  const answeredCount = SURVEY_RATING_FIELDS.filter(({ key }) => values[key]).length;
  const progress = (answeredCount / SURVEY_RATING_FIELDS.length) * 100;
  const style = {
    "--survey-accent": theme.primaryColor,
    "--survey-action": theme.secondaryColor,
  } as CSSProperties;

  return (
    <SurveyPageShell style={style}>
      <form onSubmit={onSubmit} noValidate className="space-y-4 sm:space-y-5">
        <SurveyIdentityHeader
          mode={mode}
          config={config}
          answeredCount={answeredCount}
          progress={progress}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {SURVEY_RATING_FIELDS.map(({ key, configKey }, index) => (
            <SurveyQuestion
              key={key}
              number={index + 1}
              title={config[configKey]}
              required
              error={errors[key]}
            >
              <RatingScale
                name={key}
                value={values[key]}
                onChange={(value) => onRatingChange(key, value as RatingValue)}
                disabled={isSubmitting}
                error={errors[key]}
              />
            </SurveyQuestion>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#ded4c7] bg-[#fffdf8] p-4 shadow-[0_1px_2px_rgba(43,18,53,0.05)] sm:p-5">
            <div className="mb-3 flex items-center gap-2.5 text-[#2b1235]">
              <MessageSquareText className="size-5 text-[#69723a]" aria-hidden="true" />
              <label htmlFor="survey-comment" className="text-sm font-semibold">
                Comentario opcional
              </label>
            </div>
            <textarea
              id="survey-comment"
              value={values.comment}
              maxLength={COMMENT_MAX_LENGTH}
              disabled={isSubmitting}
              onChange={(event) => onCommentChange(event.target.value)}
              className="min-h-32 w-full resize-y rounded-xl border border-[#d8cdbf] bg-white p-3 text-sm text-[#2b1235] shadow-sm transition placeholder:text-[#8a808b] focus-visible:border-[var(--survey-accent)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--survey-accent)]/15 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Cuéntanos algo más (opcional)"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-red-700">{errors.comment}</span>
              <span className="ml-auto text-[#756b77]">
                {values.comment.length}/{COMMENT_MAX_LENGTH}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-[#ded4c7] bg-[#fffdf8] p-4 shadow-[0_1px_2px_rgba(43,18,53,0.05)] sm:p-5">
            <PhoneConsentField
              id="survey-phone"
              value={values.customer_phone}
              disabled={isSubmitting}
              label="Teléfono para seguimiento (opcional)"
              consentText={config.contact_consent_text}
              consent={values.consent_to_contact}
              error={errors.customer_phone}
              consentError={errors.consent_to_contact}
              onChange={(event) => onPhoneChange(event.target.value)}
              onConsentChange={onConsentChange}
            />
          </section>
        </div>

        {errors.submit ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {errors.submit}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="min-h-14 w-full rounded-xl border-0 text-base font-semibold text-white shadow-[0_8px_20px_rgba(43,18,53,0.12)] transition hover:brightness-95 sm:text-lg"
          style={{ backgroundColor: theme.secondaryColor }}
        >
          <Send className="size-5" aria-hidden="true" />
          {isSubmitting ? "Enviando..." : submitLabel}
        </Button>

        {mode === "device" && onReset ? (
          <div className="flex flex-col items-center justify-center gap-2 px-2 text-center text-sm leading-6 text-[#756b77] sm:flex-row sm:gap-3">
            <p>La encuesta se reiniciará automáticamente en unos segundos.</p>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-[#2b1235] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--survey-accent)]"
              onClick={onReset}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Nueva encuesta
            </button>
          </div>
        ) : null}

        <p className="flex items-center justify-center gap-1.5 px-2 text-center text-xs leading-5 text-[#756b77]">
          <ShieldCheck className="size-4 text-[#69723a]" aria-hidden="true" />
          Consulta nuestro
          <Link
            href="/privacidad"
            className="font-semibold text-[#2b1235] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--survey-accent)]"
          >
            aviso de privacidad
          </Link>
          .
        </p>
      </form>
    </SurveyPageShell>
  );
}

export function SurveyPageShell({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <main
      style={style}
      className="min-h-screen overflow-x-hidden bg-[#fbf7ef] px-3 py-4 font-sans text-[#2b1235] sm:px-6 sm:py-7 lg:px-8 lg:py-9"
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  );
}

function SurveyIdentityHeader({
  mode,
  config,
  answeredCount,
  progress,
}: {
  mode: "qr" | "device";
  config: PublicSurveyConfig;
  answeredCount: number;
  progress: number;
}) {
  return (
    <header className="overflow-hidden rounded-2xl border border-[#ded4c7] bg-[#fffdf8] shadow-[0_2px_8px_rgba(43,18,53,0.05)]">
      <div className="flex flex-col gap-4 border-b border-[#e7ded3] px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <RestaurantLogo logoUrl={config.logo_url} restaurantName={config.restaurant_name} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-[-0.025em] text-[#2b1235] sm:text-2xl">
              {config.restaurant_name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#685f6b] sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-[#69723a]" aria-hidden="true" />
                {config.branch_name}
              </span>
              {config.zone_name ? (
                <span className="inline-flex items-center gap-1.5 border-l border-[#d8cdbf] pl-3 text-[#59622f]">
                  {config.zone_name}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {mode === "device" ? (
          <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-end md:gap-1">
            <p className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d8cdbf] bg-white px-3 text-sm font-semibold text-[#2b1235]">
              <Smartphone className="size-4 text-[#69723a]" aria-hidden="true" />
              Modo dispositivo
            </p>
            {config.device_name ? (
              <p className="truncate text-xs font-medium text-[#756b77] sm:text-sm">
                {config.device_name}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="px-4 py-5 text-center sm:px-6 sm:py-7 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#2b1235] sm:text-3xl">
          Cuéntanos sobre tu experiencia
        </h2>
        <div className="mx-auto my-3 flex w-28 items-center gap-2 text-[#69723a]" aria-hidden="true">
          <span className="h-px flex-1 bg-[#cfc3b4]" />
          <span className="size-1.5 rotate-45 bg-current" />
          <span className="h-px flex-1 bg-[#cfc3b4]" />
        </div>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-[#685f6b] sm:text-base">
          {config.survey_welcome_text ??
            "Gracias por visitarnos. Tu opinión nos ayuda a mejorar cada día."}
        </p>
        <div className="mt-5 flex items-center gap-3 sm:gap-4">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7dfd5]"
            role="progressbar"
            aria-label="Progreso de la encuesta"
            aria-valuemin={0}
            aria-valuemax={SURVEY_RATING_FIELDS.length}
            aria-valuenow={answeredCount}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progress}%`, backgroundColor: "var(--survey-accent)" }}
            />
          </div>
          <span className="shrink-0 text-sm font-semibold text-[#59622f]">
            {answeredCount} de {SURVEY_RATING_FIELDS.length}
          </span>
        </div>
      </div>
    </header>
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
        className="size-12 shrink-0 rounded-full border border-[#d8cdbf] bg-white object-cover sm:size-16"
      />
    );
  }

  return (
    <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#2b1235] text-[#fffdf8] sm:size-16">
      <Store className="size-6 sm:size-8" aria-hidden="true" />
    </div>
  );
}
