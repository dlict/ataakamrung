import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  THAI_MONTHS,
  type ReportPeriod,
  type SchoolStaffingRecord,
} from '../types/staffing';
import { parseJsonResponse } from '../utils/api';
import { formatNumber, formatSigned, getDiffToneClass } from '../utils/formatters';

interface TeacherTrendChartProps {
  periods: ReportPeriod[];
  selectedPeriodId: string;
  currentPeriodRecords: SchoolStaffingRecord[];
  selectedDistrict: string;
  selectedSize: string;
  selectedType: string;
  onSelectPeriod?: (periodId: string) => void;
}

type PositionScope = 'all' | 'teacher' | 'deputy' | 'director';

interface TrendDatum {
  periodId: string;
  shortLabel: string;
  fullLabel: string;
  periodNote: string;
  isCurrent: boolean;
  actual: number;
  j18Paid: number;
  criteria: number;
  diff: number;
  vacantTeacher: number;
  supplementTeachers: number;
  schoolsCount: number;
  studentsCount: number;
}

const SCOPE_OPTIONS: ReadonlyArray<{ id: PositionScope; label: string }> = [
  { id: 'all', label: 'รวมทุกตำแหน่ง' },
  { id: 'teacher', label: 'ครูผู้สอน' },
  { id: 'deputy', label: 'รอง ผอ.' },
  { id: 'director', label: 'ผอ.' },
];

const SHORT_MONTH_MAP = new Map<number, string>(
  THAI_MONTHS.map((m) => [m.value, m.short])
);

