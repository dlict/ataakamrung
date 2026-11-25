import { useEffect, useMemo, useState } from 'react';
import { Printer, RotateCcw, Trash2, Upload } from 'lucide-react';
import type {
  ReportPeriod,
  SchoolStaffingRecord,
  SupabaseStatus,
} from '../types/staffing';
import { formatNumber, formatPercent, formatSigned, getDiffToneClass } from '../utils/formatters';
import { parseJsonResponse } from '../utils/api';
import {
  calculateActualStaffing,
  calculateActualStaffingForRecords,
  DEFAULT_REALITY_FIELDS,
  formatRealityFormula,
  REALITY_COMPONENT_OPTIONS,
  type RealityFieldKey,
} from '../utils/staffingCalculations';

interface ComparePeriodsViewProps {
  periods: ReportPeriod[];
  supabaseStatus: SupabaseStatus | null;
  onSelectPeriod: (periodId: string) => void;
  onDeletePeriod: (periodId: string) => Promise<void>;
  onDeleteYear: (buddhistYear: number) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onOpenUpload: () => void;
}

interface SchoolDeltaRow {
  school_code: string;
  school_name: string;
  district: string;
  studentsA: number;
  studentsB: number;
  actualA: number;
  actualB: number;
  realityA: number;
  realityB: number;
  diffA: number;
  diffB: number;
  deltaStudents: number;
  deltaActual: number;
  deltaReality: number;
  deltaDiff: number;
}

