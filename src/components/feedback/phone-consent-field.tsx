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
        <label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id={id}
            type="tel"
            inputMode="tel"
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/20",
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
          <p id={descriptionId} className="text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={consentId}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-5 text-slate-700 shadow-sm transition",
            "has-focus-visible:ring-3 has-focus-visible:ring-teal-600/20",
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
              className="peer size-5 appearance-none rounded border border-slate-300 bg-white transition checked:border-teal-700 checked:bg-teal-700 focus-visible:outline-none"
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
