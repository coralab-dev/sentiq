import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DataTableColumn = {
  key: string;
  header: ReactNode;
  className?: string;
};

type DataTableRow = {
  id: string;
  cells: Record<string, ReactNode>;
  actions?: ReactNode;
  onSelect?: () => void;
  selected?: boolean;
  mobileSummary?: ReactNode;
};

type DataTableProps = {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyState: ReactNode;
  actionsHeader?: ReactNode;
  className?: string;
};

export function DataTable({ columns, rows, emptyState, actionsHeader = "", className }: DataTableProps) {
  const hasActions = Boolean(actionsHeader) || rows.some((row) => Boolean(row.actions));

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>, onSelect?: () => void) {
    if (!onSelect || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onSelect();
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[var(--sq-line,#e2e8f0)] bg-[var(--sq-surface,#fff)]", className)}>
      <div className="divide-y divide-[var(--sq-line,#e2e8f0)] lg:hidden">
        {rows.map((row) => {
          const content = row.mobileSummary ?? (
            <dl className="grid gap-3 sm:grid-cols-2">
              {columns.map((column) => (
                <div key={column.key} className="min-w-0">
                  <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[var(--sq-muted,#64748b)]">{column.header}</dt>
                  <dd className="mt-1 break-words text-sm text-[var(--sq-ink,#334155)]">{row.cells[column.key]}</dd>
                </div>
              ))}
            </dl>
          );

          return row.onSelect ? (
            <button key={row.id} type="button" onClick={row.onSelect} className={cn("block min-h-11 w-full p-4 text-left transition hover:bg-[var(--sq-soft,#f8fafc)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sq-coral,#0f766e)] sm:p-5", row.selected && "border-l-2 border-[var(--sq-coral)] bg-[var(--sq-coral-soft)]/45")}>
              {content}
              {hasActions && row.actions ? <div className="mt-4 flex flex-wrap justify-end gap-2">{row.actions}</div> : null}
            </button>
          ) : (
            <article key={row.id} className="p-4 sm:p-5">{content}{hasActions && row.actions ? <div className="mt-4 flex flex-wrap justify-end gap-2">{row.actions}</div> : null}</article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="border-b border-[var(--sq-line,#e2e8f0)] bg-[var(--sq-soft,#f8fafc)] text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[var(--sq-muted,#64748b)]">
            <tr>{columns.map((column) => <th key={column.key} scope="col" className={cn("px-4 py-3.5", column.className)}>{column.header}</th>)}{hasActions ? <th scope="col" className="w-16 px-4 py-3.5 text-right">{actionsHeader}</th> : null}</tr>
          </thead>
          <tbody className="divide-y divide-[var(--sq-line,#e2e8f0)]">
            {rows.map((row) => (
              <tr key={row.id} onClick={row.onSelect} onKeyDown={(event) => handleKeyDown(event, row.onSelect)} tabIndex={row.onSelect ? 0 : undefined} aria-selected={row.selected || undefined} className={cn("bg-[var(--sq-surface,#fff)] transition", row.onSelect && "cursor-pointer hover:bg-[var(--sq-soft,#f8fafc)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sq-coral,#0f766e)]", row.selected && "bg-[var(--sq-coral-soft)]/45 shadow-[inset_2px_0_0_var(--sq-coral)]")}>
                {columns.map((column) => <td key={column.key} className={cn("px-4 py-3.5 text-[var(--sq-muted,#334155)]", column.className)}>{row.cells[column.key]}</td>)}
                {hasActions ? <td className="px-4 py-3.5 text-right" onClick={(event) => event.stopPropagation()}>{row.actions}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <div className="border-t border-[var(--sq-line,#e2e8f0)]">{emptyState}</div> : null}
    </div>
  );
}
