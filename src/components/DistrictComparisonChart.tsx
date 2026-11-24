import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DistrictSummary } from '../types/staffing';
import { formatNumber, formatSigned, getDiffToneClass } from '../utils/formatters';

interface DistrictComparisonChartProps {
  districts: DistrictSummary[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}

type PositionScope = 'all' | 'teacher' | 'deputy' | 'director';

interface ComparisonDatum {
  district: string;
  label: string;
  actual: number;
  criteria: number;
  diff: number;
  actualDirector: number;
  criteriaDirector: number;
  actualDeputy: number;
  criteriaDeputy: number;
  actualTeacher: number;
  criteriaTeacher: number;
  schools: number;
}

function ComparisonTooltip({
  active,
  payload,
  scopeLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: ComparisonDatum }>;
  scopeLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <div className="min-w-[240px] rounded-md border border-[#E5E7EB] bg-white p-3.5 text-sm shadow-md">
      <div className="flex items-baseline justify-between gap-4 border-b border-[#F3F4F6] pb-2">
        <div>
          <span className="font-semibold text-[#111827]">อ.{d.district}</span>
          <span className="ml-2 text-xs text-[#6B7280]">{formatNumber(d.schools)} ร.ร.</span>
        </div>
        <span className={`font-mono-num text-sm font-semibold ${getDiffToneClass(d.diff)}`}>
          {formatSigned(d.diff)}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5 text-[13px] tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-[#374151]">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#1E3A8A]" aria-hidden="true" />
            บุคลากรจริง ({scopeLabel})
          </span>
          <span className="font-mono-num font-semibold text-[#111827]">
            {formatNumber(d.actual)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-[#374151]">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#CBD5E1]" aria-hidden="true" />
            เกณฑ์ที่กำหนด (ก.ค.ศ.)
          </span>
          <span className="font-mono-num font-semibold text-[#4B5563]">
            {formatNumber(d.criteria)}
          </span>
        </div>
      </div>

      <div className="mt-2.5 space-y-1 border-t border-[#F3F4F6] pt-2 text-xs text-[#6B7280] tabular-nums">
        <div className="flex justify-between gap-4">
          <span>ผอ. (จริง / เกณฑ์)</span>
          <span className="font-mono-num text-[#374151]">
            {formatNumber(d.actualDirector)} / {formatNumber(d.criteriaDirector)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>รอง ผอ. (จริง / เกณฑ์)</span>
          <span className="font-mono-num text-[#374151]">
            {formatNumber(d.actualDeputy)} / {formatNumber(d.criteriaDeputy)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>ครูผู้สอน (จริง / เกณฑ์)</span>
          <span className="font-mono-num text-[#374151]">
            {formatNumber(d.actualTeacher)} / {formatNumber(d.criteriaTeacher)}
          </span>
        </div>
      </div>
    </div>
  );
}

const SCOPE_OPTIONS: ReadonlyArray<{ id: PositionScope; label: string }> = [
  { id: 'all', label: 'รวมทุกตำแหน่ง' },
  { id: 'teacher', label: 'ครูผู้สอน' },
  { id: 'deputy', label: 'รอง ผอ.' },
  { id: 'director', label: 'ผอ.' },
];

export function DistrictComparisonChart({
  districts,
  selectedDistrict,
  onSelectDistrict,
}: DistrictComparisonChartProps) {
  const [scope, setScope] = useState<PositionScope>('all');

  const data = useMemo<ComparisonDatum[]>(
    () =>
      districts.map((d) => {
        const actual =
          scope === 'director'
            ? d.actualDirector
            : scope === 'deputy'
              ? d.actualDeputy
              : scope === 'teacher'
                ? d.actualTeacher
                : d.actualTotal;
        const criteria =
          scope === 'director'
            ? d.criteriaDirector
            : scope === 'deputy'
              ? d.criteriaDeputy
              : scope === 'teacher'
                ? d.criteriaTeacher
                : d.criteriaTotal;
        return {
          district: d.district,
          label: `อ.${d.district}`,
          actual,
          criteria,
          diff: actual - criteria,
          actualDirector: d.actualDirector,
          criteriaDirector: d.criteriaDirector,
          actualDeputy: d.actualDeputy,
          criteriaDeputy: d.criteriaDeputy,
          actualTeacher: d.actualTeacher,
          criteriaTeacher: d.criteriaTeacher,
          schools: d.schools,
        };
      }),
    [districts, scope]
  );

  const yDomain = useMemo<[number, number]>(() => {
    const maxVal = Math.max(
      5,
      ...data.map((d) => Math.max(d.actual, d.criteria))
    );
    const step = maxVal <= 20 ? 5 : maxVal <= 100 ? 10 : 50;
    return [0, Math.ceil((maxVal * 1.15) / step) * step];
  }, [data]);

  const scopeLabel = SCOPE_OPTIONS.find((o) => o.id === scope)?.label ?? 'รวมทุกตำแหน่ง';

  if (data.length === 0) return null;

  return (
    <section
      aria-label="กราฟเปรียบเทียบจำนวนบุคลากรจริงกับเกณฑ์ที่กำหนดในแต่ละอำเภอ"
      className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-[#F3F4F6] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">
            เปรียบเทียบจำนวนบุคลากรจริงกับเกณฑ์ที่กำหนดในแต่ละอำเภอ
          </h2>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            จำนวนบุคลากรที่มีตัวจริง (คนครอง) เทียบกับเกณฑ์ ก.ค.ศ. แยกรายอำเภอ (คลิกที่แท่งกราฟเพื่อกรองอำเภอ)
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

      <div className="mt-5 h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 26, right: 16, left: -4, bottom: 8 }}
            barCategoryGap="16%"
            barGap={10}
            onClick={(state) => {
              const clicked = state?.activeLabel;
              if (typeof clicked === 'string') {
                const name = clicked.replace(/^อ\./, '');
                onSelectDistrict(selectedDistrict === name ? 'all' : name);
              }
            }}
          >
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              tick={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
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
              cursor={{ fill: '#F9FAFB', opacity: 0.7 }}
              content={<ComparisonTooltip scopeLabel={scopeLabel} />}
            />
            <Bar
              dataKey="actual"
              name="บุคลากรจริง (คนครอง)"
              fill="#1E3A8A"
              radius={[4, 4, 0, 0]}
              maxBarSize={84}
            >
              <LabelList
                dataKey="actual"
                position="top"
                formatter={(v: unknown) => formatNumber(Number(v))}
                style={{ fill: '#1E3A8A', fontSize: 13, fontWeight: 600 }}
              />
            </Bar>
            <Bar
              dataKey="criteria"
              name="เกณฑ์ที่กำหนด (ก.ค.ศ.)"
              fill="#CBD5E1"
              radius={[4, 4, 0, 0]}
              maxBarSize={84}
            >
              <LabelList
                dataKey="criteria"
                position="top"
                formatter={(v: unknown) => formatNumber(Number(v))}
                style={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F4F6] pt-3.5 text-[13px] text-[#4B5563]">
        <div className="flex flex-wrap items-center gap-5">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-xs bg-[#1E3A8A]" aria-hidden="true" />
            <span>บุคลากรจริง (คนครอง) — {scopeLabel}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-xs bg-[#CBD5E1]" aria-hidden="true" />
            <span>เกณฑ์ที่กำหนด (ก.ค.ศ.) — {scopeLabel}</span>
          </span>
        </div>
        <span className="text-[#6B7280]">นำเมาส์วางบนแท่งกราฟเพื่อดูเปรียบเทียบรายตำแหน่ง ผอ./รอง ผอ./ครู</span>
      </div>
    </section>
  );
}
