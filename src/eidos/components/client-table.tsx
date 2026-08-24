"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getEidosCopy,
  getEidosRiskLabel,
  getEidosStatusLabel,
  getEidosStrategyLabel,
} from "@/eidos/lib/eidos-i18n";
import { cn } from "@/lib/utils";
import { RISK_TONE, STATUS_TONE, formatMwh } from "@/eidos/lib/eidos-format";
import type { ClientRisk, EidosClient } from "@/eidos/types/eidos";
import type { Locale } from "@/lib/observatory-i18n";

export type SortKey =
  | "name"
  | "annualConsumptionMwh"
  | "currentStrategy"
  | "recommendedStrategy"
  | "risk"
  | "status";
export type SortDirection = "asc" | "desc";

type Props = {
  locale: Locale;
  rows: EidosClient[];
  totalCount: number;
  selectedClientId: string | null;
  onSelect: (clientId: string) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  search: string;
  onSearch: (value: string) => void;
  riskFilter: ClientRisk | "ALL";
  onRiskFilter: (value: ClientRisk | "ALL") => void;
};

export function ClientTable({
  locale,
  rows,
  totalCount,
  selectedClientId,
  onSelect,
  sortKey,
  sortDirection,
  onSort,
  search,
  onSearch,
  riskFilter,
  onRiskFilter,
}: Props) {
  const copy = getEidosCopy(locale);
  const columns: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: "name", label: copy.table.columns.client },
    {
      key: "annualConsumptionMwh",
      label: copy.table.columns.annualConsumption,
      numeric: true,
    },
    { key: "currentStrategy", label: copy.table.columns.current },
    { key: "recommendedStrategy", label: copy.table.columns.recommended },
    { key: "risk", label: copy.table.columns.risk },
    { key: "status", label: copy.table.columns.status },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={copy.table.searchPlaceholder}
            aria-label={copy.table.searchAriaLabel}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          <span className="sr-only sm:not-sr-only">{copy.table.riskLabel}</span>
          <select
            value={riskFilter}
            onChange={(event) =>
              onRiskFilter(event.target.value as ClientRisk | "ALL")
            }
            aria-label={copy.table.riskFilterAriaLabel}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition hover:border-white/20 focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            <option value="ALL" className="bg-slate-900">
              {copy.table.allRisk}
            </option>
            <option value="LOW" className="bg-slate-900">
              {getEidosRiskLabel(locale, "LOW")}
            </option>
            <option value="MEDIUM" className="bg-slate-900">
              {getEidosRiskLabel(locale, "MEDIUM")}
            </option>
            <option value="HIGH" className="bg-slate-900">
              {getEidosRiskLabel(locale, "HIGH")}
            </option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-[20px] border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            {copy.table.caption(rows.length, totalCount)}
          </caption>
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {columns.map((column) => {
                const active = sortKey === column.key;
                const ariaSort = active
                  ? sortDirection === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";
                const SortIcon = active
                  ? sortDirection === "asc"
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      "px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400",
                      column.numeric && "text-right",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60",
                        column.numeric && "flex-row-reverse",
                        active && "text-white",
                      )}
                    >
                      <span>{column.label}</span>
                      <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  {copy.table.noMatches}
                </td>
              </tr>
            ) : (
              rows.map((client) => {
                const selected = client.id === selectedClientId;
                return (
                  <tr
                    key={client.id}
                    className={cn(
                      "border-b border-white/6 transition last:border-b-0",
                      selected ? "bg-cyan-300/10" : "hover:bg-white/5",
                    )}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSelect(client.id)}
                        aria-pressed={selected}
                        className="flex flex-col items-start gap-0.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                      >
                        <span className="font-medium text-white">
                          {client.name}
                        </span>
                        <span className="text-[11px] uppercase tracking-wide text-slate-500">
                          {client.id}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {formatMwh(client.annualConsumptionMwh)}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {getEidosStrategyLabel(locale, client.currentStrategy)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "font-medium",
                          client.decisionChanged
                            ? "text-cyan-200"
                            : "text-slate-300",
                        )}
                      >
                        {getEidosStrategyLabel(
                          locale,
                          client.recommendedStrategy,
                        )}
                      </span>
                      {client.decisionChanged ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-cyan-300/80">
                          {copy.table.changedBadge}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={RISK_TONE[client.risk]}>
                        {getEidosRiskLabel(locale, client.risk)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_TONE[client.status]}>
                        {getEidosStatusLabel(locale, client.status)}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
