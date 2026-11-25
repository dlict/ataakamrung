import type { SchoolStaffingRecord } from '../types/staffing';

export type GroupedTableRow =
  | {
      kind: 'school';
      record: SchoolStaffingRecord;
      role: 'standalone' | 'main' | 'branch';
      branchCount?: number;
    }
  | {
      kind: 'branch_total';
      mainSchool: SchoolStaffingRecord;
      branches: SchoolStaffingRecord[];
      combined: SchoolStaffingRecord;
    };

function normalizeSchoolName(name: string): string {
  return name.replace(/^โรงเรียน\s*/u, '').replace(/\s+/g, ' ').trim();
}

export function extractMainSchoolPrefix(schoolName: string): string | null {
  const match = schoolName.match(/^(.+?)\s*สาขา/u);
  if (!match) return null;
  const prefix = normalizeSchoolName(match[1]);
  return prefix || null;
}

export function isBranchSchool(record: Pick<SchoolStaffingRecord, 'school_name'>): boolean {
  return extractMainSchoolPrefix(record.school_name) !== null;
}

/**
 * รวมค่าตัวเลขทั้งหมดของโรงเรียนหลักและโรงเรียนสาขาเข้าด้วยกันเป็นแถวรวม 1 แถว
 */
export function combineSchoolRecords(
  groupRecords: readonly SchoolStaffingRecord[]
): SchoolStaffingRecord {
  const base = groupRecords[0];
  const sum = (getter: (r: SchoolStaffingRecord) => number) =>
    groupRecords.reduce((acc, r) => acc + getter(r), 0);

  const criteriaTeacher = sum((r) => r.criteria_teacher);
  const diffTeacher = sum((r) => r.diff_teacher);
  const postRetireTeacher = sum((r) => r.post_retire_teacher);

  return {
    ...base,
    id: `branch-total-${base.school_code}`,
    school_code: base.school_code,
    school_name: `รวม ${base.school_name} (+${groupRecords.length - 1} สาขา)`,
    students_count: sum((r) => r.students_count),
    classrooms_count: sum((r) => r.classrooms_count),

    actual_director: sum((r) => r.actual_director),
    actual_deputy: sum((r) => r.actual_deputy),
    actual_teacher: sum((r) => r.actual_teacher),
    actual_total: sum((r) => r.actual_total),

    j18_paid_director: sum((r) => r.j18_paid_director),
    j18_paid_deputy: sum((r) => r.j18_paid_deputy),
    j18_paid_teacher: sum((r) => r.j18_paid_teacher),
    j18_paid_total: sum((r) => r.j18_paid_total),

    j18_calc_director: sum((r) => r.j18_calc_director),
    j18_calc_deputy: sum((r) => r.j18_calc_deputy),
    j18_calc_teacher: sum((r) => r.j18_calc_teacher),
    j18_calc_total: sum((r) => r.j18_calc_total),

    criteria_director: sum((r) => r.criteria_director),
    criteria_deputy: sum((r) => r.criteria_deputy),
    criteria_teacher: criteriaTeacher,
    criteria_total: sum((r) => r.criteria_total),

    diff_director: sum((r) => r.diff_director),
    diff_deputy: sum((r) => r.diff_deputy),
    diff_teacher: diffTeacher,
    diff_total: sum((r) => r.diff_total),
    diff_teacher_pct:
      criteriaTeacher > 0
        ? Number(((diffTeacher / criteriaTeacher) * 100).toFixed(2))
        : 0,

    retire_director: sum((r) => r.retire_director),
    retire_deputy: sum((r) => r.retire_deputy),
    retire_teacher: sum((r) => r.retire_teacher),
    retire_total: sum((r) => r.retire_total),

    post_retire_director: sum((r) => r.post_retire_director),
    post_retire_deputy: sum((r) => r.post_retire_deputy),
    post_retire_teacher: postRetireTeacher,
    post_retire_total: sum((r) => r.post_retire_total),
    post_retire_pct:
      criteriaTeacher > 0
        ? Number(((postRetireTeacher / criteriaTeacher) * 100).toFixed(2))
        : 0,

    secondment_out: sum((r) => r.secondment_out),
    secondment_in: sum((r) => r.secondment_in),
    royal_decree_teacher: sum((r) => r.royal_decree_teacher),
    contract_teacher: sum((r) => r.contract_teacher),
  };
}

