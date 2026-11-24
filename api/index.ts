import 'dotenv/config';
import express, { type Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const THAI_MONTHS = [
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

interface SchoolStaffingRecord {
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

interface ReportPeriod {
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
  created_at?: string;
  updated_at?: string;
}

interface SupabaseStatus {
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

const FALLBACK_SCHEMA_SQL = `-- Supabase PostgreSQL Schema for สพป.แม่ฮ่องสอน เขต 1 Staffing Dashboard
-- Run this SQL once in your Supabase Project -> SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.report_periods (
  id uuid primary key default gen_random_uuid(),
  buddhist_year integer not null check (buddhist_year >= 2500 and buddhist_year <= 2700),
  month_number integer not null check (month_number >= 1 and month_number <= 12),
  month_label text not null,
  period_note text not null default '',
  source_filename text not null,
  total_schools integer not null default 0,
  total_students integer not null default 0,
  total_classrooms integer not null default 0,
  total_actual_staff integer not null default 0,
  total_j18_calc integer not null default 0,
  total_criteria integer not null default 0,
  net_diff integer not null default 0,
  net_diff_pct numeric(7,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_report_periods_year_month unique (buddhist_year, month_number)
);

create table if not exists public.school_staffing_records (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.report_periods(id) on delete cascade,
  seq_no integer not null,
  is_flagged boolean not null default false,
  school_code text not null,
  school_name text not null,
  location_raw text not null default '',
  subdistrict text not null default '',
  district text not null default '',
  province text not null default '',
  school_size text not null default '',
  school_type text not null default '',
  project_name text not null default '',
  special_feature text not null default '',
  students_count integer not null default 0,
  classrooms_count integer not null default 0,
  actual_director integer not null default 0,
  actual_deputy integer not null default 0,
  actual_teacher integer not null default 0,
  actual_total integer not null default 0,
  j18_paid_director integer not null default 0,
  j18_paid_deputy integer not null default 0,
  j18_paid_teacher integer not null default 0,
  j18_paid_total integer not null default 0,
  j18_calc_director integer not null default 0,
  j18_calc_deputy integer not null default 0,
  j18_calc_teacher integer not null default 0,
  j18_calc_total integer not null default 0,
  criteria_director integer not null default 0,
  criteria_deputy integer not null default 0,
  criteria_teacher integer not null default 0,
  criteria_total integer not null default 0,
  diff_director integer not null default 0,
  diff_deputy integer not null default 0,
  diff_teacher integer not null default 0,
  diff_total integer not null default 0,
  diff_teacher_pct numeric(7,2) not null default 0,
  retire_director integer not null default 0,
  retire_deputy integer not null default 0,
  retire_teacher integer not null default 0,
  retire_total integer not null default 0,
  post_retire_director integer not null default 0,
  post_retire_deputy integer not null default 0,
  post_retire_teacher integer not null default 0,
  post_retire_total integer not null default 0,
  post_retire_pct numeric(7,2) not null default 0,
  secondment_out integer not null default 0,
  secondment_in integer not null default 0,
  royal_decree_teacher integer not null default 0,
  contract_teacher integer not null default 0,
  created_at timestamptz not null default now(),
  constraint uq_period_school_code unique (period_id, school_code)
);

create index if not exists idx_school_records_period_id on public.school_staffing_records(period_id);
create index if not exists idx_school_records_district on public.school_staffing_records(district);
create index if not exists idx_school_records_school_code on public.school_staffing_records(school_code);
create index if not exists idx_report_periods_sort on public.report_periods(buddhist_year desc, month_number desc);

alter table public.report_periods enable row level security;
alter table public.school_staffing_records enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.report_periods to service_role;
grant select, insert, update, delete on table public.school_staffing_records to service_role;
grant usage, select on all sequences in schema public to service_role;

drop policy if exists "Allow read report_periods" on public.report_periods;
drop policy if exists "Allow read school_staffing_records" on public.school_staffing_records;
revoke all on table public.report_periods from anon;
revoke all on table public.school_staffing_records from anon;
`;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return '';
  let val = raw.trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  return val;
}

function inspectSupabaseConfig() {
  let url = cleanEnvValue(process.env.SUPABASE_URL);
  if (url.startsWith('SUPABASE_URL=')) {
    url = cleanEnvValue(url.slice('SUPABASE_URL='.length));
  }
  url = url.replace(/\/+$/, '');

  const serviceKeyRaw = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anonKeyRaw = cleanEnvValue(process.env.SUPABASE_ANON_KEY);

  let keySource: 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY' | 'none' = 'none';
  let key = '';
  if (serviceKeyRaw) {
    keySource = 'SUPABASE_SERVICE_ROLE_KEY';
    key = serviceKeyRaw.startsWith('SUPABASE_SERVICE_ROLE_KEY=')
      ? cleanEnvValue(serviceKeyRaw.slice('SUPABASE_SERVICE_ROLE_KEY='.length))
      : serviceKeyRaw;
  } else if (anonKeyRaw) {
    keySource = 'SUPABASE_ANON_KEY';
    key = anonKeyRaw.startsWith('SUPABASE_ANON_KEY=')
      ? cleanEnvValue(anonKeyRaw.slice('SUPABASE_ANON_KEY='.length))
      : anonKeyRaw;
  }

  let urlValid = false;
  let urlNote = 'ยังไม่ได้ระบุ SUPABASE_URL';
  let urlProjectRef = '';
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co')) {
        urlValid = true;
        urlProjectRef = parsed.hostname.split('.')[0] || '';
        urlNote = `รูปแบบ URL ถูกต้อง (Project: ${urlProjectRef})`;
      } else if (parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:') {
        urlNote =
          'ค่าที่ใส่เป็น PostgreSQL Connection String ไม่ใช่ Project URL (ต้องขึ้นต้นด้วย https://...supabase.co)';
      } else {
        urlNote = `URL ต้องเป็น https://<project-ref>.supabase.co (พบ ${parsed.protocol}//${parsed.hostname})`;
      }
    } catch {
      urlNote = 'รูปแบบ SUPABASE_URL ไม่ใช่ URL ที่ถูกต้อง';
    }
  }

  let keyKind = 'none';
  let jwtRef = '';
  let jwtRole = '';
  if (key) {
    if (key.startsWith('eyJ') && key.split('.').length === 3) {
      try {
        const payload = JSON.parse(
          Buffer.from(key.split('.')[1], 'base64url').toString('utf8')
        ) as { role?: string; ref?: string };
        jwtRole = payload.role || 'unknown';
        jwtRef = payload.ref || '';
        keyKind = `jwt (role=${jwtRole})`;
      } catch {
        keyKind = 'jwt (malformed)';
      }
    } else if (key.startsWith('sb_secret_')) {
      keyKind = 'sb_secret';
    } else if (key.startsWith('sb_publishable_')) {
      keyKind = 'sb_publishable (ห้ามใช้คีย์นี้แทน service_role)';
    } else {
      keyKind = `unknown format (length=${key.length})`;
    }
  }

  const refMismatch = Boolean(urlProjectRef && jwtRef && urlProjectRef !== jwtRef);

  return {
    url,
    key,
    urlValid,
    urlNote,
    keySource,
    keyKind,
    jwtRole,
    refMismatch,
    urlProjectRef,
    jwtRef,
  };
}

