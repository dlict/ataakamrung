import ExcelJS from 'exceljs';
import type { SchoolStaffingRecord } from '../types/staffing';
import { buildGroupedRowsWithBranchTotals } from './branchGrouping';

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
  branchSubtotal: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFFFF2CC' },
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

// Leaf columns summed vertically with SUBTOTAL(9, ...); derived columns I, N, R, S..V, Y use row-level formulas
const SUBTOTAL_LEAF_COLS = new Set([4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 23, 24]);

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

function buildRowDerivedCellValue(
  col: number,
  rowNum: number,
  cachedResult: number
): ExcelJS.CellValue | undefined {
  switch (col) {
    case 9:
      return { formula: `SUM(F${rowNum}:H${rowNum})`, result: cachedResult };
    case 14:
      return { formula: `SUM(K${rowNum}:M${rowNum})`, result: cachedResult };
    case 18:
      return { formula: `SUM(O${rowNum}:Q${rowNum})`, result: cachedResult };
    case 19:
      return { formula: `K${rowNum}-O${rowNum}`, result: cachedResult };
    case 20:
      return { formula: `L${rowNum}-P${rowNum}`, result: cachedResult };
    case 21:
      return { formula: `M${rowNum}-Q${rowNum}`, result: cachedResult };
    case 22:
      return { formula: `SUM(S${rowNum}:U${rowNum})`, result: cachedResult };
    case 25:
      return { formula: `U${rowNum}+W${rowNum}+X${rowNum}`, result: cachedResult };
    default:
      return undefined;
  }
}

