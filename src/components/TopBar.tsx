import { Upload } from 'lucide-react';
import type { ActiveTab } from '../types/staffing';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string }[] = [
  { id: 'overview', label: 'ภาพรวม' },
  { id: 'schools', label: 'รายชื่อโรงเรียน' },
  { id: 'student-breakdowns', label: 'นักเรียนแยกชั้น' },
  { id: 'workload', label: 'ปริมาณงานสถานศึกษา' },
  { id: 'compare-schools', label: 'เทียบโรงเรียน' },
  { id: 'compare', label: 'เทียบรายงวด' },
];

export function TopBar({ activeTab, onTabChange, onOpenUpload }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="text-left text-base font-semibold tracking-tight text-[#111827] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
        >
          อัตรากำลัง สพป.มส.1
        </button>

        <nav
          aria-label="หลัก"
          className="hidden md:flex items-center gap-3.5 lg:gap-5 text-[15px] font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative py-5 text-[15px] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] ${
                  isActive
                    ? 'font-semibold text-[#111827]'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[#1E3A8A]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#1E40AF] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>นำเข้าไฟล์ CSV</span>
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="เมนูมือถือ"
        className="flex md:hidden overflow-x-auto border-t border-[#F3F4F6] bg-white px-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex-1 px-2 py-2.5 text-center text-[13px] transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'font-semibold text-[#1E3A8A]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 bottom-0 h-[2px] bg-[#1E3A8A]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