function getSupabaseClient(): SupabaseClient | null {
  const cfg = inspectSupabaseConfig();
  if (!cfg.url || !cfg.key || !cfg.urlValid) {
    return null;
  }
  return createClient(cfg.url, cfg.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function checkSupabaseStatus(): Promise<SupabaseStatus> {
  const cfg = inspectSupabaseConfig();

  if (!cfg.url && !cfg.key) {
    return {
      configured: false,
      tablesReady: false,
      mode: 'preview',
      message:
        'ยังไม่ได้ตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY (กรุณาตั้งค่า Environment Variables ในเซิร์ฟเวอร์หรือ Vercel แล้ว Redeploy)',
      diagnostic: {
        urlValid: false,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  }

  if (!cfg.urlValid || !cfg.key) {
    return {
      configured: true,
      tablesReady: false,
      mode: 'preview',
      message: !cfg.urlValid
        ? cfg.urlNote
        : 'พบ SUPABASE_URL แล้ว แต่ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY',
      diagnostic: {
        urlValid: cfg.urlValid,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  }

  if (cfg.refMismatch) {
    return {
      configured: true,
      tablesReady: false,
      mode: 'preview',
      message: `Project ID ใน SUPABASE_URL (${cfg.urlProjectRef}) ไม่ตรงกับคีย์ (${cfg.jwtRef}) กรุณาตรวจสอบว่าทั้งสองค่ามาจากโปรเจกต์เดียวกัน`,
      diagnostic: {
        urlValid: cfg.urlValid,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  }

  const client = getSupabaseClient()!;

  try {
    const { error, status } = await client.from('report_periods').select('id').limit(1);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const code = (error.code || '').toUpperCase();
      const isMissingTable =
        code === '42P01' ||
        code === 'PGRST205' ||
        msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        msg.includes('could not find the table');

      if (isMissingTable) {
        return {
          configured: true,
          tablesReady: false,
          mode: 'preview',
          message:
            'เชื่อมต่อ Supabase แล้ว แต่ยังไม่พบตารางข้อมูล กรุณารันคำสั่ง SQL ในไฟล์ supabase/schema.sql',
          diagnostic: {
            urlValid: cfg.urlValid,
            urlNote: cfg.urlNote,
            keySource: cfg.keySource,
            keyKind: cfg.keyKind,
            httpStatus: status,
            errorCode: error.code,
            errorDetail: error.message,
          },
        };
      }

      if (
        status === 401 ||
        status === 403 ||
        code === '42501' ||
        msg.includes('jwt') ||
        msg.includes('api key')
      ) {
        const isPublishableOrAnon =
          cfg.jwtRole === 'anon' || cfg.keyKind.startsWith('sb_publishable');
        const isMissingGrant =
          !isPublishableOrAnon && (code === '42501' || msg.includes('permission denied'));

        const customMessage = isPublishableOrAnon
          ? `คีย์ที่ใส่เป็น anon/publishable key ไม่ใช่ service_role/secret key: ${error.message}`
          : isMissingGrant
            ? 'คีย์ sb_secret_ ถูกต้องแล้ว แต่ยังไม่มีสิทธิ์ GRANT บนตารางข้อมูล กรุณารันคำสั่ง SQL ล่าสุดในหน้าต่างตั้งค่า Supabase (เพิ่มสิทธิ์ GRANT ให้ service_role)'
            : `พบตัวแปร Supabase แล้ว แต่คีย์เชื่อมต่อไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง: ${error.message}`;

        return {
          configured: true,
          tablesReady: false,
          mode: 'preview',
          message: customMessage,
          diagnostic: {
            urlValid: cfg.urlValid,
            urlNote: cfg.urlNote,
            keySource: cfg.keySource,
            keyKind: cfg.keyKind,
            httpStatus: status,
            errorCode: error.code,
            errorDetail: error.message,
          },
        };
      }

      return {
        configured: true,
        tablesReady: false,
        mode: 'preview',
        message: `ไม่สามารถติดต่อฐานข้อมูล Supabase ได้ (${error.code || status || 'ERROR'}: ${error.message})`,
        diagnostic: {
          urlValid: cfg.urlValid,
          urlNote: cfg.urlNote,
          keySource: cfg.keySource,
          keyKind: cfg.keyKind,
          httpStatus: status,
          errorCode: error.code,
          errorDetail: error.message,
        },
      };
    }

    return {
      configured: true,
      tablesReady: true,
      mode: 'supabase',
      message: 'เชื่อมต่อฐานข้อมูล Supabase พร้อมใช้งาน',
      diagnostic: {
        urlValid: cfg.urlValid,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  } catch (err) {
    return {
      configured: true,
      tablesReady: false,
      mode: 'preview',
      message: `ไม่สามารถเชื่อมต่อไปยัง SUPABASE_URL ได้: ${
        err instanceof Error ? err.message : 'Network error'
      }`,
      diagnostic: {
        urlValid: cfg.urlValid,
        urlNote: cfg.urlNote,
        keySource: cfg.keySource,
        keyKind: cfg.keyKind,
      },
    };
  }
}

function sanitizeInt(value: unknown, min = -100000, max = 1000000): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function sanitizeFloat(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Number(Math.max(-10000, Math.min(10000, n)).toFixed(2));
}

function sanitizeText(value: unknown, maxLen = 250): string {
  return String(value ?? '').trim().slice(0, maxLen);
}

function sanitizeRecords(rawRecords: unknown[]): SchoolStaffingRecord[] {
  return rawRecords.map((item, idx) => {
    const r = (item ?? {}) as Record<string, unknown>;
    return {
      seq_no: sanitizeInt(r.seq_no, 1, 100000) || idx + 1,
      is_flagged: Boolean(r.is_flagged),
      school_code: sanitizeText(r.school_code, 32),
      school_name: sanitizeText(r.school_name, 200),
      location_raw: sanitizeText(r.location_raw, 200),
      subdistrict: sanitizeText(r.subdistrict, 100),
      district: sanitizeText(r.district, 100),
      province: sanitizeText(r.province, 100),
      school_size: sanitizeText(r.school_size, 64),
      school_type: sanitizeText(r.school_type, 64),
      project_name: sanitizeText(r.project_name, 250),
      special_feature: sanitizeText(r.special_feature, 120),

      students_count: sanitizeInt(r.students_count, 0),
      classrooms_count: sanitizeInt(r.classrooms_count, 0),

      actual_director: sanitizeInt(r.actual_director, 0),
      actual_deputy: sanitizeInt(r.actual_deputy, 0),
      actual_teacher: sanitizeInt(r.actual_teacher, 0),
      actual_total: sanitizeInt(r.actual_total, 0),

      j18_paid_director: sanitizeInt(r.j18_paid_director, 0),
      j18_paid_deputy: sanitizeInt(r.j18_paid_deputy, 0),
      j18_paid_teacher: sanitizeInt(r.j18_paid_teacher, 0),
      j18_paid_total: sanitizeInt(r.j18_paid_total, 0),

      j18_calc_director: sanitizeInt(r.j18_calc_director, 0),
      j18_calc_deputy: sanitizeInt(r.j18_calc_deputy, 0),
      j18_calc_teacher: sanitizeInt(r.j18_calc_teacher, 0),
      j18_calc_total: sanitizeInt(r.j18_calc_total, 0),

      criteria_director: sanitizeInt(r.criteria_director, 0),
      criteria_deputy: sanitizeInt(r.criteria_deputy, 0),
      criteria_teacher: sanitizeInt(r.criteria_teacher, 0),
      criteria_total: sanitizeInt(r.criteria_total, 0),

      diff_director: sanitizeInt(r.diff_director),
      diff_deputy: sanitizeInt(r.diff_deputy),
      diff_teacher: sanitizeInt(r.diff_teacher),
      diff_total: sanitizeInt(r.diff_total),
      diff_teacher_pct: sanitizeFloat(r.diff_teacher_pct),

      retire_director: sanitizeInt(r.retire_director, 0),
      retire_deputy: sanitizeInt(r.retire_deputy, 0),
      retire_teacher: sanitizeInt(r.retire_teacher, 0),
      retire_total: sanitizeInt(r.retire_total, 0),

      post_retire_director: sanitizeInt(r.post_retire_director),
      post_retire_deputy: sanitizeInt(r.post_retire_deputy),
      post_retire_teacher: sanitizeInt(r.post_retire_teacher),
      post_retire_total: sanitizeInt(r.post_retire_total),
      post_retire_pct: sanitizeFloat(r.post_retire_pct),

      secondment_out: sanitizeInt(r.secondment_out, 0),
      secondment_in: sanitizeInt(r.secondment_in, 0),
      royal_decree_teacher: sanitizeInt(r.royal_decree_teacher, 0),
      contract_teacher: sanitizeInt(r.contract_teacher, 0),
    };
  });
}

function verifySameOrigin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }
  const origin = req.headers.origin;
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host;
  const host = rawHost ? String(rawHost).split(',')[0].trim() : '';
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        res.status(403).json({ error: 'ไม่อนุญาตให้ส่งคำขอข้ามโดเมน' });
        return;
      }
    } catch {
      res.status(403).json({ error: 'รูปแบบ Origin ไม่ถูกต้อง' });
      return;
    }
  }
  next();
}

export function createApiApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use('/api', verifySameOrigin);
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/status', async (_req, res) => {
    try {
      const status = await checkSupabaseStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({
        configured: false,
        tablesReady: false,
        mode: 'preview',
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ',
      });
    }
  });

  app.get('/api/schema-sql', (_req, res) => {
    try {
      const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        res.json({ sql });
        return;
      }
    } catch {
      // Fallback to embedded SQL on serverless environments
    }
    res.json({ sql: FALLBACK_SCHEMA_SQL });
  });

  app.get('/api/periods', async (_req, res) => {
    try {
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.json({ mode: 'preview', periods: [] });
        return;
      }

      const client = getSupabaseClient()!;
      const { data, error } = await client
        .from('report_periods')
        .select('*')
        .order('buddhist_year', { ascending: false })
        .order('month_number', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      res.json({ mode: 'supabase', periods: data ?? [] });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ไม่สามารถโหลดรายการงวดข้อมูลได้',
      });
    }
  });

  app.delete('/api/periods', async (_req, res) => {
    try {
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.status(503).json({
          error: 'ยังไม่ได้เชื่อมต่อฐานข้อมูล Supabase หรือยังไม่ได้สร้างตารางข้อมูล',
        });
        return;
      }

      const client = getSupabaseClient()!;
      const { error } = await client
        .from('report_periods')
        .delete()
        .not('id', 'is', null);

      if (error) {
        throw new Error(error.message);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ไม่สามารถลบข้อมูลทั้งหมดได้',
      });
    }
  });

  app.get('/api/periods/:id/records', async (req, res) => {
    try {
      const { id } = req.params;
      const status = await checkSupabaseStatus();

      if (!status.tablesReady) {
        res.json({ mode: 'preview', records: [] });
        return;
      }

      if (!UUID_REGEX.test(id)) {
        res.status(400).json({ error: 'รหัสงวดข้อมูลไม่ถูกต้อง' });
        return;
      }

      const client = getSupabaseClient()!;
      const { data, error } = await client
        .from('school_staffing_records')
        .select('*')
        .eq('period_id', id)
        .order('seq_no', { ascending: true })
        .range(0, 4999);

      if (error) {
        throw new Error(error.message);
      }

      res.json({ mode: 'supabase', records: data ?? [] });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลโรงเรียนได้',
      });
    }
  });

  app.post('/api/periods', async (req, res) => {
    try {
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.status(503).json({
          error:
            'ยังไม่ได้เชื่อมต่อ Supabase หรือยังไม่ได้สร้างตารางข้อมูล กรุณาตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY และรัน supabase/schema.sql ก่อนบันทึกงวดใหม่',
        });
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const buddhistYear = Number(body.buddhist_year);
      const monthNumber = Number(body.month_number);
      const periodNote = sanitizeText(body.period_note, 200);
      const sourceFilename = sanitizeText(body.source_filename, 255) || 'upload.csv';
      const overwrite = Boolean(body.overwrite);
      const rawRecords = body.records;

      if (!Number.isInteger(buddhistYear) || buddhistYear < 2500 || buddhistYear > 2700) {
        res.status(400).json({ error: 'ปี พ.ศ. ต้องอยู่ระหว่าง 2500 - 2700' });
        return;
      }

      if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        res.status(400).json({ error: 'เดือนต้องอยู่ระหว่าง 1 - 12' });
        return;
      }

      if (!Array.isArray(rawRecords) || rawRecords.length === 0 || rawRecords.length > 5000) {
        res.status(400).json({ error: 'ไม่พบข้อมูลโรงเรียนที่ถูกต้องในไฟล์ที่นำเข้า' });
        return;
      }

      const records = sanitizeRecords(rawRecords).filter(
        (r) => r.school_code.length > 0 && r.school_name.length > 0
      );

      if (records.length === 0) {
        res.status(400).json({ error: 'ไม่พบรายการโรงเรียนที่สามารถบันทึกได้' });
        return;
      }

      let totalStudents = 0;
      let totalClassrooms = 0;
      let totalActualStaff = 0;
      let totalJ18Calc = 0;
      let totalCriteria = 0;
      let netDiff = 0;
      let diffTeacher = 0;
      let criteriaTeacher = 0;

      for (const r of records) {
        totalStudents += r.students_count;
        totalClassrooms += r.classrooms_count;
        totalActualStaff += r.actual_total;
        totalJ18Calc += r.j18_calc_total;
        totalCriteria += r.criteria_total;
        netDiff += r.diff_total;
        diffTeacher += r.diff_teacher;
        criteriaTeacher += r.criteria_teacher;
      }

      const netDiffPct =
        criteriaTeacher > 0 ? Number(((diffTeacher / criteriaTeacher) * 100).toFixed(2)) : 0;
      const monthLabel =
        THAI_MONTHS.find((m) => m.value === monthNumber)?.label ?? String(monthNumber);

      const client = getSupabaseClient()!;

      const { data: existing } = await client
        .from('report_periods')
        .select('id')
        .eq('buddhist_year', buddhistYear)
        .eq('month_number', monthNumber)
        .maybeSingle();

      if (existing && !overwrite) {
        res.status(409).json({
          error: `มีข้อมูลประจำเดือน${monthLabel} พ.ศ. ${buddhistYear} อยู่ในฐานข้อมูลแล้ว`,
          exists: true,
        });
        return;
      }

      let periodRow: ReportPeriod;
      if (existing) {
        const { data: updated, error: updErr } = await client
          .from('report_periods')
          .update({
            month_label: monthLabel,
            period_note: periodNote,
            source_filename: sourceFilename,
            total_schools: records.length,
            total_students: totalStudents,
            total_classrooms: totalClassrooms,
            total_actual_staff: totalActualStaff,
            total_j18_calc: totalJ18Calc,
            total_criteria: totalCriteria,
            net_diff: netDiff,
            net_diff_pct: netDiffPct,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updErr || !updated) {
          throw new Error(updErr?.message || 'อัปเดตงวดข้อมูลไม่สำเร็จ');
        }
        periodRow = updated as ReportPeriod;

        const { error: delErr } = await client
          .from('school_staffing_records')
          .delete()
          .eq('period_id', periodRow.id);
        if (delErr) {
          throw new Error(delErr.message);
        }
      } else {
        const { data: inserted, error: insErr } = await client
          .from('report_periods')
          .insert({
            buddhist_year: buddhistYear,
            month_number: monthNumber,
            month_label: monthLabel,
            period_note: periodNote,
            source_filename: sourceFilename,
            total_schools: records.length,
            total_students: totalStudents,
            total_classrooms: totalClassrooms,
            total_actual_staff: totalActualStaff,
            total_j18_calc: totalJ18Calc,
            total_criteria: totalCriteria,
            net_diff: netDiff,
            net_diff_pct: netDiffPct,
          })
          .select()
          .single();

        if (insErr || !inserted) {
          throw new Error(insErr?.message || 'สร้างงวดข้อมูลใหม่ไม่สำเร็จ');
        }
        periodRow = inserted as ReportPeriod;
      }

      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize).map((r) => ({
          ...r,
          period_id: periodRow.id,
        }));
        const { error: recErr } = await client.from('school_staffing_records').insert(batch);
        if (recErr) {
          throw new Error(recErr.message);
        }
      }

      res.status(201).json({ period: periodRow });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'บันทึกข้อมูลลง Supabase ไม่สำเร็จ',
      });
    }
  });

  app.delete('/api/periods/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.status(503).json({ error: 'ไม่สามารถลบข้อมูลในโหมดตัวอย่างได้' });
        return;
      }

      if (!UUID_REGEX.test(id)) {
        res.status(400).json({ error: 'รหัสงวดข้อมูลไม่ถูกต้อง' });
        return;
      }

      const client = getSupabaseClient()!;
      const { error } = await client.from('report_periods').delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ลบงวดข้อมูลไม่สำเร็จ',
      });
    }
  });

  app.delete('/api/years/:year', async (req, res) => {
    try {
      const year = Number(req.params.year);
      const status = await checkSupabaseStatus();
      if (!status.tablesReady) {
        res.status(503).json({ error: 'ไม่สามารถลบข้อมูลในโหมดตัวอย่างได้' });
        return;
      }

      if (!Number.isInteger(year) || year < 2500 || year > 2700) {
        res.status(400).json({ error: 'ปี พ.ศ. ไม่ถูกต้อง' });
        return;
      }

      const client = getSupabaseClient()!;
      const { error } = await client
        .from('report_periods')
        .delete()
        .eq('buddhist_year', year);

      if (error) {
        throw new Error(error.message);
      }
      res.json({ ok: true, deletedYear: year });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'ลบข้อมูลรายปีไม่สำเร็จ',
      });
    }
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'ไม่พบ API Endpoint ที่ร้องขอ' });
  });

  return app;
}

const app = createApiApp();
export default app;
