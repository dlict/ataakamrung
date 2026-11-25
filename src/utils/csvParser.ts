import Papa from 'papaparse';
import type {
  AggregateSummary,
  DistrictSummary,
  SchoolStaffingRecord,
} from '../types/staffing.ts';

function toInt(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.round(val);
  const cleaned = String(val ?? '')
    .replace(/,/g, '')
    .trim();
  if (!cleaned) return 0;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toFloat(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return Number(val.toFixed(2));
  const cleaned = String(val ?? '')
    .replace(/,/g, '')
    .trim();
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function splitLocation(raw: string): {
  subdistrict: string;
  district: string;
  province: string;
} {
  const parts = raw
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    subdistrict: parts[0] ?? '',
    district: parts[1] ?? '',
    province: parts[2] ?? '',
  };
}

export interface ParsedCsvResult {
  records: SchoolStaffingRecord[];
  summary: AggregateSummary;
  skippedRows: number;
  csvTotalRow?: {
    students: number;
    classrooms: number;
    actualTotal: number;
    criteriaTotal: number;
    diffTotal: number;
  };
}

export function parseSchoolStaffingCsv(csvText: string): ParsedCsvResult {
  const normalizedText = csvText.replace(/^\uFEFF/, '');
  const parsed = Papa.parse<string[]>(normalizedText, {
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error('ไม่สามารถอ่านโครงสร้างไฟล์ CSV ได้ กรุณาตรวจสอบรูปแบบไฟล์');
  }

  const rows = parsed.data;
  if (rows.length < 4) {
    throw new Error('ไฟล์ CSV มีข้อมูลไม่ครบถ้วน (ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 โรงเรียน)');
  }

  // Locate where actual school data begins (first row where col[1] looks like a 10-digit school code or col[0] is numeric)
  let startIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const col0 = (rows[i][0] ?? '').replace(/^\*\s*/, '').trim();
    const col1 = (rows[i][1] ?? '').trim();
    if (/^\d+$/.test(col0) && col1.length >= 6) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === 0) {
    // Fallback: verify row 0 contains Thai header keywords
    const firstRowText = rows[0].join(',');
    if (!firstRowText.includes('รหัสโรงเรียน') && !firstRowText.includes('ชื่อโรงเรียน')) {
      throw new Error('รูปแบบหัวตารางไม่ตรงกับรายงานอัตรากำลังมาตรฐาน (ไม่พบคอลัมน์ รหัสโรงเรียน / ชื่อโรงเรียน)');
    }
    startIndex = 3;
  }

  const records: SchoolStaffingRecord[] = [];
  let skippedRows = 0;
  let csvTotalRow: ParsedCsvResult['csvTotalRow'];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    const col0Raw = (row[0] ?? '').trim();

    if (col0Raw.startsWith('รวม') || col0Raw.includes('รวมทั้งหมด')) {
      csvTotalRow = {
        students: toInt(row[8]),
        classrooms: toInt(row[9]),
        actualTotal: toInt(row[13]),
        criteriaTotal: toInt(row[25]),
        diffTotal: toInt(row[29]),
      };
      continue;
    }

    const isFlagged = col0Raw.startsWith('*');
    const seqNo = toInt(col0Raw.replace(/^\*\s*/, ''));
    const schoolCode = (row[1] ?? '').trim();
    const schoolName = (row[2] ?? '').trim();

    if (!schoolCode || !schoolName) {
      skippedRows++;
      continue;
    }

    const locationRaw = (row[3] ?? '').trim();
    const { subdistrict, district, province } = splitLocation(locationRaw);

    records.push({
      seq_no: seqNo || records.length + 1,
      is_flagged: isFlagged,
      school_code: schoolCode,
      school_name: schoolName,
      location_raw: locationRaw,
      subdistrict,
      district,
      province,
      school_size: (row[4] ?? '').trim(),
      school_type: (row[5] ?? '').trim(),
      project_name: (row[6] ?? '').trim(),
      special_feature: (row[7] ?? '').trim(),

      students_count: toInt(row[8]),
      classrooms_count: toInt(row[9]),

      actual_director: toInt(row[10]),
      actual_deputy: toInt(row[11]),
      actual_teacher: toInt(row[12]),
      actual_total: toInt(row[13]),

      j18_paid_director: toInt(row[14]),
      j18_paid_deputy: toInt(row[15]),
      j18_paid_teacher: toInt(row[16]),
      j18_paid_total: toInt(row[17]),

      j18_calc_director: toInt(row[18]),
      j18_calc_deputy: toInt(row[19]),
      j18_calc_teacher: toInt(row[20]),
      j18_calc_total: toInt(row[21]),

      criteria_director: toInt(row[22]),
      criteria_deputy: toInt(row[23]),
      criteria_teacher: toInt(row[24]),
      criteria_total: toInt(row[25]),

      diff_director: toInt(row[26]),
      diff_deputy: toInt(row[27]),
      diff_teacher: toInt(row[28]),
      diff_total: toInt(row[29]),
      diff_teacher_pct: toFloat(row[30]),

      retire_director: toInt(row[31]),
      retire_deputy: toInt(row[32]),
      retire_teacher: toInt(row[33]),
      retire_total: toInt(row[34]),

      post_retire_director: toInt(row[35]),
      post_retire_deputy: toInt(row[36]),
      post_retire_teacher: toInt(row[37]),
      post_retire_total: toInt(row[38]),
      post_retire_pct: toFloat(row[39]),

      secondment_out: toInt(row[40]),
      secondment_in: toInt(row[41]),
      royal_decree_teacher: toInt(row[42]),
      contract_teacher: toInt(row[43]),
    });
  }

  if (records.length === 0) {
    throw new Error('ไม่พบรายการโรงเรียนที่ถูกต้องในไฟล์ CSV นี้');
  }

  return {
    records,
    summary: computeSummaryFromRecords(records),
    skippedRows,
    csvTotalRow,
  };
}

