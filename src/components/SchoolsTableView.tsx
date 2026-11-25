import { useMemo, useState } from 'react';
import { ArrowDownUp, Download, FileSpreadsheet, Search } from 'lucide-react';
import type { SchoolStaffingRecord } from '../types/staffing';
import { exportStaffingExcel } from '../utils/excelExport';
import {
  formatDeficitPositionsText,
  formatNumber,
  formatPercent,
  formatSigned,
  formatSurplusPositionsText,
  getDiffLabel,
  getDiffToneClass,
} from '../utils/formatters';

interface SchoolsTableViewProps {
  records: SchoolStaffingRecord[];
  totalPeriodRecords: number;
  periodLabel: string;
  periodNote?: string;
  districts: string[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onSelectSchool: (school: SchoolStaffingRecord) => void;
  compareCodes: string[];
  onToggleCompareCode: (schoolCode: string) => void;
  onGoToCompare: () => void;
}

type StatusFilter =
  | 'all'
  | 'deficit'
  | 'deficit_teacher'
  | 'deficit_deputy'
  | 'deficit_director'
  | 'balanced'
  | 'surplus'
  | 'vacant_dir'
  | 'supplement';
type ColumnGroup = 'summary' | 'positions' | 'retirement';
type SortField =
  | 'seq_no'
  | 'students_count'
  | 'actual_total'
  | 'criteria_total'
  | 'diff_total'
  | 'diff_teacher_pct'
  | 'contract_teacher';

export function SchoolsTableView({
  records,
  totalPeriodRecords,
  periodLabel,
  periodNote,
  districts,
  selectedDistrict,
  onSelectDistrict,
  onSelectSchool,
  compareCodes,
  onToggleCompareCode,
  onGoToCompare,
}: SchoolsTableViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [columnGroup, setColumnGroup] = useState<ColumnGroup>('summary');
  const [sortField, setSortField] = useState<SortField>('seq_no');
  const [sortAsc, setSortAsc] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records
      .filter((r) => {
        if (q) {
          const hay = `${r.school_code} ${r.school_name} ${r.subdistrict} ${r.district} ${r.project_name}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (statusFilter === 'deficit') return r.diff_total < 0;
        if (statusFilter === 'deficit_teacher') return r.diff_teacher < 0;
        if (statusFilter === 'deficit_deputy') return r.diff_deputy < 0;
        if (statusFilter === 'deficit_director') return r.diff_director < 0;
        if (statusFilter === 'balanced') return r.diff_total === 0;
        if (statusFilter === 'surplus') return r.diff_total > 0;
        if (statusFilter === 'vacant_dir') return r.criteria_director > r.actual_director;
        if (statusFilter === 'supplement')
          return r.contract_teacher > 0 || r.royal_decree_teacher > 0;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        return sortAsc ? av - bv : bv - av;
      });
  }, [records, search, statusFilter, sortField, sortAsc]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'seq_no');
    }
  }

  function handleExportCsv() {
    const headers = [
      'ลำดับ',
      'รหัสโรงเรียน',
      'ชื่อโรงเรียน',
      'ตำบล',
      'อำเภอ',
      'จังหวัด',
      'ขนาด',
      'ประเภท',
      'นักเรียน',
      'ห้องเรียน',
      'คนครอง_ผอ',
      'คนครอง_รอง',
      'คนครอง_ครู',
      'คนครอง_รวม',
      'จ18คำนวณ_รวม',
      'เกณฑ์กคศ_รวม',
      'ขาดเกิน_ผอ',
      'ขาดเกิน_รองผอ',
      'ขาดเกิน_ครู',
      'ขาดเกิน_รวม',
      'ตำแหน่งที่ขาดเกณฑ์',
      'ขาดเกิน_ร้อยละ',
      'เกษียณ_รวม',
      'หลังเกษียณ_รวม',
      'ไปช่วยราชการ',
      'มาช่วยราชการ',
      'พรก',
      'อัตราจ้าง',
    ];
    const escapeCell = (v: unknown) => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const lines = [
      headers.join(','),
      ...filtered.map((r) =>
        [
          r.seq_no,
          r.school_code,
          r.school_name,
          r.subdistrict,
          r.district,
          r.province,
          r.school_size,
          r.school_type,
          r.students_count,
          r.classrooms_count,
          r.actual_director,
          r.actual_deputy,
          r.actual_teacher,
          r.actual_total,
          r.j18_calc_total,
          r.criteria_total,
          r.diff_director,
          r.diff_deputy,
          r.diff_teacher,
          r.diff_total,
          formatDeficitPositionsText(r) || 'ไม่ขาดเกณฑ์',
          r.diff_teacher_pct,
          r.retire_total,
          r.post_retire_total,
          r.secondment_out,
          r.secondment_in,
          r.royal_decree_teacher,
          r.contract_teacher,
        ]
          .map(escapeCell)
          .join(',')
      ),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายชื่อโรงเรียน_${periodLabel.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleExportExcel() {
    if (filtered.length === 0 || exportingExcel) return;
    setExportingExcel(true);
    try {
      await exportStaffingExcel(filtered, {
        periodLabel,
        periodNote,
        districtFilter: selectedDistrict,
      });
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white">
      {/* Controls Header */}
      <div className="space-y-4 border-b border-[#E5E7EB] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">
              ข้อมูลรายโรงเรียน ({formatNumber(filtered.length)} จาก {formatNumber(totalPeriodRecords)} แห่ง)
            </h1>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              งวด {periodLabel} · คลิกที่รายการเพื่อเปิดรายละเอียดครบทุกตำแหน่ง
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {compareCodes.length > 0 && (
              <button
                type="button"
                onClick={onGoToCompare}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#1E3A8A] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF] whitespace-nowrap shrink-0"
              >
                <span>เปรียบเทียบ ({compareCodes.length}/6 แห่ง)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filtered.length === 0 || exportingExcel}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#15803D] bg-[#16A34A] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#15803D] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>{exportingExcel ? 'กำลังสร้างไฟล์...' : 'ส่งออก Excel (.xlsx)'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4 text-[#6B7280]" aria-hidden="true" />
              <span>ดาวน์โหลด CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search + District + Status */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อโรงเรียน รหัส หรือตำบล..."
                className="h-10 w-full rounded-md border border-[#D1D5DB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1E3A8A] focus:outline-none sm:w-64"
              />
            </div>

            <select
              aria-label="กรองตามอำเภอในตารางโรงเรียน"
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="h-10 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
            >
              <option value="all">ทุกอำเภอ</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  อ.{d}
                </option>
              ))}
            </select>

            <select
              aria-label="กรองสถานะอัตรากำลัง"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-10 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
            >
              <option value="all">ทุกสถานะอัตรากำลัง</option>
              <option value="deficit">ขาดเกณฑ์ (รวมทุกตำแหน่ง)</option>
              <option value="deficit_teacher">ขาดเกณฑ์ตำแหน่ง ครูผู้สอน</option>
              <option value="deficit_deputy">ขาดเกณฑ์ตำแหน่ง รอง ผอ.</option>
              <option value="deficit_director">ขาดเกณฑ์ตำแหน่ง ผอ.</option>
              <option value="balanced">พอดีเกณฑ์</option>
              <option value="surplus">เกินเกณฑ์</option>
              <option value="vacant_dir">ตำแหน่ง ผอ. ว่าง (คนครอง)</option>
              <option value="supplement">มีอัตราจ้าง / พรก.</option>
            </select>
          </div>

          {/* Column Group Switcher */}
          <div className="hidden md:flex items-center gap-1 rounded-md bg-[#F3F4F6] p-1">
            {(
              [
                { id: 'summary', label: 'มุมมองหลัก' },
                { id: 'positions', label: 'แยก ผอ./รอง/ครู' },
                { id: 'retirement', label: 'เกษียณ & อัตราเสริม' },
              ] as const
            ).map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setColumnGroup(grp.id)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  columnGroup === grp.id
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-base font-medium text-[#111827]">ไม่พบรายชื่อโรงเรียนที่ตรงกับเงื่อนไข</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            ลองปรับคำค้นหาหรือรีเซ็ตตัวกรองเพื่อดูข้อมูลทั้งหมด
          </p>
        </div>
      ) : (
        <>
          {/* Desktop High-Density Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#6B7280]">
                  <th className="py-3 pl-6 pr-2 font-medium whitespace-nowrap">เทียบ</th>
                  <th className="px-2 py-3 font-medium whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('seq_no')}
                      className="inline-flex items-center gap-1 hover:text-[#111827]"
                    >
                      <span>ที่</span>
                      <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap">รหัส</th>
                  <th className="px-3 py-3 font-medium">โรงเรียน / พื้นที่</th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap">ขนาด · ประเภท</th>
                  <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('students_count')}
                      className="inline-flex items-center gap-1 hover:text-[#111827]"
                    >
                      <span>นร. (ห้อง)</span>
                      <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </th>

                  {columnGroup === 'summary' && (
                    <>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSort('actual_total')}
                          className="inline-flex items-center gap-1 hover:text-[#111827]"
                        >
                          <span>คนครอง</span>
                          <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </th>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        จ.18 คำนวณ
                      </th>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSort('criteria_total')}
                          className="inline-flex items-center gap-1 hover:text-[#111827]"
                        >
                          <span>เกณฑ์ ก.ค.ศ.</span>
                          <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </th>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSort('diff_total')}
                          className="inline-flex items-center gap-1 hover:text-[#111827]"
                        >
                          <span>ขาด/เกิน</span>
                          <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </th>
                      <th className="px-3 py-3 font-medium whitespace-nowrap">
                        ตำแหน่งที่ขาด/เกิน
                      </th>
                      <th className="py-3 pl-3 pr-6 text-right font-medium whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSort('diff_teacher_pct')}
                          className="inline-flex items-center gap-1 hover:text-[#111827]"
                        >
                          <span>ร้อยละครู</span>
                          <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </th>
                    </>
                  )}

                  {columnGroup === 'positions' && (
                    <>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        คนครอง (ผอ/รอง/ครู)
                      </th>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        เกณฑ์ (ผอ/รอง/ครู)
                      </th>
                      <th className="py-3 pl-3 pr-6 text-right font-medium whitespace-nowrap">
                        ขาด/เกิน (ผอ/รอง/ครู)
                      </th>
                    </>
                  )}

                  {columnGroup === 'retirement' && (
                    <>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        เกษียณ (รวม)
                      </th>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        หลังเกษียณ 1 ต.ค.
                      </th>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        ช่วยราชการ (ไป/มา)
                      </th>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">
                        พรก.
                      </th>
                      <th className="py-3 pl-3 pr-6 text-right font-medium whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSort('contract_teacher')}
                          className="inline-flex items-center gap-1 hover:text-[#111827]"
                        >
                          <span>อัตราจ้าง</span>
                          <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filtered.map((r) => {
                  const isChecked = compareCodes.includes(r.school_code);
                  const disableNew = !isChecked && compareCodes.length >= 6;
                  return (
                  <tr
                    key={r.school_code}
                    onClick={() => onSelectSchool(r)}
                    className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
                  >
                    <td
                      className="py-3 pl-6 pr-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={disableNew}
                        onChange={() => onToggleCompareCode(r.school_code)}
                        aria-label={`เลือก ${r.school_name} เพื่อเปรียบเทียบ`}
                        className="h-4 w-4 rounded border-[#D1D5DB] text-[#1E3A8A] disabled:opacity-40"
                      />
                    </td>
                    <td className="px-2 py-3 font-mono-num text-[#6B7280]">
                      {r.is_flagged ? `*${r.seq_no}` : r.seq_no}
                    </td>
                    <td className="px-3 py-3 font-mono-num text-[#4B5563]">
                      {r.school_code}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-[#111827]">{r.school_name}</div>
                      <div className="text-[13px] text-[#6B7280]">
                        ต.{r.subdistrict} · อ.{r.district}
                        {r.special_feature ? ` · ${r.special_feature}` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#4B5563] whitespace-nowrap">
                      {r.school_size} · {r.school_type}
                    </td>
                    <td className="px-3 py-3 text-right font-mono-num text-[#111827] whitespace-nowrap">
                      {formatNumber(r.students_count)}{' '}
                      <span className="text-[#9CA3AF]">({r.classrooms_count})</span>
                    </td>

                    {columnGroup === 'summary' && (
                      <>
                        <td className="px-3 py-3 text-right font-mono-num text-[#111827]">
                          {formatNumber(r.actual_total)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono-num text-[#4B5563]">
                          {formatNumber(r.j18_calc_total)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono-num text-[#4B5563]">
                          {formatNumber(r.criteria_total)}
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-mono-num font-semibold ${getDiffToneClass(
                            r.diff_total
                          )}`}
                        >
                          {formatSigned(r.diff_total)}
                        </td>
                        <td className="px-3 py-3 text-[13px]">
                          {(() => {
                            const deficitText = formatDeficitPositionsText(r);
                            const surplusText = formatSurplusPositionsText(r);
                            if (!deficitText && !surplusText) {
                              return <span className="text-[#6B7280]">พอดีทุกตำแหน่ง</span>;
                            }
                            return (
                              <div className="space-y-0.5">
                                {deficitText && (
                                  <div className="font-medium text-[#B91C1C]">{deficitText}</div>
                                )}
                                {surplusText && (
                                  <div className="font-medium text-[#0F766E]">{surplusText}</div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td
                          className={`py-3 pl-3 pr-6 text-right font-mono-num ${getDiffToneClass(
                            r.diff_teacher
                          )}`}
                        >
                          {formatPercent(r.diff_teacher_pct)}
                        </td>
                      </>
                    )}

                    {columnGroup === 'positions' && (
                      <>
                        <td className="px-3 py-3 text-right font-mono-num text-[#111827]">
                          {r.actual_director} / {r.actual_deputy} / {r.actual_teacher}
                        </td>
                        <td className="px-3 py-3 text-right font-mono-num text-[#4B5563]">
                          {r.criteria_director} / {r.criteria_deputy} / {r.criteria_teacher}
                        </td>
                        <td
                          className={`py-3 pl-3 pr-6 text-right font-mono-num font-medium ${getDiffToneClass(
                            r.diff_total
                          )}`}
                        >
                          {formatSigned(r.diff_director)} / {formatSigned(r.diff_deputy)} /{' '}
                          {formatSigned(r.diff_teacher)}
                        </td>
                      </>
                    )}

                    {columnGroup === 'retirement' && (
                      <>
                        <td className="px-3 py-3 text-right font-mono-num text-[#111827]">
                          {formatNumber(r.retire_total)}
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-mono-num font-medium ${getDiffToneClass(
                            r.post_retire_total
                          )}`}
                        >
                          {formatSigned(r.post_retire_total)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono-num text-[#4B5563]">
                          {r.secondment_out} / {r.secondment_in}
                        </td>
                        <td className="px-3 py-3 text-right font-mono-num text-[#4B5563]">
                          {formatNumber(r.royal_decree_teacher)}
                        </td>
                        <td className="py-3 pl-3 pr-6 text-right font-mono-num text-[#111827]">
                          {formatNumber(r.contract_teacher)}
                        </td>
                      </>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Card-Row List */}
          <div className="divide-y divide-[#F3F4F6] md:hidden">
            {filtered.map((r) => {
              const deficitText = formatDeficitPositionsText(r);
              const surplusText = formatSurplusPositionsText(r);
              return (
                <button
                  key={r.school_code}
                  type="button"
                  onClick={() => onSelectSchool(r)}
                  className="block w-full px-4 py-4 text-left transition-colors hover:bg-[#F9FAFB]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#111827]">
                        {r.school_name}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#6B7280]">
                        {r.school_code} · ต.{r.subdistrict} อ.{r.district} · {r.school_size}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`font-mono-num text-[15px] font-semibold ${getDiffToneClass(
                          r.diff_total
                        )}`}
                      >
                        {formatSigned(r.diff_total)}
                      </p>
                      <p className={`text-[13px] ${getDiffToneClass(r.diff_total)}`}>
                        {getDiffLabel(r.diff_total)}
                      </p>
                    </div>
                  </div>
                  {(deficitText || surplusText) && (
                    <div className="mt-2 flex flex-wrap gap-x-2 text-[13px] font-medium">
                      {deficitText && <span className="text-[#B91C1C]">{deficitText}</span>}
                      {surplusText && <span className="text-[#0F766E]">{surplusText}</span>}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#4B5563] tabular-nums">
                    <span>นร. {formatNumber(r.students_count)}</span>
                    <span>คนครอง {formatNumber(r.actual_total)}</span>
                    <span>เกณฑ์ {formatNumber(r.criteria_total)}</span>
                    {(r.contract_teacher > 0 || r.royal_decree_teacher > 0) && (
                      <span>
                        จ้าง/พรก. {formatNumber(r.contract_teacher + r.royal_decree_teacher)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
