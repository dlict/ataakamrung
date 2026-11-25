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

export interface VacantCounts {
  director: number;
  deputy: number;
  teacher: number;
  total: number;
}

export function getVacantCounts(record: {
  j18_paid_director: number;
  j18_paid_deputy: number;
  j18_paid_teacher: number;
  actual_director: number;
  actual_deputy: number;
  actual_teacher: number;
}): VacantCounts {
  const director = Math.max(0, record.j18_paid_director - record.actual_director);
  const deputy = Math.max(0, record.j18_paid_deputy - record.actual_deputy);
  const teacher = Math.max(0, record.j18_paid_teacher - record.actual_teacher);
  return {
    director,
    deputy,
    teacher,
    total: director + deputy + teacher,
  };
}

export function formatVacantPositionsText(record: {
  j18_paid_director: number;
  j18_paid_deputy: number;
  j18_paid_teacher: number;
  actual_director: number;
  actual_deputy: number;
  actual_teacher: number;
}): string {
  const v = getVacantCounts(record);
  const parts: string[] = [];
  if (v.director > 0) parts.push(`ผอ. ${formatNumber(v.director)}`);
  if (v.deputy > 0) parts.push(`รอง ${formatNumber(v.deputy)}`);
  if (v.teacher > 0) parts.push(`ครู ${formatNumber(v.teacher)}`);
  return parts.length > 0 ? `ว่าง ${parts.join(' · ')}` : '';
}
