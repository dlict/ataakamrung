import ExcelJS from 'exceljs';
import type { SchoolStaffingRecord } from '../types/staffing';

export interface ExportExcelOptions {
  periodLabel: string;
  periodNote?: string;
  districtFilter?: string;
}

const THIN_BLACK_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

const FILLS = {
  vacantGreen: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FF92D050' },
  },
  j18Teacher: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFDDD9C4' },
  },
  criteriaTeacher: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFFDE9D9' },
  },
  diffTeacher: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFFFFF99' },
  },
  realityBlue: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFDAEEF3' },
  },
  totalRow: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFF3F4F6' },
  },
};

const COL_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y',
] as const;

function buildSubtitleText(periodLabel: string, periodNote?: string): string {
  const note = (periodNote ?? '').trim();
  if (note) {
    return note.startsWith('ข้อมูล') ? note : `ข้อมูล ณ วันที่ ${note}`;
  }
  if (periodLabel) {
    return `งวด ${periodLabel}`;
  }
  return 'ข้อมูลล่าสุด';
}

export async function exportStaffingExcel(
  records: readonly SchoolStaffingRecord[],
  options: ExportExcelOptions
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'สพป.แม่ฮ่องสอน เขต 1';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('ปริมาณงานสถานศึกษา', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4 }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  // Column widths matching reference spreadsheet
  const maxSchoolNameLen = records.reduce(
    (max, r) => Math.max(max, r.school_name.length),
    18
  );
  const colWidths = [
    7, // A: ลำดับที่
    Math.min(Math.max(maxSchoolNameLen + 4, 24), 36), // B: ชื่อโรงเรียน
    13, // C: อำเภอ
    7, // D: นร.
    6, // E: ห้อง
    5.5, // F: ผอ. (คนครอง)
    5.5, // G: รอง
    5.5, // H: ครู
    5.5, // I: รวม
    5.5, // J: ว่าง
    5.5, // K: ผอ. (จ.18)
    5.5, // L: รอง
    5.5, // M: ครู
    5.5, // N: รวม
    5.5, // O: ผอ. (เกณฑ์)
    5.5, // P: รอง
    5.5, // Q: ครู
    5.5, // R: รวม
    5.5, // S: ผอ. (-ขาด +เกิน)
    5.5, // T: รอง
    5.5, // U: ครู
    5.5, // V: รวม
    10.5, // W: พรก. (ครูผู้สอน)
    11, // X: อัตราจ้าง (ครูผู้สอน)
    9.5, // Y: สภาพจริง
  ];
  colWidths.forEach((width, idx) => {
    sheet.getColumn(idx + 1).width = width;
  });

  // Row 1: Title
  const subtitle = buildSubtitleText(options.periodLabel, options.periodNote);
  const districtSuffix =
    options.districtFilter && options.districtFilter !== 'all'
      ? ` · อำเภอ${options.districtFilter}`
      : '';
  sheet.mergeCells('A1:Y1');
  const titleRow = sheet.getRow(1);
  titleRow.height = 28;
  const titleCell = sheet.getCell('A1');
  titleCell.value = `ปริมาณงานของสถานศึกษา สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาแม่ฮ่องสอน เขต 1 (${subtitle}${districtSuffix})`;
  titleCell.font = { name: 'Tahoma', size: 13, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Rows 2-4: Multi-level Merged Headers
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 24;
  sheet.getRow(4).height = 22;

  sheet.mergeCells('A2:A4');
  sheet.mergeCells('B2:B4');
  sheet.mergeCells('C2:C4');
  sheet.mergeCells('D2:E3');
  sheet.mergeCells('F2:V2');
  sheet.mergeCells('F3:I3');
  sheet.mergeCells('J3:J4');
  sheet.mergeCells('K3:N3');
  sheet.mergeCells('O3:R3');
  sheet.mergeCells('S3:V3');
  sheet.mergeCells('W2:W4');
  sheet.mergeCells('X2:X4');
  sheet.mergeCells('Y2:Y4');

  const headerCells: Array<[string, string]> = [
    ['A2', 'ลำดับที่'],
    ['B2', 'ชื่อโรงเรียน'],
    ['C2', 'อำเภอ'],
    ['D2', 'จำนวนนักเรียน'],
    ['D4', 'นร.'],
    ['E4', 'ห้อง'],
    ['F2', 'จำนวนครู'],
    ['F3', 'ครูมีตัวจริง (คนครอง)'],
    ['F4', 'ผอ.'],
    ['G4', 'รอง'],
    ['H4', 'ครู'],
    ['I4', 'รวม'],
    ['J3', 'ว่าง'],
    ['K3', 'ตาม จ.18 (บัญชีถือจ่าย)'],
    ['K4', 'ผอ.'],
    ['L4', 'รอง'],
    ['M4', 'ครู'],
    ['N4', 'รวม'],
    ['O3', 'ตามเกณฑ์ ก.ค.ศ.'],
    ['O4', 'ผอ.'],
    ['P4', 'รอง'],
    ['Q4', 'ครู'],
    ['R4', 'รวม'],
    ['S3', '- ขาด, +เกิน'],
    ['S4', 'ผอ.'],
    ['T4', 'รอง'],
    ['U4', 'ครู'],
    ['V4', 'รวม'],
    ['W2', 'พรก.\n(ครูผู้สอน)'],
    ['X2', 'อัตราจ้าง\n(ครูผู้สอน)'],
    ['Y2', 'สภาพจริง'],
  ];

  for (const [ref, text] of headerCells) {
    sheet.getCell(ref).value = text;
  }

  for (let r = 2; r <= 4; r++) {
    for (let c = 1; c <= 25; c++) {
      const cell = sheet.getCell(r, c);
      cell.font = { name: 'Tahoma', size: 10, bold: true, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = THIN_BLACK_BORDER;
    }
  }

  // Data rows start at Row 5
  const startRow = 5;
  const totals = {
    students: 0,
    classrooms: 0,
    actualDirector: 0,
    actualDeputy: 0,
    actualTeacher: 0,
    actualTotal: 0,
    vacantTeacher: 0,
    j18Director: 0,
    j18Deputy: 0,
    j18Teacher: 0,
    j18Total: 0,
    criteriaDirector: 0,
    criteriaDeputy: 0,
    criteriaTeacher: 0,
    criteriaTotal: 0,
    diffDirector: 0,
    diffDeputy: 0,
    diffTeacher: 0,
    diffTotal: 0,
    royalDecree: 0,
    contract: 0,
    reality: 0,
  };

  records.forEach((rec, index) => {
    const rowNum = startRow + index;
    const row = sheet.getRow(rowNum);
    row.height = 20;

    const vacantTeacher = rec.j18_paid_teacher - rec.actual_teacher;
    const vacantDisplay = vacantTeacher > 0 ? vacantTeacher : null;
    const realityValue =
      rec.diff_teacher + rec.royal_decree_teacher + rec.contract_teacher;

    totals.students += rec.students_count;
    totals.classrooms += rec.classrooms_count;
    totals.actualDirector += rec.actual_director;
    totals.actualDeputy += rec.actual_deputy;
    totals.actualTeacher += rec.actual_teacher;
    totals.actualTotal += rec.actual_total;
    if (vacantTeacher > 0) totals.vacantTeacher += vacantTeacher;
    totals.j18Director += rec.j18_paid_director;
    totals.j18Deputy += rec.j18_paid_deputy;
    totals.j18Teacher += rec.j18_paid_teacher;
    totals.j18Total += rec.j18_paid_total;
    totals.criteriaDirector += rec.criteria_director;
    totals.criteriaDeputy += rec.criteria_deputy;
    totals.criteriaTeacher += rec.criteria_teacher;
    totals.criteriaTotal += rec.criteria_total;
    totals.diffDirector += rec.diff_director;
    totals.diffDeputy += rec.diff_deputy;
    totals.diffTeacher += rec.diff_teacher;
    totals.diffTotal += rec.diff_total;
    totals.royalDecree += rec.royal_decree_teacher;
    totals.contract += rec.contract_teacher;
    totals.reality += realityValue;

    const rowValues: Array<ExcelJS.CellValue> = [
      index + 1,
      rec.school_name,
      rec.district,
      rec.students_count,
      rec.classrooms_count,
      rec.actual_director,
      rec.actual_deputy,
      rec.actual_teacher,
      rec.actual_total,
      vacantDisplay,
      rec.j18_paid_director,
      rec.j18_paid_deputy,
      rec.j18_paid_teacher,
      rec.j18_paid_total,
      rec.criteria_director,
      rec.criteria_deputy,
      rec.criteria_teacher,
      rec.criteria_total,
      rec.diff_director,
      rec.diff_deputy,
      rec.diff_teacher,
      rec.diff_total,
      rec.royal_decree_teacher,
      rec.contract_teacher,
      { formula: `U${rowNum}+W${rowNum}+X${rowNum}`, result: realityValue },
    ];

    rowValues.forEach((val, colIdx) => {
      const col = colIdx + 1;
      const cell = row.getCell(col);
      cell.value = val;
      cell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF000000' } };
      cell.border = THIN_BLACK_BORDER;
      cell.alignment = {
        horizontal: col === 2 ? 'left' : 'center',
        vertical: 'middle',
      };
      if (col >= 4) {
        cell.numFmt = '#,##0';
      }

      // Column-specific fills matching the reference layout
      if (col === 10 && vacantTeacher > 0) {
        cell.fill = FILLS.vacantGreen;
      } else if (col === 13) {
        cell.fill = FILLS.j18Teacher;
      } else if (col === 17) {
        cell.fill = FILLS.criteriaTeacher;
      } else if (col === 21) {
        cell.fill = FILLS.diffTeacher;
      } else if (col === 25) {
        cell.fill = FILLS.realityBlue;
      }
    });
  });

  // Summary row at bottom
  if (records.length > 0) {
    const lastDataRow = startRow + records.length - 1;
    const totalRowNum = lastDataRow + 1;
    const totalRow = sheet.getRow(totalRowNum);
    totalRow.height = 22;

    sheet.mergeCells(`A${totalRowNum}:C${totalRowNum}`);
    totalRow.getCell(1).value = `รวมทั้งหมด (${records.length} โรงเรียน)`;

    const cachedTotals: number[] = [
      totals.students,
      totals.classrooms,
      totals.actualDirector,
      totals.actualDeputy,
      totals.actualTeacher,
      totals.actualTotal,
      totals.vacantTeacher,
      totals.j18Director,
      totals.j18Deputy,
      totals.j18Teacher,
      totals.j18Total,
      totals.criteriaDirector,
      totals.criteriaDeputy,
      totals.criteriaTeacher,
      totals.criteriaTotal,
      totals.diffDirector,
      totals.diffDeputy,
      totals.diffTeacher,
      totals.diffTotal,
      totals.royalDecree,
      totals.contract,
      totals.reality,
    ];

    for (let col = 1; col <= 25; col++) {
      const cell = totalRow.getCell(col);
      if (col >= 4) {
        const letter = COL_LETTERS[col - 1];
        cell.value = {
          formula: `SUM(${letter}${startRow}:${letter}${lastDataRow})`,
          result: cachedTotals[col - 4],
        };
        cell.numFmt = '#,##0';
      }
      cell.font = { name: 'Tahoma', size: 10, bold: true, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = THIN_BLACK_BORDER;

      if (col === 13) {
        cell.fill = FILLS.j18Teacher;
      } else if (col === 17) {
        cell.fill = FILLS.criteriaTeacher;
      } else if (col === 21) {
        cell.fill = FILLS.diffTeacher;
      } else if (col === 25) {
        cell.fill = FILLS.realityBlue;
      } else {
        cell.fill = FILLS.totalRow;
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safePeriod = (options.periodLabel || 'ล่าสุด').replace(/\s+/g, '_');
  const safeDistrict =
    options.districtFilter && options.districtFilter !== 'all'
      ? `_${options.districtFilter.replace(/\s+/g, '_')}`
      : '';
  link.href = url;
  link.download = `ปริมาณงานสถานศึกษา_${safePeriod}${safeDistrict}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
