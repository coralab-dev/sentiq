"use client";

import { Check, Phone } from "lucide-react";
import type { ChangeEvent, InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type PhoneConsentFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  helperText?: string;
  error?: string;
  consentText: string;
  consent: boolean;
  onConsentChange: (consent: boolean) => void;
  consentError?: string;
};

export function PhoneConsentField({
  label = "Teléfono para seguimiento",
  helperText = "Opcional. Si lo compartes y autorizas el contacto, el restaurante podrá usarlo solo para dar seguimiento a tu comentario.",
  error,
  consentText,
  consent,
  onConsentChange,
  consentError,
  id = "phone-consent",
  className,
  ...props
}: PhoneConsentFieldProps) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const consentId = `${id}-consent`;
  const consentErrorId = `${id}-consent-error`;
  const describedBy = error ? errorId : descriptionId;

  function handleConsentChange(event: ChangeEvent<HTMLInputElement>) {
    onConsentChange(event.target.checked);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-semibold text-[#2b1235]">
          {label}
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#69723a]" aria-hidden="true" />
          <input
            id={id}
            type="tel"
            inputMode="tel"
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            className={cn(
              "min-h-11 w-full rounded-xl border border-[#d8cdbf] bg-white pl-10 pr-3 text-sm text-[#2b1235] shadow-sm transition placeholder:text-[#958a96] focus-visible:border-[var(--survey-accent,#2b1235)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--survey-accent,#2b1235)]/15",
              error && "border-red-400 focus-visible:ring-red-500/20"
            )}
            placeholder="Ej. 55 1234 5678"
            {...props}
          />
        </div>
        {error ? (
          <p id={errorId} className="text-sm text-red-600">
            {error}
          </p>
        ) : (
          <p id={descriptionId} className="text-sm leading-5 text-[#756b77]">
            {helperText}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={consentId}
          className={cn(
            "flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-[#ded4c7] bg-white p-3 text-sm leading-5 text-[#514653] shadow-sm transition",
            "has-focus-visible:ring-3 has-focus-visible:ring-[color:var(--survey-accent,#2b1235)]/15",
            consentError && "border-red-300 bg-red-50/40"
          )}
        >
          <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              onChange={handleConsentChange}
              aria-describedby={consentError ? consentErrorId : undefined}
              aria-invalid={Boolean(consentError)}
              className="peer size-5 appearance-none rounded border border-[#cbbfb1] bg-white transition checked:border-[var(--survey-accent,#2b1235)] checked:bg-[var(--survey-accent,#2b1235)] focus-visible:outline-none"
            />
            <Check className="pointer-events-none absolute size-3.5 text-white opacity-0 transition peer-checked:opacity-100" />
          </span>
          <span>{consentText}</span>
        </label>
        {consentError && (
          <p id={consentErrorId} className="text-sm text-red-600">
            {consentError}
          </p>
        )}
      </div>
    </div>
  );
}
