import type { SchoolStaffingRecord } from '../types/staffing';

export type RealityFieldKey =
  | 'actual_teacher'
  | 'royal_decree_teacher'
  | 'contract_teacher'
  | 'secondment_in'
  | 'secondment_out'
  | 'actual_director'
  | 'actual_deputy';

export interface RealityFieldOption {
  key: RealityFieldKey;
  label: string;
  shortLabel: string;
  sign: 1 | -1;
}

export interface RealityCalculationResult {
  total: number;
  breakdownText: string;
  referenceCriteria: number;
  referenceLabel: string;
  diff: number;
  studentRatio: string;
}

export const REALITY_COMPONENT_OPTIONS: readonly RealityFieldOption[] = [
  {
    key: 'actual_teacher',
    label: 'ตำแหน่งครูผู้สอน (ครูมีตัวจริง)',
    shortLabel: 'ครูผู้สอน',
    sign: 1,
  },
  {
    key: 'royal_decree_teacher',
    label: 'พนักงานราชการ (ตำแหน่งครูผู้สอน)',
    shortLabel: 'พนักงานราชการ',
    sign: 1,
  },
  {
    key: 'contract_teacher',
    label: 'ครูอัตราจ้าง (ตำแหน่งครูผู้สอน)',
    shortLabel: 'อัตราจ้าง',
    sign: 1,
  },
  {
    key: 'secondment_in',
    label: 'มาช่วยราชการ (+)',
    shortLabel: 'มาช่วยราชการ',
    sign: 1,
  },
  {
    key: 'secondment_out',
    label: 'หักไปช่วยราชการ (-)',
    shortLabel: 'หักไปช่วยฯ',
    sign: -1,
  },
  {
    key: 'actual_director',
    label: 'ผอ. มีตัวจริง',
    shortLabel: 'ผอ.',
    sign: 1,
  },
  {
    key: 'actual_deputy',
    label: 'รอง ผอ. มีตัวจริง',
    shortLabel: 'รอง ผอ.',
    sign: 1,
  },
] as const;

export const DEFAULT_REALITY_FIELDS: RealityFieldKey[] = [
  'actual_teacher',
  'royal_decree_teacher',
];

export function formatRealityFormula(selectedFields: readonly RealityFieldKey[]): string {
  const active = REALITY_COMPONENT_OPTIONS.filter((opt) =>
    selectedFields.includes(opt.key)
  );
  if (active.length === 0) return 'ยังไม่ได้เลือกองค์ประกอบ';
  return active
    .map((opt, idx) => {
      if (idx === 0) return opt.sign === -1 ? `-${opt.shortLabel}` : opt.shortLabel;
      return opt.sign === -1 ? ` - ${opt.shortLabel}` : ` + ${opt.shortLabel}`;
    })
    .join('');
}

const FIELD_SIGN_MAP = new Map<string, 1 | -1>(
  REALITY_COMPONENT_OPTIONS.map((opt) => [opt.key, opt.sign])
);

/**
 * คำนวณค่าผลรวม "สภาพจริง" จากรายการชื่อ field ของตำแหน่งที่ผู้ใช้เลือกนำมาบวกกัน
 */
export function calculateActualStaffing(
  record: SchoolStaffingRecord,
  selectedFields: readonly (keyof SchoolStaffingRecord)[] = DEFAULT_REALITY_FIELDS
): number {
  const uniqueFields = Array.from(new Set(selectedFields));
  let total = 0;

  for (const field of uniqueFields) {
    const rawValue = record[field];
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) continue;
    const sign = FIELD_SIGN_MAP.get(String(field)) ?? 1;
    total += rawValue * sign;
  }

  return total;
}

/**
 * คำนวณผลรวม "สภาพจริง" สำหรับข้อมูลหลายโรงเรียนพร้อมกัน
 */
export function calculateActualStaffingForRecords(
  records: readonly SchoolStaffingRecord[],
  selectedFields: readonly (keyof SchoolStaffingRecord)[] = DEFAULT_REALITY_FIELDS
): number {
  return records.reduce(
    (sum, record) => sum + calculateActualStaffing(record, selectedFields),
    0
  );
}

export function calculateRealityTotal(
  record: SchoolStaffingRecord,
  selectedFields: readonly RealityFieldKey[] = DEFAULT_REALITY_FIELDS
): number {
  return calculateActualStaffing(record, selectedFields);
}

export function calculateRealityStaffing(
  record: SchoolStaffingRecord,
  selectedFields: readonly RealityFieldKey[] = DEFAULT_REALITY_FIELDS
): RealityCalculationResult {
  let total = 0;
  const parts: string[] = [];

  for (const opt of REALITY_COMPONENT_OPTIONS) {
    if (!selectedFields.includes(opt.key)) continue;
    const value = Number(record[opt.key] ?? 0);
    const safeValue = Number.isFinite(value) ? value : 0;
    total += safeValue * opt.sign;
    const prefix =
      parts.length === 0
        ? opt.sign === -1
          ? '-'
          : ''
        : opt.sign === -1
          ? ' - '
          : ' + ';
    parts.push(`${prefix}${opt.shortLabel} ${safeValue}`);
  }

  const includesDirector = selectedFields.includes('actual_director');
  const includesDeputy = selectedFields.includes('actual_deputy');
  const includesTeacherGroup =
    selectedFields.includes('actual_teacher') ||
    selectedFields.includes('royal_decree_teacher') ||
    selectedFields.includes('contract_teacher') ||
    selectedFields.includes('secondment_in') ||
    selectedFields.includes('secondment_out');

  const referenceCriteria =
    (includesTeacherGroup || (!includesDirector && !includesDeputy)
      ? record.criteria_teacher
      : 0) +
    (includesDirector ? record.criteria_director : 0) +
    (includesDeputy ? record.criteria_deputy : 0);

  const referenceLabel =
    includesDirector || includesDeputy
      ? 'เกณฑ์ ก.ค.ศ. (ตามตำแหน่งที่เลือก)'
      : 'เกณฑ์ครู ก.ค.ศ.';

  const diff = total - referenceCriteria;
  const studentRatio =
    total > 0 ? (record.students_count / total).toFixed(1) : '—';

  return {
    total,
    breakdownText: parts.join('') || '—',
    referenceCriteria,
    referenceLabel,
    diff,
    studentRatio,
  };
}
