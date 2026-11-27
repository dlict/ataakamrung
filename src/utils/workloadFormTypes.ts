import type { SchoolStaffingRecord } from '../types/staffing';

export type GradeKey =
  | 'k0'
  | 'k1'
  | 'k2'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'p5'
  | 'p6'
  | 'm1'
  | 'm2'
  | 'm3'
  | 'm4'
  | 'm5'
  | 'm6';

export interface GradeCount {
  students: number;
  rooms: number;
}

export type GradeCountsMap = Record<GradeKey, GradeCount>;

export interface WorkloadStaffingInput {
  j18Director: number;
  j18Deputy: number;
  j18Teacher: number;
  criteriaDirector: number;
  criteriaDeputy: number;
  criteriaTeacher: number;
}

export interface WorkloadSignOffMeta {
  note: string;
  signerName: string;
  signerPosition: string;
  signDate: string;
}

export interface SavedSchoolWorkload {
  grades: GradeCountsMap;
  deductRetire: boolean;
  staffingOverride?: Partial<WorkloadStaffingInput>;
}

export const PRE_PRIMARY_GRADES: ReadonlyArray<{ key: GradeKey; label: string; maxPerRoom: number }> = [
  { key: 'k0', label: 'อนุบาล 3 ขวบ', maxPerRoom: 30 },
  { key: 'k1', label: 'อนุบาล ปีที่ 1', maxPerRoom: 30 },
  { key: 'k2', label: 'อนุบาล ปีที่ 2', maxPerRoom: 30 },
];

export const PRIMARY_GRADES: ReadonlyArray<{ key: GradeKey; label: string; maxPerRoom: number }> = [
  { key: 'p1', label: 'ประถมศึกษา ปีที่ 1', maxPerRoom: 36 },
  { key: 'p2', label: 'ประถมศึกษา ปีที่ 2', maxPerRoom: 36 },
  { key: 'p3', label: 'ประถมศึกษา ปีที่ 3', maxPerRoom: 36 },
  { key: 'p4', label: 'ประถมศึกษา ปีที่ 4', maxPerRoom: 36 },
  { key: 'p5', label: 'ประถมศึกษา ปีที่ 5', maxPerRoom: 36 },
  { key: 'p6', label: 'ประถมศึกษา ปีที่ 6', maxPerRoom: 36 },
];

export const LOWER_SECONDARY_GRADES: ReadonlyArray<{ key: GradeKey; label: string; maxPerRoom: number }> = [
  { key: 'm1', label: 'มัธยมศึกษา ปีที่ 1', maxPerRoom: 40 },
  { key: 'm2', label: 'มัธยมศึกษา ปีที่ 2', maxPerRoom: 40 },
  { key: 'm3', label: 'มัธยมศึกษา ปีที่ 3', maxPerRoom: 40 },
];

export const UPPER_SECONDARY_GRADES: ReadonlyArray<{ key: GradeKey; label: string; maxPerRoom: number }> = [
  { key: 'm4', label: 'มัธยมศึกษา ปีที่ 4', maxPerRoom: 40 },
  { key: 'm5', label: 'มัธยมศึกษา ปีที่ 5', maxPerRoom: 40 },
  { key: 'm6', label: 'มัธยมศึกษา ปีที่ 6', maxPerRoom: 40 },
];

export const ALL_GRADES = [
  ...PRE_PRIMARY_GRADES,
  ...PRIMARY_GRADES,
  ...LOWER_SECONDARY_GRADES,
  ...UPPER_SECONDARY_GRADES,
] as const;

export function createEmptyGradeCounts(): GradeCountsMap {
  return {
    k0: { students: 0, rooms: 0 },
    k1: { students: 0, rooms: 0 },
    k2: { students: 0, rooms: 0 },
    p1: { students: 0, rooms: 0 },
    p2: { students: 0, rooms: 0 },
    p3: { students: 0, rooms: 0 },
    p4: { students: 0, rooms: 0 },
    p5: { students: 0, rooms: 0 },
    p6: { students: 0, rooms: 0 },
    m1: { students: 0, rooms: 0 },
    m2: { students: 0, rooms: 0 },
    m3: { students: 0, rooms: 0 },
    m4: { students: 0, rooms: 0 },
    m5: { students: 0, rooms: 0 },
    m6: { students: 0, rooms: 0 },
  };
}

export function autoComputeRoomsFromStudents(grades: GradeCountsMap): GradeCountsMap {
  const next = { ...grades };
  for (const g of ALL_GRADES) {
    const students = Math.max(0, Math.round(grades[g.key].students || 0));
    next[g.key] = {
      students,
      rooms: students > 0 ? Math.ceil(students / g.maxPerRoom) : 0,
    };
  }
  return next;
}

export function sumGradeGroup(
  grades: GradeCountsMap,
  keys: ReadonlyArray<GradeKey>
): GradeCount {
  return keys.reduce(
    (acc, key) => ({
      students: acc.students + (Number(grades[key]?.students) || 0),
      rooms: acc.rooms + (Number(grades[key]?.rooms) || 0),
    }),
    { students: 0, rooms: 0 }
  );
}

export function computeWorkloadTotals(grades: GradeCountsMap) {
  const prePrimary = sumGradeGroup(grades, ['k0', 'k1', 'k2']);
  const primary = sumGradeGroup(grades, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
  const primaryAll: GradeCount = {
    students: prePrimary.students + primary.students,
    rooms: prePrimary.rooms + primary.rooms,
  };
  const lowerSec = sumGradeGroup(grades, ['m1', 'm2', 'm3']);
  const upperSec = sumGradeGroup(grades, ['m4', 'm5', 'm6']);
  const secondaryAll: GradeCount = {
    students: lowerSec.students + upperSec.students,
    rooms: lowerSec.rooms + upperSec.rooms,
  };
  const grandTotal: GradeCount = {
    students: primaryAll.students + secondaryAll.students,
    rooms: primaryAll.rooms + secondaryAll.rooms,
  };

  return {
    prePrimary,
    primary,
    primaryAll,
    lowerSec,
    upperSec,
    secondaryAll,
    grandTotal,
  };
}

export function buildDefaultStaffingFromRecord(
  school: SchoolStaffingRecord,
  deductRetire: boolean
): WorkloadStaffingInput {
  const j18Director = Math.max(
    0,
    school.j18_paid_director - (deductRetire ? school.retire_director : 0)
  );
  const j18Deputy = Math.max(
    0,
    school.j18_paid_deputy - (deductRetire ? school.retire_deputy : 0)
  );
  const j18Teacher = Math.max(
    0,
    school.j18_paid_teacher - (deductRetire ? school.retire_teacher : 0)
  );

  return {
    j18Director,
    j18Deputy,
    j18Teacher,
    criteriaDirector: school.criteria_director,
    criteriaDeputy: school.criteria_deputy,
    criteriaTeacher: school.criteria_teacher,
  };
}

export function formatSchoolFullName(schoolName: string): string {
  const trimmed = schoolName.trim();
  if (!trimmed) return 'โรงเรียน';
  return trimmed.startsWith('โรงเรียน') ? trimmed : `โรงเรียน${trimmed}`;
}
