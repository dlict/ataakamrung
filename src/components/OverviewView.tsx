import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type {
  AggregateSummary,
  DistrictSummary,
  ReportPeriod,
  SchoolStaffingRecord,
} from '../types/staffing';
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
import { DistrictComparisonChart } from './DistrictComparisonChart';
import { DistrictPositionChart } from './DistrictPositionChart';
import { SchoolDistributionCharts } from './SchoolDistributionCharts';
import { TeacherTrendChart } from './TeacherTrendChart';

interface OverviewViewProps {
  records: SchoolStaffingRecord[];
  allPeriodRecords: SchoolStaffingRecord[];
  summary: AggregateSummary;
  districtBreakdown: DistrictSummary[];
  periods: ReportPeriod[];
  selectedPeriodId: string;
  selectedDistrict: string;
  selectedSize: string;
  selectedType: string;
  onSelectPeriod: (periodId: string) => void;
  onSelectDistrict: (district: string) => void;
  onSelectSchool: (school: SchoolStaffingRecord) => void;
  onNavigateToSchools: () => void;
}

type PriorityMode = 'deficit' | 'surplus' | 'vacant' | 'vacant_director' | 'retiring';

export function OverviewView({
  records,
  allPeriodRecords,
  summary,
  districtBreakdown,
  periods,
  selectedPeriodId,
  selectedDistrict,
  selectedSize,
  selectedType,
  onSelectPeriod,
  onSelectDistrict,
  onSelectSchool,
  onNavigateToSchools,
}: OverviewViewProps) {
  const [priorityMode, setPriorityMode] = useState<PriorityMode>('deficit');

  const sizeBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; students: number; diff: number }>();
    for (const r of records) {
      const key = r.school_size || 'ไม่ระบุ';
      const prev = map.get(key) ?? { count: 0, students: 0, diff: 0 };
      prev.count += 1;
      prev.students += r.students_count;
      prev.diff += r.diff_total;
      map.set(key, prev);
    }
    const order = ['ขนาดเล็ก', 'ขนาดกลาง', 'ขนาดใหญ่'];
    return Array.from(map.entries()).sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [records]);

  const featureBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) {
      const key = r.special_feature || 'โรงเรียนทั่วไป (ไม่ระบุลักษณะพิเศษ)';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [records]);

  const positionDeficitSummary = useMemo(() => {
    let dirSchools = 0;
    let dirSeats = 0;
    let depSchools = 0;
    let depSeats = 0;
    let teaSchools = 0;
    let teaSeats = 0;

    for (const r of records) {
      if (r.diff_director < 0) {
        dirSchools += 1;
        dirSeats += Math.abs(r.diff_director);
      }
      if (r.diff_deputy < 0) {
        depSchools += 1;
        depSeats += Math.abs(r.diff_deputy);
      }
      if (r.diff_teacher < 0) {
        teaSchools += 1;
        teaSeats += Math.abs(r.diff_teacher);
      }
    }

    return [
      { label: 'ขาดเกณฑ์ตำแหน่ง ผอ.', schools: dirSchools, seats: dirSeats },
      { label: 'ขาดเกณฑ์ตำแหน่ง รอง ผอ.', schools: depSchools, seats: depSeats },
      { label: 'ขาดเกณฑ์ตำแหน่ง ครูผู้สอน', schools: teaSchools, seats: teaSeats },
    ];
  }, [records]);

  const prioritySchools = useMemo(() => {
    if (priorityMode === 'deficit') {
      return [...records]
        .filter((r) => r.diff_total < 0)
        .sort((a, b) => a.diff_total - b.diff_total || a.diff_teacher_pct - b.diff_teacher_pct)
        .slice(0, 10);
    }
    if (priorityMode === 'surplus') {
      return [...records]
        .filter((r) => r.diff_total > 0)
        .sort((a, b) => b.diff_total - a.diff_total || b.diff_teacher_pct - b.diff_teacher_pct)
        .slice(0, 10);
    }
    if (priorityMode === 'vacant') {
      return [...records]
        .filter((r) => getVacantCounts(r).total > 0)
        .sort(
          (a, b) =>
            getVacantCounts(b).total - getVacantCounts(a).total ||
            b.students_count - a.students_count
        );
    }
    if (priorityMode === 'vacant_director') {
      return [...records]
        .filter((r) => r.criteria_director > r.actual_director)
        .sort((a, b) => b.students_count - a.students_count)
        .slice(0, 10);
    }
    return [...records]
      .filter((r) => r.retire_total > 0)
      .sort((a, b) => b.retire_total - b.retire_total || a.post_retire_total - b.post_retire_total)
      .slice(0, 10);
  }, [records, priorityMode]);

  const maxDistrictCriteria = useMemo(
    () => Math.max(1, ...districtBreakdown.map((d) => Math.max(d.criteriaTotal, d.actualTotal))),
    [districtBreakdown]
  );

  const totalForBar = Math.max(1, summary.totalSchools);
  const deficitPct = (summary.deficitSchools / totalForBar) * 100;
  const balancedPct = (summary.balancedSchools / totalForBar) * 100;
  const surplusPct = (summary.surplusSchools / totalForBar) * 100;

  return (
    <div className="space-y-6">
      {/* 4-Column Hairline KPI Strip */}
      <section
        aria-label="สรุปตัวชี้วัดหลัก"
        className="grid grid-cols-1 divide-y divide-[#E5E7EB] rounded-lg border border-[#E5E7EB] bg-white sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
      >
        <div className="p-5 sm:border-b sm:border-r lg:border-b-0 lg:border-r-0 border-[#E5E7EB]">
          <p className="text-sm font-medium text-[#6B7280]">โรงเรียนและนักเรียน</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num text-3xl font-semibold tracking-tight text-[#111827]">
              {formatNumber(summary.totalSchools)}
            </span>
            <span className="text-sm text-[#6B7280]">แห่ง</span>
          </div>
          <p className="mt-2 text-sm text-[#4B5563] tabular-nums">
            {formatNumber(summary.totalStudents)} นักเรียน · {formatNumber(summary.totalClassrooms)} ห้องเรียน
          </p>
        </div>

        <div className="p-5 sm:border-b lg:border-b-0 border-[#E5E7EB]">
          <p className="text-sm font-medium text-[#6B7280]">ครูมีตัวจริง / เกณฑ์ ก.ค.ศ.</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num text-3xl font-semibold tracking-tight text-[#111827]">
              {formatNumber(summary.actualTotal)}
            </span>
            <span className="font-mono-num text-base text-[#6B7280]">
              / {formatNumber(summary.criteriaTotal)}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#4B5563] tabular-nums">
            จ.18 ถือจ่าย {formatNumber(summary.j18PaidTotal)} ·{' '}
            <span className={summary.vacantTotal > 0 ? 'font-medium text-[#15803D]' : ''}>
              ตำแหน่งว่าง {formatNumber(summary.vacantTotal)} อัตรา
            </span>
          </p>
        </div>

        <div className="p-5 sm:border-r lg:border-r-0 border-[#E5E7EB]">
          <p className="text-sm font-medium text-[#6B7280]">ดุลอัตรากำลัง (จ.18 เทียบเกณฑ์)</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span
              className={`font-mono-num text-3xl font-semibold tracking-tight ${getDiffToneClass(
                summary.diffTotal
              )}`}
            >
              {formatSigned(summary.diffTotal)}
            </span>
            <span className={`font-mono-num text-sm font-medium ${getDiffToneClass(summary.diffTotal)}`}>
              ({formatPercent(summary.diffTeacherPct)}) · {getDiffLabel(summary.diffTotal)}
            </span>
          </div>
          <p className="mt-2 flex flex-wrap gap-x-2.5 gap-y-0.5 text-sm tabular-nums">
            <span className={getDiffToneClass(summary.diffDirector)}>
              ผอ. {formatSigned(summary.diffDirector)}
            </span>
            <span className="text-[#D1D5DB]">·</span>
            <span className={getDiffToneClass(summary.diffDeputy)}>
              รอง ผอ. {formatSigned(summary.diffDeputy)}
            </span>
            <span className="text-[#D1D5DB]">·</span>
            <span className={getDiffToneClass(summary.diffTeacher)}>
              ครู {formatSigned(summary.diffTeacher)}
            </span>
          </p>
        </div>

        <div className="p-5">
          <p className="text-sm font-medium text-[#6B7280]">ครูอัตราจ้าง พรก. และเกษียณ</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num text-3xl font-semibold tracking-tight text-[#111827]">
              {formatNumber(summary.contractTeacher + summary.royalDecreeTeacher)}
            </span>
            <span className="text-sm text-[#6B7280]">อัตราเสริม</span>
          </div>
          <p className="mt-2 text-sm text-[#4B5563] tabular-nums">
            อัตราจ้าง {formatNumber(summary.contractTeacher)} · พรก. {formatNumber(summary.royalDecreeTeacher)} · เกษียณ{' '}
            {formatNumber(summary.retireTotal)}
          </p>
        </div>
      </section>

      {/* Vacant Positions Summary Panel (J.18 Paid minus Actual) */}
      <section
        aria-label="สรุปตำแหน่งว่างตามบัญชีถือจ่าย"
        className="rounded-lg border border-[#E5E7EB] bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] px-5 py-3.5 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">
              สรุปตำแหน่งว่าง (จ.18 บัญชีถือจ่าย − คนครองจริง)
            </h2>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              คำนวณจากอัตราที่มีในบัญชีถือจ่าย (จ.18) แต่ยังไม่มีผู้ดำรงตำแหน่งจริงในแต่ละโรงเรียน
            </p>
          </div>
          {summary.vacantSchools > 0 && (
            <button
              type="button"
              onClick={() => {
                setPriorityMode('vacant');
                document
                  .getElementById('priority-schools-section')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#15803D] hover:underline whitespace-nowrap shrink-0"
            >
              <span>ดูรายชื่อ {formatNumber(summary.vacantSchools)} โรงเรียนที่มีตำแหน่งว่าง</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 divide-y divide-[#E5E7EB] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          <div className="px-5 py-4 sm:border-b sm:border-r lg:border-b-0 lg:border-r-0 border-[#E5E7EB]">
            <p className="text-sm text-[#6B7280]">ตำแหน่งว่างรวมทั้งหมด</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={`font-mono-num text-2xl font-semibold ${
                  summary.vacantTotal > 0 ? 'text-[#15803D]' : 'text-[#111827]'
                }`}
              >
                {formatNumber(summary.vacantTotal)}
              </span>
              <span className="text-sm text-[#6B7280]">
                อัตรา · {formatNumber(summary.vacantSchools)} โรงเรียน
              </span>
            </div>
          </div>
          <div className="px-5 py-4 sm:border-b lg:border-b-0 border-[#E5E7EB]">
            <p className="text-sm text-[#6B7280]">ว่างตำแหน่ง ผอ.</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono-num text-2xl font-semibold text-[#111827]">
                {formatNumber(summary.vacantDirector)}
              </span>
              <span className="text-sm text-[#6B7280]">
                อัตรา · {formatNumber(summary.vacantDirectorByJ18Schools)} แห่ง
              </span>
            </div>
          </div>
          <div className="px-5 py-4 sm:border-r lg:border-r-0 border-[#E5E7EB]">
            <p className="text-sm text-[#6B7280]">ว่างตำแหน่ง รอง ผอ.</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono-num text-2xl font-semibold text-[#111827]">
                {formatNumber(summary.vacantDeputy)}
              </span>
              <span className="text-sm text-[#6B7280]">
                อัตรา · {formatNumber(summary.vacantDeputyByJ18Schools)} แห่ง
              </span>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-[#6B7280]">ว่างตำแหน่ง ครูผู้สอน</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={`font-mono-num text-2xl font-semibold ${
                  summary.vacantTeacher > 0 ? 'text-[#15803D]' : 'text-[#111827]'
                }`}
              >
                {formatNumber(summary.vacantTeacher)}
              </span>
              <span className="text-sm text-[#6B7280]">
                อัตรา · {formatNumber(summary.vacantTeacherByJ18Schools)} แห่ง
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recharts Historical Teacher Trend Line Chart */}
      <TeacherTrendChart
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        currentPeriodRecords={allPeriodRecords}
        selectedDistrict={selectedDistrict}
        selectedSize={selectedSize}
        selectedType={selectedType}
        onSelectPeriod={onSelectPeriod}
      />

      {/* Recharts Actual vs Criteria per District */}
      <DistrictComparisonChart
        districts={districtBreakdown}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={onSelectDistrict}
      />

      {/* Recharts Position-by-District Deficit/Surplus Visualization */}
      <DistrictPositionChart
        districts={districtBreakdown}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={onSelectDistrict}
      />

      {/* Recharts Pie Charts: School Size & Type Distribution */}
      <SchoolDistributionCharts records={records} />

      {/* Main Analytical Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* District Breakdown */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#F3F4F6] pb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                สรุปอัตรากำลังรายอำเภอ
              </h2>
              <p className="mt-0.5 text-sm text-[#6B7280]">
                เปรียบเทียบคนครองจริงกับเกณฑ์ ก.ค.ศ. (คลิกชื่ออำเภอเพื่อกรองข้อมูล)
              </p>
            </div>
            {selectedDistrict !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectDistrict('all')}
                className="text-sm font-medium text-[#1E3A8A] hover:underline"
              >
                แสดงทุกอำเภอ
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {districtBreakdown.map((d) => {
              const actualWidth = (d.actualTotal / maxDistrictCriteria) * 100;
              const criteriaWidth = (d.criteriaTotal / maxDistrictCriteria) * 100;
              const isSelected = selectedDistrict === d.district;

              return (
                <button
                  key={d.district}
                  type="button"
                  onClick={() =>
                    onSelectDistrict(isSelected ? 'all' : d.district)
                  }
                  className={`block w-full rounded-md border p-4 text-left transition-colors duration-150 ${
                    isSelected
                      ? 'border-[#1E3A8A] bg-[#F8FAFC]'
                      : 'border-[#F3F4F6] bg-white hover:border-[#D1D5DB] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[15px] font-semibold text-[#111827]">
                        อ.{d.district}
                      </span>
                      <span className="text-sm text-[#6B7280] tabular-nums">
                        {formatNumber(d.schools)} ร.ร. · {formatNumber(d.students)} นร.
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2.5 font-mono-num text-sm">
                      <span className="text-[#4B5563]">
                        คนครอง {formatNumber(d.actualTotal)} / เกณฑ์ {formatNumber(d.criteriaTotal)}
                      </span>
                      <span className={`font-semibold ${getDiffToneClass(d.diffTotal)}`}>
                        {formatSigned(d.diffTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Minimalist Precision Comparative Track */}
                  <div className="mt-3 space-y-2">
                    <div className="relative h-2.5 w-full overflow-hidden rounded-sm bg-[#F3F4F6]">
                      <div
                        className="absolute inset-y-0 left-0 bg-[#D1D5DB]"
                        style={{ width: `${Math.min(100, criteriaWidth)}%` }}
                        title={`เกณฑ์ ก.ค.ศ. ${d.criteriaTotal}`}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-[#1E3A8A]"
                        style={{ width: `${Math.min(100, actualWidth)}%` }}
                        title={`ครูมีตัวจริง ${d.actualTotal}`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#6B7280] tabular-nums">
                      <span>
                        ขาด {d.deficitSchools} · พอดี {d.balancedSchools} · เกิน {d.surplusSchools} โรงเรียน
                        {d.vacantTotal > 0 && (
                          <span className="ml-2 font-medium text-[#15803D]">
                            · ว่าง {formatNumber(d.vacantTotal)} อัตรา
                          </span>
                        )}
                      </span>
                      <span>
                        ผอ. {formatSigned(d.diffDirector)} · รอง {formatSigned(d.diffDeputy)} · ครู {formatSigned(d.diffTeacher)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-[#F3F4F6] pt-3.5 text-[13px] text-[#6B7280]">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-3.5 bg-[#1E3A8A]" aria-hidden="true" />
              ครูมีตัวจริง (คนครอง)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-3.5 bg-[#D1D5DB]" aria-hidden="true" />
              เกณฑ์ ก.ค.ศ.
            </span>
          </div>
        </section>

        {/* Right Column: School Status & Structure */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 lg:col-span-5">
          <div className="border-b border-[#F3F4F6] pb-4">
            <h2 className="text-lg font-semibold text-[#111827]">
              สัดส่วนสถานะและโครงสร้างโรงเรียน
            </h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              จำแนกตามเกณฑ์อัตรากำลัง ขนาดโรงเรียน และพื้นที่พิเศษ
            </p>
          </div>

          {/* Segmented Bar */}
          <div className="mt-5">
            <div className="flex h-3.5 w-full overflow-hidden rounded-sm bg-[#F3F4F6]">
              {deficitPct > 0 && (
                <div
                  className="bg-[#B91C1C]"
                  style={{ width: `${deficitPct}%` }}
                  title={`ขาดเกณฑ์ ${summary.deficitSchools} โรงเรียน`}
                />
              )}
              {balancedPct > 0 && (
                <div
                  className="bg-[#9CA3AF]"
                  style={{ width: `${balancedPct}%` }}
                  title={`พอดีเกณฑ์ ${summary.balancedSchools} โรงเรียน`}
                />
              )}
              {surplusPct > 0 && (
                <div
                  className="bg-[#0F766E]"
                  style={{ width: `${surplusPct}%` }}
                  title={`เกินเกณฑ์ ${summary.surplusSchools} โรงเรียน`}
                />
              )}
            </div>

            <div className="mt-3.5 grid grid-cols-3 gap-2 text-sm tabular-nums">
              <div>
                <div className="flex items-center gap-1.5 text-[#6B7280]">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#B91C1C]" aria-hidden="true" />
                  <span>ขาดเกณฑ์</span>
                </div>
                <p className="mt-1 font-mono-num text-base font-semibold text-[#111827]">
                  {formatNumber(summary.deficitSchools)} แห่ง
                </p>
                <p className="text-[13px] text-[#6B7280]">{deficitPct.toFixed(1)}%</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[#6B7280]">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#9CA3AF]" aria-hidden="true" />
                  <span>พอดีเกณฑ์</span>
                </div>
                <p className="mt-1 font-mono-num text-base font-semibold text-[#111827]">
                  {formatNumber(summary.balancedSchools)} แห่ง
                </p>
                <p className="text-[13px] text-[#6B7280]">{balancedPct.toFixed(1)}%</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[#6B7280]">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#0F766E]" aria-hidden="true" />
                  <span>เกินเกณฑ์</span>
                </div>
                <p className="mt-1 font-mono-num text-base font-semibold text-[#111827]">
                  {formatNumber(summary.surplusSchools)} แห่ง
                </p>
                <p className="text-[13px] text-[#6B7280]">{surplusPct.toFixed(1)}%</p>
              </div>
            </div>

            <div className="mt-4 border-t border-[#F3F4F6] pt-3.5">
              <h3 className="text-sm font-semibold text-[#374151]">
                โรงเรียนที่ขาดเกณฑ์ แยกตามตำแหน่ง (ผอ. / รอง ผอ. / ครู)
              </h3>
              <div className="mt-2 space-y-2 text-sm tabular-nums">
                {positionDeficitSummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[#4B5563]">{item.label}</span>
                    <span className="font-mono-num">
                      <span className="font-medium text-[#111827]">
                        {formatNumber(item.schools)} แห่ง
                      </span>
                      <span
                        className={`ml-2 font-semibold ${
                          item.seats > 0 ? 'text-[#B91C1C]' : 'text-[#6B7280]'
                        }`}
                      >
                        ({item.seats > 0 ? `ขาด ${formatNumber(item.seats)} อัตรา` : 'ไม่ขาด'})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* School Sizes */}
          <div className="mt-6 border-t border-[#F3F4F6] pt-4">
            <h3 className="text-sm font-semibold text-[#374151]">จำแนกตามขนาดโรงเรียน</h3>
            <div className="mt-2.5 divide-y divide-[#F3F4F6] text-sm">
              {sizeBreakdown.map(([size, info]) => (
                <div key={size} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="font-medium text-[#111827]">{size}</span>
                    <span className="ml-2 text-[#6B7280] tabular-nums">
                      {formatNumber(info.students)} นร.
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono-num">
                    <span className="text-[#4B5563]">{formatNumber(info.count)} แห่ง</span>
                    <span className={`w-12 text-right font-semibold ${getDiffToneClass(info.diff)}`}>
                      {formatSigned(info.diff)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Features & Position Summary */}
          <div className="mt-5 border-t border-[#F3F4F6] pt-4">
            <h3 className="text-sm font-semibold text-[#374151]">ลักษณะพื้นที่และอัตรากำลังเพิ่มเติม</h3>
            <div className="mt-2.5 space-y-2 text-sm">
              {featureBreakdown.map(([feat, count]) => (
                <div key={feat} className="flex items-center justify-between text-[#4B5563]">
                  <span className="truncate pr-3">{feat}</span>
                  <span className="font-mono-num font-medium text-[#111827]">
                    {formatNumber(count)} แห่ง
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[#F9FAFB] pt-2.5 text-[#4B5563]">
                <span>โรงเรียนที่ยังไม่มี ผอ. (คนครอง)</span>
                <span className="font-mono-num font-medium text-[#111827]">
                  {formatNumber(summary.vacantDirectorSchools)} แห่ง
                </span>
              </div>
              <div className="flex items-center justify-between text-[#4B5563]">
                <span>ช่วยราชการ (ไป / มา)</span>
                <span className="font-mono-num font-medium text-[#111827]">
                  ไป {formatNumber(summary.secondmentOut)} / มา {formatNumber(summary.secondmentIn)} คน
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Priority Schools List */}
      <section
        id="priority-schools-section"
        className="rounded-lg border border-[#E5E7EB] bg-white"
      >
        <div className="flex flex-col gap-3 border-b border-[#E5E7EB] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              รายการโรงเรียนที่ควรติดตาม
            </h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              คลิกที่แถวเพื่อดูรายละเอียดอัตรากำลังครบทุกตำแหน่งของโรงเรียน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-md bg-[#F3F4F6] p-1">
            {(
              [
                { id: 'deficit', label: 'ขาดแคลนมากที่สุด' },
                { id: 'vacant', label: `มีตำแหน่งว่าง (${formatNumber(summary.vacantSchools)})` },
                { id: 'surplus', label: 'เกินเกณฑ์มากที่สุด' },
                { id: 'vacant_director', label: 'ว่างตำแหน่ง ผอ.' },
                { id: 'retiring', label: 'มีผู้เกษียณ 1 ต.ค.' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPriorityMode(tab.id)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  priorityMode === tab.id
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {prioritySchools.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">
            ไม่พบโรงเรียนในกลุ่มนี้ตามตัวกรองที่เลือก
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#6B7280]">
                  <th className="py-3 pl-6 pr-3 font-medium">รหัส</th>
                  <th className="px-3 py-3 font-medium">โรงเรียน</th>
                  <th className="hidden md:table-cell px-3 py-3 font-medium">ตำบล / อำเภอ</th>
                  <th className="hidden sm:table-cell px-3 py-3 font-medium">ขนาด</th>
                  <th className="px-3 py-3 text-right font-medium">นร.</th>
                  <th className="px-3 py-3 text-right font-medium">คนครอง</th>
                  <th className="px-3 py-3 text-right font-medium">เกณฑ์ ก.ค.ศ.</th>
                  <th className="px-3 py-3 text-right font-medium">ขาด/เกิน</th>
                  <th className="hidden lg:table-cell px-3 py-3 font-medium">
                    จำแนกตำแหน่ง (ผอ./รอง/ครู)
                  </th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap">ตำแหน่งว่าง (จ.18)</th>
                  <th className="hidden sm:table-cell py-3 pl-3 pr-6 text-right font-medium">
                    อัตราจ้าง+พรก.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {prioritySchools.map((s) => {
                  const deficitText = formatDeficitPositionsText(s);
                  const surplusText = formatSurplusPositionsText(s);
                  const vacantText = formatVacantPositionsText(s);
                  return (
                    <tr
                      key={s.school_code}
                      onClick={() => onSelectSchool(s)}
                      className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
                    >
                      <td className="py-3.5 pl-6 pr-3 font-mono-num text-[#6B7280]">
                        {s.school_code}
                      </td>
                      <td className="px-3 py-3.5 font-medium text-[#111827]">
                        <div>
                          <span>{s.school_name}</span>
                          {s.is_flagged && (
                            <span className="ml-1.5 text-[13px] font-normal text-[#6B7280]">
                              (มีสาขา/หมายเหตุ)
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[13px] font-normal lg:hidden">
                          {deficitText && (
                            <span className="font-medium text-[#B91C1C]">{deficitText}</span>
                          )}
                          {deficitText && surplusText && <span className="text-[#9CA3AF]"> · </span>}
                          {surplusText && (
                            <span className="font-medium text-[#0F766E]">{surplusText}</span>
                          )}
                          {!deficitText && !surplusText && (
                            <span className="text-[#6B7280]">พอดีทุกตำแหน่ง</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 py-3.5 text-[#4B5563]">
                        ต.{s.subdistrict} · อ.{s.district}
                      </td>
                      <td className="hidden sm:table-cell px-3 py-3.5 text-[#4B5563]">
                        {s.school_size}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono-num text-[#111827]">
                        {formatNumber(s.students_count)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono-num text-[#111827]">
                        {formatNumber(s.actual_total)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono-num text-[#4B5563]">
                        {formatNumber(s.criteria_total)}
                      </td>
                      <td
                        className={`px-3 py-3.5 text-right font-mono-num font-semibold ${getDiffToneClass(
                          s.diff_total
                        )}`}
                      >
                        {formatSigned(s.diff_total)}
                        <span className="ml-1 font-normal text-[13px]">
                          ({formatPercent(s.diff_teacher_pct)})
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-3 py-3.5 text-[13px]">
                        {deficitText && (
                          <div className="font-medium text-[#B91C1C]">{deficitText}</div>
                        )}
                        {surplusText && (
                          <div className="font-medium text-[#0F766E]">{surplusText}</div>
                        )}
                        {!deficitText && !surplusText && (
                          <span className="text-[#6B7280]">พอดีทุกตำแหน่ง</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-[13px] whitespace-nowrap">
                        {vacantText ? (
                          <span className="font-medium text-[#15803D]">{vacantText}</span>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell py-3.5 pl-3 pr-6 text-right font-mono-num text-[#4B5563]">
                        {formatNumber(s.contract_teacher + s.royal_decree_teacher)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end border-t border-[#F3F4F6] px-6 py-3.5">
          <button
            type="button"
            onClick={onNavigateToSchools}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E3A8A] hover:underline"
          >
            <span>ดูรายชื่อโรงเรียนทั้งหมด ({formatNumber(records.length)} แห่ง)</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
