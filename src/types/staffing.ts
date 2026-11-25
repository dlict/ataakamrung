export const THAI_MONTHS = [
  { value: 1, label: 'มกราคม', short: 'ม.ค.' },
  { value: 2, label: 'กุมภาพันธ์', short: 'ก.พ.' },
  { value: 3, label: 'มีนาคม', short: 'มี.ค.' },
  { value: 4, label: 'เมษายน', short: 'เม.ย.' },
  { value: 5, label: 'พฤษภาคม', short: 'พ.ค.' },
  { value: 6, label: 'มิถุนายน', short: 'มิ.ย.' },
  { value: 7, label: 'กรกฎาคม', short: 'ก.ค.' },
  { value: 8, label: 'สิงหาคม', short: 'ส.ค.' },
  { value: 9, label: 'กันยายน', short: 'ก.ย.' },
  { value: 10, label: 'ตุลาคม', short: 'ต.ค.' },
  { value: 11, label: 'พฤศจิกายน', short: 'พ.ย.' },
  { value: 12, label: 'ธันวาคม', short: 'ธ.ค.' },
] as const;

export interface SchoolStaffingRecord {
  id?: string;
  period_id?: string;
  seq_no: number;
  is_flagged: boolean;
  school_code: string;
  school_name: string;
  location_raw: string;
  subdistrict: string;
  district: string;
  province: string;
  school_size: string;
  school_type: string;
  project_name: string;
  special_feature: string;

  students_count: number;
  classrooms_count: number;

  actual_director: number;
  actual_deputy: number;
  actual_teacher: number;
  actual_total: number;

  j18_paid_director: number;
  j18_paid_deputy: number;
  j18_paid_teacher: number;
  j18_paid_total: number;

  j18_calc_director: number;
  j18_calc_deputy: number;
  j18_calc_teacher: number;
  j18_calc_total: number;

  criteria_director: number;
  criteria_deputy: number;
  criteria_teacher: number;
  criteria_total: number;

  diff_director: number;
  diff_deputy: number;
  diff_teacher: number;
  diff_total: number;
  diff_teacher_pct: number;

  retire_director: number;
  retire_deputy: number;
  retire_teacher: number;
  retire_total: number;

  post_retire_director: number;
  post_retire_deputy: number;
  post_retire_teacher: number;
  post_retire_total: number;
  post_retire_pct: number;

  secondment_out: number;
  secondment_in: number;
  royal_decree_teacher: number;
  contract_teacher: number;
}

export interface ReportPeriod {
  id: string;
  buddhist_year: number;
  month_number: number;
  month_label: string;
  period_note: string;
  source_filename: string;
  total_schools: number;
  total_students: number;
  total_classrooms: number;
  total_actual_staff: number;
  total_j18_calc: number;
  total_criteria: number;
  net_diff: number;
  net_diff_pct: number;
  created_at: string;
  is_initial_snapshot?: boolean;
}

export interface AggregateSummary {
  totalSchools: number;
  totalStudents: number;
  totalClassrooms: number;

  actualDirector: number;
  actualDeputy: number;
  actualTeacher: number;
  actualTotal: number;

  j18PaidDirector: number;
  j18PaidDeputy: number;
  j18PaidTeacher: number;
  j18PaidTotal: number;
  j18CalcDirector: number;
  j18CalcDeputy: number;
  j18CalcTeacher: number;
  j18CalcTotal: number;

  criteriaDirector: number;
  criteriaDeputy: number;
  criteriaTeacher: number;
  criteriaTotal: number;

  diffDirector: number;
  diffDeputy: number;
  diffTeacher: number;
  diffTotal: number;
  diffTeacherPct: number;

  retireDirector: number;
  retireDeputy: number;
  retireTeacher: number;
  retireTotal: number;

  postRetireDirector: number;
  postRetireDeputy: number;
  postRetireTeacher: number;
  postRetireTotal: number;
  postRetirePct: number;

  secondmentOut: number;
  secondmentIn: number;
  royalDecreeTeacher: number;
  contractTeacher: number;

  vacantDirector: number;
  vacantDeputy: number;
  vacantTeacher: number;
  vacantTotal: number;
  vacantSchools: number;
  vacantDirectorByJ18Schools: number;
  vacantDeputyByJ18Schools: number;
  vacantTeacherByJ18Schools: number;

  deficitSchools: number;
  balancedSchools: number;
  surplusSchools: number;
  vacantDirectorSchools: number;
  studentTeacherRatio: number;
}

export interface DistrictSummary {
  district: string;
  schools: number;
  students: number;
  classrooms: number;
  actualDirector: number;
  actualDeputy: number;
  actualTeacher: number;
  actualTotal: number;
  j18CalcTotal: number;
  criteriaDirector: number;
  criteriaDeputy: number;
  criteriaTeacher: number;
  criteriaTotal: number;
  diffDirector: number;
  diffDeputy: number;
  diffTeacher: number;
  diffTotal: number;
  diffTeacherPct: number;
  retireTotal: number;
  contractAndRoyal: number;
  vacantDirector: number;
  vacantDeputy: number;
  vacantTeacher: number;
  vacantTotal: number;
  vacantSchools: number;
  deficitSchools: number;
  balancedSchools: number;
  surplusSchools: number;
}

export interface SupabaseStatus {
  configured: boolean;
  tablesReady: boolean;
  mode: 'supabase' | 'preview';
  message: string;
  diagnostic?: {
    urlValid: boolean;
    urlNote: string;
    keySource: 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY' | 'none';
    keyKind: string;
    httpStatus?: number;
    errorCode?: string;
    errorDetail?: string;
  };
}

export type ActiveTab = 'overview' | 'schools' | 'compare-schools' | 'compare';
