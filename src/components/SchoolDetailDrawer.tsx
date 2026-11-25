import { X } from 'lucide-react';
import type { SchoolStaffingRecord } from '../types/staffing';
import {
  buildGroupedRowsWithBranchTotals,
  getRelatedBranchGroupCodes,
} from '../utils/branchGrouping';
import {
  formatDeficitPositionsText,
  formatNumber,
  formatPercent,
  formatSigned,
  formatSurplusPositionsText,
  formatVacantPositionsText,
  getDiffLabel,
  getDiffToneClass,
  getVacantCounts,
} from '../utils/formatters';

interface SchoolDetailDrawerProps {
  school: SchoolStaffingRecord | null;
  allRecords?: SchoolStaffingRecord[];
  onClose: () => void;
}

export function SchoolDetailDrawer({
  school,
  allRecords = [],
  onClose,
}: SchoolDetailDrawerProps) {
  if (!school) return null;

  const relatedCodes = getRelatedBranchGroupCodes(allRecords);
  const branchGroup = relatedCodes.has(school.school_code)
    ? buildGroupedRowsWithBranchTotals(allRecords, true).find(
        (row): row is Extract<typeof row, { kind: 'branch_total' }> =>
          row.kind === 'branch_total' &&
          (row.mainSchool.school_code === school.school_code ||
            row.branches.some((b) => b.school_code === school.school_code))
      )
    : undefined;

  const vacantCounts = getVacantCounts(school);
  const vacantText = formatVacantPositionsText(school);
  const studentTeacherRatio =
    school.actual_teacher > 0
      ? (school.students_count / school.actual_teacher).toFixed(1)
      : '—';
  const deficitText = formatDeficitPositionsText(school);
  const surplusText = formatSurplusPositionsText(school);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#111827]/30 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={`รายละเอียด ${school.school_name}`}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-6 py-4">
          <div className="min-w-0">
            <p className="font-mono-num text-sm text-[#6B7280]">
              รหัส {school.school_code} · ลำดับที่ {school.seq_no}
              {school.is_flagged ? ' (มีเครื่องหมาย *)' : ''}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#111827]">
              {school.school_name}
            </h2>
            <p className="mt-0.5 text-sm text-[#4B5563]">
              ต.{school.subdistrict} · อ.{school.district} · จ.{school.province}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างรายละเอียด"
            className="rounded-md p-1.5 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Basic Classification */}
          <div className="grid grid-cols-2 gap-4 border-b border-[#F3F4F6] pb-5 text-sm">
            <div>
              <span className="text-[#6B7280]">ขนาดตามเกณฑ์ สพฐ.</span>
              <p className="mt-0.5 font-medium text-[#111827]">{school.school_size || '—'}</p>
            </div>
            <div>
              <span className="text-[#6B7280]">ประเภทโรงเรียน</span>
              <p className="mt-0.5 font-medium text-[#111827]">{school.school_type || '—'}</p>
            </div>
            <div>
              <span className="text-[#6B7280]">ลักษณะพิเศษ</span>
              <p className="mt-0.5 font-medium text-[#111827]">{school.special_feature || 'ทั่วไป'}</p>
            </div>
            <div>
              <span className="text-[#6B7280]">โครงการ คปร.</span>
              <p className="mt-0.5 font-medium text-[#111827]">{school.project_name || '—'}</p>
            </div>
          </div>

          {/* Student & Ratio Summary */}
          <div className="grid grid-cols-3 gap-4 border-b border-[#F3F4F6] pb-5">
            <div>
              <span className="text-sm text-[#6B7280]">จำนวนนักเรียน</span>
              <p className="mt-1 font-mono-num text-2xl font-semibold text-[#111827]">
                {formatNumber(school.students_count)}
              </p>
            </div>
            <div>
              <span className="text-sm text-[#6B7280]">ห้องเรียน</span>
              <p className="mt-1 font-mono-num text-2xl font-semibold text-[#111827]">
                {formatNumber(school.classrooms_count)}
              </p>
            </div>
            <div>
              <span className="text-sm text-[#6B7280]">อัตราส่วน นร./ครูจริง</span>
              <p className="mt-1 font-mono-num text-2xl font-semibold text-[#111827]">
                {studentTeacherRatio} : 1
              </p>
            </div>
          </div>

          {/* 4-Level Staffing Comparison Table */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-[#111827]">
                ตารางเปรียบเทียบอัตรากำลังรายตำแหน่ง
              </h3>
              <span
                className={`font-mono-num text-sm font-semibold ${getDiffToneClass(
                  school.diff_total
                )}`}
              >
                {getDiffLabel(school.diff_total)} {formatSigned(school.diff_total)} (
                {formatPercent(school.diff_teacher_pct)})
              </span>
            </div>
            {(deficitText || surplusText) && (
              <p className="mt-1.5 text-sm font-medium">
                {deficitText && <span className="text-[#B91C1C]">{deficitText}</span>}
                {deficitText && surplusText && <span className="text-[#9CA3AF]"> · </span>}
                {surplusText && <span className="text-[#0F766E]">{surplusText}</span>}
              </p>
            )}

            <div className="mt-3 overflow-x-auto rounded-md border border-[#E5E7EB]">
              <table className="w-full border-collapse text-right text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                    <th className="px-3 py-2 text-left font-medium">รายการ</th>
                    <th className="px-3 py-2 font-medium">ผอ.</th>
                    <th className="px-3 py-2 font-medium">รอง</th>
                    <th className="px-3 py-2 font-medium">ครู</th>
                    <th className="px-3 py-2 font-medium">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] font-mono-num">
                  <tr>
                    <td className="px-3 py-2.5 text-left font-sans font-medium text-[#111827]">
                      ครูมีตัวจริง (คนครอง)
                    </td>
                    <td className="px-3 py-2.5">{school.actual_director}</td>
                    <td className="px-3 py-2.5">{school.actual_deputy}</td>
                    <td className="px-3 py-2.5">{school.actual_teacher}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#111827]">
                      {school.actual_total}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-left font-sans text-[#4B5563]">
                      ตาม จ.18 (บัญชีถือจ่าย)
                    </td>
                    <td className="px-3 py-2.5">{school.j18_paid_director}</td>
                    <td className="px-3 py-2.5">{school.j18_paid_deputy}</td>
                    <td className="px-3 py-2.5">{school.j18_paid_teacher}</td>
                    <td className="px-3 py-2.5 font-medium">{school.j18_paid_total}</td>
                  </tr>
                  <tr className="bg-[#F0FDF4]/70">
                    <td className="px-3 py-2.5 text-left font-sans font-medium text-[#15803D]">
                      ตำแหน่งว่าง (จ.18 ถือจ่าย − คนครอง)
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[#15803D]">
                      {vacantCounts.director || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[#15803D]">
                      {vacantCounts.deputy || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[#15803D]">
                      {vacantCounts.teacher || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-[#15803D]">
                      {vacantCounts.total || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-left font-sans text-[#4B5563]">
                      ตาม จ.18 (คำนวณอัตรา)
                    </td>
                    <td className="px-3 py-2.5">{school.j18_calc_director}</td>
                    <td className="px-3 py-2.5">{school.j18_calc_deputy}</td>
                    <td className="px-3 py-2.5">{school.j18_calc_teacher}</td>
                    <td className="px-3 py-2.5 font-medium">{school.j18_calc_total}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-left font-sans text-[#4B5563]">
                      ตามเกณฑ์ ก.ค.ศ.
                    </td>
                    <td className="px-3 py-2.5">{school.criteria_director}</td>
                    <td className="px-3 py-2.5">{school.criteria_deputy}</td>
                    <td className="px-3 py-2.5">{school.criteria_teacher}</td>
                    <td className="px-3 py-2.5 font-medium">{school.criteria_total}</td>
                  </tr>
                  <tr className="bg-[#FAFAFA]">
                    <td className="px-3 py-2.5 text-left font-sans font-semibold text-[#111827]">
                      ดุลอัตรากำลัง (-ขาด / +เกิน)
                    </td>
                    <td className={`px-3 py-2.5 ${getDiffToneClass(school.diff_director)}`}>
                      {formatSigned(school.diff_director)}
                    </td>
                    <td className={`px-3 py-2.5 ${getDiffToneClass(school.diff_deputy)}`}>
                      {formatSigned(school.diff_deputy)}
                    </td>
                    <td className={`px-3 py-2.5 ${getDiffToneClass(school.diff_teacher)}`}>
                      {formatSigned(school.diff_teacher)}
                    </td>
                    <td
                      className={`px-3 py-2.5 font-semibold ${getDiffToneClass(
                        school.diff_total
                      )}`}
                    >
                      {formatSigned(school.diff_total)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-left font-sans text-[#4B5563]">
                      เกษียณอายุราชการ
                    </td>
                    <td className="px-3 py-2.5">{school.retire_director}</td>
                    <td className="px-3 py-2.5">{school.retire_deputy}</td>
                    <td className="px-3 py-2.5">{school.retire_teacher}</td>
                    <td className="px-3 py-2.5 font-medium">{school.retire_total}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-left font-sans text-[#4B5563]">
                      หลังเกษียณ (1 ต.ค.)
                    </td>
                    <td className={`px-3 py-2.5 ${getDiffToneClass(school.post_retire_director)}`}>
                      {formatSigned(school.post_retire_director)}
                    </td>
                    <td className={`px-3 py-2.5 ${getDiffToneClass(school.post_retire_deputy)}`}>
                      {formatSigned(school.post_retire_deputy)}
                    </td>
                    <td className={`px-3 py-2.5 ${getDiffToneClass(school.post_retire_teacher)}`}>
                      {formatSigned(school.post_retire_teacher)}
                    </td>
                    <td
                      className={`px-3 py-2.5 font-semibold ${getDiffToneClass(
                        school.post_retire_total
                      )}`}
                    >
                      {formatSigned(school.post_retire_total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {vacantCounts.total > 0 && (
              <p className="mt-2 text-xs font-medium text-[#15803D]">
                หมายเหตุ: มีตำแหน่งว่างตามบัญชีถือจ่าย จ.18 จำนวน {formatNumber(vacantCounts.total)} อัตรา ({vacantText})
              </p>
            )}
          </div>

          {branchGroup && (
            <div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#92400E]">
                  สรุปผลรวมโรงเรียนหลัก + สาขา ({1 + branchGroup.branches.length} แห่ง)
                </h3>
                <span
                  className={`font-mono-num text-sm font-semibold ${getDiffToneClass(
                    branchGroup.combined.diff_total
                  )}`}
                >
                  ขาด/เกินรวม {formatSigned(branchGroup.combined.diff_total)} (
                  {formatPercent(branchGroup.combined.diff_teacher_pct)})
                </span>
              </div>
              <p className="mt-1 text-xs text-[#B45309]">
                {branchGroup.mainSchool.school_name} +{' '}
                {branchGroup.branches.map((b) => b.school_name).join(', ')}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-[#92400E]">นักเรียนรวม</span>
                  <p className="mt-0.5 font-mono-num text-sm font-semibold text-[#111827]">
                    {formatNumber(branchGroup.combined.students_count)} คน
                  </p>
                </div>
                <div>
                  <span className="text-[#92400E]">คนครองรวม</span>
                  <p className="mt-0.5 font-mono-num text-sm font-semibold text-[#111827]">
                    {formatNumber(branchGroup.combined.actual_total)} คน
                  </p>
                </div>
                <div>
                  <span className="text-[#92400E]">เกณฑ์ ก.ค.ศ.</span>
                  <p className="mt-0.5 font-mono-num text-sm font-semibold text-[#111827]">
                    {formatNumber(branchGroup.combined.criteria_total)} อัตรา
                  </p>
                </div>
                <div>
                  <span className="text-[#92400E]">สภาพจริงครู</span>
                  <p className="mt-0.5 font-mono-num text-sm font-semibold text-[#111827]">
                    {formatSigned(
                      branchGroup.combined.diff_teacher +
                        branchGroup.combined.royal_decree_teacher +
                        branchGroup.combined.contract_teacher
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Support Staff & Secondment */}
          <div className="border-t border-[#F3F4F6] pt-5">
            <h3 className="text-sm font-semibold text-[#111827]">
              อัตรากำลังเสริมและการช่วยราชการ
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border border-[#E5E7EB] p-3">
                <span className="text-[#6B7280]">ครูอัตราจ้าง (ครูผู้สอน)</span>
                <p className="mt-1 font-mono-num text-base font-semibold text-[#111827]">
                  {formatNumber(school.contract_teacher)} คน
                </p>
              </div>
              <div className="rounded-md border border-[#E5E7EB] p-3">
                <span className="text-[#6B7280]">พรก. (ครูผู้สอน)</span>
                <p className="mt-1 font-mono-num text-base font-semibold text-[#111827]">
                  {formatNumber(school.royal_decree_teacher)} คน
                </p>
              </div>
              <div className="rounded-md border border-[#E5E7EB] p-3">
                <span className="text-[#6B7280]">ครูไปช่วยราชการ</span>
                <p className="mt-1 font-mono-num text-base font-semibold text-[#111827]">
                  {formatNumber(school.secondment_out)} คน
                </p>
              </div>
              <div className="rounded-md border border-[#E5E7EB] p-3">
                <span className="text-[#6B7280]">ครูมาช่วยราชการ</span>
                <p className="mt-1 font-mono-num text-base font-semibold text-[#111827]">
                  {formatNumber(school.secondment_in)} คน
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