export function computeSummaryFromRecords(
  records: SchoolStaffingRecord[]
): AggregateSummary {
  const acc: AggregateSummary = {
    totalSchools: records.length,
    totalStudents: 0,
    totalClassrooms: 0,

    actualDirector: 0,
    actualDeputy: 0,
    actualTeacher: 0,
    actualTotal: 0,

    j18PaidDirector: 0,
    j18PaidDeputy: 0,
    j18PaidTeacher: 0,
    j18PaidTotal: 0,
    j18CalcDirector: 0,
    j18CalcDeputy: 0,
    j18CalcTeacher: 0,
    j18CalcTotal: 0,

    criteriaDirector: 0,
    criteriaDeputy: 0,
    criteriaTeacher: 0,
    criteriaTotal: 0,

    diffDirector: 0,
    diffDeputy: 0,
    diffTeacher: 0,
    diffTotal: 0,
    diffTeacherPct: 0,

    retireDirector: 0,
    retireDeputy: 0,
    retireTeacher: 0,
    retireTotal: 0,

    postRetireDirector: 0,
    postRetireDeputy: 0,
    postRetireTeacher: 0,
    postRetireTotal: 0,
    postRetirePct: 0,

    secondmentOut: 0,
    secondmentIn: 0,
    royalDecreeTeacher: 0,
    contractTeacher: 0,

    vacantDirector: 0,
    vacantDeputy: 0,
    vacantTeacher: 0,
    vacantTotal: 0,
    vacantSchools: 0,
    vacantDirectorByJ18Schools: 0,
    vacantDeputyByJ18Schools: 0,
    vacantTeacherByJ18Schools: 0,

    deficitSchools: 0,
    balancedSchools: 0,
    surplusSchools: 0,
    vacantDirectorSchools: 0,
    studentTeacherRatio: 0,
  };

  for (const r of records) {
    acc.totalStudents += r.students_count;
    acc.totalClassrooms += r.classrooms_count;

    acc.actualDirector += r.actual_director;
    acc.actualDeputy += r.actual_deputy;
    acc.actualTeacher += r.actual_teacher;
    acc.actualTotal += r.actual_total;

    acc.j18PaidDirector += r.j18_paid_director;
    acc.j18PaidDeputy += r.j18_paid_deputy;
    acc.j18PaidTeacher += r.j18_paid_teacher;
    acc.j18PaidTotal += r.j18_paid_total;
    acc.j18CalcDirector += r.j18_calc_director;
    acc.j18CalcDeputy += r.j18_calc_deputy;
    acc.j18CalcTeacher += r.j18_calc_teacher;
    acc.j18CalcTotal += r.j18_calc_total;

    acc.criteriaDirector += r.criteria_director;
    acc.criteriaDeputy += r.criteria_deputy;
    acc.criteriaTeacher += r.criteria_teacher;
    acc.criteriaTotal += r.criteria_total;

    acc.diffDirector += r.diff_director;
    acc.diffDeputy += r.diff_deputy;
    acc.diffTeacher += r.diff_teacher;
    acc.diffTotal += r.diff_total;

    acc.retireDirector += r.retire_director;
    acc.retireDeputy += r.retire_deputy;
    acc.retireTeacher += r.retire_teacher;
    acc.retireTotal += r.retire_total;

    acc.postRetireDirector += r.post_retire_director;
    acc.postRetireDeputy += r.post_retire_deputy;
    acc.postRetireTeacher += r.post_retire_teacher;
    acc.postRetireTotal += r.post_retire_total;

    acc.secondmentOut += r.secondment_out;
    acc.secondmentIn += r.secondment_in;
    acc.royalDecreeTeacher += r.royal_decree_teacher;
    acc.contractTeacher += r.contract_teacher;

    const vacDir = Math.max(0, r.j18_paid_director - r.actual_director);
    const vacDep = Math.max(0, r.j18_paid_deputy - r.actual_deputy);
    const vacTea = Math.max(0, r.j18_paid_teacher - r.actual_teacher);
    const vacSum = vacDir + vacDep + vacTea;

    acc.vacantDirector += vacDir;
    acc.vacantDeputy += vacDep;
    acc.vacantTeacher += vacTea;
    acc.vacantTotal += vacSum;
    if (vacSum > 0) acc.vacantSchools++;
    if (vacDir > 0) acc.vacantDirectorByJ18Schools++;
    if (vacDep > 0) acc.vacantDeputyByJ18Schools++;
    if (vacTea > 0) acc.vacantTeacherByJ18Schools++;

    if (r.diff_total < 0) acc.deficitSchools++;
    else if (r.diff_total > 0) acc.surplusSchools++;
    else acc.balancedSchools++;

    if (r.criteria_director > r.actual_director) {
      acc.vacantDirectorSchools++;
    }
  }

  acc.diffTeacherPct =
    acc.criteriaTeacher > 0
      ? Number(((acc.diffTeacher / acc.criteriaTeacher) * 100).toFixed(2))
      : 0;
  acc.postRetirePct =
    acc.criteriaTeacher > 0
      ? Number(((acc.postRetireTeacher / acc.criteriaTeacher) * 100).toFixed(2))
      : 0;
  acc.studentTeacherRatio =
    acc.actualTeacher > 0
      ? Number((acc.totalStudents / acc.actualTeacher).toFixed(1))
      : 0;

  return acc;
}

