export function formatNumber(n: number): string {
  return new Intl.NumberFormat('th-TH').format(n);
}

export function formatSigned(n: number): string {
  if (n > 0) return `+${new Intl.NumberFormat('th-TH').format(n)}`;
  if (n < 0) return new Intl.NumberFormat('th-TH').format(n);
  return '0';
}

export function formatPercent(n: number): string {
  const fixed = n.toFixed(2);
  if (n > 0) return `+${fixed}%`;
  return `${fixed}%`;
}

export function getDiffToneClass(n: number): string {
  if (n < 0) return 'text-[#B91C1C]';
  if (n > 0) return 'text-[#0F766E]';
  return 'text-[#6B7280]';
}

export function getDiffLabel(n: number): string {
  if (n < 0) return 'ขาดเกณฑ์';
  if (n > 0) return 'เกินเกณฑ์';
  return 'พอดีเกณฑ์';
}

export interface PositionDiffItem {
  key: 'director' | 'deputy' | 'teacher';
  label: 'ผอ.' | 'รอง ผอ.' | 'ครู';
  diff: number;
}

export function getPositionDiffItems(record: {
  diff_director: number;
  diff_deputy: number;
  diff_teacher: number;
}): PositionDiffItem[] {
  return [
    { key: 'director', label: 'ผอ.', diff: record.diff_director },
    { key: 'deputy', label: 'รอง ผอ.', diff: record.diff_deputy },
    { key: 'teacher', label: 'ครู', diff: record.diff_teacher },
  ];
}

export function formatDeficitPositionsText(record: {
  diff_director: number;
  diff_deputy: number;
  diff_teacher: number;
}): string {
  const parts = getPositionDiffItems(record)
    .filter((item) => item.diff < 0)
    .map((item) => `ขาด ${item.label} ${formatNumber(Math.abs(item.diff))}`);
  return parts.join(' · ');
}

export function formatSurplusPositionsText(record: {
  diff_director: number;
  diff_deputy: number;
  diff_teacher: number;
}): string {
  const parts = getPositionDiffItems(record)
    .filter((item) => item.diff > 0)
    .map((item) => `เกิน ${item.label} +${formatNumber(item.diff)}`);
  return parts.join(' · ');
}

