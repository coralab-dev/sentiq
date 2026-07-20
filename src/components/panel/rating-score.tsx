import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type RatingScoreProps = {
  value: 1 | 2 | 3 | 4 | 5;
  label?: string;
  className?: string;
};

function getRatingStyle(value: RatingScoreProps["value"]) {
  if (value <= 2) {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (value === 3) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-teal-50 text-teal-700 ring-teal-100";
}

export function RatingScore({ value, label, className }: RatingScoreProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        getRatingStyle(value),
        className,
      )}
      aria-label={label ?? `Calificación ${value} de 5`}
    >
      <Star className="size-3.5 fill-current" aria-hidden="true" />
      {value}/5
    </span>
  );
}
