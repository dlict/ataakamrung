import { useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import {
  THAI_MONTHS,
  type ReportPeriod,
  type SupabaseStatus,
} from '../types/staffing';
import {
  decodeCsvFile,
  parseSchoolStaffingCsv,
  type ParsedCsvResult,
} from '../utils/csvParser';
import { formatNumber, formatPercent, formatSigned, getDiffToneClass } from '../utils/formatters';
import { parseJsonResponse } from '../utils/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPeriods: ReportPeriod[];
  supabaseStatus: SupabaseStatus | null;
  onSuccess: (savedPeriod: ReportPeriod) => void;
  onOpenSetup: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  existingPeriods,
  supabaseStatus,
  onSuccess,
  onOpenSetup,
}: UploadModalProps) {
  const [buddhistYear, setBuddhistYear] = useState<number>(2569);
  const [monthNumber, setMonthNumber] = useState<number>(12);
  const [periodNote, setPeriodNote] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedCsvResult | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [overwrite, setOverwrite] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  if (!isOpen) return null;

  const duplicatePeriod = existingPeriods.find(
    (p) => p.buddhist_year === buddhistYear && p.month_number === monthNumber
  );

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setParseError('');
    setSubmitError('');
    setFilename(file.name);

    // Auto-detect Buddhist year in filename if present (e.g., 2568, 2569, 2570)
    const yearMatch = file.name.match(/25[6-8]\d/);
    if (yearMatch) {
      setBuddhistYear(Number(yearMatch[0]));
    }

    try {
      const text = await decodeCsvFile(file);
      const result = parseSchoolStaffingCsv(text);
      setParsed(result);
    } catch (err) {
      setParsed(null);
      setParseError(err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ CSV นี้ได้');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) return;
    if (duplicatePeriod && !overwrite) {
      setSubmitError('พบงวดข้อมูลนี้อยู่แล้ว กรุณาติ๊กเลือกบันทึกทับข้อมูลเดิม หรือเปลี่ยนเดือน/พ.ศ.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buddhist_year: buddhistYear,
          month_number: monthNumber,
          period_note: periodNote.trim(),
          source_filename: filename,
          overwrite,
          records: parsed.records,
        }),
      });
      const data = await parseJsonResponse<{ period?: ReportPeriod; error?: string }>(response);
      if (!response.ok || !data.period) {
        throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ');
      }
      setParsed(null);
      setFilename('');
      setPeriodNote('');
      setOverwrite(false);
      onSuccess(data.period);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="นำเข้าไฟล์ CSV อัตรากำลัง"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#111827]">
            นำเข้าไฟล์ CSV ตามช่วงเวลา (พ.ศ. / เดือน)
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างนำเข้าไฟล์"
            className="rounded-md p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {!supabaseStatus?.tablesReady && (
            <div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-sm text-[#92400E]">
              <p className="font-medium">
                ยังไม่ได้เชื่อมต่อฐานข้อมูล Supabase จึงยังไม่สามารถบันทึกงวดใหม่ถาวรได้
              </p>
              {supabaseStatus?.message && (
                <p className="mt-1 text-xs text-[#78350F]">
                  สาเหตุ: {supabaseStatus.message}
                </p>
              )}
              <p className="mt-1.5">
                คุณสามารถทดสอบเลือกไฟล์เพื่อดูการประมวลผลก่อนได้ หรือ{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSetup();
                  }}
                  className="font-semibold underline"
                >
                  ดูวิธีตั้งค่าและตรวจสอบคีย์ Supabase
                </button>
              </p>
            </div>
          )}

          {/* Year & Month Selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-[#374151]">ปี พ.ศ.</span>
              <input
                type="number"
                min={2500}
                max={2700}
                required
                value={buddhistYear}
                onChange={(e) => setBuddhistYear(Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-md border border-[#D1D5DB] px-3 font-mono-num text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-[#374151]">เดือน</span>
              <select
                value={monthNumber}
                onChange={(e) => setMonthNumber(Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              >
                {THAI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} ({m.short})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-[#374151]">คำอธิบายรอบข้อมูล (ไม่บังคับ)</span>
            <input
              type="text"
              maxLength={120}
              value={periodNote}
              onChange={(e) => setPeriodNote(e.target.value)}
              placeholder="เช่น รอบ 10 มิ.ย. หรือ หลังเกษียณ 1 ต.ค."
              className="mt-1.5 h-10 w-full rounded-md border border-[#D1D5DB] px-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1E3A8A] focus:outline-none"
            />
          </label>

          {/* File Picker */}
          <div>
            <span className="block text-sm font-medium text-[#374151]">
              ไฟล์ CSV รายงานอัตรากำลัง (.csv)
            </span>
            <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-6 text-center transition-colors hover:border-[#1E3A8A] hover:bg-[#F3F4F6]">
              <FileSpreadsheet className="h-6 w-6 text-[#6B7280]" aria-hidden="true" />
              <span className="mt-2 text-sm font-medium text-[#111827]">
                {filename || 'คลิกเพื่อเลือกไฟล์ CSV จากเครื่องของคุณ'}
              </span>
              <span className="mt-1 text-[13px] text-[#6B7280]">
                รองรับทั้งรหัสภาษาไทย UTF-8 และ Windows-874 (Excel)
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </label>
          </div>

          {parseError && (
            <p className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-sm text-[#B91C1C]">
              {parseError}
            </p>
          )}

          {/* Preview Summary */}
          {parsed && (
            <div className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm">
              <p className="font-semibold text-[#111827]">ผลการตรวจสอบไฟล์ก่อนบันทึก</p>
              <div className="mt-2.5 grid grid-cols-2 gap-y-2 tabular-nums">
                <div className="text-[#6B7280]">จำนวนโรงเรียน</div>
                <div className="text-right font-mono-num font-medium text-[#111827]">
                  {formatNumber(parsed.summary.totalSchools)} แห่ง
                </div>
                <div className="text-[#6B7280]">นักเรียน / ห้องเรียน</div>
                <div className="text-right font-mono-num font-medium text-[#111827]">
                  {formatNumber(parsed.summary.totalStudents)} คน / {formatNumber(parsed.summary.totalClassrooms)} ห้อง
                </div>
                <div className="text-[#6B7280]">คนครองจริง / เกณฑ์ ก.ค.ศ.</div>
                <div className="text-right font-mono-num font-medium text-[#111827]">
                  {formatNumber(parsed.summary.actualTotal)} / {formatNumber(parsed.summary.criteriaTotal)} อัตรา
                </div>
                <div className="text-[#6B7280]">ดุลขาด/เกินสุทธิ</div>
                <div
                  className={`text-right font-mono-num font-semibold ${getDiffToneClass(
                    parsed.summary.diffTotal
                  )}`}
                >
                  {formatSigned(parsed.summary.diffTotal)} ({formatPercent(parsed.summary.diffTeacherPct)})
                </div>
              </div>
            </div>
          )}

          {duplicatePeriod && (
            <label className="flex items-start gap-2 rounded-md border border-[#E5E7EB] bg-white p-3.5 text-sm">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="mt-0.5 rounded border-[#D1D5DB] text-[#1E3A8A]"
              />
              <span className="text-[#374151]">
                มีข้อมูลประจำเดือน{duplicatePeriod.month_label} {duplicatePeriod.buddhist_year} อยู่แล้ว
                — <strong>บันทึกทับข้อมูลเดิม</strong>
              </span>
            </label>
          )}

          {submitError && (
            <p className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-sm text-[#B91C1C]">
              {submitError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-[#E5E7EB] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!parsed || submitting || !supabaseStatus?.tablesReady}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'กำลังบันทึกลง Supabase...' : 'บันทึกลงฐานข้อมูล Supabase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
