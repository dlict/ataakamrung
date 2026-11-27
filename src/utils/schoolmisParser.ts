import Papa from 'papaparse';
import type { SchoolStudentBreakdown } from '../types/staffing';
import type { GradeCountsMap } from './workloadFormTypes';

function toInt(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0, Math.round(val));
  const cleaned = String(val ?? '')
    .replace(/,/g, '')
    .trim();
  if (!cleaned) return 0;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export interface ParsedSchoolMisResult {
  records: SchoolStudentBreakdown[];
  totalSchools: number;
  totalStudents: number;
  totalRooms: number;
}

export function parseSchoolMisCsv(
  csvText: string,
  options: { semester?: string; sourceFilename?: string } = {}
): ParsedSchoolMisResult {
  const semester = options.semester?.trim() || '2569-2';
  const sourceFilename = options.sourceFilename?.trim() || 'schoolmis.csv';

  const normalizedText = csvText.replace(/^\uFEFF/, '');
  const parsed = Papa.parse<Record<string, string>>(normalizedText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const fields = parsed.meta.fields ?? [];
  if (
    !fields.includes('รหัสโรงเรียน') ||
    !fields.includes('ชื่อโรงเรียน') ||
    (!fields.includes('รวมป.1') && !fields.includes('รวมอ.1'))
  ) {
    throw new Error(
      'รูปแบบไฟล์ไม่ตรงกับรายงาน SchoolMIS แยกชั้นแยกห้อง (ไม่พบคอลัมน์ รหัสโรงเรียน / ชื่อโรงเรียน / รวมอ.1 / รวมป.1)'
    );
  }

  const records: SchoolStudentBreakdown[] = [];
  let totalStudents = 0;
  let totalRooms = 0;

  for (const row of parsed.data) {
    const schoolCode = (row['รหัสโรงเรียน'] ?? '').trim();
    const schoolName = (row['ชื่อโรงเรียน'] ?? '').trim();
    if (!schoolCode || !schoolName) continue;

    const rec: SchoolStudentBreakdown = {
      semester,
      district_code: (row['รหัสเขต'] ?? '').trim() || '58010000',
      district_name: (row['ชื่อเขต'] ?? '').trim() || 'สพป.แม่ฮ่องสอน เขต 1',
      school_code: schoolCode,
      school_name: schoolName,
      source_filename: sourceFilename,

      k0_students: toInt(row['รวมอ.1']),
      k0_rooms: toInt(row['อ.1 ห้อง']),
      k1_students: toInt(row['รวมอ.2']),
      k1_rooms: toInt(row['อ.2 ห้อง']),
      k2_students: toInt(row['รวมอ.3']),
      k2_rooms: toInt(row['อ.3 ห้อง']),

      p1_students: toInt(row['รวมป.1']),
      p1_rooms: toInt(row['ป.1 ห้อง']),
      p2_students: toInt(row['รวมป.2']),
      p2_rooms: toInt(row['ป.2 ห้อง']),
      p3_students: toInt(row['รวมป.3']),
      p3_rooms: toInt(row['ป.3 ห้อง']),
      p4_students: toInt(row['รวมป.4']),
      p4_rooms: toInt(row['ป.4 ห้อง']),
      p5_students: toInt(row['รวมป.5']),
      p5_rooms: toInt(row['ป.5 ห้อง']),
      p6_students: toInt(row['รวมป.6']),
      p6_rooms: toInt(row['ป.6 ห้อง']),

      m1_students: toInt(row['รวมม.1']),
      m1_rooms: toInt(row['ม.1 ห้อง']),
      m2_students: toInt(row['รวมม.2']),
      m2_rooms: toInt(row['ม.2 ห้อง']),
      m3_students: toInt(row['รวมม.3']),
      m3_rooms: toInt(row['ม.3 ห้อง']),
      m4_students: toInt(row['รวมม.4']),
      m4_rooms: toInt(row['ม.4 ห้อง']),
      m5_students: toInt(row['รวมม.5']),
      m5_rooms: toInt(row['ม.5 ห้อง']),
      m6_students: toInt(row['รวมม.6']),
      m6_rooms: toInt(row['ม.6 ห้อง']),

      total_male: toInt(row['รวมทั้งหมด ชาย']),
      total_female: toInt(row['รวมทั้งหมด หญิง']),
      total_students: toInt(row['รวมทั้งหมด']),
      total_rooms: toInt(row['รวมห้องทั้งหมด']),
    };

    records.push(rec);
    totalStudents += rec.total_students;
    totalRooms += rec.total_rooms;
  }

  if (records.length === 0) {
    throw new Error('ไม่พบข้อมูลโรงเรียนในไฟล์ SchoolMIS นี้');
  }

  return {
    records,
    totalSchools: records.length,
    totalStudents,
    totalRooms,
  };
}

export function breakdownToGradeCounts(record: SchoolStudentBreakdown): GradeCountsMap {
  return {
    k0: { students: record.k0_students, rooms: record.k0_rooms },
    k1: { students: record.k1_students, rooms: record.k1_rooms },
    k2: { students: record.k2_students, rooms: record.k2_rooms },
    p1: { students: record.p1_students, rooms: record.p1_rooms },
    p2: { students: record.p2_students, rooms: record.p2_rooms },
    p3: { students: record.p3_students, rooms: record.p3_rooms },
    p4: { students: record.p4_students, rooms: record.p4_rooms },
    p5: { students: record.p5_students, rooms: record.p5_rooms },
    p6: { students: record.p6_students, rooms: record.p6_rooms },
    m1: { students: record.m1_students, rooms: record.m1_rooms },
    m2: { students: record.m2_students, rooms: record.m2_rooms },
    m3: { students: record.m3_students, rooms: record.m3_rooms },
    m4: { students: record.m4_students, rooms: record.m4_rooms },
    m5: { students: record.m5_students, rooms: record.m5_rooms },
    m6: { students: record.m6_students, rooms: record.m6_rooms },
  };
}
