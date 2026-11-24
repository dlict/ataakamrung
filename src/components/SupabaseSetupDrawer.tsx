import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import type { SupabaseStatus } from '../types/staffing';

interface SupabaseSetupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: SupabaseStatus | null;
  onRefreshStatus: () => void;
}

export function SupabaseSetupDrawer({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
}: SupabaseSetupDrawerProps) {
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/schema-sql')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.sql === 'string') setSchemaSql(data.sql);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleCopy() {
    if (!schemaSql) return;
    try {
      await navigator.clipboard.writeText(schemaSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#111827]/30 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="การเชื่อมต่อฐานข้อมูล Supabase"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#111827]">
            การเชื่อมต่อฐานข้อมูล Supabase
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 text-sm">
          <div className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[#111827]">สถานะปัจจุบัน</span>
              <button
                type="button"
                onClick={onRefreshStatus}
                className="font-medium text-[#1E3A8A] hover:underline"
              >
                ตรวจสอบอีกครั้ง
              </button>
            </div>
            <p className="mt-1.5 text-[#374151]">{status?.message}</p>
            {status?.diagnostic && (
              <div className="mt-3 space-y-1 border-t border-[#E5E7EB] pt-2.5 text-xs text-[#4B5563]">
                <div>• URL: {status.diagnostic.urlNote}</div>
                <div>
                  • Key: {status.diagnostic.keySource} ({status.diagnostic.keyKind})
                </div>
                {status.diagnostic.errorDetail && (
                  <div className="text-[#B91C1C]">
                    • รายละเอียดจาก Supabase: [{status.diagnostic.httpStatus ?? status.diagnostic.errorCode ?? 'ERR'}] {status.diagnostic.errorDetail}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <h3 className="text-[15px] font-semibold text-[#111827]">
              1. ตั้งค่า Environment Variables (Secrets)
            </h3>
            <p className="text-[#4B5563] leading-relaxed">
              เพื่อความปลอดภัยสูงสุด คีย์เชื่อมต่อฐานข้อมูลจะถูกอ่านจากฝั่งเซิร์ฟเวอร์เท่านั้น กรุณากำหนดค่าตัวแปรในเมนู
              Secrets ของโปรเจกต์:
            </p>
            <div className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-3 font-mono-num text-[13px] text-[#111827]">
              <div>SUPABASE_URL=https://your-project.supabase.co</div>
              <div className="mt-1">SUPABASE_SERVICE_ROLE_KEY=sb_secret_... หรือ service_role (eyJ...)</div>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              ไปที่ Supabase Dashboard → <span className="font-medium text-[#374151]">Project Settings → API Keys</span> แล้วคัดลอก{' '}
              <span className="font-medium text-[#374151]">Secret key (ขึ้นต้นด้วย sb_secret_...)</span>{' '}
              หรือแท็บ <span className="font-medium text-[#374151]">Legacy anon, service_role API keys → service_role</span>{' '}
              (ห้ามใช้ Publishable key ที่ขึ้นต้นด้วย sb_publishable_... เพราะจะติดสิทธิ์ 401/42501)
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#111827]">
                2. สร้างตารางใน Supabase SQL Editor
              </h3>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!schemaSql}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#0F766E]" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#6B7280]" />
                    <span>คัดลอก SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[#4B5563]">
              นำคำสั่ง SQL ด้านล่างไปวางและกด Run ในหน้า SQL Editor ของโปรเจกต์ Supabase
              (เมื่อสร้างตารางเสร็จแล้ว ระบบจะนำเข้าข้อมูลตั้งต้นจากไฟล์ CSV แรกให้โดยอัตโนมัติ)
            </p>
            <pre className="max-h-72 overflow-auto rounded-md border border-[#E5E7EB] bg-[#111827] p-3.5 font-mono-num text-[13px] leading-relaxed text-[#F3F4F6]">
              {schemaSql || 'กำลังโหลด...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