export async function exportStaffingExcel(
  records: readonly SchoolStaffingRecord[],
  options: ExportExcelOptions
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'สพป.แม่ฮ่องสอน เขต 1';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

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

  const groupedRows = buildGroupedRowsWithBranchTotals(records, true);

  // Column widths matching reference spreadsheet
  const maxSchoolNameLen = groupedRows.reduce((max, item) => {
    const name = item.kind === 'school' ? item.record.school_name : item.combined.school_name;
    return Math.max(max, name.length);
  }, 18);
  const colWidths = [
    7, // A: ลำดับที่
    Math.min(Math.max(maxSchoolNameLen + 4, 24), 40), // B: ชื่อโรงเรียน
    14, // C: อำเภอ
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
  let currentRowNum = startRow;
  let schoolSeq = 0;
  let currentGroupStartRow = startRow;

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

  for (const item of groupedRows) {
    const rowNum = currentRowNum++;
    const row = sheet.getRow(rowNum);

    if (item.kind === 'school') {
      const rec = item.record;
      schoolSeq += 1;
      if (item.role === 'main') {
        currentGroupStartRow = rowNum;
      }
      row.height = 20;

      const actualTotal = rec.actual_director + rec.actual_deputy + rec.actual_teacher;
      const vacantTeacher = Math.max(0, rec.j18_paid_teacher - rec.actual_teacher);
      const j18Total = rec.j18_paid_director + rec.j18_paid_deputy + rec.j18_paid_teacher;
      const criteriaTotal = rec.criteria_director + rec.criteria_deputy + rec.criteria_teacher;
      const diffDirector = rec.j18_paid_director - rec.criteria_director;
      const diffDeputy = rec.j18_paid_deputy - rec.criteria_deputy;
      const diffTeacher = rec.j18_paid_teacher - rec.criteria_teacher;
      const diffTotal = diffDirector + diffDeputy + diffTeacher;
      const realityValue =
        diffTeacher + rec.royal_decree_teacher + rec.contract_teacher;

      totals.students += rec.students_count;
      totals.classrooms += rec.classrooms_count;
      totals.actualDirector += rec.actual_director;
      totals.actualDeputy += rec.actual_deputy;
      totals.actualTeacher += rec.actual_teacher;
      totals.actualTotal += actualTotal;
      totals.vacantTeacher += vacantTeacher;
      totals.j18Director += rec.j18_paid_director;
      totals.j18Deputy += rec.j18_paid_deputy;
      totals.j18Teacher += rec.j18_paid_teacher;
      totals.j18Total += j18Total;
      totals.criteriaDirector += rec.criteria_director;
      totals.criteriaDeputy += rec.criteria_deputy;
      totals.criteriaTeacher += rec.criteria_teacher;
      totals.criteriaTotal += criteriaTotal;
      totals.diffDirector += diffDirector;
      totals.diffDeputy += diffDeputy;
      totals.diffTeacher += diffTeacher;
      totals.diffTotal += diffTotal;
      totals.royalDecree += rec.royal_decree_teacher;
      totals.contract += rec.contract_teacher;
      totals.reality += realityValue;

      const rowValues: Array<ExcelJS.CellValue> = [
        schoolSeq,
        rec.school_name,
        rec.district,
        rec.students_count,
        rec.classrooms_count,
        rec.actual_director,
        rec.actual_deputy,
        rec.actual_teacher,
        { formula: `SUM(F${rowNum}:H${rowNum})`, result: actualTotal },
        {
          formula: `IF(M${rowNum}-H${rowNum}>0,M${rowNum}-H${rowNum},"")`,
          result: vacantTeacher > 0 ? vacantTeacher : '',
        },
        rec.j18_paid_director,
        rec.j18_paid_deputy,
        rec.j18_paid_teacher,
        { formula: `SUM(K${rowNum}:M${rowNum})`, result: j18Total },
        rec.criteria_director,
        rec.criteria_deputy,
        rec.criteria_teacher,
        { formula: `SUM(O${rowNum}:Q${rowNum})`, result: criteriaTotal },
        { formula: `K${rowNum}-O${rowNum}`, result: diffDirector },
        { formula: `L${rowNum}-P${rowNum}`, result: diffDeputy },
        { formula: `M${rowNum}-Q${rowNum}`, result: diffTeacher },
        { formula: `SUM(S${rowNum}:U${rowNum})`, result: diffTotal },
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
    } else {
      // Branch group subtotal row: leaf cols use SUBTOTAL(9,...), derived cols use row formulas
      const c = item.combined;
      const firstGroupRow = currentGroupStartRow;
      const lastGroupRow = rowNum - 1;
      row.height = 21;

      const groupActualTotal = c.actual_director + c.actual_deputy + c.actual_teacher;
      const groupVacantTeacher = [item.mainSchool, ...item.branches].reduce(
        (sum, r) => sum + Math.max(0, r.j18_paid_teacher - r.actual_teacher),
        0
      );
      const groupJ18Total = c.j18_paid_director + c.j18_paid_deputy + c.j18_paid_teacher;
      const groupCriteriaTotal = c.criteria_director + c.criteria_deputy + c.criteria_teacher;
      const groupDiffDirector = c.j18_paid_director - c.criteria_director;
      const groupDiffDeputy = c.j18_paid_deputy - c.criteria_deputy;
      const groupDiffTeacher = c.j18_paid_teacher - c.criteria_teacher;
      const groupDiffTotal = groupDiffDirector + groupDiffDeputy + groupDiffTeacher;
      const groupReality =
        groupDiffTeacher + c.royal_decree_teacher + c.contract_teacher;

      const cachedGroupValues: number[] = [
        c.students_count,
        c.classrooms_count,
        c.actual_director,
        c.actual_deputy,
        c.actual_teacher,
        groupActualTotal,
        groupVacantTeacher,
        c.j18_paid_director,
        c.j18_paid_deputy,
        c.j18_paid_teacher,
        groupJ18Total,
        c.criteria_director,
        c.criteria_deputy,
        c.criteria_teacher,
        groupCriteriaTotal,
        groupDiffDirector,
        groupDiffDeputy,
        groupDiffTeacher,
        groupDiffTotal,
        c.royal_decree_teacher,
        c.contract_teacher,
        groupReality,
      ];

      row.getCell(1).value = 'รวม';
      row.getCell(2).value = c.school_name;
      row.getCell(3).value = c.district;

      for (let col = 1; col <= 25; col++) {
        const cell = row.getCell(col);
        if (col >= 4) {
          const cachedVal = cachedGroupValues[col - 4];
          if (SUBTOTAL_LEAF_COLS.has(col)) {
            const letter = COL_LETTERS[col - 1];
            cell.value = {
              formula: `SUBTOTAL(9,${letter}${firstGroupRow}:${letter}${lastGroupRow})`,
              result: cachedVal,
            };
          } else {
            cell.value = buildRowDerivedCellValue(col, rowNum, cachedVal) ?? cachedVal;
          }
          cell.numFmt = col === 10 ? '#,##0;-#,##0;""' : '#,##0';
        }

        cell.font = { name: 'Tahoma', size: 10, bold: true, color: { argb: 'FF000000' } };
        cell.border = THIN_BLACK_BORDER;
        cell.alignment = {
          horizontal: col === 2 ? 'left' : 'center',
          vertical: 'middle',
        };

        if (col === 10 && groupVacantTeacher > 0) {
          cell.fill = FILLS.vacantGreen;
        } else if (col === 13) {
          cell.fill = FILLS.j18Teacher;
        } else if (col === 17) {
          cell.fill = FILLS.criteriaTeacher;
        } else if (col === 21) {
          cell.fill = FILLS.diffTeacher;
        } else if (col === 25) {
          cell.fill = FILLS.realityBlue;
        } else {
          cell.fill = FILLS.branchSubtotal;
        }
      }
    }
  }

  // Grand total row at bottom (SUBTOTAL(9,...) skips nested branch subtotal rows)
  if (records.length > 0) {
    const lastDataRow = currentRowNum - 1;
    const totalRowNum = currentRowNum;
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
        const cachedVal = cachedTotals[col - 4];
        if (SUBTOTAL_LEAF_COLS.has(col)) {
          const letter = COL_LETTERS[col - 1];
          cell.value = {
            formula: `SUBTOTAL(9,${letter}${startRow}:${letter}${lastDataRow})`,
            result: cachedVal,
          };
        } else {
          cell.value = buildRowDerivedCellValue(col, totalRowNum, cachedVal) ?? cachedVal;
        }
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

    // Dynamic green conditional highlight on column J (ว่าง) whenever J > 0 or becomes empty after user edits H or M
    sheet.addConditionalFormatting({
      ref: `J${startRow}:J${lastDataRow}`,
      rules: [
        {
          type: 'expression',
          priority: 1,
          formulae: [`AND(ISNUMBER(J${startRow}),J${startRow}>0)`],
          style: {
            fill: FILLS.vacantGreen,
          },
        },
        {
          type: 'expression',
          priority: 2,
          formulae: [`J${startRow}=""`],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' },
            },
          },
        },
      ],
    });
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
