"use client";

import { useId, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type RatingScaleProps = {
  value?: number;
  onChange?: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  name?: string;
  "aria-label"?: string;
};

export function RatingScale({
  value,
  onChange,
  minLabel = "Muy malo",
  maxLabel = "Excelente",
  disabled,
  error,
  className,
  name,
  "aria-label": ariaLabel = "Selecciona una calificación",
}: RatingScaleProps) {
  const generatedId = useId();
  const errorId = `${name ?? generatedId}-error`;

  return (
    <fieldset
      className={cn("space-y-3", className)}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="sr-only">{ariaLabel}</legend>
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <RatingButton
            key={rating}
            name={name}
            rating={rating}
            selected={value === rating}
            invalid={Boolean(error)}
            disabled={disabled}
            onClick={() => onChange?.(rating)}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs font-medium text-[#756b77]">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}

type RatingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  rating: number;
  selected: boolean;
  invalid: boolean;
  name?: string;
};

function RatingButton({
  rating,
  selected,
  invalid,
  name,
  className,
  ...props
}: RatingButtonProps) {
  return (
    <button
      type="button"
      name={name}
      aria-pressed={selected}
      className={cn(
        "flex h-14 min-w-0 flex-1 items-center justify-center rounded-xl border text-base font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--survey-accent,#2b1235)]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:text-lg",
        selected
          ? "border-[var(--survey-accent,#2b1235)] bg-[var(--survey-accent,#2b1235)] text-white shadow-sm"
          : "border-[#d8cdbf] bg-white text-[#2b1235] hover:border-[var(--survey-accent,#2b1235)] hover:bg-[#fbf7ef]",
        invalid && !selected && "border-red-300 text-red-700 hover:border-red-400",
        className
      )}
      {...props}
    >
      {rating}
    </button>
  );
}
