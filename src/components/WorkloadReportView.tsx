import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Calculator,
  CalendarDays,
  Database,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { SCHOOLMIS_2569_2_RECORDS } from '../data/schoolmis2569_2';
import {
  THAI_MONTHS,
  type SchoolStaffingRecord,
  type SchoolStudentBreakdown,
  type SupabaseStatus,
} from '../types/staffing';
import { parseJsonResponse } from '../utils/api';
import { decodeCsvFile } from '../utils/csvParser';
import { formatNumber } from '../utils/formatters';
import { breakdownToGradeCounts, parseSchoolMisCsv } from '../utils/schoolmisParser';
import { exportWorkloadExcel } from '../utils/workloadExcelExport';
import {
  ALL_GRADES,
  autoComputeRoomsFromStudents,
  buildDefaultStaffingFromRecord,
  computeWorkloadTotals,
  createEmptyGradeCounts,
  formatSchoolFullName,
  LOWER_SECONDARY_GRADES,
  PRE_PRIMARY_GRADES,
  PRIMARY_GRADES,
  UPPER_SECONDARY_GRADES,
  type GradeCountsMap,
  type GradeKey,
  type SavedSchoolWorkload,
  type WorkloadSignOffMeta,
  type WorkloadStaffingInput,
} from '../utils/workloadFormTypes';

interface WorkloadReportViewProps {
  records: SchoolStaffingRecord[];
  buddhistYear?: number;
  supabaseStatus?: SupabaseStatus | null;
  initialBreakdowns?: SchoolStudentBreakdown[] | null;
  initialBreakdownMode?: 'supabase' | 'preview';
  onOpenSetup?: () => void;
}

const STORAGE_SCHOOLS_KEY = 'workload_report_schools_v1';
const STORAGE_META_KEY = 'workload_report_meta_v1';

function readStoredMap(): Record<string, SavedSchoolWorkload> {
  try {
    const raw = localStorage.getItem(STORAGE_SCHOOLS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SavedSchoolWorkload>;
  } catch {
    return {};
  }
}

function readStoredMeta(defaultYear: number): WorkloadSignOffMeta {
  const fallback: WorkloadSignOffMeta = {
    note: `ข้อมูลนักเรียนและข้อมูลอัตรากำลังครู ณ ปัจจุบัน ทั้งนี้ ให้หักอัตราเกษียณอายุราชการ ปี ${defaultYear}`,
    signerName: 'นางสาวกชนิภา คำมาสาร',
    signerPosition: 'ผู้อำนวยการกลุ่มบริหารงานบุคคล',
    signDate: `วันที่ 21 เดือน ตุลาคม พ.ศ. ${defaultYear}`,
  };
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<WorkloadSignOffMeta>;
    return {
      note: parsed.note ?? fallback.note,
      signerName: parsed.signerName ?? fallback.signerName,
      signerPosition: parsed.signerPosition ?? fallback.signerPosition,
      signDate: parsed.signDate ?? fallback.signDate,
    };
  } catch {
    return fallback;
  }
}

function formatThaiTodayDate(): string {
  const now = new Date();
  const day = now.getDate();
  const monthLabel =
    THAI_MONTHS.find((m) => m.value === now.getMonth() + 1)?.label ?? 'มกราคม';
  const buddhistYear = now.getFullYear() + 543;
  return `วันที่ ${day} เดือน ${monthLabel} พ.ศ. ${buddhistYear}`;
}

function hasAnyGradeCount(grades?: GradeCountsMap): boolean {
  if (!grades) return false;
  return ALL_GRADES.some(
    (g) => (grades[g.key]?.students ?? 0) > 0 || (grades[g.key]?.rooms ?? 0) > 0
  );
}