export function computeDistrictBreakdown(
  records: SchoolStaffingRecord[]
): DistrictSummary[] {
  const map = new Map<string, SchoolStaffingRecord[]>();
  for (const r of records) {
    const key = r.district || 'ไม่ระบุอำเภอ';
    const list = map.get(key);
    if (list) list.push(r);
    else map.set(key, [r]);
  }

  const summaries: DistrictSummary[] = [];
  for (const [district, list] of map.entries()) {
    const sum = computeSummaryFromRecords(list);
    summaries.push({
      district,
      schools: sum.totalSchools,
      students: sum.totalStudents,
      classrooms: sum.totalClassrooms,
      actualDirector: sum.actualDirector,
      actualDeputy: sum.actualDeputy,
      actualTeacher: sum.actualTeacher,
      actualTotal: sum.actualTotal,
      j18CalcTotal: sum.j18CalcTotal,
      criteriaDirector: sum.criteriaDirector,
      criteriaDeputy: sum.criteriaDeputy,
      criteriaTeacher: sum.criteriaTeacher,
      criteriaTotal: sum.criteriaTotal,
      diffDirector: sum.diffDirector,
      diffDeputy: sum.diffDeputy,
      diffTeacher: sum.diffTeacher,
      diffTotal: sum.diffTotal,
      diffTeacherPct: sum.diffTeacherPct,
      retireTotal: sum.retireTotal,
      contractAndRoyal: sum.contractTeacher + sum.royalDecreeTeacher,
      vacantDirector: sum.vacantDirector,
      vacantDeputy: sum.vacantDeputy,
      vacantTeacher: sum.vacantTeacher,
      vacantTotal: sum.vacantTotal,
      vacantSchools: sum.vacantSchools,
      deficitSchools: sum.deficitSchools,
      balancedSchools: sum.balancedSchools,
      surplusSchools: sum.surplusSchools,
    });
  }

  return summaries.sort((a, b) => b.students - a.students);
}

/**
 * Decodes an uploaded CSV File supporting both UTF-8 (with or without BOM)
 * and Windows-874 / TIS-620 (common for Excel exports on Thai Windows).
 */
export async function decodeCsvFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check UTF-8 BOM
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  // Try strict UTF-8 first
  try {
    const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (utf8.includes('รหัสโรงเรียน') || utf8.includes('ชื่อโรงเรียน') || /[\u0E00-\u0E7F]/.test(utf8)) {
      return utf8;
    }
  } catch {
    // Fallback to windows-874
  }

  try {
    return new TextDecoder('windows-874').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}
