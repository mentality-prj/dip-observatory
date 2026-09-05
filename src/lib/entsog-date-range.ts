export type EntsogDateRangeInput = {
  from: string;
  to: string;
};

export function getEntsogDatePickerBounds(from: string, todayIso: string) {
  return {
    fromMax: todayIso,
    toMax: todayIso,
    toMin: from.trim() || undefined,
  };
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayLocalDateIso(now: Date = new Date()): string {
  return formatLocalDate(now);
}

function parseIsoDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function validateEntsogHistoricalDateRange(
  input: EntsogDateRangeInput,
  todayIso: string = getTodayLocalDateIso(),
): string | null {
  const from = input.from.trim();
  const to = input.to.trim();

  if (!from) {
    return '"From" date is required.';
  }

  if (!to) {
    return '"To" date is required.';
  }

  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  const todayDate = parseIsoDate(todayIso);

  if (!fromDate || !toDate || !todayDate) {
    return "Invalid date.";
  }

  if (fromDate > todayDate || toDate > todayDate) {
    return "Future dates are not available.";
  }

  if (fromDate > toDate) {
    return "From date must be on or before To date.";
  }

  return null;
}
