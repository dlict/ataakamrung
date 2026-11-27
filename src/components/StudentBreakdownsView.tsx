import { useMemo, useState } from 'react';
import {
  Database,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  SchoolStaffingRecord,
  SchoolStudentBreakdown,
  SupabaseStatus,
} from '../types/staffing';
import { formatNumber } from '../utils/formatters';
import { normalizeSchoolName } from '../utils/schoolmisParser';
import { exportStudentBreakdownExcel } from '../utils/studentBreakdownExcelExport';

type GradeGroupFilter = 'all' | 'pre' | 'primary' | 'secondary';

interface GradeColDef {
  key: string;
  label: string;
  group: 'pre' | 'primary' | 'secondary';
  getStudents: (r: SchoolStudentBreakdown) => number;
  getRooms: (r: SchoolStudentBreakdown) => number;
}

const GRADE_COLUMNS: GradeColDef[] = [
  { key: 'k0', label: 'อ.1', group: 'pre', getStudents: (r) => r.k0_students, getRooms: (r) => r.k0_rooms },
  { key: 'k1', label: 'อ.2', group: 'pre', getStudents: (r) => r.k1_students, getRooms: (r) => r.k1_rooms },
  { key: 'k2', label: 'อ.3', group: 'pre', getStudents: (r) => r.k2_students, getRooms: (r) => r.k2_rooms },
  { key: 'p1', label: 'ป.1', group: 'primary', getStudents: (r) => r.p1_students, getRooms: (r) => r.p1_rooms },
  { key: 'p2', label: 'ป.2', group: 'primary', getStudents: (r) => r.p2_students, getRooms: (r) => r.p2_rooms },
  { key: 'p3', label: 'ป.3', group: 'primary', getStudents: (r) => r.p3_students, getRooms: (r) => r.p3_rooms },
  { key: 'p4', label: 'ป.4', group: 'primary', getStudents: (r) => r.p4_students, getRooms: (r) => r.p4_rooms },
  { key: 'p5', label: 'ป.5', group: 'primary', getStudents: (r) => r.p5_students, getRooms: (r) => r.p5_rooms },
  { key: 'p6', label: 'ป.6', group: 'primary', getStudents: (r) => r.p6_students, getRooms: (r) => r.p6_rooms },
  { key: 'm1', label: 'ม.1', group: 'secondary', getStudents: (r) => r.m1_students, getRooms: (r) => r.m1_rooms },
  { key: 'm2', label: 'ม.2', group: 'secondary', getStudents: (r) => r.m2_students, getRooms: (r) => r.m2_rooms },
  { key: 'm3', label: 'ม.3', group: 'secondary', getStudents: (r) => r.m3_students, getRooms: (r) => r.m3_rooms },
  { key: 'm4', label: 'ม.4', group: 'secondary', getStudents: (r) => r.m4_students, getRooms: (r) => r.m4_rooms },
  { key: 'm5', label: 'ม.5', group: 'secondary', getStudents: (r) => r.m5_students, getRooms: (r) => r.m5_rooms },
  { key: 'm6', label: 'ม.6', group: 'secondary', getStudents: (r) => r.m6_students, getRooms: (r) => r.m6_rooms },
];

interface StudentBreakdownsViewProps {
  records: SchoolStudentBreakdown[];
  staffingRecords: SchoolStaffingRecord[];
  semesters: string[];
  selectedSemester: string;
  mode: 'supabase' | 'preview';
  supabaseStatus: SupabaseStatus | null;
  loading?: boolean;
  onSelectSemester: (semester: string) => void;
  onOpenUploadStudents: () => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onDeleteSemester: (semester: string) => Promise<void>;
  onSeedDefault: () => Promise<void>;
  onOpenWorkload: (record: SchoolStudentBreakdown) => void;
  onOpenSetup: () => void;
}

