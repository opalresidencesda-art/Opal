export const KAS_OPAL_CONTRIBUTION_CATEGORY = "Iuran Kas OPAL";

export type ContributionStatus = "paid" | "pending" | "waived";
export type MonthlyDuesStatus = ContributionStatus | "unprepared" | "attention";

export type MonthlyDuesProperty = {
  id: string;
  unitCode: string;
  responsibleName: string | null;
};

export type MonthlyDuesContribution = {
  id: string;
  propertyId: string;
  period: string | null;
  amountRupiah: number;
  paidAt: string | null;
  status: ContributionStatus;
};

export type MonthlyDuesRow = MonthlyDuesProperty & {
  selectedContribution: MonthlyDuesContribution | null;
  selectedStatus: MonthlyDuesStatus;
  lastPaidPeriod: string | null;
  outstandingAmount: number;
  outstandingPeriods: string[];
};

export function isPeriodMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function jakartaPeriod(now = new Date()) {
  const values = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", timeZone: "Asia/Jakarta" }).formatToParts(now);
  const year = values.find((value) => value.type === "year")?.value;
  const month = values.find((value) => value.type === "month")?.value;
  return `${year}-${month}`;
}

function periodMonth(period: string | null) {
  return period?.slice(0, 7) ?? null;
}

export function buildMonthlyDuesRows(properties: MonthlyDuesProperty[], contributions: MonthlyDuesContribution[], selectedPeriod: string): MonthlyDuesRow[] {
  const contributionsByProperty = new Map<string, MonthlyDuesContribution[]>();
  for (const contribution of contributions) {
    const items = contributionsByProperty.get(contribution.propertyId) ?? [];
    items.push(contribution);
    contributionsByProperty.set(contribution.propertyId, items);
  }

  return properties.map((property) => {
    const items = contributionsByProperty.get(property.id) ?? [];
    const selected = items.filter((item) => periodMonth(item.period) === selectedPeriod);
    const pending = items.filter((item) => item.status === "pending");
    const paid = items.filter((item) => item.status === "paid" && periodMonth(item.period));
    const selectedContribution = selected.length === 1 ? selected[0] : null;
    const selectedStatus: MonthlyDuesStatus = selected.length === 0
      ? "unprepared"
      : selected.length > 1
        ? "attention"
        : selectedContribution!.status;
    const lastPaidPeriod = paid
      .map((item) => periodMonth(item.period)!)
      .sort((left, right) => right.localeCompare(left))[0] ?? null;
    const outstandingPeriods = [...new Set(pending.map((item) => periodMonth(item.period)).filter((period): period is string => Boolean(period)))].sort();

    return {
      ...property,
      selectedContribution,
      selectedStatus,
      lastPaidPeriod,
      outstandingAmount: pending.reduce((total, item) => total + item.amountRupiah, 0),
      outstandingPeriods,
    };
  }).sort((left, right) => {
    const leftPriority = left.selectedStatus === "pending" ? 0 : left.selectedStatus === "attention" ? 1 : left.selectedStatus === "unprepared" ? 2 : 3;
    const rightPriority = right.selectedStatus === "pending" ? 0 : right.selectedStatus === "attention" ? 1 : right.selectedStatus === "unprepared" ? 2 : 3;
    return leftPriority - rightPriority || right.outstandingAmount - left.outstandingAmount || left.unitCode.localeCompare(right.unitCode);
  });
}

export function summarizeMonthlyDues(rows: MonthlyDuesRow[]) {
  return rows.reduce((summary, row) => ({
    ...summary,
    [row.selectedStatus]: summary[row.selectedStatus] + 1,
    outstandingHomes: summary.outstandingHomes + (row.outstandingAmount > 0 ? 1 : 0),
    outstandingAmount: summary.outstandingAmount + row.outstandingAmount,
  }), { paid: 0, pending: 0, waived: 0, unprepared: 0, attention: 0, outstandingHomes: 0, outstandingAmount: 0 });
}
