import { useEffect, useState } from 'react';
import { FileSpreadsheet, GraduationCap, Upload, Users, X } from 'lucide-react';
import {
  THAI_MONTHS,
  type ReportPeriod,
  type SchoolStudentBreakdown,
  type SupabaseStatus,
} from '../types/staffing';
import {
  decodeCsvFile,
  parseSchoolStaffingCsv,
  type ParsedCsvResult,
} from '../utils/csvParser';
import {
  parseSchoolMisCsv,
  type ParsedSchoolMisResult,
} from '../utils/schoolmisParser';
import {
  formatNumber,
  formatPercent,
  formatSigned,
  getDiffToneClass,
} from '../utils/formatters';
import { parseJsonResponse } from '../utils/api';

type UploadMode = 'staffing' | 'students';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPeriods: ReportPeriod[];
  supabaseStatus: SupabaseStatus | null;
  initialMode?: UploadMode;
  onSuccess: (savedPeriod: ReportPeriod) => void;
  onStudentBreakdownSuccess: (
    records: SchoolStudentBreakdown[],
    mode: 'supabase' | 'preview'
  ) => void;
  onOpenSetup: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  existingPeriods,
  supabaseStatus,
  initialMode = 'staffing',
  onSuccess,
  onStudentBreakdownSuccess,
  onOpenSetup,
}: UploadModalProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setUploadMode(initialMode);
      setParseError('');
      setSubmitError('');
    }
  }, [isOpen, initialMode]);

  // Staffing CSV state
  const [buddhistYear, setBuddhistYear] = useState<number>(2569);
  const [monthNumber, setMonthNumber] = useState<number>(12);
  const [periodNote, setPeriodNote] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedCsvResult | null>(null);
  const [overwrite, setOverwrite] = useState<boolean>(false);

  // Student breakdown (SchoolMIS) CSV state
  const [semester, setSemester] = useState<string>('2569-2');
  const [misFilename, setMisFilename] = useState<string>('');
  const [parsedMis, setParsedMis] = useState<ParsedSchoolMisResult | null>(null);

  const [parseError, setParseError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  if (!isOpen) return null;

  const duplicatePeriod = existingPeriods.find(
    (p) => p.buddhist_year === buddhistYear && p.month_number === monthNumber
  );

  function handleSwitchMode(mode: UploadMode) {
    setUploadMode(mode);
    setParseError('');
    setSubmitError('');
  }

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setParseError('');
    setSubmitError('');

    try {
      const text = await decodeCsvFile(file);
      const isSchoolMisFile =
        text.includes('รวมห้องทั้งหมด') &&
        (text.includes('รวมป.1') || text.includes('รวมอ.1'));

      if (uploadMode === 'students' || isSchoolMisFile) {
        if (uploadMode !== 'students') {
          setUploadMode('students');
        }
        setMisFilename(file.name);
        const semMatch = file.name.match(/(25[6-8]\d-[12])/);
        if (semMatch) {
          setSemester(semMatch[1]);
        }
        const misResult = parseSchoolMisCsv(text, {
          semester: semMatch?.[1] || semester,
          sourceFilename: file.name,
        });
        setParsedMis(misResult);
        return;
      }

      setFilename(file.name);
      const yearMatch = file.name.match(/25[6-8]\d/);
      if (yearMatch) {
        setBuddhistYear(Number(yearMatch[0]));
      }
      const result = parseSchoolStaffingCsv(text);
      setParsed(result);
    } catch (err) {
      if (uploadMode === 'students') {
        setParsedMis(null);
      } else {
        setParsed(null);
      }
      setParseError(err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ CSV นี้ได้');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (uploadMode === 'students') {
      if (!parsedMis) return;
      setSubmitting(true);
      setSubmitError('');
      try {
        const cleanSemester = semester.trim() || '2569-2';
        const recordsToSend = parsedMis.records.map((r) => ({
          ...r,
          semester: cleanSemester,
        }));
        const response = await fetch('/api/student-breakdowns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            semester: cleanSemester,
            source_filename: misFilename || 'schoolmis.csv',
            records: recordsToSend,
          }),
        });
        const data = await parseJsonResponse<{
          mode?: 'supabase' | 'preview';
          records?: SchoolStudentBreakdown[];
          error?: string;
        }>(response);
        if (!response.ok) {
          throw new Error(data.error || 'บันทึกข้อมูลนักเรียนแยกชั้นแยกห้องไม่สำเร็จ');
        }
        setParsedMis(null);
        setMisFilename('');
        onStudentBreakdownSuccess(
          data.records && data.records.length > 0 ? data.records : recordsToSend,
          data.mode === 'supabase' ? 'supabase' : 'preview'
        );
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'บันทึกข้อมูลนักเรียนแยกชั้นแยกห้องไม่สำเร็จ'
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

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

  const misTotals = parsedMis
    ? parsedMis.records.reduce(
        (acc, r) => ({
          male: acc.male + r.total_male,
          female: acc.female + r.total_female,
        }),
        { male: 0, female: 0 }
      )
    : { male: 0, female: 0 };

  const canSubmit =
    uploadMode === 'students'
      ? Boolean(
          parsedMis &&
            !submitting &&
            supabaseStatus?.tablesReady &&
            supabaseStatus?.studentBreakdownReady
        )
      : Boolean(parsed && !submitting && supabaseStatus?.tablesReady);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="นำเข้าไฟล์ CSV"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#111827]">
            นำเข้าไฟล์ CSV เข้าสู่ฐานข้อมูล
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

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Upload Type Selector */}
          <div
            role="tablist"
            aria-label="ประเภทไฟล์ CSV ที่ต้องการนำเข้า"
            className="grid grid-cols-2 gap-1.5 rounded-lg bg-[#F3F4F6] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={uploadMode === 'staffing'}
              onClick={() => handleSwitchMode('staffing')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                uploadMode === 'staffing'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>อัตรากำลังรายงวด</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={uploadMode === 'students'}
              onClick={() => handleSwitchMode('students')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                uploadMode === 'students'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>นักเรียนแยกชั้นแยกห้อง</span>
            </button>
          </div>

          {!supabaseStatus?.tablesReady ? (
            <div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-sm text-[#92400E]">
              <p className="font-medium">
                ยังไม่ได้เชื่อมต่อฐานข้อมูล Supabase จึงยังไม่สามารถบันทึกถาวรได้
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
          ) : uploadMode === 'students' && !supabaseStatus?.studentBreakdownReady ? (
            <div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-sm text-[#92400E]">
              <p className="font-medium">
                ยังไม่พบตาราง school_student_breakdowns ใน Supabase
              </p>
              <p className="mt-1 text-xs text-[#78350F]">
                กรุณารันคำสั่ง SQL ล่าสุดใน Supabase SQL Editor ก่อนบันทึกข้อมูลนักเรียนแยกชั้นแยกห้อง{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSetup();
                  }}
                  className="font-semibold underline"
                >
                  เปิดดู Schema SQL
                </button>
              </p>
            </div>
          ) : null}

          {uploadMode === 'staffing' ? (
            <>
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
            </>
          ) : (
            <label className="block text-sm">
              <span className="font-medium text-[#374151]">ภาคเรียน / ปีการศึกษา</span>
              <input
                type="text"
                maxLength={32}
                required
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="เช่น 2569-2"
                className="mt-1.5 h-10 w-full rounded-md border border-[#D1D5DB] px-3 font-mono-num text-sm text-[#111827] focus:border-[#1E3A8A] focus:outline-none"
              />
              <span className="mt-1 block text-xs text-[#6B7280]">
                ใช้สำหรับอ้างอิงชุดข้อมูลจาก SchoolMIS (ค่าเริ่มต้น 2569-2 จะแสดงอัตโนมัติในเมนูปริมาณงานสถานศึกษา)
              </span>
            </label>
          )}

          {/* File Picker */}
          <div>
            <span className="block text-sm font-medium text-[#374151]">
              {uploadMode === 'students'
                ? 'ไฟล์ CSV รายงาน SchoolMIS แยกชั้นแยกห้อง (.csv)'
                : 'ไฟล์ CSV รายงานอัตรากำลัง (.csv)'}
            </span>
            <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-6 text-center transition-colors hover:border-[#1E3A8A] hover:bg-[#F3F4F6]">
              <FileSpreadsheet className="h-6 w-6 text-[#6B7280]" aria-hidden="true" />
              <span className="mt-2 text-sm font-medium text-[#111827]">
                {(uploadMode === 'students' ? misFilename : filename) ||
                  'คลิกเพื่อเลือกไฟล์ CSV จากเครื่องของคุณ'}
              </span>
              <span className="mt-1 text-[13px] text-[#6B7280]">
                รองรับทั้งรหัสภาษาไทย UTF-8 และ Windows-874 (Excel / SchoolMIS)
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
          {uploadMode === 'staffing' && parsed && (
            <div className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm">
              <p className="font-semibold text-[#111827]">ผลการตรวจสอบไฟล์อัตรากำลังก่อนบันทึก</p>
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

          {uploadMode === 'students' && parsedMis && (
            <div className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm">
              <p className="font-semibold text-[#111827]">
                ผลการตรวจสอบไฟล์นักเรียนแยกชั้นแยกห้อง (SchoolMIS)
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-y-2 tabular-nums">
                <div className="text-[#6B7280]">จำนวนโรงเรียน</div>
                <div className="text-right font-mono-num font-medium text-[#111827]">
                  {formatNumber(parsedMis.totalSchools)} แห่ง
                </div>
                <div className="text-[#6B7280]">นักเรียนชาย / หญิง</div>
                <div className="text-right font-mono-num font-medium text-[#111827]">
                  {formatNumber(misTotals.male)} / {formatNumber(misTotals.female)} คน
                </div>
                <div className="text-[#6B7280]">รวมนักเรียนทั้งหมด</div>
                <div className="text-right font-mono-num font-semibold text-[#111827]">
                  {formatNumber(parsedMis.totalStudents)} คน
                </div>
                <div className="text-[#6B7280]">รวมห้องเรียนทั้งหมด</div>
                <div className="text-right font-mono-num font-semibold text-[#1E3A8A]">
                  {formatNumber(parsedMis.totalRooms)} ห้อง
                </div>
              </div>
            </div>
          )}

          {uploadMode === 'staffing' && duplicatePeriod && (
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
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>
                {submitting ? 'กำลังบันทึกลง Supabase...' : 'บันทึกลงฐานข้อมูล Supabase'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