function TrendTooltip({
  active,
  payload,
  scopeLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendDatum }>;
  scopeLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <div className="min-w-[245px] rounded-md border border-[#E5E7EB] bg-white p-3.5 text-sm shadow-md">
      <div className="flex items-baseline justify-between gap-4 border-b border-[#F3F4F6] pb-2">
        <div>
          <span className="font-semibold text-[#111827]">{d.fullLabel}</span>
          {d.isCurrent && (
            <span className="ml-2 text-xs font-medium text-[#1E3A8A]">(งวดปัจจุบัน)</span>
          )}
          {d.periodNote && (
            <p className="mt-0.5 text-xs text-[#6B7280]">ณ {d.periodNote}</p>
          )}
        </div>
        <span className={`font-mono-num text-sm font-semibold ${getDiffToneClass(d.diff)}`}>
          {formatSigned(d.diff)}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5 text-[13px] tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-[#374151]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1E3A8A]" aria-hidden="true" />
            ครูมีตัวจริง ({scopeLabel})
          </span>
          <span className="font-mono-num font-semibold text-[#111827]">
            {formatNumber(d.actual)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-[#374151]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0F766E]" aria-hidden="true" />
            ตาม จ.18 (ถือจ่าย)
          </span>
          <span className="font-mono-num font-semibold text-[#0F766E]">
            {formatNumber(d.j18Paid)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-[#374151]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]" aria-hidden="true" />
            ตามเกณฑ์ ก.ค.ศ.
          </span>
          <span className="font-mono-num font-semibold text-[#B45309]">
            {formatNumber(d.criteria)}
          </span>
        </div>
      </div>

      <div className="mt-2.5 space-y-1 border-t border-[#F3F4F6] pt-2 text-xs text-[#6B7280] tabular-nums">
        <div className="flex justify-between gap-4">
          <span>โรงเรียน / นักเรียน</span>
          <span className="font-mono-num text-[#374151]">
            {formatNumber(d.schoolsCount)} แห่ง · {formatNumber(d.studentsCount)} นร.
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>ว่าง (ครู จ.18) / พรก.+จ้าง</span>
          <span className="font-mono-num text-[#374151]">
            {formatNumber(d.vacantTeacher)} / {formatNumber(d.supplementTeachers)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TeacherTrendChart({
  periods,
  selectedPeriodId,
  currentPeriodRecords,
  selectedDistrict,
  selectedSize,
  selectedType,
  onSelectPeriod,
}: TeacherTrendChartProps) {
  const [scope, setScope] = useState<PositionScope>('all');
  const [recordsByPeriodId, setRecordsByPeriodId] = useState<
    Record<string, SchoolStaffingRecord[]>
  >({});

  // Sync already-loaded records for the currently selected period
  useEffect(() => {
    if (!selectedPeriodId || currentPeriodRecords.length === 0) return;
    setRecordsByPeriodId((prev) => {
      if (prev[selectedPeriodId] === currentPeriodRecords) return prev;
      return { ...prev, [selectedPeriodId]: currentPeriodRecords };
    });
  }, [selectedPeriodId, currentPeriodRecords]);

  // Fetch records for other historical periods when available
  useEffect(() => {
    const missingIds = periods
      .map((p) => p.id)
      .filter((id) => id !== selectedPeriodId && !(id in recordsByPeriodId));

    if (missingIds.length === 0) return;
    let active = true;

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
    });

    return () => {
      active = false;
    };
  }, [periods, selectedPeriodId, recordsByPeriodId]);

  const chronologicalPeriods = useMemo(
    () =>
      [...periods].sort(
        (a, b) => a.buddhist_year - b.buddhist_year || a.month_number - b.month_number
      ),
    [periods]
  );

  const hasActiveFilters =
    selectedDistrict !== 'all' || selectedSize !== 'all' || selectedType !== 'all';

  const data = useMemo<TrendDatum[]>(() => {
    return chronologicalPeriods.map((p) => {
      const shortMonth = SHORT_MONTH_MAP.get(p.month_number) ?? p.month_label;
      const shortYear = String(p.buddhist_year).slice(-2);
      const shortLabel = `${shortMonth} ${shortYear}`;
      const fullLabel = `${p.month_label} ${p.buddhist_year}`;

      const rawRecords = recordsByPeriodId[p.id];
      if (!rawRecords) {
        return {
          periodId: p.id,
          shortLabel,
          fullLabel,
          periodNote: p.period_note,
          isCurrent: p.id === selectedPeriodId,
          actual: hasActiveFilters ? 0 : p.total_actual_staff,
          j18Paid: hasActiveFilters ? 0 : p.total_j18_calc,
          criteria: hasActiveFilters ? 0 : p.total_criteria,
          diff: hasActiveFilters ? 0 : p.net_diff,
          vacantTeacher: 0,
          supplementTeachers: 0,
          schoolsCount: hasActiveFilters ? 0 : p.total_schools,
          studentsCount: hasActiveFilters ? 0 : p.total_students,
        };
      }

      const filtered = rawRecords.filter((r) => {
        if (selectedDistrict !== 'all' && r.district !== selectedDistrict) return false;
        if (selectedSize !== 'all' && r.school_size !== selectedSize) return false;
        if (selectedType !== 'all' && r.school_type !== selectedType) return false;
        return true;
      });

      let actual = 0;
      let j18Paid = 0;
      let criteria = 0;
      let vacantTeacher = 0;
      let supplementTeachers = 0;
      let studentsCount = 0;

      for (const r of filtered) {
        studentsCount += r.students_count;
        vacantTeacher += Math.max(0, r.j18_paid_teacher - r.actual_teacher);
        supplementTeachers += r.royal_decree_teacher + r.contract_teacher;

        if (scope === 'director') {
          actual += r.actual_director;
          j18Paid += r.j18_paid_director;
          criteria += r.criteria_director;
        } else if (scope === 'deputy') {
          actual += r.actual_deputy;
          j18Paid += r.j18_paid_deputy;
          criteria += r.criteria_deputy;
        } else if (scope === 'teacher') {
          actual += r.actual_teacher;
          j18Paid += r.j18_paid_teacher;
          criteria += r.criteria_teacher;
        } else {
          actual += r.actual_total;
          j18Paid += r.j18_paid_total;
          criteria += r.criteria_total;
        }
      }

      return {
        periodId: p.id,
        shortLabel,
        fullLabel,
        periodNote: p.period_note,
        isCurrent: p.id === selectedPeriodId,
        actual,
        j18Paid,
        criteria,
        diff: j18Paid - criteria,
        vacantTeacher,
        supplementTeachers,
        schoolsCount: filtered.length,
        studentsCount,
      };
    });
  }, [
    chronologicalPeriods,
    recordsByPeriodId,
    selectedPeriodId,
    selectedDistrict,
    selectedSize,
    selectedType,
    hasActiveFilters,
    scope,
  ]);

  const yDomain = useMemo<[number, number]>(() => {
    if (data.length === 0) return [0, 10];
    const values = data.flatMap((d) => [d.actual, d.j18Paid, d.criteria]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(5, ...values);
    const step = maxVal <= 20 ? 5 : maxVal <= 100 ? 10 : maxVal <= 500 ? 25 : 50;

    if (data.length === 1 || minVal === maxVal) {
      return [0, Math.ceil((maxVal * 1.15) / step) * step];
    }

    const span = Math.max(step, maxVal - minVal);
    const low = Math.max(0, Math.floor((minVal - span * 0.35) / step) * step);
    const high = Math.ceil((maxVal + span * 0.25) / step) * step;
    return [low, Math.max(low + step, high)];
  }, [data]);

  const latestDelta = useMemo(() => {
    if (data.length < 2) return null;
    const prev = data[data.length - 2];
    const latest = data[data.length - 1];
    return {
      fromLabel: prev.shortLabel,
      toLabel: latest.shortLabel,
      actualDelta: latest.actual - prev.actual,
      criteriaDelta: latest.criteria - prev.criteria,
    };
  }, [data]);

  const scopeLabel =
    SCOPE_OPTIONS.find((o) => o.id === scope)?.label ?? 'รวมทุกตำแหน่ง';

  if (data.length === 0) return null;

  return (
    <section
      aria-label="กราฟเส้นแสดงแนวโน้มจำนวนครูย้อนหลัง"
      className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-[#F3F4F6] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 className="text-lg font-semibold text-[#111827]">
              แนวโน้มจำนวนครูในภาพรวมย้อนหลัง
            </h2>
            {latestDelta && (
              <span className="font-mono-num text-sm text-[#4B5563]">
                ({latestDelta.fromLabel} → {latestDelta.toLabel}: คนครอง{' '}
                <span
                  className={`font-semibold ${getDiffToneClass(latestDelta.actualDelta)}`}
                >
                  {formatSigned(latestDelta.actualDelta)}
                </span>{' '}
                อัตรา)
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            {data.length === 1
              ? 'กำลังแสดงข้อมูล 1 งวดที่มีในระบบ — เมื่อนำเข้าข้อมูลงวดอื่นเพิ่มเติม กราฟเส้นจะแสดงแนวโน้มต่อเนื่องให้อัตโนมัติ'
              : `แสดงแนวโน้มย้อนหลัง ${formatNumber(data.length)} งวด (เปรียบเทียบคนครองจริง จ.18 และเกณฑ์ ก.ค.ศ.)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 self-start rounded-md bg-[#F3F4F6] p-1 lg:self-auto">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setScope(opt.id)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                scope === opt.id
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 16, right: 20, left: 0, bottom: 8 }}
            onClick={(state) => {
              const label = state?.activeLabel;
              if (!onSelectPeriod || typeof label !== 'string') return;
              const clicked = data.find((d) => d.shortLabel === label);
              if (clicked?.periodId && clicked.periodId !== selectedPeriodId) {
                onSelectPeriod(clicked.periodId);
              }
            }}
          >
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="shortLabel"
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 13 }}
              tickFormatter={(v) => formatNumber(Number(v))}
            />
            <Tooltip
              cursor={{ stroke: '#D1D5DB', strokeDasharray: '3 3' }}
              content={<TrendTooltip scopeLabel={scopeLabel} />}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="ครูมีตัวจริง (คนครอง)"
              stroke="#1E3A8A"
              strokeWidth={2.5}
              dot={{ r: 4.5, fill: '#1E3A8A', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6.5, fill: '#1E3A8A', strokeWidth: 2, stroke: '#FFFFFF' }}
            />
            <Line
              type="monotone"
              dataKey="j18Paid"
              name="ตาม จ.18 (บัญชีถือจ่าย)"
              stroke="#0F766E"
              strokeWidth={2}
              dot={{ r: 4, fill: '#0F766E', strokeWidth: 1.5, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#0F766E', strokeWidth: 2, stroke: '#FFFFFF' }}
            />
            <Line
              type="monotone"
              dataKey="criteria"
              name="ตามเกณฑ์ ก.ค.ศ."
              stroke="#D97706"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 4, fill: '#D97706', strokeWidth: 1.5, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#D97706', strokeWidth: 2, stroke: '#FFFFFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F4F6] pt-3.5 text-[13px] text-[#4B5563]">
        <div className="flex flex-wrap items-center gap-5">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-0.5 w-4 bg-[#1E3A8A]" aria-hidden="true" />
            <span>ครูมีตัวจริง ({scopeLabel})</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-0.5 w-4 bg-[#0F766E]" aria-hidden="true" />
            <span>ตาม จ.18 (ถือจ่าย)</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[#D97706]"
              aria-hidden="true"
            />
            <span>ตามเกณฑ์ ก.ค.ศ.</span>
          </span>
        </div>
        <span className="text-[#6B7280]">
          {hasActiveFilters
            ? 'กำลังกรองแนวโน้มตามเงื่อนไขที่เลือกด้านบน'
            : 'นำเมาส์วางบนจุดกราฟเพื่อดูรายละเอียดแต่ละงวด'}
        </span>
      </div>
    </section>
  );
}
