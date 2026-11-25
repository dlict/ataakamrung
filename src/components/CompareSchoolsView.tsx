import { useMemo, useState } from 'react';
import { Plus, Printer, RotateCcw, Search, X } from 'lucide-react';
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
import type { SchoolStaffingRecord } from '../types/staffing';
import {
  formatDeficitPositionsText,
  formatNumber,
  formatPercent,
  formatSigned,
  formatSurplusPositionsText,
  getDiffLabel,
  getDiffToneClass,
} from '../utils/formatters';
import {
  calculateRealityStaffing,
  calculateRealityTotal,
  DEFAULT_REALITY_FIELDS,
  formatRealityFormula,
  REALITY_COMPONENT_OPTIONS,
  type RealityFieldKey,
} from '../utils/staffingCalculations';

interface CompareSchoolsViewProps {
  allRecords: SchoolStaffingRecord[];
  districts: string[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  selectedSchoolCodes: string[];
  onChangeSelectedCodes: (codes: string[]) => void;
  periodLabel: string;
}

const MAX_COMPARE_SCHOOLS = 6;

export function CompareSchoolsView({
  allRecords,
  districts,
  selectedDistrict,
  onSelectDistrict,
  selectedSchoolCodes,
  onChangeSelectedCodes,
  periodLabel,
}: CompareSchoolsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRealityKeys, setSelectedRealityKeys] =
    useState<RealityFieldKey[]>(DEFAULT_REALITY_FIELDS);

  const realityFormulaLabel = useMemo(
    () => formatRealityFormula(selectedRealityKeys),
    [selectedRealityKeys]
  );

  const isDefaultReality =
    selectedRealityKeys.length === DEFAULT_REALITY_FIELDS.length &&
    DEFAULT_REALITY_FIELDS.every((k) => selectedRealityKeys.includes(k));

