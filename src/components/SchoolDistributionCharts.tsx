import { useMemo } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SchoolStaffingRecord } from '../types/staffing';
import { formatNumber, formatSigned, getDiffToneClass } from '../utils/formatters';

interface SchoolDistributionChartsProps {
  records: SchoolStaffingRecord[];
}

interface PieDatum {
  name: string;
  count: number;
  students: number;
  diff: number;
  pct: number;
  color: string;
}

const SIZE_COLOR_MAP: Record<string, string> = {
  ขนาดเล็ก: '#1E3A8A',
  ขนาดกลาง: '#0F766E',
  ขนาดใหญ่: '#D97706',
  ขนาดใหญ่พิเศษ: '#B91C1C',
};

const TYPE_PALETTE = [
  '#1E3A8A',
  '#0F766E',
  '#475569',
  '#D97706',
  '#B91C1C',
  '#6B7280',
];

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PieDatum }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <div className="min-w-[205px] rounded-md border border-[#E5E7EB] bg-white p-3.5 text-sm shadow-md">
      <div className="flex items-center gap-2 border-b border-[#F3F4F6] pb-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-xs"
          style={{ backgroundColor: d.color }}
          aria-hidden="true"
        />
        <span className="font-semibold text-[#111827]">{d.name}</span>
      </div>
      <div className="mt-2 space-y-1 text-[13px] tabular-nums">
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7280]">จำนวนโรงเรียน</span>
          <span className="font-mono-num font-semibold text-[#111827]">
            {formatNumber(d.count)} แห่ง ({d.pct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7280]">นักเรียนรวม</span>
          <span className="font-mono-num text-[#374151]">
            {formatNumber(d.students)} คน
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7280]">ดุลขาด/เกิน</span>
          <span className={`font-mono-num font-semibold ${getDiffToneClass(d.diff)}`}>
            {formatSigned(d.diff)} อัตรา
          </span>
        </div>
      </div>
    </div>
  );
}

function PieCard({
  title,
  subtitle,
  data,
  totalSchools,
}: {
  title: string;
  subtitle: string;
  data: PieDatum[];
  totalSchools: number;
}) {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6">
      <div className="border-b border-[#F3F4F6] pb-4">
        <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
        <p className="mt-0.5 text-sm text-[#6B7280]">{subtitle}</p>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-[220px] w-[220px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={92}
                paddingAngle={2}
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DistributionTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono-num text-2xl font-semibold text-[#111827]">
              {formatNumber(totalSchools)}
            </span>
            <span className="text-xs text-[#6B7280]">โรงเรียน</span>
          </div>
        </div>

        <div className="w-full flex-1 divide-y divide-[#F3F4F6] text-sm">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-xs"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#111827]">{item.name}</p>
                  <p className="text-[13px] text-[#6B7280] tabular-nums">
                    {formatNumber(item.students)} นร.
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right font-mono-num tabular-nums">
                <p className="font-semibold text-[#111827]">
                  {formatNumber(item.count)} แห่ง
                </p>
                <p className="text-[13px] text-[#6B7280]">{item.pct.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SchoolDistributionCharts({ records }: SchoolDistributionChartsProps) {
  const total = Math.max(1, records.length);

  const sizeData = useMemo<PieDatum[]>(() => {
    const map = new Map<string, { count: number; students: number; diff: number }>();
    for (const r of records) {
      const key = r.school_size || 'ไม่ระบุ';
      const prev = map.get(key) ?? { count: 0, students: 0, diff: 0 };
      prev.count += 1;
      prev.students += r.students_count;
      prev.diff += r.diff_total;
      map.set(key, prev);
    }
    const order = ['ขนาดเล็ก', 'ขนาดกลาง', 'ขนาดใหญ่', 'ขนาดใหญ่พิเศษ'];
    return Array.from(map.entries())
      .sort((a, b) => {
        const ia = order.indexOf(a[0]);
        const ib = order.indexOf(b[0]);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map(([name, info], idx) => ({
        name,
        count: info.count,
        students: info.students,
        diff: info.diff,
        pct: (info.count / total) * 100,
        color: SIZE_COLOR_MAP[name] ?? TYPE_PALETTE[idx % TYPE_PALETTE.length],
      }));
  }, [records, total]);

  const typeData = useMemo<PieDatum[]>(() => {
    const map = new Map<string, { count: number; students: number; diff: number }>();
    for (const r of records) {
      const key = r.school_type || 'ไม่ระบุประเภท';
      const prev = map.get(key) ?? { count: 0, students: 0, diff: 0 };
      prev.count += 1;
      prev.students += r.students_count;
      prev.diff += r.diff_total;
      map.set(key, prev);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, info], idx) => ({
        name,
        count: info.count,
        students: info.students,
        diff: info.diff,
        pct: (info.count / total) * 100,
        color: TYPE_PALETTE[idx % TYPE_PALETTE.length],
      }));
  }, [records, total]);

  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PieCard
        title="การกระจายตัวตามขนาดโรงเรียน"
        subtitle="สัดส่วนโรงเรียนขนาดเล็ก กลาง และใหญ่ตามเกณฑ์ สพฐ."
        data={sizeData}
        totalSchools={records.length}
      />
      <PieCard
        title="การกระจายตัวตามประเภทโรงเรียน"
        subtitle="สัดส่วนสถานศึกษาจำแนกตามประเภทการจัดการศึกษา"
        data={typeData}
        totalSchools={records.length}
      />
    </div>
  );
}
