import { Database, RotateCcw } from 'lucide-react';
import type { ReportPeriod, SupabaseStatus } from '../types/staffing';

interface ToolbarProps {
  periods: ReportPeriod[];
  selectedPeriodId: string;
  onSelectPeriod: (periodId: string) => void;
  districts: string[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  sizes: string[];
  selectedSize: string;
  onSelectSize: (size: string) => void;
  types: string[];
  selectedType: string;
  onSelectType: (type: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  supabaseStatus: SupabaseStatus | null;
  onOpenSetup: () => void;
}

export function Toolbar({
  periods,
  selectedPeriodId,
  onSelectPeriod,
  districts,
  selectedDistrict,
  onSelectDistrict,
  sizes,
  selectedSize,
  onSelectSize,
  types,
  selectedType,
  onSelectType,
  onResetFilters,
  hasActiveFilters,
  supabaseStatus,
  onOpenSetup,
}: ToolbarProps) {
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <section
      aria-label="ตัวกรองและงวดข้อมูล"
      className="border-b border-[#E5E7EB] bg-white"
    >
      <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-3.5">
          <label className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="shrink-0 font-medium text-[#374151]">งวดข้อมูล</span>
            <select
              aria-label="เลือกงวดข้อมูล พ.ศ. และเดือน"
              value={selectedPeriodId}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="h-10 min-w-[190px] flex-1 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#111827] transition-colors focus:border-[#1E3A8A] focus:outline-none"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.month_label} {p.buddhist_year}
                  {p.period_note ? ` — ${p.period_note}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="shrink-0 font-medium text-[#374151]">อำเภอ</span>
            <select
              aria-label="กรองตามอำเภอ"
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="h-10 min-w-[145px] flex-1 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] transition-colors focus:border-[#1E3A8A] focus:outline-none"
            >
              <option value="all">ทุกอำเภอ</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="shrink-0 font-medium text-[#374151]">ขนาด</span>
            <select
              aria-label="กรองตามขนาดโรงเรียน"
              value={selectedSize}
              onChange={(e) => onSelectSize(e.target.value)}
              className="h-10 min-w-[125px] flex-1 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] transition-colors focus:border-[#1E3A8A] focus:outline-none"
            >
              <option value="all">ทุกขนาด</option>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="shrink-0 font-medium text-[#374151]">ประเภท</span>
            <select
              aria-label="กรองตามประเภทโรงเรียน"
              value={selectedType}
              onChange={(e) => onSelectType(e.target.value)}
              className="h-10 min-w-[135px] flex-1 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] transition-colors focus:border-[#1E3A8A] focus:outline-none"
            >
              <option value="all">ทุกประเภท</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#E5E7EB] px-3 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827] whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F4F6] pt-2.5 text-[13px] text-[#6B7280] lg:border-t-0 lg:pt-0">
          {selectedPeriod && (
            <span className="truncate max-w-[260px]">
              ไฟล์: {selectedPeriod.source_filename}
            </span>
          )}
          <span aria-hidden="true" className="hidden sm:inline text-[#D1D5DB]">
            ·
          </span>
          <button
            type="button"
            onClick={onOpenSetup}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#374151] transition-colors hover:text-[#1E3A8A] whitespace-nowrap shrink-0"
          >
            <Database className="h-4 w-4 text-[#6B7280]" aria-hidden="true" />
            <span>
              {supabaseStatus?.tablesReady
                ? 'ฐานข้อมูล Supabase (เชื่อมต่อแล้ว)'
                : 'ตั้งค่าฐานข้อมูล Supabase'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
