import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DistrictSummary } from '../types/staffing';
import { formatNumber, formatSigned, getDiffToneClass } from '../utils/formatters';

interface DistrictPositionChartProps {
  districts: DistrictSummary[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}

type ChartMode = 'diff' | 'compare';

interface ChartDatum {
  district: string;
  label: string;
  diffDirector: number;
  diffDeputy: number;
  diffTeacher: number;
  diffTotal: number;
  actualTotal: number;
  criteriaTotal: number;
  actualDirector: number;
  criteriaDirector: number;
  actualDeputy: number;
  criteriaDeputy: number;
  actualTeacher: number;
  criteriaTeacher: number;
}

function CustomTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  mode: ChartMode;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <div className="min-w-[230px] rounded-md border border-[#E5E7EB] bg-white p-3.5 text-sm shadow-md">
      <div className="flex items-baseline justify-between gap-4 border-b border-[#F3F4F6] pb-2">
        <span className="font-semibold text-[#111827]">อ.{d.district}</span>
        <span className={`font-mono-num text-sm font-semibold ${getDiffToneClass(d.diffTotal)}`}>
          รวม {formatSigned(d.diffTotal)}
        </span>
      </div>

      {mode === 'diff' ? (
        <div className="mt-2.5 space-y-1.5 text-[13px] tabular-nums">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-[#374151]">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#475569]" aria-hidden="true" />
              ผู้อำนวยการ (ผอ.)
            </span>
            <span className={`font-mono-num font-semibold ${getDiffToneClass(d.diffDirector)}`}>
              {formatSigned(d.diffDirector)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-[#374151]">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#D97706]" aria-hidden="true" />
              รองผู้อำนวยการ (รอง ผอ.)
            </span>
            <span className={`font-mono-num font-semibold ${getDiffToneClass(d.diffDeputy)}`}>
              {formatSigned(d.diffDeputy)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-[#374151]">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#1E3A8A]" aria-hidden="true" />
              ครูผู้สอน
            </span>
            <span className={`font-mono-num font-semibold ${getDiffToneClass(d.diffTeacher)}`}>
              {formatSigned(d.diffTeacher)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 space-y-1.5 text-[13px] tabular-nums">
          <div className="flex items-center justify-between gap-4 text-[#374151]">
            <span>ผอ. (คนครอง / เกณฑ์)</span>
            <span className="font-mono-num font-medium">
              {d.actualDirector} / {d.criteriaDirector}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#374151]">
            <span>รอง ผอ. (คนครอง / เกณฑ์)</span>
            <span className="font-mono-num font-medium">
              {d.actualDeputy} / {d.criteriaDeputy}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#374151]">
            <span>ครูผู้สอน (คนครอง / เกณฑ์)</span>
            <span className="font-mono-num font-medium">
              {formatNumber(d.actualTeacher)} / {formatNumber(d.criteriaTeacher)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function DistrictPositionChart({
  districts,
  selectedDistrict,
  onSelectDistrict,
}: DistrictPositionChartProps) {
  const [mode, setMode] = useState<ChartMode>('diff');

  const data = useMemo<ChartDatum[]>(
    () =>
      districts.map((d) => ({
        district: d.district,
        label: `อ.${d.district}`,
        diffDirector: d.diffDirector,
        diffDeputy: d.diffDeputy,
        diffTeacher: d.diffTeacher,
        diffTotal: d.diffTotal,
        actualTotal: d.actualTotal,
        criteriaTotal: d.criteriaTotal,
        actualDirector: d.actualDirector,
        criteriaDirector: d.criteriaDirector,
        actualDeputy: d.actualDeputy,
        criteriaDeputy: d.criteriaDeputy,
        actualTeacher: d.actualTeacher,
        criteriaTeacher: d.criteriaTeacher,
      })),
    [districts]
  );

  const yDomain = useMemo<[number, number]>(() => {
    if (mode === 'compare') {
      const maxVal = Math.max(
        10,
        ...data.map((d) => Math.max(d.actualTotal, d.criteriaTotal))
      );
      return [0, Math.ceil((maxVal * 1.15) / 10) * 10];
    }
    const vals = data.flatMap((d) => [d.diffDirector, d.diffDeputy, d.diffTeacher]);
    const minVal = Math.min(0, ...vals);
    const maxVal = Math.max(0, ...vals);
    const padMin = minVal < 0 ? Math.floor((minVal * 1.25) / 5) * 5 : -2;
    const padMax = maxVal > 0 ? Math.ceil((maxVal * 1.25) / 5) * 5 : 4;
    return [padMin, Math.max(2, padMax)];
  }, [data, mode]);

  if (data.length === 0) return null;

  return (
    <section
      aria-label="กราฟอัตรากำลังแยกตามประเภทตำแหน่งในแต่ละอำเภอ"
      className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-[#F3F4F6] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">
            อัตรากำลังแยกตามประเภทตำแหน่งรายอำเภอ
          </h2>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            {mode === 'diff'
              ? 'แท่งกราฟต่ำกว่าเส้น 0 คือขาดเกณฑ์ (-) · สูงกว่าเส้น 0 คือเกินเกณฑ์ (+)'
              : 'เปรียบเทียบจำนวนครูมีตัวจริง (คนครอง) กับเกณฑ์ ก.ค.ศ. ในแต่ละอำเภอ'}
          </p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-md bg-[#F3F4F6] p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('diff')}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'diff'
                ? 'bg-white text-[#111827] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            สถานะขาด/เกิน รายตำแหน่ง
          </button>
          <button
            type="button"
            onClick={() => setMode('compare')}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === 'compare'
                ? 'bg-white text-[#111827] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            คนครอง vs เกณฑ์รวม
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-5 h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'diff' ? (
            <BarChart
              data={data}
              margin={{ top: 24, right: 16, left: -4, bottom: 8 }}
              barCategoryGap="12%"
              barGap={6}
              onClick={(state) => {
                const clicked = state?.activeLabel;
                if (typeof clicked === 'string') {
                  const name = clicked.replace(/^อ\./, '');
                  onSelectDistrict(selectedDistrict === name ? 'all' : name);
                }
              }}
            >
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <ReferenceArea
                y1={yDomain[0]}
                y2={0}
                fill="#FEF2F2"
                fillOpacity={0.5}
              />
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
                tickFormatter={(v) => (v > 0 ? `+${v}` : String(v))}
              />
              <ReferenceLine y={0} stroke="#6B7280" strokeWidth={1.5} />
              <Tooltip
                cursor={{ fill: '#F9FAFB', opacity: 0.7 }}
                content={<CustomTooltip mode="diff" />}
              />
              <Bar
                dataKey="diffDirector"
                name="ผู้อำนวยการ (ผอ.)"
                fill="#475569"
                radius={[4, 4, 0, 0]}
                maxBarSize={64}
              >
                <LabelList
                  dataKey="diffDirector"
                  position="top"
                  formatter={(v: unknown) => {
                    const n = Number(v);
                    return n > 0 ? `+${n}` : String(n);
                  }}
                  style={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>
              <Bar
                dataKey="diffDeputy"
                name="รองผู้อำนวยการ (รอง ผอ.)"
                fill="#D97706"
                radius={[4, 4, 0, 0]}
                maxBarSize={64}
              >
                <LabelList
                  dataKey="diffDeputy"
                  position="top"
                  formatter={(v: unknown) => {
                    const n = Number(v);
                    return n > 0 ? `+${n}` : String(n);
                  }}
                  style={{ fill: '#92400E', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>
              <Bar
                dataKey="diffTeacher"
                name="ครูผู้สอน"
                fill="#1E3A8A"
                radius={[4, 4, 0, 0]}
                maxBarSize={64}
              >
                <LabelList
                  dataKey="diffTeacher"
                  position="top"
                  formatter={(v: unknown) => {
                    const n = Number(v);
                    return n > 0 ? `+${n}` : String(n);
                  }}
                  style={{ fill: '#1E3A8A', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 24, right: 16, left: -4, bottom: 8 }}
              barCategoryGap="16%"
              barGap={8}
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
              />
              <Tooltip
                cursor={{ fill: '#F9FAFB', opacity: 0.7 }}
                content={<CustomTooltip mode="compare" />}
              />
              <Bar
                dataKey="actualTotal"
                name="ครูมีตัวจริง (คนครอง)"
                fill="#1E3A8A"
                radius={[4, 4, 0, 0]}
                maxBarSize={78}
              >
                <LabelList
                  dataKey="actualTotal"
                  position="top"
                  style={{ fill: '#1E3A8A', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>
              <Bar
                dataKey="criteriaTotal"
                name="เกณฑ์ ก.ค.ศ."
                fill="#CBD5E1"
                radius={[4, 4, 0, 0]}
                maxBarSize={78}
              >
                <LabelList
                  dataKey="criteriaTotal"
                  position="top"
                  style={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Clean Editorial Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F4F6] pt-3.5 text-[13px] text-[#4B5563]">
        {mode === 'diff' ? (
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#475569]" aria-hidden="true" />
              <span>ผู้อำนวยการ (ผอ.)</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#D97706]" aria-hidden="true" />
              <span>รองผู้อำนวยการ (รอง ผอ.)</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#1E3A8A]" aria-hidden="true" />
              <span>ครูผู้สอน</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#1E3A8A]" aria-hidden="true" />
              <span>ครูมีตัวจริง (คนครอง)</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#CBD5E1]" aria-hidden="true" />
              <span>เกณฑ์ ก.ค.ศ.</span>
            </span>
          </div>
        )}
        <span className="text-[#6B7280]">นำเมาส์วางบนแท่งกราฟเพื่อดูรายละเอียดรายตำแหน่ง</span>
      </div>
    </section>
  );
}
