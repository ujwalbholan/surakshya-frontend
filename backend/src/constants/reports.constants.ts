export enum ReportRange {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
}

export const REPORT_RANGE_DAYS: Record<ReportRange, number> = {
  [ReportRange.SEVEN_DAYS]: 7,
  [ReportRange.THIRTY_DAYS]: 30,
  [ReportRange.NINETY_DAYS]: 90,
};