export function ComparePeriodsView({
  periods,
  supabaseStatus,
  onSelectPeriod,
  onDeletePeriod,
  onDeleteYear,
  onDeleteAll,
  onOpenUpload,
}: ComparePeriodsViewProps) {
  const [periodAId, setPeriodAId] = useState<string>('');
  const [periodBId, setPeriodBId] = useState<string>('');
  const [recordsByPeriodId, setRecordsByPeriodId] = useState<
    Record<string, SchoolStaffingRecord[]>
  >({});
  const [loadingPeriodIds, setLoadingPeriodIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteYear, setConfirmDeleteYear] = useState<number | null>(null);
  const [deletingYear, setDeletingYear] = useState<number | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedRealityFields, setSelectedRealityFields] =
    useState<RealityFieldKey[]>(DEFAULT_REALITY_FIELDS);

  const realityFormulaLabel = useMemo(
    () => formatRealityFormula(selectedRealityFields),
    [selectedRealityFields]
  );

  const isDefaultReality =
    selectedRealityFields.length === DEFAULT_REALITY_FIELDS.length &&
    DEFAULT_REALITY_FIELDS.every((k) => selectedRealityFields.includes(k));

  function toggleRealityField(key: RealityFieldKey) {
    setSelectedRealityFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function resetRealityFields() {
    setSelectedRealityFields(DEFAULT_REALITY_FIELDS);
  }

  const chronological = useMemo(
    () =>
      [...periods].sort(
        (a, b) => a.buddhist_year - b.buddhist_year || a.month_number - b.month_number
      ),
    [periods]
  );

  const yearsSummary = useMemo(() => {
    const map = new Map<number, { year: number; monthsCount: number; latestStudents: number }>();
    for (const p of periods) {
      const existing = map.get(p.buddhist_year);
      if (!existing) {
        map.set(p.buddhist_year, {
          year: p.buddhist_year,
          monthsCount: 1,
          latestStudents: p.total_students,
        });
      } else {
        existing.monthsCount += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.year - a.year);
  }, [periods]);

  useEffect(() => {
    if (chronological.length >= 2) {
      setPeriodAId((prev) =>
        chronological.some((p) => p.id === prev) ? prev : chronological[chronological.length - 2].id
      );
      setPeriodBId((prev) =>
        chronological.some((p) => p.id === prev) ? prev : chronological[chronological.length - 1].id
      );
    }
  }, [chronological]);

  useEffect(() => {
    const missingIds = periods
      .map((p) => p.id)
      .filter((id) => !(id in recordsByPeriodId) && !loadingPeriodIds[id]);

    if (missingIds.length === 0) return;
    let active = true;

    setLoadingPeriodIds((prev) => {
      const next = { ...prev };
      for (const id of missingIds) next[id] = true;
      return next;
    });

    Promise.all(
      missingIds.map((id) =>
        fetch(`/api/periods/${id}/records`)
          .then((r) => parseJsonResponse<{ records?: SchoolStaffingRecord[] }>(r))
          .then((res) => ({
            id,
            records: Array.isArray(res.records) ? res.records : [],
          }))
          .catch(() => ({ id, records: [] as SchoolStaffingRecord[] }))
      )
    ).then((results) => {
      if (!active) return;
      setRecordsByPeriodId((prev) => {
        const next = { ...prev };
        for (const item of results) {
          next[item.id] = item.records;
        }
        return next;
      });
      setLoadingPeriodIds((prev) => {
        const next = { ...prev };
        for (const item of results) {
          delete next[item.id];
        }
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [periods, recordsByPeriodId, loadingPeriodIds]);

  const recordsA = recordsByPeriodId[periodAId] ?? [];
  const recordsB = recordsByPeriodId[periodBId] ?? [];
  const loadingCompare =
    Boolean(loadingPeriodIds[periodAId]) || Boolean(loadingPeriodIds[periodBId]);

  const periodA = periods.find((p) => p.id === periodAId);
  const periodB = periods.find((p) => p.id === periodBId);

  const periodRealityTotals = useMemo(() => {
    const totalA = calculateActualStaffingForRecords(recordsA, selectedRealityFields);
    const totalB = calculateActualStaffingForRecords(recordsB, selectedRealityFields);
    return { totalA, totalB, delta: totalB - totalA };
  }, [recordsA, recordsB, selectedRealityFields]);

  const deltaRows = useMemo<SchoolDeltaRow[]>(() => {
    if (recordsA.length === 0 || recordsB.length === 0) return [];
    const mapA = new Map<string, SchoolStaffingRecord>();
    for (const r of recordsA) mapA.set(r.school_code, r);

    const rows: SchoolDeltaRow[] = [];
    for (const b of recordsB) {
      const a = mapA.get(b.school_code);
      if (!a) continue;
      const realityA = calculateActualStaffing(a, selectedRealityFields);
      const realityB = calculateActualStaffing(b, selectedRealityFields);
      const deltaStudents = b.students_count - a.students_count;
      const deltaActual = b.actual_total - a.actual_total;
      const deltaReality = realityB - realityA;
      const deltaDiff = b.diff_total - a.diff_total;
      if (
        deltaStudents !== 0 ||
        deltaActual !== 0 ||
        deltaReality !== 0 ||
        deltaDiff !== 0
      ) {
        rows.push({
          school_code: b.school_code,
          school_name: b.school_name,
          district: b.district,
          studentsA: a.students_count,
          studentsB: b.students_count,
          actualA: a.actual_total,
          actualB: b.actual_total,
          realityA,
          realityB,
          diffA: a.diff_total,
          diffB: b.diff_total,
          deltaStudents,
          deltaActual,
          deltaReality,
          deltaDiff,
        });
      }
    }
    return rows.sort(
      (x, y) =>
        Math.abs(y.deltaDiff) - Math.abs(x.deltaDiff) ||
        Math.abs(y.deltaReality) - Math.abs(x.deltaReality) ||
        Math.abs(y.deltaActual) - Math.abs(x.deltaActual) ||
        Math.abs(y.deltaStudents) - Math.abs(x.deltaStudents)
    );
  }, [recordsA, recordsB, selectedRealityFields]);

  async function handleConfirmDelete(id: string) {
    setDeletingId(id);
    try {
      await onDeletePeriod(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleConfirmDeleteYear(year: number) {
    setDeletingYear(year);
    try {
      await onDeleteYear(year);
      setConfirmDeleteYear(null);
    } finally {
      setDeletingYear(null);
    }
  }

  async function handleConfirmDeleteAll() {
    setDeletingAll(true);
    try {
      await onDeleteAll();
      setConfirmDeleteAll(false);
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Print-only Header */}
      <header className="hidden border-b-2 border-[#111827] pb-3 print:block">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#4B5563]">
              สำนักงานเขตพื้นที่การศึกษาประถมศึกษาแม่ฮ่องสอน เขต 1
            </p>
            <h1 className="mt-0.5 text-lg font-bold text-[#111827]">
              รายงานคลังงวดข้อมูลและเปรียบเทียบความเปลี่ยนแปลงอัตรากำลัง
            </h1>
            <p className="mt-0.5 text-xs text-[#4B5563]">
              สูตรสภาพจริง: {realityFormulaLabel}
            </p>
          </div>
          <div className="text-right text-xs text-[#4B5563]">
            {periodA && periodB && (
              <p>
                เปรียบเทียบ: {periodA.month_label} {periodA.buddhist_year} → {periodB.month_label}{' '}
                {periodB.buddhist_year}
              </p>
            )}
            <p>
              พิมพ์เมื่อ:{' '}
              {new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </header>

      {/* Year-level Management */}
      {yearsSummary.length > 0 && (
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 print:hidden">
          <div className="flex flex-col gap-3 border-b border-[#F3F4F6] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                จัดการข้อมูลแยกตามปี พ.ศ.
              </h2>
              <p className="mt-0.5 text-sm text-[#6B7280]">
                {supabaseStatus?.tablesReady
                  ? 'สามารถลบข้อมูลทั้งปี พ.ศ. ลบงวดรายเดือน หรือล้างข้อมูลทั้งหมดออกจากฐานข้อมูล Supabase ได้'
                  : 'เมื่อเชื่อมต่อฐานข้อมูล Supabase แล้ว จะสามารถลบข้อมูลรายปีและรายเดือนได้ถาวร'}
              </p>
            </div>

            {supabaseStatus?.tablesReady && (
              <div className="shrink-0 text-sm">
                {confirmDeleteAll ? (
                  <div className="flex items-center gap-2.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5">
                    <button
                      type="button"
                      disabled={deletingAll}
                      onClick={handleConfirmDeleteAll}
                      className="font-semibold text-[#B91C1C] hover:underline disabled:opacity-50"
                    >
                      {deletingAll ? 'กำลังลบทั้งหมด...' : 'ยืนยันลบข้อมูลทั้งหมด'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAll(false)}
                      className="text-[#6B7280] hover:text-[#111827]"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-sm font-medium text-[#B91C1C] transition-colors hover:bg-[#FEE2E2]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>ลบข้อมูลทั้งหมด</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {yearsSummary.map((y) => (
              <div
                key={y.year}
                className="flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3"
              >
                <div>
                  <p className="font-mono-num text-base font-semibold text-[#111827]">
                    ปี พ.ศ. {y.year}
                  </p>
                  <p className="text-[13px] text-[#6B7280] tabular-nums">
                    {y.monthsCount} งวดข้อมูล · นร. {formatNumber(y.latestStudents)} คน
                  </p>
                </div>

                {supabaseStatus?.tablesReady && (
                  <div className="shrink-0 text-sm">
                    {confirmDeleteYear === y.year ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={deletingYear === y.year}
                          onClick={() => handleConfirmDeleteYear(y.year)}
                          className="font-semibold text-[#B91C1C] hover:underline disabled:opacity-50"
                        >
                          {deletingYear === y.year ? 'กำลังลบ...' : 'ยืนยันลบทั้งปี'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteYear(null)}
                          className="text-[#6B7280] hover:text-[#111827]"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteYear(y.year)}
                        className="inline-flex items-center gap-1.5 rounded border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#B91C1C] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>ลบปี {y.year}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Period Archive Table */}
      <section className="print-avoid-break rounded-lg border border-[#E5E7EB] bg-white print:border-[#D1D5DB]">
        <div className="flex flex-col gap-3 border-b border-[#E5E7EB] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 print:px-4 print:py-3">
          <div>
            <h1 className="text-lg font-semibold text-[#111827] print:text-base">
              คลังงวดข้อมูลตามช่วงเวลา (พ.ศ. / เดือน)
            </h1>
            <p className="mt-0.5 text-sm text-[#6B7280] print:text-xs">
              บันทึกทั้งหมด {formatNumber(periods.length)} งวด
              {supabaseStatus?.tablesReady ? ' ในฐานข้อมูล Supabase' : ' (โหมดข้อมูลตั้งต้น)'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {periods.length > 0 && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] whitespace-nowrap shrink-0"
              >
                <Printer className="h-4 w-4 text-[#4B5563]" aria-hidden="true" />
                <span>พิมพ์รายงาน</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] whitespace-nowrap shrink-0"
            >
              <Upload className="h-4 w-4 text-[#6B7280]" aria-hidden="true" />
              <span>เพิ่มงวดข้อมูลใหม่</span>
            </button>
          </div>
        </div>

        {/* Reality Staffing Component Selector */}
        {periods.length > 0 && (
          <div className="border-b border-[#E5E7EB] bg-[#F9FAFB]/70 px-5 py-4 sm:px-6 print:hidden">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#111827]">
                  กำหนดองค์ประกอบหัวข้อ “สภาพจริง”
                </h2>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  สูตรที่เลือกปัจจุบัน:{' '}
                  <span className="font-medium text-[#0F766E]">{realityFormulaLabel}</span>
                </p>
              </div>
              {!isDefaultReality && (
                <button
                  type="button"
                  onClick={resetRealityFields}
                  className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-[#6B7280] hover:text-[#111827] sm:self-auto whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>คืนค่าเริ่มต้น</span>
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {REALITY_COMPONENT_OPTIONS.map((opt) => {
                const checked = selectedRealityFields.includes(opt.key);
                return (
                  <label
                    key={opt.key}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors select-none sm:text-sm ${
                      checked
                        ? 'border-[#0F766E] bg-[#F0FDFA] font-medium text-[#0F766E]'
                        : 'border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRealityField(opt.key)}
                      className="h-3.5 w-3.5 rounded border-[#D1D5DB] accent-[#0F766E]"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-left text-sm print:text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#6B7280] print:text-xs">
                <th className="py-3 pl-6 pr-3 font-medium print:pl-4">พ.ศ. / เดือน</th>
                <th className="hidden md:table-cell px-3 py-3 font-medium print:table-cell">คำอธิบาย / ชื่อไฟล์</th>
                <th className="px-3 py-3 text-right font-medium">โรงเรียน</th>
                <th className="px-3 py-3 text-right font-medium">นักเรียน</th>
                <th className="px-3 py-3 text-right font-medium">คนครอง / เกณฑ์</th>
                <th className="px-3 py-3 text-right font-medium text-[#0F766E]">สภาพจริง</th>
                <th className="px-3 py-3 text-right font-medium">ดุลขาด/เกิน</th>
                <th className="py-3 pl-3 pr-6 text-right font-medium print:hidden">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {periods.map((p) => {
                const periodRecords = recordsByPeriodId[p.id];
                const isPeriodLoading = Boolean(loadingPeriodIds[p.id]) || !periodRecords;
                const realityTotal = periodRecords
                  ? calculateActualStaffingForRecords(periodRecords, selectedRealityFields)
                  : null;
                return (
                <tr key={p.id} className="hover:bg-[#F9FAFB]">
                  <td className="py-3.5 pl-6 pr-3 font-medium text-[#111827] whitespace-nowrap print:pl-4 print:py-2">
                    {p.month_label} {p.buddhist_year}
                  </td>
                  <td className="hidden md:table-cell px-3 py-3.5 text-[#4B5563] print:table-cell print:py-2">
                    <div className="truncate max-w-[260px]">
                      {p.period_note || p.source_filename}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono-num text-[#111827] print:py-2">
                    {formatNumber(p.total_schools)}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono-num text-[#111827] print:py-2">
                    {formatNumber(p.total_students)}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono-num text-[#4B5563] whitespace-nowrap print:py-2">
                    {formatNumber(p.total_actual_staff)} / {formatNumber(p.total_criteria)}
                  </td>
                  <td className="bg-[#F0FDFA]/40 px-3 py-3.5 text-right font-mono-num font-semibold text-[#0F766E] whitespace-nowrap print:py-2">
                    {isPeriodLoading || realityTotal === null ? '…' : formatNumber(realityTotal)}
                  </td>
                  <td
                    className={`px-3 py-3.5 text-right font-mono-num font-semibold whitespace-nowrap print:py-2 ${getDiffToneClass(
                      p.net_diff
                    )}`}
                  >
                    {formatSigned(p.net_diff)} ({formatPercent(p.net_diff_pct)})
                  </td>
                  <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap print:hidden">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectPeriod(p.id)}
                        className="font-medium text-[#1E3A8A] hover:underline"
                      >
                        เปิดดู
                      </button>
                      {supabaseStatus?.tablesReady && !p.is_initial_snapshot && (
                        <>
                          {confirmDeleteId === p.id ? (
                            <span className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={deletingId === p.id}
                                onClick={() => handleConfirmDelete(p.id)}
                                className="font-medium text-[#B91C1C] hover:underline disabled:opacity-50"
                              >
                                {deletingId === p.id ? 'กำลังลบ...' : 'ยืนยันลบ'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[#6B7280] hover:text-[#111827]"
                              >
                                ยกเลิก
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(p.id)}
                              aria-label={`ลบงวด ${p.month_label} ${p.buddhist_year}`}
                              className="text-[#9CA3AF] transition-colors hover:text-[#B91C1C]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Multi-period Comparison Section */}
      {chronological.length < 2 ? (
        <section className="rounded-lg border border-dashed border-[#D1D5DB] bg-white p-8 text-center print:hidden">
          <h2 className="text-base font-semibold text-[#111827]">
            อัปโหลดข้อมูลอย่างน้อย 2 งวด เพื่อเปรียบเทียบความเปลี่ยนแปลงรายเดือน/รายปี
          </h2>
          <p className="mx-auto mt-1.5 max-w-lg text-sm text-[#6B7280]">
            เมื่อแนบไฟล์ CSV ของเดือนหรือปี พ.ศ. อื่นเพิ่มเติม ระบบจะแสดงแนวโน้มจำนวนนักเรียน ครูมีตัวจริง
            และดุลขาด/เกินรายโรงเรียนที่เปลี่ยนแปลงระหว่างสองงวดโดยอัตโนมัติ
          </p>
          <button
            type="button"
            onClick={onOpenUpload}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF]"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>แนบไฟล์ CSV งวดถัดไป</span>
          </button>
        </section>
      ) : (
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 print:border-[#D1D5DB] print:p-4">
          <div className="flex flex-col gap-4 border-b border-[#E5E7EB] pb-5 lg:flex-row lg:items-center lg:justify-between print:pb-3">
            <div>
              <h2 className="text-lg font-semibold text-[#111827] print:text-base">
                เปรียบเทียบการเปลี่ยนแปลงระหว่างงวด
              </h2>
              <p className="mt-0.5 text-sm text-[#6B7280] print:text-xs">
                แสดงรายการโรงเรียนที่มีการเปลี่ยนแปลงจำนวนนักเรียน ครูมีตัวจริง หรือดุลขาด/เกิน
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm print:hidden">
              <select
                aria-label="เลือกงวดตั้งต้น A"
                value={periodAId}
                onChange={(e) => setPeriodAId(e.target.value)}
                className="h-10 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              >
                {chronological.map((p) => (
                  <option key={p.id} value={p.id}>
                    งวด A: {p.month_label} {p.buddhist_year}
                  </option>
                ))}
              </select>
              <span className="text-[#6B7280]">เทียบกับ</span>
              <select
                aria-label="เลือกงวดเปรียบเทียบ B"
                value={periodBId}
                onChange={(e) => setPeriodBId(e.target.value)}
                className="h-10 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              >
                {chronological.map((p) => (
                  <option key={p.id} value={p.id}>
                    งวด B: {p.month_label} {p.buddhist_year}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] whitespace-nowrap shrink-0"
              >
                <Printer className="h-4 w-4 text-[#4B5563]" aria-hidden="true" />
                <span>พิมพ์รายงาน</span>
              </button>
            </div>

            {periodA && periodB && (
              <div className="hidden text-xs font-medium text-[#111827] print:block">
                งวด A: {periodA.month_label} {periodA.buddhist_year} เทียบกับ งวด B:{' '}
                {periodB.month_label} {periodB.buddhist_year}
              </div>
            )}
          </div>

          {periodA && periodB && (
            <div className="mt-5 grid grid-cols-1 divide-y divide-[#E5E7EB] rounded-md border border-[#E5E7EB] sm:grid-cols-2 lg:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <span className="text-sm text-[#6B7280]">นักเรียนเปลี่ยนแปลง</span>
                <p className="mt-1 font-mono-num text-xl font-semibold text-[#111827]">
                  {formatSigned(periodB.total_students - periodA.total_students)} คน
                </p>
                <p className="mt-0.5 text-[13px] text-[#6B7280] tabular-nums">
                  {formatNumber(periodA.total_students)} → {formatNumber(periodB.total_students)}
                </p>
              </div>
              <div className="p-4">
                <span className="text-sm text-[#6B7280]">ครูมีตัวจริงเปลี่ยนแปลง</span>
                <p className="mt-1 font-mono-num text-xl font-semibold text-[#111827]">
                  {formatSigned(periodB.total_actual_staff - periodA.total_actual_staff)} อัตรา
                </p>
                <p className="mt-0.5 text-[13px] text-[#6B7280] tabular-nums">
                  {formatNumber(periodA.total_actual_staff)} → {formatNumber(periodB.total_actual_staff)}
                </p>
              </div>
              <div className="bg-[#F0FDFA]/50 p-4">
                <span className="text-sm font-medium text-[#0F766E]">
                  สภาพจริงเปลี่ยนแปลง
                </span>
                <p
                  className={`mt-1 font-mono-num text-xl font-semibold ${getDiffToneClass(
                    periodRealityTotals.delta
                  )}`}
                >
                  {formatSigned(periodRealityTotals.delta)} คน
                </p>
                <p className="mt-0.5 text-[13px] text-[#4B5563] tabular-nums">
                  {formatNumber(periodRealityTotals.totalA)} →{' '}
                  {formatNumber(periodRealityTotals.totalB)} ({realityFormulaLabel})
                </p>
              </div>
              <div className="p-4">
                <span className="text-sm text-[#6B7280]">ดุลขาด/เกินสุทธิเปลี่ยนแปลง</span>
                <p
                  className={`mt-1 font-mono-num text-xl font-semibold ${getDiffToneClass(
                    periodB.net_diff - periodA.net_diff
                  )}`}
                >
                  {formatSigned(periodB.net_diff - periodA.net_diff)} อัตรา
                </p>
                <p className="mt-0.5 text-[13px] text-[#6B7280] tabular-nums">
                  {formatSigned(periodA.net_diff)} → {formatSigned(periodB.net_diff)}
                </p>
              </div>
            </div>
          )}

          <div className="mt-5">
            {loadingCompare ? (
              <p className="py-6 text-center text-sm text-[#6B7280]">กำลังคำนวณความเปลี่ยนแปลง...</p>
            ) : deltaRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#6B7280]">
                ไม่พบความแตกต่างระหว่างสองงวดที่เลือก
              </p>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse text-left text-sm print:text-xs [&_td]:print:py-1.5">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#6B7280]">
                      <th className="py-3 pr-3 font-medium">รหัส · โรงเรียน</th>
                      <th className="px-3 py-3 text-right font-medium">นร. (เปลี่ยน)</th>
                      <th className="px-3 py-3 text-right font-medium">คนครอง (เปลี่ยน)</th>
                      <th className="px-3 py-3 text-right font-medium text-[#0F766E]">
                        สภาพจริง (เปลี่ยน)
                      </th>
                      <th className="py-3 pl-3 text-right font-medium">ดุลขาด/เกิน (เปลี่ยน)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {deltaRows.slice(0, 50).map((row) => (
                      <tr key={row.school_code} className="hover:bg-[#F9FAFB]">
                        <td className="py-3 pr-3">
                          <div className="font-medium text-[#111827]">{row.school_name}</div>
                          <div className="text-[13px] text-[#6B7280]">
                            {row.school_code} · อ.{row.district}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono-num">
                          <span className="text-[#4B5563]">
                            {row.studentsA} → {row.studentsB}
                          </span>{' '}
                          <span className={getDiffToneClass(row.deltaStudents)}>
                            ({formatSigned(row.deltaStudents)})
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono-num">
                          <span className="text-[#4B5563]">
                            {row.actualA} → {row.actualB}
                          </span>{' '}
                          <span className={getDiffToneClass(row.deltaActual)}>
                            ({formatSigned(row.deltaActual)})
                          </span>
                        </td>
                        <td className="bg-[#F0FDFA]/40 px-3 py-3 text-right font-mono-num">
                          <span className="text-[#111827]">
                            {row.realityA} → {row.realityB}
                          </span>{' '}
                          <span className={`font-semibold ${getDiffToneClass(row.deltaReality)}`}>
                            ({formatSigned(row.deltaReality)})
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right font-mono-num">
                          <span className="text-[#4B5563]">
                            {formatSigned(row.diffA)} → {formatSigned(row.diffB)}
                          </span>{' '}
                          <span className={`font-semibold ${getDiffToneClass(row.deltaDiff)}`}>
                            ({formatSigned(row.deltaDiff)})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