export function StudentBreakdownsView({
  records,
  staffingRecords,
  semesters,
  selectedSemester,
  mode,
  supabaseStatus,
  loading = false,
  onSelectSemester,
  onOpenUploadStudents,
  onDeleteRecord,
  onDeleteSemester,
  onSeedDefault,
  onOpenWorkload,
  onOpenSetup,
}: StudentBreakdownsViewProps) {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [gradeGroup, setGradeGroup] = useState<GradeGroupFilter>('all');
  const [showRooms, setShowRooms] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState<string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const staffingByCode = useMemo(
    () => new Map(staffingRecords.map((r) => [r.school_code, r])),
    [staffingRecords]
  );
  const staffingByName = useMemo(
    () => new Map(staffingRecords.map((r) => [normalizeSchoolName(r.school_name), r])),
    [staffingRecords]
  );

  function findStaffingMatch(b: SchoolStudentBreakdown): SchoolStaffingRecord | undefined {
    return (
      staffingByCode.get(b.school_code) ??
      staffingByName.get(normalizeSchoolName(b.school_name))
    );
  }

  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      const match = findStaffingMatch(r);
      if (match?.district) set.add(match.district);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [records, staffingByCode, staffingByName]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const match = findStaffingMatch(r);
      if (districtFilter !== 'all' && match?.district !== districtFilter) {
        return false;
      }
      if (!q) return true;
      const fullSchoolName = r.school_name.startsWith('โรงเรียน')
        ? r.school_name
        : `โรงเรียน${r.school_name}`;
      const haystack = `${r.school_code} ${match?.school_code ?? ''} ${r.school_name} ${fullSchoolName} ${match?.subdistrict ?? ''} ${match?.district ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [records, search, districtFilter, staffingByCode, staffingByName]);

  const visibleGradeCols = useMemo(
    () =>
      gradeGroup === 'all'
        ? GRADE_COLUMNS
        : GRADE_COLUMNS.filter((c) => c.group === gradeGroup),
    [gradeGroup]
  );

  const totals = useMemo(() => {
    const gradeSums: Record<string, { students: number; rooms: number }> = {};
    for (const col of GRADE_COLUMNS) {
      gradeSums[col.key] = { students: 0, rooms: 0 };
    }
    let male = 0;
    let female = 0;
    let students = 0;
    let rooms = 0;
    let preStudents = 0;
    let primaryStudents = 0;
    let secondaryStudents = 0;

    for (const r of filteredRecords) {
      male += r.total_male;
      female += r.total_female;
      students += r.total_students;
      rooms += r.total_rooms;
      preStudents += r.k0_students + r.k1_students + r.k2_students;
      primaryStudents +=
        r.p1_students + r.p2_students + r.p3_students + r.p4_students + r.p5_students + r.p6_students;
      secondaryStudents +=
        r.m1_students + r.m2_students + r.m3_students + r.m4_students + r.m5_students + r.m6_students;

      for (const col of GRADE_COLUMNS) {
        gradeSums[col.key].students += col.getStudents(r);
        gradeSums[col.key].rooms += col.getRooms(r);
      }
    }

    return {
      gradeSums,
      male,
      female,
      students,
      rooms,
      preStudents,
      primaryStudents,
      secondaryStudents,
    };
  }, [filteredRecords]);

  const canModifyDb =
    mode === 'supabase' && Boolean(supabaseStatus?.tablesReady && supabaseStatus?.studentBreakdownReady);

  async function handleExportExcel() {
    if (filteredRecords.length === 0 || exporting) return;
    setExporting(true);
    try {
      await exportStudentBreakdownExcel(
        filteredRecords,
        selectedSemester === 'all' ? 'ทุกภาคเรียน' : selectedSemester || '2569-2'
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleConfirmDeleteRow(row: SchoolStudentBreakdown) {
    if (!row.id) return;
    setDeletingRowId(row.id);
    setFeedback(null);
    try {
      await onDeleteRecord(row.id);
      setConfirmDeleteRowId(null);
      setFeedback({
        type: 'success',
        text: `ลบข้อมูลนักเรียนของ "${row.school_name}" ออกจากฐานข้อมูล Supabase เรียบร้อยแล้ว`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถลบข้อมูลโรงเรียนได้',
      });
    } finally {
      setDeletingRowId(null);
    }
  }

  async function handleConfirmDeleteBatch() {
    setDeletingBatch(true);
    setFeedback(null);
    try {
      const target = selectedSemester || 'all';
      await onDeleteSemester(target);
      setConfirmDeleteBatch(false);
      setFeedback({
        type: 'success',
        text:
          target === 'all'
            ? 'ล้างข้อมูลนักเรียนแยกชั้นทั้งหมดออกจากฐานข้อมูล Supabase เรียบร้อยแล้ว'
            : `ลบข้อมูลนักเรียนแยกชั้นภาคเรียน ${target} ออกจากฐานข้อมูล Supabase เรียบร้อยแล้ว`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถลบข้อมูลนักเรียนแยกชั้นได้',
      });
    } finally {
      setDeletingBatch(false);
    }
  }

  async function handleSeedDefault() {
    setSeeding(true);
    setFeedback(null);
    try {
      await onSeedDefault();
      setFeedback({
        type: 'success',
        text: 'กู้คืนข้อมูลนักเรียนแยกชั้น SchoolMIS 2569/2 (131 โรงเรียน) ลงฐานข้อมูล Supabase เรียบร้อยแล้ว',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถกู้คืนข้อมูลเริ่มต้นได้',
      });
    } finally {
      setSeeding(false);
    }
  }

  const effectiveSemesterList = semesters.length > 0 ? semesters : selectedSemester ? [selectedSemester] : ['2569-2'];

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-semibold text-[#111827]">
                ข้อมูลนักเรียนแยกชั้นแต่ละโรงเรียน (SchoolMIS)
              </h1>
              {mode === 'supabase' ? (
                <span className="inline-flex items-center gap-1 rounded border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-0.5 text-xs font-medium text-[#15803D]">
                  <Database className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>ฐานข้อมูล Supabase</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenSetup}
                  className="inline-flex items-center gap-1 rounded border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-xs font-medium text-[#B45309] hover:underline"
                >
                  <Database className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>โหมดตัวอย่าง (คลิกตั้งค่า Supabase)</span>
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-[#6B7280]">
              แสดงจำนวนนักเรียนและห้องเรียนรายชั้น (อ.1–ม.6) ของแต่ละโรงเรียน สามารถค้นหา ส่งออก Excel นำเข้าไฟล์ใหม่ หรือลบข้อมูลในฐานข้อมูลได้
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenUploadStudents}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] whitespace-nowrap shrink-0"
            >
              <Upload className="h-4 w-4 text-[#1E3A8A]" aria-hidden="true" />
              <span>นำเข้า SchoolMIS (.csv)</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredRecords.length === 0 || exporting}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#15803D] bg-[#16A34A] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>{exporting ? 'กำลังสร้าง...' : 'ส่งออก Excel (.xlsx)'}</span>
            </button>

            {canModifyDb && records.length > 0 && (
              confirmDeleteBatch ? (
                <div className="inline-flex h-10 items-center gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 text-sm">
                  <button
                    type="button"
                    disabled={deletingBatch}
                    onClick={handleConfirmDeleteBatch}
                    className="font-semibold text-[#B91C1C] hover:underline disabled:opacity-50 whitespace-nowrap"
                  >
                    {deletingBatch
                      ? 'กำลังลบ...'
                      : selectedSemester === 'all'
                        ? `ยืนยันลบทั้งหมด (${records.length} แห่ง)`
                        : `ยืนยันลบภาคเรียน ${selectedSemester}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteBatch(false)}
                    className="text-[#6B7280] hover:text-[#111827]"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteBatch(true)}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3.5 text-sm font-medium text-[#B91C1C] transition-colors hover:bg-[#FEE2E2] whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {selectedSemester === 'all'
                      ? 'ลบข้อมูลทั้งหมด'
                      : `ลบภาคเรียน ${selectedSemester}`}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="mt-5 grid grid-cols-2 divide-y divide-[#E5E7EB] overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F9FAFB] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-3.5">
            <p className="text-xs font-medium text-[#6B7280]">โรงเรียนที่แสดง</p>
            <p className="mt-1 font-mono-num text-xl font-semibold text-[#111827]">
              {formatNumber(filteredRecords.length)}{' '}
              <span className="text-xs font-normal text-[#6B7280]">
                / {formatNumber(records.length)} แห่ง
              </span>
            </p>
          </div>
          <div className="p-3.5">
            <p className="text-xs font-medium text-[#6B7280]">นักเรียนรวมทั้งหมด</p>
            <p className="mt-1 font-mono-num text-xl font-semibold text-[#111827]">
              {formatNumber(totals.students)}{' '}
              <span className="text-xs font-normal text-[#6B7280]">
                คน (ช {formatNumber(totals.male)} / ญ {formatNumber(totals.female)})
              </span>
            </p>
          </div>
          <div className="p-3.5">
            <p className="text-xs font-medium text-[#6B7280]">ห้องเรียนรวม</p>
            <p className="mt-1 font-mono-num text-xl font-semibold text-[#1E3A8A]">
              {formatNumber(totals.rooms)}{' '}
              <span className="text-xs font-normal text-[#6B7280]">ห้อง</span>
            </p>
          </div>
          <div className="p-3.5">
            <p className="text-xs font-medium text-[#6B7280]">แบ่งตามช่วงชั้น</p>
            <p className="mt-1.5 font-mono-num text-xs font-medium text-[#374151] tabular-nums">
              อ. {formatNumber(totals.preStudents)} · ป. {formatNumber(totals.primaryStudents)} · ม.{' '}
              {formatNumber(totals.secondaryStudents)}
            </p>
          </div>
        </div>

        {/* Filters Row */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#F3F4F6] pt-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="relative h-10">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อโรงเรียน รหัสโรงเรียน หรือตำบล..."
                className="h-10 w-full rounded-md border border-[#D1D5DB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="เลือกภาคเรียน"
              value={selectedSemester || effectiveSemesterList[0]}
              onChange={(e) => onSelectSemester(e.target.value)}
              className="h-10 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
            >
              {effectiveSemesterList.map((sem) => (
                <option key={sem} value={sem}>
                  ภาคเรียน {sem}
                </option>
              ))}
              {effectiveSemesterList.length > 1 && (
                <option value="all">ทุกภาคเรียน</option>
              )}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="กรองตามอำเภอ"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
            >
              <option value="all">ทุกอำเภอ</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  อ.{d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 lg:col-span-4 lg:justify-end">
            <div
              role="group"
              aria-label="กรองช่วงชั้น"
              className="inline-flex rounded-md border border-[#D1D5DB] bg-[#F9FAFB] p-0.5 text-xs font-medium"
            >
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'pre', label: 'อนุบาล' },
                { id: 'primary', label: 'ประถม' },
                { id: 'secondary', label: 'มัธยม' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGradeGroup(item.id as GradeGroupFilter)}
                  className={`rounded px-2.5 py-1.5 transition-colors ${
                    gradeGroup === item.id
                      ? 'bg-white text-[#1E3A8A] shadow-xs'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#4B5563] select-none">
              <input
                type="checkbox"
                checked={showRooms}
                onChange={(e) => setShowRooms(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#D1D5DB] text-[#1E3A8A]"
              />
              <span>แสดงห้องเรียน</span>
            </label>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={`mt-3 rounded-md border px-3.5 py-2.5 text-sm ${
              feedback.type === 'error'
                ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </section>

      {/* Empty State or Table */}
      {loading ? (
        <div className="h-64 animate-pulse rounded-lg border border-[#E5E7EB] bg-white" />
      ) : records.length === 0 ? (
        <section className="rounded-lg border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-[#111827]">
            ไม่มีข้อมูลนักเรียนแยกชั้นในฐานข้อมูล{selectedSemester && selectedSemester !== 'all' ? ` (ภาคเรียน ${selectedSemester})` : ''}
          </h2>
          <p className="mx-auto mt-1.5 max-w-lg text-sm text-[#6B7280]">
            สามารถนำเข้าไฟล์ CSV รายงาน SchoolMIS แยกชั้นแยกห้องชุดใหม่ หรือกู้คืนข้อมูลตั้งต้นภาคเรียน 2569-2 (131 โรงเรียน) กลับเข้าสู่ฐานข้อมูลได้ทันที
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenUploadStudents}
              className="inline-flex items-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF]"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>นำเข้าไฟล์ SchoolMIS (.csv)</span>
            </button>
            {supabaseStatus?.tablesReady && supabaseStatus?.studentBreakdownReady && (
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedDefault}
                className="inline-flex items-center gap-2 rounded-md border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4 text-[#4B5563]" aria-hidden="true" />
                <span>{seeding ? 'กำลังกู้คืนข้อมูล...' : 'กู้คืนข้อมูลตั้งต้น 2569-2 (131 โรงเรียน)'}</span>
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[12px] font-semibold text-[#4B5563]">
                  <th className="sticky left-0 z-10 w-11 min-w-[44px] bg-[#F9FAFB] py-3 pl-3 pr-2 text-center">
                    ที่
                  </th>
                  <th className="sticky left-[44px] z-10 min-w-[200px] border-r border-[#E5E7EB] bg-[#F9FAFB] px-3 py-3">
                    โรงเรียน / รหัส
                  </th>
                  {visibleGradeCols.map((col) => (
                    <th
                      key={col.key}
                      className="min-w-[46px] px-2 py-3 text-center whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="border-l border-[#E5E7EB] px-2.5 py-3 text-right whitespace-nowrap">
                    ชาย
                  </th>
                  <th className="px-2.5 py-3 text-right whitespace-nowrap">หญิง</th>
                  <th className="bg-[#EFF6FF] px-3 py-3 text-right text-[#1E3A8A] whitespace-nowrap">
                    รวม นร.
                  </th>
                  <th className="bg-[#FEFCE8] px-2.5 py-3 text-right text-[#854D0E] whitespace-nowrap">
                    ห้อง
                  </th>
                  <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleGradeCols.length + 7}
                      className="py-10 text-center text-sm text-[#6B7280]"
                    >
                      ไม่พบโรงเรียนที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((row, idx) => {
                    const match = findStaffingMatch(row);
                    const rowKey = row.id ?? `${row.semester}-${row.school_code}`;
                    return (
                      <tr key={rowKey} className="group hover:bg-[#F9FAFB]">
                        <td className="sticky left-0 z-10 w-11 min-w-[44px] bg-white py-2.5 pl-3 pr-2 text-center font-mono-num text-xs text-[#6B7280] group-hover:bg-[#F9FAFB]">
                          {idx + 1}
                        </td>
                        <td className="sticky left-[44px] z-10 border-r border-[#E5E7EB] bg-white px-3 py-2.5 group-hover:bg-[#F9FAFB]">
                          <div className="font-medium text-[#111827] leading-snug">
                            {row.school_name}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#6B7280]">
                            <span className="font-mono-num">{row.school_code}</span>
                            {match ? (
                              <span>
                                {' '}
                                · ต.{match.subdistrict} อ.{match.district}
                              </span>
                            ) : null}
                            {selectedSemester === 'all' && (
                              <span className="ml-1 rounded bg-[#F3F4F6] px-1 py-0.5 font-mono-num text-[10px]">
                                {row.semester}
                              </span>
                            )}
                          </div>
                        </td>

                        {visibleGradeCols.map((col) => {
                          const s = col.getStudents(row);
                          const rm = col.getRooms(row);
                          return (
                            <td key={col.key} className="px-2 py-2.5 text-center font-mono-num">
                              {s > 0 ? (
                                <div>
                                  <span className="font-medium text-[#111827]">
                                    {formatNumber(s)}
                                  </span>
                                  {showRooms && rm > 0 && (
                                    <span className="block text-[10px] text-[#6B7280]">
                                      {rm} ห้อง
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[#D1D5DB]">-</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="border-l border-[#E5E7EB] px-2.5 py-2.5 text-right font-mono-num text-[#4B5563]">
                          {formatNumber(row.total_male)}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-mono-num text-[#4B5563]">
                          {formatNumber(row.total_female)}
                        </td>
                        <td className="bg-[#EFF6FF]/50 px-3 py-2.5 text-right font-mono-num font-semibold text-[#1E3A8A]">
                          {formatNumber(row.total_students)}
                        </td>
                        <td className="bg-[#FEFCE8]/60 px-2.5 py-2.5 text-right font-mono-num font-semibold text-[#854D0E]">
                          {formatNumber(row.total_rooms)}
                        </td>
                        <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => onOpenWorkload(row)}
                              title="เปิดดูแบบรายงานปริมาณงานของโรงเรียนนี้"
                              className="inline-flex items-center gap-1 rounded border border-[#D1D5DB] bg-white px-2 py-1 text-xs font-medium text-[#1E3A8A] transition-colors hover:border-[#1E3A8A] hover:bg-[#EFF6FF]"
                            >
                              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>แบบรายงาน</span>
                            </button>

                            {canModifyDb && row.id && (
                              confirmDeleteRowId === row.id ? (
                                <span className="inline-flex items-center gap-1.5 text-xs">
                                  <button
                                    type="button"
                                    disabled={deletingRowId === row.id}
                                    onClick={() => handleConfirmDeleteRow(row)}
                                    className="font-semibold text-[#B91C1C] hover:underline disabled:opacity-50"
                                  >
                                    {deletingRowId === row.id ? 'กำลังลบ...' : 'ยืนยัน'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRowId(null)}
                                    className="text-[#6B7280] hover:text-[#111827]"
                                  >
                                    ยกเลิก
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteRowId(row.id!)}
                                  aria-label={`ลบข้อมูล ${row.school_name}`}
                                  title="ลบข้อมูลโรงเรียนนี้ออกจากฐานข้อมูล"
                                  className="rounded p-1 text-[#9CA3AF] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredRecords.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-[#D1D5DB] bg-[#FEF9C3]/60 font-semibold text-[#111827]">
                    <td
                      colSpan={2}
                      className="sticky left-0 z-10 border-r border-[#E5E7EB] bg-[#FEF9C3] py-3 pl-4 pr-3 text-right"
                    >
                      รวมทั้งหมด ({formatNumber(filteredRecords.length)} โรงเรียน)
                    </td>
                    {visibleGradeCols.map((col) => {
                      const sum = totals.gradeSums[col.key];
                      return (
                        <td key={col.key} className="px-2 py-3 text-center font-mono-num">
                          <div>{formatNumber(sum.students)}</div>
                          {showRooms && (
                            <div className="text-[10px] font-normal text-[#6B7280]">
                              {formatNumber(sum.rooms)} ห้อง
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border-l border-[#E5E7EB] px-2.5 py-3 text-right font-mono-num">
                      {formatNumber(totals.male)}
                    </td>
                    <td className="px-2.5 py-3 text-right font-mono-num">
                      {formatNumber(totals.female)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono-num text-[#1E3A8A]">
                      {formatNumber(totals.students)}
                    </td>
                    <td className="px-2.5 py-3 text-right font-mono-num text-[#854D0E]">
                      {formatNumber(totals.rooms)}
                    </td>
                    <td className="py-3 pl-3 pr-4" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