export function WorkloadReportView({
  records,
  buddhistYear = 2569,
  supabaseStatus = null,
  initialBreakdowns = null,
  initialBreakdownMode = 'preview',
  onOpenSetup,
}: WorkloadReportViewProps) {
  const [schoolSearch, setSchoolSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [storedByCode, setStoredByCode] = useState<Record<string, SavedSchoolWorkload>>(
    () => readStoredMap()
  );
  const [studentBreakdowns, setStudentBreakdowns] = useState<SchoolStudentBreakdown[]>(
    () => (initialBreakdowns && initialBreakdowns.length > 0 ? initialBreakdowns : SCHOOLMIS_2569_2_RECORDS)
  );
  const [breakdownSource, setBreakdownSource] = useState<'supabase' | 'preview'>(initialBreakdownMode);
  const [uploadingMis, setUploadingMis] = useState(false);
  const [meta, setMeta] = useState<WorkloadSignOffMeta>(() =>
    readStoredMeta(buddhistYear)
  );
  const [showMetaEditor, setShowMetaEditor] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [calcFeedback, setCalcFeedback] = useState<{
    type: 'success' | 'warning';
    text: string;
  } | null>(null);
  const firstStudentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialBreakdowns && initialBreakdowns.length > 0) {
      setStudentBreakdowns(initialBreakdowns);
      setBreakdownSource(initialBreakdownMode);
    }
  }, [initialBreakdowns, initialBreakdownMode]);

  useEffect(() => {
    let cancelled = false;
    async function loadBreakdowns() {
      try {
        const res = await fetch('/api/student-breakdowns?semester=2569-2');
        if (!res.ok) return;
        const data = await parseJsonResponse<{
          mode?: 'supabase' | 'preview';
          records?: SchoolStudentBreakdown[];
        }>(res);
        if (!cancelled && Array.isArray(data.records) && data.records.length > 0) {
          setStudentBreakdowns(data.records);
          setBreakdownSource(data.mode === 'supabase' ? 'supabase' : 'preview');
        }
      } catch {
        // Keep bundled SchoolMIS 2569/2 fallback records silently
      }
    }
    loadBreakdowns();
    return () => {
      cancelled = true;
    };
  }, [supabaseStatus?.studentBreakdownReady]);

  const breakdownByCode = useMemo(
    () => new Map(studentBreakdowns.map((b) => [b.school_code, b])),
    [studentBreakdowns]
  );

  const filteredSchools = useMemo(() => {
    const q = schoolSearch.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      `${r.school_code} ${r.school_name} ${r.subdistrict} ${r.district}`
        .toLowerCase()
        .includes(q)
    );
  }, [records, schoolSearch]);

  useEffect(() => {
    if (records.length === 0) {
      setSelectedCode('');
      return;
    }
    if (!selectedCode || !records.some((r) => r.school_code === selectedCode)) {
      setSelectedCode(records[0].school_code);
    }
  }, [records, selectedCode]);

  const school = useMemo(
    () =>
      records.find((r) => r.school_code === selectedCode) ?? records[0] ?? null,
    [records, selectedCode]
  );

  const schoolBreakdown = school ? breakdownByCode.get(school.school_code) : undefined;
  const savedEntry = school ? storedByCode[school.school_code] : undefined;
  const grades: GradeCountsMap = hasAnyGradeCount(savedEntry?.grades)
    ? savedEntry!.grades
    : schoolBreakdown
      ? breakdownToGradeCounts(schoolBreakdown)
      : createEmptyGradeCounts();
  const deductRetire = savedEntry?.deductRetire ?? false;

  const staffing: WorkloadStaffingInput = useMemo(() => {
    if (!school) {
      return {
        j18Director: 0,
        j18Deputy: 0,
        j18Teacher: 0,
        criteriaDirector: 0,
        criteriaDeputy: 0,
        criteriaTeacher: 0,
      };
    }
    const base = buildDefaultStaffingFromRecord(school, deductRetire);
    return {
      ...base,
      ...(savedEntry?.staffingOverride ?? {}),
    };
  }, [school, deductRetire, savedEntry?.staffingOverride]);

  const totals = useMemo(() => computeWorkloadTotals(grades), [grades]);

  function updateSchoolState(
    updater: (prev: SavedSchoolWorkload) => SavedSchoolWorkload
  ) {
    if (!school) return;
    const fallbackGrades = schoolBreakdown
      ? breakdownToGradeCounts(schoolBreakdown)
      : createEmptyGradeCounts();

    setStoredByCode((prev) => {
      const existing = prev[school.school_code];
      const current: SavedSchoolWorkload = existing
        ? {
            ...existing,
            grades: hasAnyGradeCount(existing.grades) ? existing.grades : fallbackGrades,
          }
        : {
            grades: fallbackGrades,
            deductRetire: false,
          };
      const updated = {
        ...prev,
        [school.school_code]: updater(current),
      };
      try {
        localStorage.setItem(STORAGE_SCHOOLS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage quota issues
      }
      return updated;
    });
  }

  function handleGradeChange(
    key: GradeKey,
    field: 'students' | 'rooms',
    rawValue: string
  ) {
    const val = Math.max(0, Number.parseInt(rawValue || '0', 10) || 0);
    const maxPerRoom =
      ALL_GRADES.find((g) => g.key === key)?.maxPerRoom ?? 36;

    setCalcFeedback(null);
    updateSchoolState((prev) => {
      const current = prev.grades[key];
      const nextGrade =
        field === 'students'
          ? {
              students: val,
              rooms: val > 0 ? Math.ceil(val / maxPerRoom) : 0,
            }
          : {
              ...current,
              rooms: val,
            };

      return {
        ...prev,
        grades: {
          ...prev.grades,
          [key]: nextGrade,
        },
      };
    });
  }

  function handleAutoComputeRooms() {
    if (!school) return;
    if (totals.grandTotal.students === 0) {
      setCalcFeedback({
        type: 'warning',
        text: `ยังไม่ได้กรอกจำนวนนักเรียนรายชั้น (ทุกชั้นเป็น 0) — กรุณากรอกจำนวนนักเรียนในช่องสีขาวรายชั้น ระบบจะคำนวณจำนวนห้องเรียนให้อัตโนมัติทันที (ยอดในระบบ: ${formatNumber(school.students_count)} นร. / ${formatNumber(school.classrooms_count)} ห้อง)`,
      });
      firstStudentInputRef.current?.focus();
      firstStudentInputRef.current?.select();
      return;
    }

    const nextGrades = autoComputeRoomsFromStudents(grades);
    const nextTotals = computeWorkloadTotals(nextGrades);
    updateSchoolState((prev) => ({
      ...prev,
      grades: autoComputeRoomsFromStudents(prev.grades),
    }));
    setCalcFeedback({
      type: 'success',
      text: `คำนวณจำนวนห้องเรียนตามเกณฑ์เรียบร้อยแล้ว (รวม ${formatNumber(nextTotals.grandTotal.students)} นร. · ${formatNumber(nextTotals.grandTotal.rooms)} ห้องเรียน)`,
    });
  }

  function handleToggleDeductRetire(checked: boolean) {
    updateSchoolState((prev) => ({
      ...prev,
      deductRetire: checked,
      staffingOverride: undefined,
    }));
  }

  function handleStaffingChange(
    field: keyof WorkloadStaffingInput,
    rawValue: string
  ) {
    const val = Math.max(0, Number.parseInt(rawValue || '0', 10) || 0);
    updateSchoolState((prev) => ({
      ...prev,
      staffingOverride: {
        ...(prev.staffingOverride ?? {}),
        [field]: val,
      },
    }));
  }

  function handleResetCurrentSchool() {
    if (!school) return;
    setCalcFeedback(null);
    setStoredByCode((prev) => {
      const next = { ...prev };
      delete next[school.school_code];
      try {
        localStorage.setItem(STORAGE_SCHOOLS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }

  function updateMeta(patch: Partial<WorkloadSignOffMeta>) {
    setMeta((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_META_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }

  async function handleExportExcel() {
    if (!school || exportingExcel) return;
    setExportingExcel(true);
    try {
      await exportWorkloadExcel({
        school,
        grades,
        staffing,
        meta,
      });
    } finally {
      setExportingExcel(false);
    }
  }

  function handlePrintPdf() {
    window.print();
  }

  async function handleUploadSchoolMisCsv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploadingMis) return;

    setUploadingMis(true);
    setCalcFeedback(null);
    try {
      const text = await decodeCsvFile(file);
      const parsed = parseSchoolMisCsv(text, {
        semester: '2569-2',
        sourceFilename: file.name,
      });

      setStudentBreakdowns(parsed.records);

      // Clear cached manual grade overrides for schools in the newly imported CSV
      const importedCodes = new Set(parsed.records.map((r) => r.school_code));
      setStoredByCode((prev) => {
        const next: Record<string, SavedSchoolWorkload> = {};
        for (const [code, entry] of Object.entries(prev)) {
          if (importedCodes.has(code)) {
            if (entry.deductRetire || entry.staffingOverride) {
              next[code] = {
                grades: createEmptyGradeCounts(),
                deductRetire: entry.deductRetire,
                staffingOverride: entry.staffingOverride,
              };
            }
          } else {
            next[code] = entry;
          }
        }
        try {
          localStorage.setItem(STORAGE_SCHOOLS_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota issues
        }
        return next;
      });

      const res = await fetch('/api/student-breakdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: '2569-2',
          source_filename: file.name,
          records: parsed.records,
        }),
      });
      const data = await parseJsonResponse<{
        mode?: 'supabase' | 'preview';
        records?: SchoolStudentBreakdown[];
        error?: string;
        detail?: string;
      }>(res);

      if (!res.ok) {
        throw new Error(data.error || data.detail || 'ไม่สามารถบันทึกข้อมูล SchoolMIS ลงฐานข้อมูลได้');
      }

      if (Array.isArray(data.records) && data.records.length > 0) {
        setStudentBreakdowns(data.records);
      }
      const mode = data.mode === 'supabase' ? 'supabase' : 'preview';
      setBreakdownSource(mode);

      setCalcFeedback({
        type: mode === 'supabase' ? 'success' : 'warning',
        text:
          mode === 'supabase'
            ? `นำเข้าข้อมูลนักเรียนแยกชั้นแยกห้อง ${formatNumber(parsed.totalSchools)} โรงเรียน (${formatNumber(parsed.totalStudents)} คน · ${formatNumber(parsed.totalRooms)} ห้อง) และบันทึกลง Supabase เรียบร้อยแล้ว`
            : `นำเข้าข้อมูล ${formatNumber(parsed.totalSchools)} โรงเรียน (${formatNumber(parsed.totalStudents)} คน · ${formatNumber(parsed.totalRooms)} ห้อง) ในหน้าจอแล้ว แต่ยังไม่ได้บันทึกลง Supabase (กรุณาสร้างตาราง school_student_breakdowns ใน Supabase SQL Editor)`,
      });
    } catch (err) {
      setCalcFeedback({
        type: 'warning',
        text: err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ SchoolMIS ได้',
      });
    } finally {
      setUploadingMis(false);
    }
  }

  if (!school) {
    return (
      <section className="rounded-lg border border-[#E5E7EB] bg-white p-10 text-center">
        <p className="text-base font-medium text-[#111827]">
          ไม่พบรายชื่อโรงเรียนตามตัวกรองที่เลือก
        </p>
        <p className="mt-1 text-sm text-[#6B7280]">
          กรุณาเลือกอำเภอหรือรีเซ็ตตัวกรองด้านบนเพื่อดูแบบรายงานปริมาณงานของสถานศึกษา
        </p>
      </section>
    );
  }

  const j18Total =
    staffing.j18Director + staffing.j18Deputy + staffing.j18Teacher;
  const criteriaTotal =
    staffing.criteriaDirector +
    staffing.criteriaDeputy +
    staffing.criteriaTeacher;
  const diffDir = staffing.j18Director - staffing.criteriaDirector;
  const diffDep = staffing.j18Deputy - staffing.criteriaDeputy;
  const diffTea = staffing.j18Teacher - staffing.criteriaTeacher;
  const diffTot = diffDir + diffDep + diffTea;

  return (
    <div className="space-y-5">
      {/* Override print orientation to A4 portrait single-page only while this tab is active */}
      <style media="print">{`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
      `}</style>

      {/* Top Controls (hidden when printing / saving PDF) */}
      <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 print:hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">
              แบบรายงานปริมาณงานของสถานศึกษา (รายโรงเรียน)
            </h1>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              เลือกโรงเรียนและกรอกจำนวนนักเรียน/ห้องเรียนรายชั้น ระบบคำนวณยอดรวมให้อัตโนมัติและส่งออก Excel หรือ PDF 1 หน้าได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label
              className={`inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] whitespace-nowrap shrink-0 ${
                uploadingMis ? 'pointer-events-none opacity-50' : ''
              }`}
              title="นำเข้าไฟล์ CSV รายงาน SchoolMIS แยกชั้นแยกห้อง (เช่น 2569-2-schoolmis-58010000.csv)"
            >
              <Upload className="h-4 w-4 text-[#1E3A8A]" aria-hidden="true" />
              <span>{uploadingMis ? 'กำลังนำเข้า...' : 'นำเข้า SchoolMIS (.csv)'}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleUploadSchoolMisCsv}
                disabled={uploadingMis}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#15803D] bg-[#16A34A] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#15803D] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>{exportingExcel ? 'กำลังสร้าง...' : 'ส่งออก Excel (.xlsx)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-[#1E3A8A] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF] whitespace-nowrap shrink-0"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>ดาวน์โหลด / พิมพ์ PDF (1 หน้า)</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#F3F4F6] pt-4 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              placeholder="ค้นหาชื่อโรงเรียน รหัส หรือตำบล..."
              className="h-10 w-full rounded-md border border-[#D1D5DB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <div className="lg:col-span-5">
            <select
              aria-label="เลือกสถานศึกษา"
              value={school.school_code}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="h-10 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
            >
              {filteredSchools.length === 0 ? (
                <option value={school.school_code}>
                  {school.school_name} (ไม่พบตามคำค้นหา)
                </option>
              ) : (
                filteredSchools.map((r) => (
                  <option key={r.school_code} value={r.school_code}>
                    {r.seq_no}. {r.school_name} · ต.{r.subdistrict} อ.{r.district}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:col-span-3 lg:justify-end">
            <button
              type="button"
              onClick={handleAutoComputeRooms}
              title="คำนวณจำนวนห้องเรียนจากจำนวนนักเรียนตามเกณฑ์มาตรฐาน (อนุบาล 30 / ประถม 36 / มัธยม 40)"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] whitespace-nowrap"
            >
              <Calculator className="h-4 w-4 text-[#6B7280]" aria-hidden="true" />
              <span>คำนวณห้องอัตโนมัติ</span>
            </button>
            <button
              type="button"
              onClick={handleResetCurrentSchool}
              title={
                schoolBreakdown
                  ? 'คืนค่าข้อมูลนักเรียน/ห้องเรียนกลับเป็นข้อมูล SchoolMIS เริ่มต้น'
                  : 'ล้างข้อมูลที่กรอกสำหรับโรงเรียนนี้'
              }
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#111827] whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>{schoolBreakdown ? 'คืนค่า SchoolMIS' : 'รีเซ็ต'}</span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[#374151]">
              <input
                type="checkbox"
                checked={deductRetire}
                onChange={(e) => handleToggleDeductRetire(e.target.checked)}
                className="h-4 w-4 rounded border-[#D1D5DB] text-[#1E3A8A]"
              />
              <span>
                หักอัตราเกษียณอายุราชการออกจาก จ.18
                {school.retire_total > 0
                  ? ` (เกษียณ ${formatNumber(school.retire_total)} อัตรา)`
                  : ' (ไม่มีผู้เกษียณ)'}
              </span>
            </label>

            <span className="text-xs text-[#6B7280] tabular-nums">
              {schoolBreakdown ? (
                <>
                  SchoolMIS 2569/2: {formatNumber(schoolBreakdown.total_students)} นร.
                  (ช {formatNumber(schoolBreakdown.total_male)} / ญ {formatNumber(schoolBreakdown.total_female)}) ·{' '}
                  {formatNumber(schoolBreakdown.total_rooms)} ห้อง
                </>
              ) : (
                <>
                  ยอดในระบบ: {formatNumber(school.students_count)} นร. ·{' '}
                  {formatNumber(school.classrooms_count)} ห้องเรียน
                </>
              )}
              {totals.grandTotal.students > 0 && (
                <>
                  {' '}
                  | ในฟอร์ม: {formatNumber(totals.grandTotal.students)} นร. ·{' '}
                  {formatNumber(totals.grandTotal.rooms)} ห้อง
                  {totals.grandTotal.students === school.students_count &&
                  totals.grandTotal.rooms === school.classrooms_count ? (
                    <span className="ml-1.5 font-medium text-[#15803D]">
                      (ตรงกับ จ.18 ✓)
                    </span>
                  ) : (
                    <span className="ml-1.5 font-medium text-[#B45309]">
                      (ต่างจาก จ.18 นร. {totals.grandTotal.students - school.students_count > 0 ? '+' : ''}
                      {formatNumber(totals.grandTotal.students - school.students_count)}, ห้อง{' '}
                      {totals.grandTotal.rooms - school.classrooms_count > 0 ? '+' : ''}
                      {formatNumber(totals.grandTotal.rooms - school.classrooms_count)})
                    </span>
                  )}
                </>
              )}
            </span>

            {breakdownSource === 'supabase' ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                <span>ข้อมูลแยกชั้นจาก Supabase</span>
              </span>
            ) : supabaseStatus?.tablesReady && !supabaseStatus?.studentBreakdownReady && onOpenSetup ? (
              <button
                type="button"
                onClick={onOpenSetup}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#B45309] hover:underline"
              >
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                <span>ยังไม่ได้สร้างตาราง SchoolMIS ใน Supabase (ดู SQL)</span>
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setShowMetaEditor((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E3A8A] hover:underline"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>{showMetaEditor ? 'ซ่อนการตั้งค่าผู้ลงนาม/หมายเหตุ' : 'แก้ไขหมายเหตุและผู้ลงนามรับรอง'}</span>
          </button>
        </div>

        {calcFeedback && (
          <div
            role="status"
            className={`mt-3 rounded-md border px-3 py-2 text-xs font-medium ${
              calcFeedback.type === 'warning'
                ? 'border-[#FCD34D] bg-[#FFFBEB] text-[#92400E]'
                : 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
            }`}
          >
            {calcFeedback.text}
          </div>
        )}

        {showMetaEditor && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#F3F4F6] pt-4 sm:grid-cols-2 lg:grid-cols-12">
            <div className="sm:col-span-2 lg:col-span-12">
              <label className="block text-xs font-medium text-[#4B5563]">
                ข้อความหมายเหตุ (ตัวหนังสือสีแดง)
              </label>
              <input
                type="text"
                value={meta.note}
                onChange={(e) => updateMeta({ note: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-[#D1D5DB] px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
            <div className="lg:col-span-4">
              <label className="block text-xs font-medium text-[#4B5563]">
                ชื่อผู้ลงนามรับรอง
              </label>
              <input
                type="text"
                value={meta.signerName}
                onChange={(e) => updateMeta({ signerName: e.target.value })}
                placeholder="เช่น นางสาวกชนิภา คำมาสาร"
                className="mt-1 h-9 w-full rounded-md border border-[#D1D5DB] px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
            <div className="lg:col-span-4">
              <label className="block text-xs font-medium text-[#4B5563]">ตำแหน่ง</label>
              <input
                type="text"
                value={meta.signerPosition}
                onChange={(e) => updateMeta({ signerPosition: e.target.value })}
                placeholder="เช่น ผู้อำนวยการกลุ่มบริหารงานบุคคล"
                className="mt-1 h-9 w-full rounded-md border border-[#D1D5DB] px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-medium text-[#4B5563]">
                  วันที่ลงนามรับรอง
                </label>
                <button
                  type="button"
                  onClick={() => updateMeta({ signDate: formatThaiTodayDate() })}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:underline"
                >
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>ใช้วันที่วันนี้</span>
                </button>
              </div>
              <input
                type="text"
                value={meta.signDate}
                onChange={(e) => updateMeta({ signDate: e.target.value })}
                placeholder="เช่น วันที่ 21 เดือน ตุลาคม พ.ศ. 2569"
                className="mt-1 h-9 w-full rounded-md border border-[#D1D5DB] px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>
        )}
      </section>

      {/* Official Single-Page A4 Portrait Form Sheet */}
      <section
        aria-label="แบบฟอร์มรายงานปริมาณงานของสถานศึกษา"
        className="font-sarabun mx-auto w-full max-w-[820px] rounded-lg border border-[#D1D5DB] bg-white p-5 text-[#000000] shadow-xs sm:p-8 print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        {/* Title Banner */}
        <div className="bg-[#B7DEE8] py-1.5 text-center text-[20px] font-bold tracking-tight print:py-1 print:text-[17px]">
          แบบรายงานปริมาณงานของสถานศึกษา
        </div>

        {/* Section 1: School Identity */}
        <div className="mt-3.5 space-y-0.5 text-[17px] leading-[1.3] print:mt-2.5 print:text-[14.5px] print:leading-[1.2]">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 sm:col-span-5 print:col-span-5">
              <span className="mr-3">1.</span>
              <span>{formatSchoolFullName(school.school_name)}</span>
            </div>
            <div className="col-span-6 sm:col-span-3 print:col-span-3">
              ตำบล{school.subdistrict || '—'}
            </div>
            <div className="col-span-6 sm:col-span-4 print:col-span-4">
              อำเภอ{school.district || '—'}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 sm:col-span-5 print:col-span-5">
              <span className="mr-3 opacity-0 select-none">1.</span>
              <span>จังหวัด{school.province || 'แม่ฮ่องสอน'}</span>
            </div>
            <div className="col-span-12 sm:col-span-7 print:col-span-7">
              สำนักงานเขตพื้นที่การศึกษาประถมศึกษาแม่ฮ่องสอน เขต 1
            </div>
          </div>
        </div>

        {/* Section 2: Classrooms & Students */}
        <div className="mt-2.5 print:mt-2">
          <p className="text-[17px] leading-[1.3] print:text-[14.5px] print:leading-[1.2]">
            2. รายละเอียดเกี่ยวกับห้องเรียนและนักเรียน
          </p>

          <div className="mt-2 grid grid-cols-1 items-start gap-5 md:grid-cols-2 print:mt-1.5 print:grid-cols-2 print:gap-5">
            {/* Left Table: Pre-Primary & Primary */}
            <table className="w-full border-collapse border border-black text-center text-[16px] leading-[1.2] tabular-nums print:text-[13.5px] print:leading-[1.15]">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th className="w-[52%] border-r border-black px-2 py-1 print:py-0.5">
                    ชั้นเรียน
                  </th>
                  <th className="w-[24%] border-r border-black px-1.5 py-1 leading-tight print:py-0.5">
                    จำนวน
                    <br />
                    นักเรียน
                  </th>
                  <th className="w-[24%] px-1.5 py-1 leading-tight print:py-0.5">
                    จำนวน
                    <br />
                    ห้องเรียน
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRE_PRIMARY_GRADES.map((g, idx) => (
                  <tr
                    key={g.key}
                    className={`h-[28px] print:h-[22px] ${
                      idx < PRE_PRIMARY_GRADES.length - 1
                        ? 'border-b border-dotted border-black'
                        : 'border-b border-black'
                    }`}
                  >
                    <td className="border-r border-black px-2 py-0 align-middle">
                      {g.label}
                    </td>
                    <td className="border-r border-black p-0 align-middle">
                      <input
                        ref={idx === 0 ? firstStudentInputRef : undefined}
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${g.label} จำนวนนักเรียน`}
                        value={grades[g.key].students}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleGradeChange(g.key, 'students', e.target.value)
                        }
                        className="no-spinner h-full w-full bg-transparent px-1.5 py-0 text-center tabular-nums leading-none focus:bg-[#EFF6FF] focus:outline-none print:hidden"
                      />
                      <span className="hidden tabular-nums print:inline">
                        {formatNumber(grades[g.key].students)}
                      </span>
                    </td>
                    <td className="bg-[#FFFF00] p-0 align-middle">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${g.label} จำนวนห้องเรียน`}
                        value={grades[g.key].rooms}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleGradeChange(g.key, 'rooms', e.target.value)
                        }
                        className="no-spinner h-full w-full bg-transparent px-1.5 py-0 text-center tabular-nums leading-none focus:bg-[#FEF08A] focus:outline-none print:hidden"
                      />
                      <span className="hidden tabular-nums print:inline">
                        {formatNumber(grades[g.key].rooms)}
                      </span>
                    </td>
                  </tr>
                ))}

                <tr className="h-[28px] border-b border-black bg-[#FFFF00] font-bold print:h-[22px]">
                  <td className="border-r border-black px-2 py-0 align-middle">
                    รวมก่อนประถมศึกษา
                  </td>
                  <td className="border-r border-black px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.prePrimary.students)}
                  </td>
                  <td className="px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.prePrimary.rooms)}
                  </td>
                </tr>

                {PRIMARY_GRADES.map((g, idx) => (
                  <tr
                    key={g.key}
                    className={`h-[28px] print:h-[22px] ${
                      idx < PRIMARY_GRADES.length - 1
                        ? 'border-b border-dotted border-black'
                        : 'border-b border-black'
                    }`}
                  >
                    <td className="border-r border-black px-2 py-0 align-middle">
                      {g.label}
                    </td>
                    <td className="border-r border-black p-0 align-middle">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${g.label} จำนวนนักเรียน`}
                        value={grades[g.key].students}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleGradeChange(g.key, 'students', e.target.value)
                        }
                        className="no-spinner h-full w-full bg-transparent px-1.5 py-0 text-center tabular-nums leading-none focus:bg-[#EFF6FF] focus:outline-none print:hidden"
                      />
                      <span className="hidden tabular-nums print:inline">
                        {formatNumber(grades[g.key].students)}
                      </span>
                    </td>
                    <td className="bg-[#FFFF00] p-0 align-middle">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${g.label} จำนวนห้องเรียน`}
                        value={grades[g.key].rooms}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleGradeChange(g.key, 'rooms', e.target.value)
                        }
                        className="no-spinner h-full w-full bg-transparent px-1.5 py-0 text-center tabular-nums leading-none focus:bg-[#FEF08A] focus:outline-none print:hidden"
                      />
                      <span className="hidden tabular-nums print:inline">
                        {formatNumber(grades[g.key].rooms)}
                      </span>
                    </td>
                  </tr>
                ))}

                <tr className="h-[28px] border-b border-black bg-[#FFFF00] font-bold print:h-[22px]">
                  <td className="border-r border-black px-2 py-0 align-middle">
                    รวมประถมศึกษา
                  </td>
                  <td className="border-r border-black px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.primary.students)}
                  </td>
                  <td className="px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.primary.rooms)}
                  </td>
                </tr>

                <tr className="h-[28px] bg-[#FFFF00] font-bold print:h-[22px]">
                  <td className="border-r border-black px-2 py-0 align-middle">
                    รวมประถมศึกษาทั้งสิ้น
                  </td>
                  <td className="border-r border-black px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.primaryAll.students)}
                  </td>
                  <td className="px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.primaryAll.rooms)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Right Table: Secondary & Grand Total */}
            <table className="w-full border-collapse border border-black text-center text-[16px] leading-[1.2] tabular-nums print:text-[13.5px] print:leading-[1.15]">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th className="w-[52%] border-r border-black px-2 py-1 print:py-0.5">
                    ชั้นเรียน
                  </th>
                  <th className="w-[24%] border-r border-black px-1.5 py-1 leading-tight print:py-0.5">
                    จำนวน
                    <br />
                    นักเรียน
                  </th>
                  <th className="w-[24%] px-1.5 py-1 leading-tight print:py-0.5">
                    จำนวน
                    <br />
                    ห้องเรียน
                  </th>
                </tr>
              </thead>
              <tbody>
                {LOWER_SECONDARY_GRADES.map((g, idx) => (
                  <tr
                    key={g.key}
                    className={`h-[28px] print:h-[22px] ${
                      idx < LOWER_SECONDARY_GRADES.length - 1
                        ? 'border-b border-dotted border-black'
                        : 'border-b border-black'
                    }`}
                  >
                    <td className="border-r border-black px-2 py-0 align-middle">
                      {g.label}
                    </td>
                    <td className="border-r border-black p-0 align-middle">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${g.label} จำนวนนักเรียน`}
                        value={grades[g.key].students}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleGradeChange(g.key, 'students', e.target.value)
                        }
                        className="no-spinner h-full w-full bg-transparent px-1.5 py-0 text-center tabular-nums leading-none focus:bg-[#EFF6FF] focus:outline-none print:hidden"
                      />
                      <span className="hidden tabular-nums print:inline">
                        {formatNumber(grades[g.key].students)}
                      </span>
                    </td>
                    <td className="bg-[#FFFF00] p-0 align-middle">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${g.label} จำนวนห้องเรียน`}
                        value={grades[g.key].rooms}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleGradeChange(g.key, 'rooms', e.target.value)
                        }
                        className="no-spinner h-full w-full bg-transparent px-1.5 py-0 text-center tabular-nums leading-none focus:bg-[#FEF08A] focus:outline-none print:hidden"
                      />
                      <span className="hidden tabular-nums print:inline">
                        {formatNumber(grades[g.key].rooms)}
                      </span>
                    </td>
                  </tr>
                ))}

                <tr className="h-[28px] border-b border-black bg-[#FFFF00] font-bold print:h-[22px]">
                  <td className="border-r border-black px-2 py-0 align-middle">
                    รวมมัธยมต้น
                  </td>
                  <td className="border-r border-black px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.lowerSec.students)}
                  </td>
                  <td className="px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.lowerSec.rooms)}
                  </td>
                </tr>

                {UPPER_SECONDARY_GRADES.map((g, idx) => (
                  <tr
                    key={g.key}
                    className={`h-[28px] print:h-[22px] ${
                      idx < UPPER_SECONDARY_GRADES.length - 1
                        ? 'border-b border-dotted border-black'
                        : 'border-b border-black'
                    }`}
                  >
                    <td className="border-r border-black px-2 py-0 align-middle">
                      {g.label}
                    </td>
                    <td className="border-r border-black p-0 align-middle">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${g.label} จำนวนนักเรียน`}
                        value={grades[g.key].students}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleGradeChange(g.key, 'students', e.target.value)
                        }
                        className="no-spinner h-full w-full bg-transparent px-1.5 py-0 text-center tabular-nums leading-none focus:bg-[#EFF6FF] focus:outline-none print:hidden"
                      />
                      <span className="hidden tabular-nums print:inline">
                        {formatNumber(grades[g.key].students)}
                      </span>
                    </td>
                    <td className="bg-[#FFFF00] p-0 align-middle">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`${g.label} จำนวนห้องเรียน`}
                        value={grades[g.key].rooms}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          handleGradeChange(g.key, 'rooms', e.target.value)
                        }
                        className="no-spinner h-full w-full bg-transparent px-1.5 py-0 text-center tabular-nums leading-none focus:bg-[#FEF08A] focus:outline-none print:hidden"
                      />
                      <span className="hidden tabular-nums print:inline">
                        {formatNumber(grades[g.key].rooms)}
                      </span>
                    </td>
                  </tr>
                ))}

                <tr className="h-[28px] border-b border-black bg-[#FFFF00] font-bold print:h-[22px]">
                  <td className="border-r border-black px-2 py-0 align-middle">
                    รวมมัธยมปลาย
                  </td>
                  <td className="border-r border-black px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.upperSec.students)}
                  </td>
                  <td className="px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.upperSec.rooms)}
                  </td>
                </tr>

                <tr className="h-[28px] border-b border-black bg-[#FFFF00] font-bold print:h-[22px]">
                  <td className="border-r border-black px-2 py-0 align-middle">
                    รวมมัธยมศึกษาทั้งสิ้น
                  </td>
                  <td className="border-r border-black px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.secondaryAll.students)}
                  </td>
                  <td className="px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.secondaryAll.rooms)}
                  </td>
                </tr>

                <tr className="h-[28px] bg-[#FFFF00] font-bold print:h-[22px]">
                  <td className="border-r border-black px-2 py-0 align-middle">
                    รวมทั้งสิ้น
                  </td>
                  <td className="border-r border-black px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.grandTotal.students)}
                  </td>
                  <td className="px-1.5 py-0 align-middle tabular-nums">
                    {formatNumber(totals.grandTotal.rooms)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Teacher Staffing */}
        <div className="mt-3 print:mt-2.5">
          <p className="text-[17px] leading-[1.3] print:text-[14.5px] print:leading-[1.2]">
            3. อัตรากำลังข้าราชการครูฯ
          </p>

          <div className="mt-1.5 overflow-x-auto print:mt-1">
            <table className="w-full max-w-[540px] border-collapse text-center text-[16px] leading-[1.2] tabular-nums print:max-w-[480px] print:text-[13.5px] print:leading-[1.15]">
              <thead>
                <tr>
                  <th className="w-[26%] px-2 py-1 text-left font-normal print:py-0.5" />
                  <th className="w-[19%] border border-black px-2 py-1 font-bold leading-tight print:py-0.5">
                    ผอ.
                    <br />
                    สถานศึกษา
                  </th>
                  <th className="w-[19%] border border-black px-2 py-1 font-bold leading-tight print:py-0.5">
                    รอง ผอ.
                    <br />
                    สถานศึกษา
                  </th>
                  <th className="w-[18%] border border-black px-2 py-1 font-bold print:py-0.5">
                    ครูผู้สอน
                  </th>
                  <th className="w-[18%] border border-black px-2 py-1 font-bold print:py-0.5">
                    รวม
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-[30px] print:h-[24px]">
                  <td className="px-2 py-0 text-left align-middle">ครูตาม จ.18</td>
                  <td className="border border-black p-0 align-middle">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label="ครูตาม จ.18 ผอ."
                      value={staffing.j18Director}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        handleStaffingChange('j18Director', e.target.value)
                      }
                      className="no-spinner h-full w-full bg-transparent px-2 py-0 text-center tabular-nums leading-none focus:bg-[#EFF6FF] focus:outline-none print:hidden"
                    />
                    <span className="hidden tabular-nums print:inline">
                      {formatNumber(staffing.j18Director)}
                    </span>
                  </td>
                  <td className="border border-black p-0 align-middle">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label="ครูตาม จ.18 รอง ผอ."
                      value={staffing.j18Deputy}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        handleStaffingChange('j18Deputy', e.target.value)
                      }
                      className="no-spinner h-full w-full bg-transparent px-2 py-0 text-center tabular-nums leading-none focus:bg-[#EFF6FF] focus:outline-none print:hidden"
                    />
                    <span className="hidden tabular-nums print:inline">
                      {formatNumber(staffing.j18Deputy)}
                    </span>
                  </td>
                  <td className="border border-black p-0 align-middle">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label="ครูตาม จ.18 ครูผู้สอน"
                      value={staffing.j18Teacher}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        handleStaffingChange('j18Teacher', e.target.value)
                      }
                      className="no-spinner h-full w-full bg-transparent px-2 py-0 text-center tabular-nums leading-none focus:bg-[#EFF6FF] focus:outline-none print:hidden"
                    />
                    <span className="hidden tabular-nums print:inline">
                      {formatNumber(staffing.j18Teacher)}
                    </span>
                  </td>
                  <td className="border border-black bg-[#FFFF00] px-2 py-0 align-middle font-bold tabular-nums">
                    {formatNumber(j18Total)}
                  </td>
                </tr>

                <tr className="h-[30px] print:h-[24px]">
                  <td className="px-2 py-0 text-left align-middle">ครูตามเกณฑ์</td>
                  <td className="border border-black bg-[#FFFF00] p-0 align-middle">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label="ครูตามเกณฑ์ ผอ."
                      value={staffing.criteriaDirector}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        handleStaffingChange('criteriaDirector', e.target.value)
                      }
                      className="no-spinner h-full w-full bg-transparent px-2 py-0 text-center tabular-nums leading-none focus:bg-[#FEF08A] focus:outline-none print:hidden"
                    />
                    <span className="hidden tabular-nums print:inline">
                      {formatNumber(staffing.criteriaDirector)}
                    </span>
                  </td>
                  <td className="border border-black bg-[#FFFF00] p-0 align-middle">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label="ครูตามเกณฑ์ รอง ผอ."
                      value={staffing.criteriaDeputy}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        handleStaffingChange('criteriaDeputy', e.target.value)
                      }
                      className="no-spinner h-full w-full bg-transparent px-2 py-0 text-center tabular-nums leading-none focus:bg-[#FEF08A] focus:outline-none print:hidden"
                    />
                    <span className="hidden tabular-nums print:inline">
                      {formatNumber(staffing.criteriaDeputy)}
                    </span>
                  </td>
                  <td className="border border-black p-0 align-middle">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label="ครูตามเกณฑ์ ครูผู้สอน"
                      value={staffing.criteriaTeacher}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        handleStaffingChange('criteriaTeacher', e.target.value)
                      }
                      className="no-spinner h-full w-full bg-transparent px-2 py-0 text-center tabular-nums leading-none focus:bg-[#EFF6FF] focus:outline-none print:hidden"
                    />
                    <span className="hidden tabular-nums print:inline">
                      {formatNumber(staffing.criteriaTeacher)}
                    </span>
                  </td>
                  <td className="border border-black bg-[#FFFF00] px-2 py-0 align-middle font-bold tabular-nums">
                    {formatNumber(criteriaTotal)}
                  </td>
                </tr>

                <tr className="h-[30px] print:h-[24px]">
                  <td className="px-2 py-0 text-left align-middle">-ขาด/+เกิน</td>
                  <td className="border border-black bg-[#FFFF00] px-2 py-0 align-middle tabular-nums">
                    {diffDir}
                  </td>
                  <td className="border border-black bg-[#FFFF00] px-2 py-0 align-middle tabular-nums">
                    {diffDep}
                  </td>
                  <td className="border border-black bg-[#FFFF00] px-2 py-0 align-middle tabular-nums">
                    {diffTea}
                  </td>
                  <td className="border border-black bg-[#FFFF00] px-2 py-0 align-middle font-bold tabular-nums">
                    {diffTot}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Red Note (inline editable on screen, plain text on print) */}
        <div className="mt-3 flex items-baseline gap-2 text-[16px] font-bold text-[#FF0000] print:mt-2 print:text-[13.5px]">
          <span className="shrink-0">หมายเหตุ</span>
          <input
            type="text"
            aria-label="ข้อความหมายเหตุในแบบฟอร์ม"
            value={meta.note}
            onChange={(e) => updateMeta({ note: e.target.value })}
            className="min-w-0 flex-1 border-b border-dashed border-transparent bg-transparent px-1 py-0 text-[16px] font-bold text-[#FF0000] hover:border-[#FCA5A5] focus:border-[#FF0000] focus:bg-[#FEF2F2] focus:outline-none print:hidden"
          />
          <span className="hidden print:inline">{meta.note}</span>
        </div>

        {/* Certification Signature Box (inline editable name, position, date) */}
        <div className="mt-2.5 flex justify-end print:mt-2">
          <div className="w-full max-w-[310px] border border-black px-4 py-2.5 text-center text-[16px] leading-[1.35] print:max-w-[270px] print:py-2 print:text-[13.5px] print:leading-[1.25]">
            <p>ขอรับรองว่าข้อมูลถูกต้อง</p>
            <div className="h-6 print:h-5" />
            <p>ลงชื่อ ................................................</p>
            <div className="flex items-center justify-center">
              <span>(</span>
              <input
                type="text"
                aria-label="ชื่อผู้ลงนามในกล่องรับรอง"
                value={meta.signerName}
                onChange={(e) => updateMeta({ signerName: e.target.value })}
                className="w-[210px] border-b border-dashed border-transparent bg-transparent px-1 text-center text-[16px] text-[#000000] hover:border-[#9CA3AF] focus:border-[#1E3A8A] focus:bg-[#EFF6FF] focus:outline-none print:hidden"
              />
              <span className="hidden print:inline">{meta.signerName}</span>
              <span>)</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="shrink-0">ตำแหน่ง</span>
              <input
                type="text"
                aria-label="ตำแหน่งผู้ลงนามในกล่องรับรอง"
                value={meta.signerPosition}
                onChange={(e) => updateMeta({ signerPosition: e.target.value })}
                className="min-w-0 flex-1 border-b border-dashed border-transparent bg-transparent px-1 text-center text-[16px] text-[#000000] hover:border-[#9CA3AF] focus:border-[#1E3A8A] focus:bg-[#EFF6FF] focus:outline-none print:hidden"
              />
              <span className="hidden print:inline">{meta.signerPosition}</span>
            </div>
            <div>
              <input
                type="text"
                aria-label="วันที่ในกล่องรับรอง"
                value={meta.signDate}
                onChange={(e) => updateMeta({ signDate: e.target.value })}
                className="w-full border-b border-dashed border-transparent bg-transparent px-1 text-center text-[16px] text-[#000000] hover:border-[#9CA3AF] focus:border-[#1E3A8A] focus:bg-[#EFF6FF] focus:outline-none print:hidden"
              />
              <span className="hidden print:inline">{meta.signDate}</span>
            </div>
          </div>
        </div>

        {/* Yellow Formula Legend */}
        <div className="mt-2.5 flex items-center gap-3 text-[16px] print:mt-2 print:text-[13.5px]">
          <span
            className="inline-block h-5 w-20 shrink-0 border border-black bg-[#FFFF00] print:h-4 print:w-16"
            aria-hidden="true"
          />
          <span>คือ แถบสูตรการคำนวณ ห้ามลบหรือแก้ไข</span>
        </div>
      </section>
    </div>
  );
}