  function toggleRealityKey(key: RealityFieldKey) {
    setSelectedRealityKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function resetRealityKeys() {
    setSelectedRealityKeys(DEFAULT_REALITY_FIELDS);
  }

  const selectedSchools = useMemo(() => {
    const byCode = new Map<string, SchoolStaffingRecord>();
    for (const r of allRecords) byCode.set(r.school_code, r);
    return selectedSchoolCodes
      .map((code) => byCode.get(code))
      .filter((r): r is SchoolStaffingRecord => Boolean(r));
  }, [allRecords, selectedSchoolCodes]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const selectedSet = new Set(selectedSchoolCodes);
    const pool = allRecords.filter((r) => {
      if (selectedSet.has(r.school_code)) return false;
      if (selectedDistrict !== 'all' && r.district !== selectedDistrict) return false;
      return true;
    });
    if (!q) return pool.slice(0, 8);
    return pool
      .filter((r) =>
        `${r.school_code} ${r.school_name} ${r.subdistrict} ${r.district}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 12);
  }, [allRecords, searchQuery, selectedSchoolCodes, selectedDistrict]);

  const chartData = useMemo(
    () =>
      selectedSchools.map((s) => ({
        name: s.school_name,
        actual: s.actual_total,
        reality: calculateRealityTotal(s, selectedRealityKeys),
        criteria: s.criteria_total,
        diff: s.diff_total,
      })),
    [selectedSchools, selectedRealityKeys]
  );

  function addSchool(code: string) {
    if (selectedSchoolCodes.includes(code)) return;
    if (selectedSchoolCodes.length >= MAX_COMPARE_SCHOOLS) return;
    onChangeSelectedCodes([...selectedSchoolCodes, code]);
    setSearchQuery('');
  }

  function removeSchool(code: string) {
    onChangeSelectedCodes(selectedSchoolCodes.filter((c) => c !== code));
  }

  function clearAll() {
    onChangeSelectedCodes([]);
  }

  return (
    <div className="space-y-6">
      {/* Print-only Header */}
      {selectedSchools.length > 0 && (
        <header className="hidden border-b-2 border-[#111827] pb-3 print:block">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#4B5563]">
                สำนักงานเขตพื้นที่การศึกษาประถมศึกษาแม่ฮ่องสอน เขต 1
              </p>
              <h1 className="mt-0.5 text-lg font-bold text-[#111827]">
                รายงานเปรียบเทียบข้อมูลอัตรากำลังรายโรงเรียน ({selectedSchools.length} แห่ง)
              </h1>
              <p className="mt-0.5 text-xs text-[#4B5563]">
                สูตรสภาพจริง: {realityFormulaLabel}
              </p>
            </div>
            <div className="text-right text-xs text-[#4B5563]">
              <p>งวดข้อมูล: {periodLabel}</p>
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
      )}

      {/* Selector Card */}
      <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 print:hidden">
        <div className="flex flex-col gap-3 border-b border-[#F3F4F6] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">
              เปรียบเทียบโรงเรียนรายแห่ง ({selectedSchools.length}/{MAX_COMPARE_SCHOOLS} แห่ง)
            </h1>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              งวด {periodLabel} · เลือกโรงเรียนเพื่อเปรียบเทียบขนาด อัตรากำลังรายตำแหน่ง และลักษณะเฉพาะของโรงเรียน
            </p>
          </div>
          {selectedSchools.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB] whitespace-nowrap"
              >
                <Printer className="h-4 w-4 text-[#4B5563]" aria-hidden="true" />
                <span>พิมพ์รายงาน</span>
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] whitespace-nowrap"
              >
                ล้างรายการที่เลือก
              </button>
            </div>
          )}
        </div>

        {/* Selected Schools Bar */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selectedSchools.map((s) => (
            <div
              key={s.school_code}
              className="flex items-start justify-between gap-2 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">
                  {s.school_name}
                </p>
                <p className="mt-0.5 text-[13px] text-[#6B7280]">
                  อ.{s.district} · {s.school_size}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeSchool(s.school_code)}
                aria-label={`นำ ${s.school_name} ออก`}
                className="rounded p-1 text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Search & Pick School */}
        {selectedSchools.length < MAX_COMPARE_SCHOOLS && (
          <div className="mt-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์ชื่อโรงเรียน รหัสโรงเรียน หรือตำบล เพื่อเพิ่มเข้าตารางเปรียบเทียบ..."
                  className="h-10 w-full rounded-md border border-[#D1D5DB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <select
                aria-label="กรองตามอำเภอสำหรับเลือกโรงเรียนเปรียบเทียบ"
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
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {searchResults.map((r) => (
                <button
                  key={r.school_code}
                  type="button"
                  onClick={() => addSchool(r.school_code)}
                  className="flex items-center justify-between gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#1E3A8A] hover:bg-[#F8FAFC]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#111827]">
                      {r.school_name}
                    </p>
                    <p className="truncate text-[13px] text-[#6B7280]">
                      อ.{r.district} · {r.school_size} · นร. {formatNumber(r.students_count)}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-[#1E3A8A]" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedSchools.length === 0 ? (
        <section className="rounded-lg border border-dashed border-[#D1D5DB] bg-white p-10 text-center">
          <p className="text-base font-semibold text-[#111827]">
            เลือกอย่างน้อย 2 โรงเรียนด้านบนเพื่อเริ่มเปรียบเทียบ
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            สามารถเปรียบเทียบขนาดโรงเรียน ประเภท ลักษณะพื้นที่พิเศษ และอัตรากำลังครูรายตำแหน่งได้สูงสุด {MAX_COMPARE_SCHOOLS} แห่งพร้อมกัน
          </p>
        </section>
      ) : (
        <>
          {/* Customizable Reality Staffing Selector */}
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 print:hidden">
            <div className="flex flex-col gap-2 border-b border-[#F3F4F6] pb-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">
                  กำหนดองค์ประกอบหัวข้อ “สภาพจริง”
                </h2>
                <p className="mt-0.5 text-sm text-[#6B7280]">
                  สูตรที่เลือกปัจจุบัน:{' '}
                  <span className="font-medium text-[#0F766E]">{realityFormulaLabel}</span>
                </p>
              </div>
              {!isDefaultReality && (
                <button
                  type="button"
                  onClick={resetRealityKeys}
                  className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-[#6B7280] hover:text-[#111827] sm:self-auto whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>คืนค่าเริ่มต้น (ครูผู้สอน + พนักงานราชการ)</span>
                </button>
              )}
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {REALITY_COMPONENT_OPTIONS.map((opt) => {
                const checked = selectedRealityKeys.includes(opt.key);
                return (
                  <label
                    key={opt.key}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors select-none ${
                      checked
                        ? 'border-[#0F766E] bg-[#F0FDFA] font-medium text-[#0F766E]'
                        : 'border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRealityKey(opt.key)}
                      className="h-4 w-4 rounded border-[#D1D5DB] accent-[#0F766E]"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Recharts Bar Comparison */}
          <section className="print-avoid-break rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 print:border-[#D1D5DB] print:p-4">
            <div className="border-b border-[#F3F4F6] pb-4 print:pb-2.5">
              <h2 className="text-lg font-semibold text-[#111827] print:text-base">
                กราฟเปรียบเทียบอัตรากำลังรวม (คนครองจริง · สภาพจริง · เกณฑ์ ก.ค.ศ.)
              </h2>
              <p className="mt-0.5 text-sm text-[#6B7280] print:text-xs">
                เปรียบเทียบคนครองจริง สภาพจริง ({realityFormulaLabel}) กับเกณฑ์ ก.ค.ศ. ของโรงเรียนที่เลือก
              </p>
            </div>

            <div className="mt-5 h-[350px] w-full print:mt-3 print:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 24, right: 16, left: -4, bottom: 12 }}
                  barCategoryGap="16%"
                  barGap={4}
                >
                  <CartesianGrid stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 13 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#F9FAFB', opacity: 0.7 }}
                    contentStyle={{
                      borderRadius: 6,
                      borderColor: '#E5E7EB',
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="actual"
                    name="คนครองจริง"
                    fill="#1E3A8A"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  >
                    <LabelList
                      dataKey="actual"
                      position="top"
                      style={{ fill: '#1E3A8A', fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                  <Bar
                    dataKey="reality"
                    name="สภาพจริง"
                    fill="#0F766E"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  >
                    <LabelList
                      dataKey="reality"
                      position="top"
                      style={{ fill: '#0F766E', fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                  <Bar
                    dataKey="criteria"
                    name="ตามเกณฑ์ ก.ค.ศ."
                    fill="#CBD5E1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  >
                    <LabelList
                      dataKey="criteria"
                      position="top"
                      style={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-[#F3F4F6] pt-3 text-[13px] text-[#4B5563]">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-[#1E3A8A]" aria-hidden="true" />
                <span>คนครองจริง</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-[#0F766E]" aria-hidden="true" />
                <span>สภาพจริง ({realityFormulaLabel})</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-[#CBD5E1]" aria-hidden="true" />
                <span>ตามเกณฑ์ ก.ค.ศ.</span>
              </span>
            </div>
          </section>

          {/* Detailed Side-by-Side Comparison Matrix */}
          <section className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden print:overflow-visible print:border-[#D1D5DB]">
            <div className="border-b border-[#E5E7EB] p-5 sm:px-6 print:px-3 print:py-2.5">
              <h2 className="text-lg font-semibold text-[#111827] print:text-base">
                ตารางเปรียบเทียบลักษณะโรงเรียนและอัตรากำลังอย่างละเอียด
              </h2>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse text-left text-sm print:text-xs [&_td]:print:px-2 [&_td]:print:py-1.5">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="min-w-[190px] py-3.5 pl-6 pr-4 font-semibold text-[#374151] print:min-w-[125px] print:w-[16%] print:py-2 print:pl-2.5 print:pr-2">
                      รายการเปรียบเทียบ
                    </th>
                    {selectedSchools.map((s) => (
                      <th
                        key={s.school_code}
                        className="min-w-[170px] px-4 py-3.5 font-semibold text-[#111827] print:min-w-0 print:px-2 print:py-2"
                      >
                        <div>{s.school_name}</div>
                        <div className="mt-0.5 font-mono-num text-[13px] font-normal text-[#6B7280] print:text-[11px]">
                          รหัส {s.school_code}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {/* Section: ลักษณะโรงเรียน */}
                  <tr className="bg-[#F9FAFB]/60">
                    <td
                      colSpan={selectedSchools.length + 1}
                      className="py-2.5 pl-6 pr-4 text-[13px] font-semibold text-[#374151]"
                    >
                      1. ขนาดโรงเรียนและลักษณะเฉพาะ
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">ขนาดตามเกณฑ์ สพฐ.</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 font-medium text-[#111827]">
                        {s.school_size || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">ประเภทโรงเรียน</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 text-[#111827]">
                        {s.school_type || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">ลักษณะพิเศษ</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 text-[#111827]">
                        {s.special_feature || 'โรงเรียนทั่วไป'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">โครงการตามเงื่อนไข คปร.</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 text-[#374151]">
                        {s.project_name || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">ที่ตั้ง (ตำบล / อำเภอ)</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 text-[#374151]">
                        ต.{s.subdistrict} · อ.{s.district}
                      </td>
                    ))}
                  </tr>

                  {/* Section: นักเรียน */}
                  <tr className="bg-[#F9FAFB]/60">
                    <td
                      colSpan={selectedSchools.length + 1}
                      className="py-2.5 pl-6 pr-4 text-[13px] font-semibold text-[#374151]"
                    >
                      2. จำนวนนักเรียนและห้องเรียน
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">จำนวนนักเรียน / ห้องเรียน</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#111827]">
                        {formatNumber(s.students_count)} คน ({formatNumber(s.classrooms_count)} ห้อง)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">อัตราส่วน นร. ต่อ ครูมีตัวจริง</td>
                    {selectedSchools.map((s) => {
                      const ratio =
                        s.actual_teacher > 0
                          ? (s.students_count / s.actual_teacher).toFixed(1)
                          : '—';
                      return (
                        <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#111827]">
                          {ratio} : 1
                        </td>
                      );
                    })}
                  </tr>

                  {/* Section: อัตรากำลัง */}
                  <tr className="bg-[#F9FAFB]/60">
                    <td
                      colSpan={selectedSchools.length + 1}
                      className="py-2.5 pl-6 pr-4 text-[13px] font-semibold text-[#374151]"
                    >
                      3. อัตรากำลังครูแยกตามตำแหน่ง (ผอ. / รอง / ครู / รวม)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">ครูมีตัวจริง (คนครอง)</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#111827]">
                        {s.actual_director} / {s.actual_deputy} / {s.actual_teacher} (รวม{' '}
                        <strong>{s.actual_total}</strong>)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">ตาม จ.18 (บัญชีถือจ่าย)</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#4B5563]">
                        {s.j18_paid_director} / {s.j18_paid_deputy} / {s.j18_paid_teacher} (รวม{' '}
                        {s.j18_paid_total})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">ตามเกณฑ์ ก.ค.ศ.</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#4B5563]">
                        {s.criteria_director} / {s.criteria_deputy} / {s.criteria_teacher} (รวม{' '}
                        <strong>{s.criteria_total}</strong>)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 font-medium text-[#111827]">
                      ดุลอัตรากำลัง (-ขาด / +เกิน)
                    </td>
                    {selectedSchools.map((s) => {
                      const deficitText = formatDeficitPositionsText(s);
                      const surplusText = formatSurplusPositionsText(s);
                      return (
                        <td key={s.school_code} className="px-4 py-3 font-mono-num">
                          <span className={`font-semibold ${getDiffToneClass(s.diff_total)}`}>
                            {formatSigned(s.diff_total)} ({getDiffLabel(s.diff_total)} ·{' '}
                            {formatPercent(s.diff_teacher_pct)})
                          </span>
                          {(deficitText || surplusText) && (
                            <div className="mt-1 font-sans text-[13px] font-medium">
                              {deficitText && <span className="text-[#B91C1C]">{deficitText}</span>}
                              {deficitText && surplusText && (
                                <span className="text-[#9CA3AF]"> · </span>
                              )}
                              {surplusText && <span className="text-[#0F766E]">{surplusText}</span>}
                            </div>
                          )}
                          <div className="mt-0.5 text-[13px] text-[#6B7280]">
                            ผอ. {formatSigned(s.diff_director)} · รอง ผอ. {formatSigned(s.diff_deputy)} · ครู{' '}
                            {formatSigned(s.diff_teacher)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Section: สภาพจริง (เลือกองค์ประกอบได้) */}
                  <tr className="bg-[#F0FDFA]">
                    <td
                      colSpan={selectedSchools.length + 1}
                      className="py-2.5 pl-6 pr-4 text-[13px] font-semibold text-[#0F766E]"
                    >
                      4. สภาพจริง ({realityFormulaLabel})
                    </td>
                  </tr>
                  <tr className="bg-[#F0FDFA]/40">
                    <td className="py-3 pl-6 pr-4 font-medium text-[#111827]">
                      รวมบุคลากรตามสภาพจริง
                    </td>
                    {selectedSchools.map((s) => {
                      const reality = calculateRealityStaffing(s, selectedRealityKeys);
                      return (
                        <td key={s.school_code} className="px-4 py-3 font-mono-num">
                          <div className="text-base font-bold text-[#0F766E]">
                            {formatNumber(reality.total)} คน
                          </div>
                          <div className="mt-0.5 font-sans text-[12px] text-[#4B5563]">
                            {reality.breakdownText}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-[#F0FDFA]/40">
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">
                      ดุลสภาพจริงเทียบเกณฑ์ ก.ค.ศ.
                    </td>
                    {selectedSchools.map((s) => {
                      const reality = calculateRealityStaffing(s, selectedRealityKeys);
                      return (
                        <td key={s.school_code} className="px-4 py-3 font-mono-num">
                          <span className={`font-semibold ${getDiffToneClass(reality.diff)}`}>
                            {formatSigned(reality.diff)} ({getDiffLabel(reality.diff)})
                          </span>
                          <div className="mt-0.5 font-sans text-[12px] text-[#6B7280]">
                            เทียบ{reality.referenceLabel} {formatNumber(reality.referenceCriteria)} คน
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-[#F0FDFA]/40">
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">
                      อัตราส่วน นร. ต่อ สภาพจริง
                    </td>
                    {selectedSchools.map((s) => {
                      const reality = calculateRealityStaffing(s, selectedRealityKeys);
                      return (
                        <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#111827]">
                          {reality.studentRatio} : 1
                        </td>
                      );
                    })}
                  </tr>

                  {/* Section: เกษียณ & อัตราเสริม */}
                  <tr className="bg-[#F9FAFB]/60">
                    <td
                      colSpan={selectedSchools.length + 1}
                      className="py-2.5 pl-6 pr-4 text-[13px] font-semibold text-[#374151]"
                    >
                      5. เกษียณอายุราชการและอัตรากำลังเสริม
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">เกษียณ / หลังเกษียณ (1 ต.ค.)</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#111827]">
                        เกษียณ {s.retire_total} · หลังเกษียณ{' '}
                        <span className={getDiffToneClass(s.post_retire_total)}>
                          {formatSigned(s.post_retire_total)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">ช่วยราชการ (ไป / มา)</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#4B5563]">
                        ไป {s.secondment_out} · มา {s.secondment_in} คน
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pl-6 pr-4 text-[#6B7280]">พรก. / อัตราจ้าง (ครูผู้สอน)</td>
                    {selectedSchools.map((s) => (
                      <td key={s.school_code} className="px-4 py-3 font-mono-num text-[#111827]">
                        พรก. {s.royal_decree_teacher} · อัตราจ้าง {s.contract_teacher} คน
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
