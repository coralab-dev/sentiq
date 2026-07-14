"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { RatingScale } from "./rating-scale";

type SurveyQuestionProps = {
  number?: number;
  title: ReactNode;
  description?: ReactNode;
  required?: boolean;
  value?: number;
  onChange?: (value: number) => void;
  error?: string;
  children?: ReactNode;
  className?: string;
};

export function SurveyQuestion({
  number,
  title,
  description,
  required,
  value,
  onChange,
  error,
  children,
  className,
}: SurveyQuestionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#ded4c7] bg-[#fffdf8] p-4 shadow-[0_1px_2px_rgba(43,18,53,0.05)] sm:p-5",
        error && "border-red-300 ring-1 ring-red-100",
        className
      )}
      data-invalid={error ? "" : undefined}
    >
      <div className="mb-5 flex items-start gap-3">
        {number !== undefined && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#69723a] text-sm font-semibold text-white">
            {number}
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold leading-6 text-[#2b1235]">
            {title}
            {required && <span className="ml-1 text-[#ff5947]">*</span>}
          </h2>
          {description && <p className="text-sm leading-5 text-[#685f6b]">{description}</p>}
        </div>
      </div>
      {children ?? <RatingScale value={value} onChange={onChange} error={error} />}
    </section>
  );
}