/**
 * หาชุดรหัสโรงเรียนที่มีความเกี่ยวข้องกัน (โรงเรียนแม่ + สาขาทั้งหมด)
 */
export function getRelatedBranchGroupCodes(
  allRecords: readonly SchoolStaffingRecord[]
): Set<string> {
  const mainByKey = new Map<string, SchoolStaffingRecord>();
  for (const r of allRecords) {
    if (!isBranchSchool(r)) {
      mainByKey.set(`${r.district}::${normalizeSchoolName(r.school_name)}`, r);
      mainByKey.set(`*::${normalizeSchoolName(r.school_name)}`, r);
    }
  }

  const related = new Set<string>();
  for (const r of allRecords) {
    const prefix = extractMainSchoolPrefix(r.school_name);
    if (!prefix) continue;
    const main =
      mainByKey.get(`${r.district}::${prefix}`) ?? mainByKey.get(`*::${prefix}`);
    if (main) {
      related.add(main.school_code);
      related.add(r.school_code);
    }
  }
  return related;
}

/**
 * จัดกลุ่มโรงเรียนหลักคู่กับโรงเรียนสาขา พร้อมแทรกแถวรวม (แม่+สาขา) ต่อท้ายทันที
 */
export function buildGroupedRowsWithBranchTotals(
  records: readonly SchoolStaffingRecord[],
  groupBranchesWithMain: boolean = true
): GroupedTableRow[] {
  if (!groupBranchesWithMain) {
    return records.map((record) => ({
      kind: 'school',
      record,
      role: isBranchSchool(record) ? 'branch' : 'standalone',
    }));
  }

  const mainByKey = new Map<string, SchoolStaffingRecord>();
  for (const r of records) {
    if (!isBranchSchool(r)) {
      mainByKey.set(`${r.district}::${normalizeSchoolName(r.school_name)}`, r);
      if (!mainByKey.has(`*::${normalizeSchoolName(r.school_name)}`)) {
        mainByKey.set(`*::${normalizeSchoolName(r.school_name)}`, r);
      }
    }
  }

  const branchesByMainCode = new Map<string, SchoolStaffingRecord[]>();
  const attachedBranchCodes = new Set<string>();

  for (const r of records) {
    const prefix = extractMainSchoolPrefix(r.school_name);
    if (!prefix) continue;
    const main =
      mainByKey.get(`${r.district}::${prefix}`) ?? mainByKey.get(`*::${prefix}`);
    if (main && main.school_code !== r.school_code) {
      const list = branchesByMainCode.get(main.school_code) ?? [];
      list.push(r);
      branchesByMainCode.set(main.school_code, list);
      attachedBranchCodes.add(r.school_code);
    }
  }

  const rows: GroupedTableRow[] = [];
  for (const r of records) {
    if (attachedBranchCodes.has(r.school_code)) {
      continue;
    }

    const branches = branchesByMainCode.get(r.school_code);
    if (branches && branches.length > 0) {
      rows.push({
        kind: 'school',
        record: r,
        role: 'main',
        branchCount: branches.length,
      });
      for (const branch of branches) {
        rows.push({
          kind: 'school',
          record: branch,
          role: 'branch',
        });
      }
      rows.push({
        kind: 'branch_total',
        mainSchool: r,
        branches,
        combined: combineSchoolRecords([r, ...branches]),
      });
    } else {
      rows.push({
        kind: 'school',
        record: r,
        role: isBranchSchool(r) ? 'branch' : 'standalone',
      });
    }
  }

  return rows;
}
