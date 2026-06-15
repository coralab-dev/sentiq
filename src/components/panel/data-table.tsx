import type { ReactNode } from "react";

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
};

type DataTableProps = {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyState: ReactNode;
  actionsHeader?: ReactNode;
  className?: string;
};

export function DataTable({
  columns,
  rows,
  emptyState,
  actionsHeader = "",
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("px-4 py-3", column.className)}
                >
                  {column.header}
                </th>
              ))}
              <th scope="col" className="w-16 px-4 py-3 text-right">
                {actionsHeader}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="bg-white">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-3 text-slate-700", column.className)}
                  >
                    {row.cells[column.key]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">{row.actions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <div className="border-t border-slate-200">{emptyState}</div> : null}
    </div>
  );
}
