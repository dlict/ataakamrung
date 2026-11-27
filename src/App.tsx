import { useCallback, useEffect, useMemo, useState } from 'react';
import { ComparePeriodsView } from './components/ComparePeriodsView';
import { CompareSchoolsView } from './components/CompareSchoolsView';
import { OverviewView } from './components/OverviewView';
import { SchoolDetailDrawer } from './components/SchoolDetailDrawer';
import { SchoolsTableView } from './components/SchoolsTableView';
import { StudentBreakdownsView } from './components/StudentBreakdownsView';
import { SupabaseSetupDrawer } from './components/SupabaseSetupDrawer';
import { Toolbar } from './components/Toolbar';
import { TopBar } from './components/TopBar';
import { UploadModal } from './components/UploadModal';
import { WorkloadReportView } from './components/WorkloadReportView';
import type {
  ActiveTab,
  ReportPeriod,
  SchoolStaffingRecord,
  SchoolStudentBreakdown,
  SupabaseStatus,
} from './types/staffing';
import {
  computeDistrictBreakdown,
  computeSummaryFromRecords,
} from './utils/csvParser';
import { parseJsonResponse } from './utils/api';
import { normalizeSchoolName } from './utils/schoolmisParser';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [records, setRecords] = useState<SchoolStaffingRecord[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(true);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [studentBreakdowns, setStudentBreakdowns] = useState<SchoolStudentBreakdown[] | null>(null);
  const [studentBreakdownMode, setStudentBreakdownMode] = useState<'supabase' | 'preview'>('preview');
  const [breakdownSemesters, setBreakdownSemesters] = useState<string[]>([]);
  const [selectedBreakdownSemester, setSelectedBreakdownSemester] = useState<string>('2569-2');
  const [loadingBreakdowns, setLoadingBreakdowns] = useState<boolean>(false);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const [compareSchoolCodes, setCompareSchoolCodes] = useState<string[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolStaffingRecord | null>(null);
  const [preferredWorkloadCode, setPreferredWorkloadCode] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadModalMode, setUploadModalMode] = useState<'staffing' | 'students'>('staffing');
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);

  const loadInitialData = useCallback(async (preferredPeriodId?: string) => {
    setLoadingPeriods(true);
    setErrorMessage('');
    try {
      const [statusRes, periodsRes, breakdownsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/periods'),
        fetch('/api/student-breakdowns?semester=2569-2').catch(() => null),
      ]);
      const statusData = await parseJsonResponse<SupabaseStatus>(statusRes);
      const periodsData = await parseJsonResponse<{
        periods?: ReportPeriod[];
        error?: string;
      }>(periodsRes);

      if (!periodsRes.ok) {
        throw new Error(periodsData.error || 'ไม่สามารถโหลดข้อมูลได้');
      }

      if (breakdownsRes && breakdownsRes.ok) {
        try {
          const bdData = await parseJsonResponse<{
            mode?: 'supabase' | 'preview';
            semester?: string;
            semesters?: string[];
            records?: SchoolStudentBreakdown[];
          }>(breakdownsRes);
          if (Array.isArray(bdData.records)) {
            setStudentBreakdowns(bdData.records);
            setStudentBreakdownMode(bdData.mode === 'supabase' ? 'supabase' : 'preview');
          }
          if (Array.isArray(bdData.semesters)) {
            setBreakdownSemesters(bdData.semesters);
          }
          if (bdData.semester) {
            setSelectedBreakdownSemester(bdData.semester);
          }
        } catch {
          // Non-fatal; WorkloadReportView still keeps bundled fallback
        }
      }

      setSupabaseStatus(statusData);
      const list = periodsData.periods ?? [];
      setPeriods(list);

      if (list.length > 0) {
        const target =
          preferredPeriodId && list.some((p) => p.id === preferredPeriodId)
            ? preferredPeriodId
            : list[0].id;
        setSelectedPeriodId(target);
      } else {
        setSelectedPeriodId('');
        setRecords([]);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
      );
    } finally {
      setLoadingPeriods(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!selectedPeriodId) return;
    let active = true;
    setLoadingRecords(true);
    setErrorMessage('');

    fetch(`/api/periods/${selectedPeriodId}/records`)
      .then(async (res) => {
        const data = await parseJsonResponse<{ records: SchoolStaffingRecord[]; error?: string }>(
          res
        );
        if (!res.ok) throw new Error(data.error || 'โหลดข้อมูลโรงเรียนไม่สำเร็จ');
        return data;
      })
      .then((data) => {
        if (!active) return;
        const loaded = data.records ?? [];
        setRecords(loaded);
        setCompareSchoolCodes((prev) => {
          const valid = prev.filter((code) =>
            loaded.some((r) => r.school_code === code)
          );
          if (valid.length >= 2) return valid;
          return loaded.slice(0, 2).map((r) => r.school_code);
        });
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลโรงเรียนได้'
        );
      })
      .finally(() => {
        if (active) setLoadingRecords(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPeriodId]);

  const districts = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.district).filter(Boolean))).sort(),
    [records]
  );

  const sizes = useMemo(() => {
    const order = ['ขนาดเล็ก', 'ขนาดกลาง', 'ขนาดใหญ่'];
    return Array.from(new Set(records.map((r) => r.school_size).filter(Boolean))).sort(
      (a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      }
    );
  }, [records]);

  const types = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.school_type).filter(Boolean))).sort(),
    [records]
  );

  const recordsBySizeAndType = useMemo(
    () =>
      records.filter((r) => {
        if (selectedSize !== 'all' && r.school_size !== selectedSize) return false;
        if (selectedType !== 'all' && r.school_type !== selectedType) return false;
        return true;
      }),
    [records, selectedSize, selectedType]
  );

  const filteredRecords = useMemo(
    () =>
      recordsBySizeAndType.filter(
        (r) => selectedDistrict === 'all' || r.district === selectedDistrict
      ),
    [recordsBySizeAndType, selectedDistrict]
  );

  const summary = useMemo(
    () => computeSummaryFromRecords(filteredRecords),
    [filteredRecords]
  );

  const districtBreakdown = useMemo(
    () => computeDistrictBreakdown(recordsBySizeAndType),
    [recordsBySizeAndType]
  );

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId);
  const currentPeriodLabel = currentPeriod
    ? `${currentPeriod.month_label} ${currentPeriod.buddhist_year}`
    : '';

  const hasActiveFilters =
    selectedDistrict !== 'all' || selectedSize !== 'all' || selectedType !== 'all';

  function handleResetFilters() {
    setSelectedDistrict('all');
    setSelectedSize('all');
    setSelectedType('all');
  }

  function handleToggleCompareCode(code: string) {
    setCompareSchoolCodes((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= 6) return prev;
      return [...prev, code];
    });
  }

  async function handleDeletePeriod(periodId: string) {
    const res = await fetch(`/api/periods/${periodId}`, { method: 'DELETE' });
    const data = await parseJsonResponse<{ ok?: boolean; error?: string }>(res);
    if (!res.ok) {
      setErrorMessage(data.error || 'ไม่สามารถลบงวดข้อมูลได้');
      return;
    }
    const nextFallback = periods.find((p) => p.id !== periodId)?.id;
    await loadInitialData(nextFallback);
  }

  async function handleDeleteYear(buddhistYear: number) {
    const res = await fetch(`/api/years/${buddhistYear}`, { method: 'DELETE' });
    const data = await parseJsonResponse<{ ok?: boolean; error?: string }>(res);
    if (!res.ok) {
      setErrorMessage(data.error || 'ไม่สามารถลบข้อมูลรายปีได้');
      return;
    }
    const nextFallback = periods.find((p) => p.buddhist_year !== buddhistYear)?.id;
    await loadInitialData(nextFallback);
  }

  async function handleDeleteAllPeriods() {
    const res = await fetch('/api/periods', { method: 'DELETE' });
    const data = await parseJsonResponse<{ ok?: boolean; error?: string }>(res);
    if (!res.ok) {
      setErrorMessage(data.error || 'ไม่สามารถลบข้อมูลทั้งหมดได้');
      return;
    }
    setSelectedPeriodId('');
    setRecords([]);
    setCompareSchoolCodes([]);
    await loadInitialData();
  }

  function handleOpenUpload(mode: 'staffing' | 'students' = 'staffing') {
    setUploadModalMode(mode);
    setIsUploadOpen(true);
  }

  function handleUploadSuccess(savedPeriod: ReportPeriod) {
    setIsUploadOpen(false);
    loadInitialData(savedPeriod.id);
    setActiveTab('overview');
  }

  async function refreshBreakdowns(semester = selectedBreakdownSemester) {
    setLoadingBreakdowns(true);
    try {
      const qs = semester ? `?semester=${encodeURIComponent(semester)}` : '';
      const res = await fetch(`/api/student-breakdowns${qs}`);
      if (!res.ok) return;
      const bdData = await parseJsonResponse<{
        mode?: 'supabase' | 'preview';
        semester?: string;
        semesters?: string[];
        records?: SchoolStudentBreakdown[];
      }>(res);
      if (Array.isArray(bdData.records)) {
        setStudentBreakdowns(bdData.records);
        setStudentBreakdownMode(bdData.mode === 'supabase' ? 'supabase' : 'preview');
      }
      if (Array.isArray(bdData.semesters)) {
        setBreakdownSemesters(bdData.semesters);
      }
      if (bdData.semester) {
        setSelectedBreakdownSemester(bdData.semester);
      }
    } finally {
      setLoadingBreakdowns(false);
    }
  }

  async function handleSelectBreakdownSemester(sem: string) {
    setSelectedBreakdownSemester(sem);
    await refreshBreakdowns(sem);
  }

  async function handleDeleteStudentBreakdown(id: string) {
    const res = await fetch(`/api/student-breakdowns/${id}`, { method: 'DELETE' });
    const data = await parseJsonResponse<{ ok?: boolean; error?: string }>(res);
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถลบข้อมูลโรงเรียนได้');
    }
    setStudentBreakdowns((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    await refreshBreakdowns(selectedBreakdownSemester);
  }

  async function handleDeleteStudentSemester(semester: string) {
    const qs =
      semester && semester !== 'all' ? `?semester=${encodeURIComponent(semester)}` : '';
    const res = await fetch(`/api/student-breakdowns${qs}`, { method: 'DELETE' });
    const data = await parseJsonResponse<{ ok?: boolean; error?: string }>(res);
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถลบข้อมูลนักเรียนแยกชั้นได้');
    }
    await refreshBreakdowns(semester === 'all' ? '' : semester);
  }

  async function handleSeedDefaultBreakdowns() {
    const res = await fetch('/api/student-breakdowns/seed', { method: 'POST' });
    const data = await parseJsonResponse<{
      ok?: boolean;
      mode?: 'supabase' | 'preview';
      semester?: string;
      records?: SchoolStudentBreakdown[];
      error?: string;
    }>(res);
    if (!res.ok) {
      throw new Error(data.error || 'ไม่สามารถกู้คืนข้อมูลเริ่มต้น SchoolMIS ได้');
    }
    setSelectedBreakdownSemester(data.semester || '2569-2');
    await refreshBreakdowns(data.semester || '2569-2');
  }

  function handleStudentBreakdownSuccess(
    savedRecords: SchoolStudentBreakdown[],
    mode: 'supabase' | 'preview'
  ) {
    const uploadedSem = savedRecords[0]?.semester || '2569-2';
    setStudentBreakdowns(savedRecords);
    setStudentBreakdownMode(mode);
    setSelectedBreakdownSemester(uploadedSem);
    setBreakdownSemesters((prev) =>
      prev.includes(uploadedSem) ? prev : [uploadedSem, ...prev].sort((a, b) => b.localeCompare(a))
    );
    setIsUploadOpen(false);
    setActiveTab('student-breakdowns');
  }

  function handleOpenWorkloadFromBreakdown(row: SchoolStudentBreakdown) {
    const match =
      records.find((r) => r.school_code === row.school_code) ??
      records.find(
        (r) => normalizeSchoolName(r.school_name) === normalizeSchoolName(row.school_name)
      );
    if (match) {
      if (!filteredRecords.some((r) => r.school_code === match.school_code)) {
        handleResetFilters();
      }
      setPreferredWorkloadCode(match.school_code);
    }
    setActiveTab('workload');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827] print:bg-white">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenUpload={() => handleOpenUpload('staffing')}
      />

      {periods.length > 0 && (
        <Toolbar
          periods={periods}
          selectedPeriodId={selectedPeriodId}
          onSelectPeriod={setSelectedPeriodId}
          districts={districts}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          sizes={sizes}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
          types={types}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          supabaseStatus={supabaseStatus}
          onOpenSetup={() => setIsSetupOpen(true)}
        />
      )}

      <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
        {/* Discreet Supabase setup notice only when not yet connected */}
        {supabaseStatus && !supabaseStatus.tablesReady && (
          <div className="mb-6 flex flex-col gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
            <p className="text-[#4B5563]">
              <strong className="font-semibold text-[#111827]">สถานะฐานข้อมูล:</strong>{' '}
              {supabaseStatus.message}
            </p>
            <button
              type="button"
              onClick={() => setIsSetupOpen(true)}
              className="self-start font-medium text-[#1E3A8A] hover:underline sm:self-auto whitespace-nowrap shrink-0"
            >
              ตั้งค่า Supabase และดู Schema SQL
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3.5 text-sm text-[#B91C1C] print:hidden">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => loadInitialData(selectedPeriodId)}
              className="font-semibold underline whitespace-nowrap shrink-0"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {loadingPeriods || loadingRecords ? (
          <div className="space-y-6" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#E5E7EB] sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-5">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-[#F3F4F6]" />
                  <div className="mt-3 h-8 w-24 animate-pulse rounded bg-[#F3F4F6]" />
                  <div className="mt-3 h-3.5 w-40 animate-pulse rounded bg-[#F3F4F6]" />
                </div>
              ))}
            </div>
            <div className="h-72 animate-pulse rounded-lg border border-[#E5E7EB] bg-white" />
          </div>
        ) : activeTab === 'student-breakdowns' ? (
          <StudentBreakdownsView
            records={studentBreakdowns ?? []}
            staffingRecords={records}
            semesters={breakdownSemesters}
            selectedSemester={selectedBreakdownSemester}
            mode={studentBreakdownMode}
            supabaseStatus={supabaseStatus}
            loading={loadingBreakdowns}
            onSelectSemester={handleSelectBreakdownSemester}
            onOpenUploadStudents={() => handleOpenUpload('students')}
            onDeleteRecord={handleDeleteStudentBreakdown}
            onDeleteSemester={handleDeleteStudentSemester}
            onSeedDefault={handleSeedDefaultBreakdowns}
            onOpenWorkload={handleOpenWorkloadFromBreakdown}
            onOpenSetup={() => setIsSetupOpen(true)}
          />
        ) : periods.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
            <h1 className="text-xl font-semibold text-[#111827]">
              ยังไม่มีข้อมูลอัตรากำลังในระบบ
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#6B7280] leading-relaxed">
              ระบบพร้อมสำหรับเริ่มต้นใหม่แบบว่างเปล่า กรุณาอัปโหลดไฟล์ CSV รายงานอัตรากำลังตามปี พ.ศ. และเดือนที่ต้องการเพื่อแสดงผลแดชบอร์ด
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenUpload('staffing')}
                className="rounded-md bg-[#1E3A8A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF]"
              >
                นำเข้าไฟล์ CSV ใหม่
              </button>
              {!supabaseStatus?.tablesReady && (
                <button
                  type="button"
                  onClick={() => setIsSetupOpen(true)}
                  className="rounded-md border border-[#D1D5DB] bg-white px-5 py-2.5 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F9FAFB]"
                >
                  ตั้งค่าการเชื่อมต่อ Supabase
                </button>
              )}
            </div>
          </section>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewView
                records={filteredRecords}
                allPeriodRecords={records}
                summary={summary}
                districtBreakdown={districtBreakdown}
                periods={periods}
                selectedPeriodId={selectedPeriodId}
                selectedDistrict={selectedDistrict}
                selectedSize={selectedSize}
                selectedType={selectedType}
                onSelectPeriod={setSelectedPeriodId}
                onSelectDistrict={setSelectedDistrict}
                onSelectSchool={setSelectedSchool}
                onNavigateToSchools={() => setActiveTab('schools')}
              />
            )}

            {activeTab === 'schools' && (
              <SchoolsTableView
                records={filteredRecords}
                totalPeriodRecords={records.length}
                periodLabel={currentPeriodLabel}
                periodNote={currentPeriod?.period_note}
                districts={districts}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={setSelectedDistrict}
                onSelectSchool={setSelectedSchool}
                compareCodes={compareSchoolCodes}
                onToggleCompareCode={handleToggleCompareCode}
                onGoToCompare={() => setActiveTab('compare-schools')}
              />
            )}

            {activeTab === 'workload' && (
              <WorkloadReportView
                records={filteredRecords}
                buddhistYear={currentPeriod?.buddhist_year}
                supabaseStatus={supabaseStatus}
                initialBreakdowns={studentBreakdowns}
                initialBreakdownMode={studentBreakdownMode}
                preferredSchoolCode={preferredWorkloadCode}
                onConsumePreferredSchool={() => setPreferredWorkloadCode(null)}
                onBreakdownsUpdated={(updated, mode) => {
                  setStudentBreakdowns(updated);
                  setStudentBreakdownMode(mode);
                  refreshBreakdowns(updated[0]?.semester || selectedBreakdownSemester);
                }}
                onOpenSetup={() => setIsSetupOpen(true)}
              />
            )}

            {activeTab === 'compare-schools' && (
              <CompareSchoolsView
                allRecords={records}
                districts={districts}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={setSelectedDistrict}
                selectedSchoolCodes={compareSchoolCodes}
                onChangeSelectedCodes={setCompareSchoolCodes}
                periodLabel={currentPeriodLabel}
              />
            )}

            {activeTab === 'compare' && (
              <ComparePeriodsView
                periods={periods}
                supabaseStatus={supabaseStatus}
                onSelectPeriod={(id) => {
                  setSelectedPeriodId(id);
                  setActiveTab('overview');
                }}
                onDeletePeriod={handleDeletePeriod}
                onDeleteYear={handleDeleteYear}
                onDeleteAll={handleDeleteAllPeriods}
                onOpenUpload={() => handleOpenUpload('staffing')}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-[#E5E7EB] bg-white print:hidden">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-1 px-4 py-4 text-sm text-[#6B7280] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>ข้อมูลอัตรากำลังข้าราชการครูและบุคลากรทางการศึกษา · สพป.แม่ฮ่องสอน เขต 1</span>
          <span>เกณฑ์เปรียบเทียบตาม จ.18 คำนวณอัตรา และเกณฑ์ ก.ค.ศ.</span>
        </div>
      </footer>

      <SchoolDetailDrawer
        school={selectedSchool}
        allRecords={records}
        onClose={() => setSelectedSchool(null)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        existingPeriods={periods}
        supabaseStatus={supabaseStatus}
        initialMode={uploadModalMode}
        onSuccess={handleUploadSuccess}
        onStudentBreakdownSuccess={handleStudentBreakdownSuccess}
        onOpenSetup={() => setIsSetupOpen(true)}
      />

      <SupabaseSetupDrawer
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        status={supabaseStatus}
        onRefreshStatus={() => loadInitialData(selectedPeriodId)}
      />
    </div>
  );
}
