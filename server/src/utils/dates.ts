import { ZodError } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export function assertIsoDate(value: string, fieldName: string): void {
  if (!isoDateRegex.test(value)) {
    throw new ZodError([
      {
        code: "custom",
        message: `${fieldName} must match YYYY-MM-DD format`,
        path: [fieldName]
      }
    ]);
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ZodError([
      {
        code: "custom",
        message: `${fieldName} must be a valid calendar date`,
        path: [fieldName]
      }
    ]);
  }
}

export function compareIsoDates(a: string, b: string): number {
  return new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime();
}

export function expandDateRange(start: string, end: string): string[] {
  assertIsoDate(start, "startDate");
  assertIsoDate(end, "endDate");

  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);

  if (startDate.getTime() > endDate.getTime()) {
    throw new ZodError([
      {
        code: "custom",
        message: "startDate must be on or before endDate",
        path: ["startDate"]
      }
    ]);
  }

  const days: string[] = [];
  const current = new Date(startDate.getTime());

  while (current.getTime() <= endDate.getTime()) {
    const iso = current.toISOString().slice(0, 10);
    days.push(iso);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}
