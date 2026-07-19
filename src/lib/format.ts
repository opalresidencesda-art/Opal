import type { FeeSchedule } from "@/lib/content";

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getActiveFees(fees: FeeSchedule[]) {
  return fees
    .filter((fee) => fee.active)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || a.label.localeCompare(b.label));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}
