import ExcelJS from 'exceljs';
import type { SchoolStaffingRecord } from '../types/staffing';
import {
  buildExcelRoomFormula,
  computeRoomsForGrade,
  computeWorkloadTotals,
  formatSchoolFullName,
  LOWER_SECONDARY_GRADES,
  PRE_PRIMARY_GRADES,
  PRIMARY_GRADES,
  UPPER_SECONDARY_GRADES,
  type GradeCountsMap,
  type GradeKey,
  type WorkloadSignOffMeta,
  type WorkloadStaffingInput,
} from './workloadFormTypes';

const FONT_NAME = 'TH Sarabun New';

const THIN_BLACK: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: 'FF000000' },
};

const DOTTED_BLACK: Partial<ExcelJS.Border> = {
  style: 'dotted',
  color: { argb: 'FF000000' },
};

const FILLS = {
  headerBlue: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFB7DEE8' },
  },
  formulaYellow: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFFFFF00' },
  },
};

export interface ExportWorkloadExcelParams {
  school: SchoolStaffingRecord;
  grades: GradeCountsMap;
  staffing: WorkloadStaffingInput;
  meta: WorkloadSignOffMeta;
}

export async function exportWorkloadExcel({
  school,
  grades,
  staffing,
  meta,
}: ExportWorkloadExcelParams): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'สพป.แม่ฮ่องสอน เขต 1';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const sheet = workbook.addWorksheet('ปริมาณงานสถานศึกษา', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.35,
        right: 0.35,
        top: 0.35,
        bottom: 0.35,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  // Column widths calibrated for TH Sarabun New 15-16pt (A..J)
  const widths = [2.5, 4.5, 25, 11.5, 11.5, 10, 12.5, 10.5, 11.5, 11.5];
  widths.forEach((w, idx) => {
    sheet.getColumn(idx + 1).width = w;
  });

  const totals = computeWorkloadTotals(grades);

  // Row 2: Light Blue Title Banner
  sheet.getRow(1).height = 8;
  sheet.getRow(2).height = 30;
  sheet.mergeCells('B2:J2');
  const titleCell = sheet.getCell('B2');
  titleCell.value = 'แบบรายงานปริมาณงานของสถานศึกษา';
  titleCell.font = { name: FONT_NAME, size: 18, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = FILLS.headerBlue;

  // Row 4-5: School Identity
  sheet.getRow(3).height = 8;
  sheet.getRow(4).height = 24;
  sheet.getRow(5).height = 24;
  sheet.getRow(6).height = 8;

  sheet.getCell('B4').value = '1.';
  sheet.getCell('B4').font = { name: FONT_NAME, size: 16 };
  sheet.getCell('B4').alignment = { horizontal: 'right', vertical: 'middle' };

  sheet.getCell('C4').value = formatSchoolFullName(school.school_name);
  sheet.getCell('C4').font = { name: FONT_NAME, size: 16, bold: false };
  sheet.getCell('C4').alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('E4:F4');
  sheet.getCell('E4').value = `ตำบล${school.subdistrict || '-'}`;
  sheet.getCell('E4').font = { name: FONT_NAME, size: 16 };
  sheet.getCell('E4').alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('H4:J4');
  sheet.getCell('H4').value = `อำเภอ${school.district || '-'}`;
  sheet.getCell('H4').font = { name: FONT_NAME, size: 16 };
  sheet.getCell('H4').alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.getCell('C5').value = `จังหวัด${school.province || 'แม่ฮ่องสอน'}`;
  sheet.getCell('C5').font = { name: FONT_NAME, size: 16 };
  sheet.getCell('C5').alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('E5:J5');
  sheet.getCell('E5').value = 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาแม่ฮ่องสอน เขต 1';
  sheet.getCell('E5').font = { name: FONT_NAME, size: 16 };
  sheet.getCell('E5').alignment = { horizontal: 'left', vertical: 'middle' };

  // Row 7: Section 2 Header
  sheet.getRow(7).height = 24;
  sheet.mergeCells('B7:J7');
  sheet.getCell('B7').value = '2. รายละเอียดเกี่ยวกับห้องเรียนและนักเรียน';
  sheet.getCell('B7').font = { name: FONT_NAME, size: 16 };
  sheet.getCell('B7').alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.getRow(8).height = 6;

  // Row 9: Side-by-side Table Headers
  sheet.getRow(9).height = 40;
  sheet.getCell('C9').value = 'ชั้นเรียน';
  sheet.getCell('D9').value = 'จำนวน\nนักเรียน';
  sheet.getCell('E9').value = 'จำนวน\nห้องเรียน';

  sheet.mergeCells('G9:H9');
  sheet.getCell('G9').value = 'ชั้นเรียน';
  sheet.getCell('I9').value = 'จำนวน\nนักเรียน';
  sheet.getCell('J9').value = 'จำนวน\nห้องเรียน';

  for (const col of [3, 4, 5, 7, 8, 9, 10]) {
    const cell = sheet.getCell(9, col);
    cell.font = { name: FONT_NAME, size: 15, bold: true, color: { argb: 'FF000000' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
  }

  // Left Table Data (Rows 10-21)
  const leftRows: Array<
    | {
        type: 'grade';
        key: GradeKey;
        rowNum: number;
        label: string;
        students: number;
        rooms: number;
        basePerRoom: number;
        remainderThreshold: number;
        isFirst?: boolean;
        isLast?: boolean;
      }
    | { type: 'sum'; rowNum: number; label: string; stuFormula: string; roomFormula: string; students: number; rooms: number }
  > = [
    ...PRE_PRIMARY_GRADES.map((g, idx) => ({
      type: 'grade' as const,
      key: g.key,
      rowNum: 10 + idx,
      label: g.label,
      students: grades[g.key].students,
      rooms: grades[g.key].rooms,
      basePerRoom: g.basePerRoom,
      remainderThreshold: g.remainderThreshold,
      isFirst: idx === 0,
      isLast: idx === PRE_PRIMARY_GRADES.length - 1,
    })),
    {
      type: 'sum',
      rowNum: 13,
      label: 'รวมก่อนประถมศึกษา',
      stuFormula: 'SUM(D10:D12)',
      roomFormula: 'SUM(E10:E12)',
      students: totals.prePrimary.students,
      rooms: totals.prePrimary.rooms,
    },
    ...PRIMARY_GRADES.map((g, idx) => ({
      type: 'grade' as const,
      key: g.key,
      rowNum: 14 + idx,
      label: g.label,
      students: grades[g.key].students,
      rooms: grades[g.key].rooms,
      basePerRoom: g.basePerRoom,
      remainderThreshold: g.remainderThreshold,
      isFirst: idx === 0,
      isLast: idx === PRIMARY_GRADES.length - 1,
    })),
    {
      type: 'sum',
      rowNum: 20,
      label: 'รวมประถมศึกษา',
      stuFormula: 'SUM(D14:D19)',
      roomFormula: 'SUM(E14:E19)',
      students: totals.primary.students,
      rooms: totals.primary.rooms,
    },
    {
      type: 'sum',
      rowNum: 21,
      label: 'รวมประถมศึกษาทั้งสิ้น',
      stuFormula: 'D13+D20',
      roomFormula: 'E13+E20',
      students: totals.primaryAll.students,
      rooms: totals.primaryAll.rooms,
    },
  ];

  for (const item of leftRows) {
    sheet.getRow(item.rowNum).height = 22;
    const cLabel = sheet.getCell(item.rowNum, 3);
    const cStu = sheet.getCell(item.rowNum, 4);
    const cRoom = sheet.getCell(item.rowNum, 5);

    if (item.type === 'grade') {
      cLabel.value = item.label;
      cStu.value = item.students;
      const autoRooms = computeRoomsForGrade(item.key, item.students);
      cRoom.value =
        item.rooms === autoRooms
          ? {
              formula: buildExcelRoomFormula(
                `D${item.rowNum}`,
                item.basePerRoom,
                item.remainderThreshold
              ),
              result: item.rooms,
            }
          : item.rooms;

      const topBorder = item.isFirst ? THIN_BLACK : DOTTED_BLACK;
      const bottomBorder = item.isLast ? THIN_BLACK : DOTTED_BLACK;

      [cLabel, cStu, cRoom].forEach((cell) => {
        cell.font = { name: FONT_NAME, size: 15 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: topBorder,
          bottom: bottomBorder,
          left: THIN_BLACK,
          right: THIN_BLACK,
        };
      });
      cStu.numFmt = '#,##0';
      cRoom.numFmt = '#,##0';
      cRoom.fill = FILLS.formulaYellow;
    } else {
      cLabel.value = item.label;
      cStu.value = { formula: item.stuFormula, result: item.students };
      cRoom.value = { formula: item.roomFormula, result: item.rooms };

      [cLabel, cStu, cRoom].forEach((cell) => {
        cell.font = { name: FONT_NAME, size: 15, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = FILLS.formulaYellow;
        cell.border = {
          top: THIN_BLACK,
          bottom: THIN_BLACK,
          left: THIN_BLACK,
          right: THIN_BLACK,
        };
      });
      cStu.numFmt = '#,##0';
      cRoom.numFmt = '#,##0';
    }
  }

  // Right Table Data (Rows 10-19)
  const rightRows: Array<
    | {
        type: 'grade';
        key: GradeKey;
        rowNum: number;
        label: string;
        students: number;
        rooms: number;
        basePerRoom: number;
        remainderThreshold: number;
        isFirst?: boolean;
        isLast?: boolean;
      }
    | { type: 'sum'; rowNum: number; label: string; stuFormula: string; roomFormula: string; students: number; rooms: number }
  > = [
    ...LOWER_SECONDARY_GRADES.map((g, idx) => ({
      type: 'grade' as const,
      key: g.key,
      rowNum: 10 + idx,
      label: g.label,
      students: grades[g.key].students,
      rooms: grades[g.key].rooms,
      basePerRoom: g.basePerRoom,
      remainderThreshold: g.remainderThreshold,
      isFirst: idx === 0,
      isLast: idx === LOWER_SECONDARY_GRADES.length - 1,
    })),
    {
      type: 'sum',
      rowNum: 13,
      label: 'รวมมัธยมต้น',
      stuFormula: 'SUM(I10:I12)',
      roomFormula: 'SUM(J10:J12)',
      students: totals.lowerSec.students,
      rooms: totals.lowerSec.rooms,
    },
    ...UPPER_SECONDARY_GRADES.map((g, idx) => ({
      type: 'grade' as const,
      key: g.key,
      rowNum: 14 + idx,
      label: g.label,
      students: grades[g.key].students,
      rooms: grades[g.key].rooms,
      basePerRoom: g.basePerRoom,
      remainderThreshold: g.remainderThreshold,
      isFirst: idx === 0,
      isLast: idx === UPPER_SECONDARY_GRADES.length - 1,
    })),
    {
      type: 'sum',
      rowNum: 17,
      label: 'รวมมัธยมปลาย',
      stuFormula: 'SUM(I14:I16)',
      roomFormula: 'SUM(J14:J16)',
      students: totals.upperSec.students,
      rooms: totals.upperSec.rooms,
    },
    {
      type: 'sum',
      rowNum: 18,
      label: 'รวมมัธยมศึกษาทั้งสิ้น',
      stuFormula: 'I13+I17',
      roomFormula: 'J13+J17',
      students: totals.secondaryAll.students,
      rooms: totals.secondaryAll.rooms,
    },
    {
      type: 'sum',
      rowNum: 19,
      label: 'รวมทั้งสิ้น',
      stuFormula: 'D21+I18',
      roomFormula: 'E21+J18',
      students: totals.grandTotal.students,
      rooms: totals.grandTotal.rooms,
    },
  ];

  for (const item of rightRows) {
    sheet.mergeCells(`G${item.rowNum}:H${item.rowNum}`);
    const cLabelG = sheet.getCell(item.rowNum, 7);
    const cLabelH = sheet.getCell(item.rowNum, 8);
    const cStu = sheet.getCell(item.rowNum, 9);
    const cRoom = sheet.getCell(item.rowNum, 10);

    if (item.type === 'grade') {
      cLabelG.value = item.label;
      cStu.value = item.students;
      const autoRooms = computeRoomsForGrade(item.key, item.students);
      cRoom.value =
        item.rooms === autoRooms
          ? {
              formula: buildExcelRoomFormula(
                `I${item.rowNum}`,
                item.basePerRoom,
                item.remainderThreshold
              ),
              result: item.rooms,
            }
          : item.rooms;

      const topBorder = item.isFirst ? THIN_BLACK : DOTTED_BLACK;
      const bottomBorder = item.isLast ? THIN_BLACK : DOTTED_BLACK;

      [cLabelG, cLabelH, cStu, cRoom].forEach((cell) => {
        cell.font = { name: FONT_NAME, size: 15 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: topBorder,
          bottom: bottomBorder,
          left: THIN_BLACK,
          right: THIN_BLACK,
        };
      });
      cStu.numFmt = '#,##0';
      cRoom.numFmt = '#,##0';
      cRoom.fill = FILLS.formulaYellow;
    } else {
      cLabelG.value = item.label;
      cStu.value = { formula: item.stuFormula, result: item.students };
      cRoom.value = { formula: item.roomFormula, result: item.rooms };

      [cLabelG, cLabelH, cStu, cRoom].forEach((cell) => {
        cell.font = { name: FONT_NAME, size: 15, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = FILLS.formulaYellow;
        cell.border = {
          top: THIN_BLACK,
          bottom: THIN_BLACK,
          left: THIN_BLACK,
          right: THIN_BLACK,
        };
      });
      cStu.numFmt = '#,##0';
      cRoom.numFmt = '#,##0';
    }
  }

  // Row 22 spacer & Row 23 Section 3 Header
  sheet.getRow(22).height = 10;
  sheet.getRow(23).height = 24;
  sheet.mergeCells('B23:J23');
  sheet.getCell('B23').value = '3. อัตรากำลังข้าราชการครูฯ';
  sheet.getCell('B23').font = { name: FONT_NAME, size: 16 };
  sheet.getCell('B23').alignment = { horizontal: 'left', vertical: 'middle' };

  // Rows 24-27: Teacher Staffing Table
  sheet.getRow(24).height = 38;
  sheet.getRow(25).height = 23;
  sheet.getRow(26).height = 23;
  sheet.getRow(27).height = 23;

  const s3Headers: Array<[number, string]> = [
    [4, 'ผอ.\nสถานศึกษา'],
    [5, 'รอง ผอ.\nสถานศึกษา'],
    [6, 'ครูผู้สอน'],
    [7, 'รวม'],
  ];
  for (const [col, label] of s3Headers) {
    const cell = sheet.getCell(24, col);
    cell.value = label;
    cell.font = { name: FONT_NAME, size: 15, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
  }

  const j18Total = staffing.j18Director + staffing.j18Deputy + staffing.j18Teacher;
  const criteriaTotal =
    staffing.criteriaDirector + staffing.criteriaDeputy + staffing.criteriaTeacher;
  const diffDir = staffing.j18Director - staffing.criteriaDirector;
  const diffDep = staffing.j18Deputy - staffing.criteriaDeputy;
  const diffTea = staffing.j18Teacher - staffing.criteriaTeacher;
  const diffTot = diffDir + diffDep + diffTea;

  // Row 25: ครูตาม จ.18
  sheet.getCell('C25').value = 'ครูตาม จ.18';
  sheet.getCell('C25').font = { name: FONT_NAME, size: 15 };
  sheet.getCell('C25').alignment = { horizontal: 'left', vertical: 'middle' };
  const row25Vals: ExcelJS.CellValue[] = [
    staffing.j18Director,
    staffing.j18Deputy,
    staffing.j18Teacher,
    { formula: 'SUM(D25:F25)', result: j18Total },
  ];
  row25Vals.forEach((val, idx) => {
    const cell = sheet.getCell(25, 4 + idx);
    cell.value = val;
    cell.font = { name: FONT_NAME, size: 15, bold: idx === 3 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.numFmt = '#,##0';
    cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
    if (idx === 3) cell.fill = FILLS.formulaYellow;
  });

  // Row 26: ครูตามเกณฑ์
  sheet.getCell('C26').value = 'ครูตามเกณฑ์';
  sheet.getCell('C26').font = { name: FONT_NAME, size: 15 };
  sheet.getCell('C26').alignment = { horizontal: 'left', vertical: 'middle' };
  const row26Vals: ExcelJS.CellValue[] = [
    staffing.criteriaDirector,
    staffing.criteriaDeputy,
    staffing.criteriaTeacher,
    { formula: 'SUM(D26:F26)', result: criteriaTotal },
  ];
  row26Vals.forEach((val, idx) => {
    const cell = sheet.getCell(26, 4 + idx);
    cell.value = val;
    cell.font = { name: FONT_NAME, size: 15, bold: idx === 3 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.numFmt = '#,##0';
    cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
    if (idx === 0 || idx === 1 || idx === 3) {
      cell.fill = FILLS.formulaYellow;
    }
  });

  // Row 27: -ขาด/+เกิน
  sheet.getCell('C27').value = '-ขาด/+เกิน';
  sheet.getCell('C27').font = { name: FONT_NAME, size: 15 };
  sheet.getCell('C27').alignment = { horizontal: 'left', vertical: 'middle' };
  const row27Vals: ExcelJS.CellValue[] = [
    { formula: 'D25-D26', result: diffDir },
    { formula: 'E25-E26', result: diffDep },
    { formula: 'F25-F26', result: diffTea },
    { formula: 'SUM(D27:F27)', result: diffTot },
  ];
  row27Vals.forEach((val, idx) => {
    const cell = sheet.getCell(27, 4 + idx);
    cell.value = val;
    cell.font = { name: FONT_NAME, size: 15, bold: idx === 3 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.numFmt = '#,##0';
    cell.fill = FILLS.formulaYellow;
    cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
  });

  // Row 28 spacer
  sheet.getRow(28).height = 14;

  // Rows 29-33: Certification Box (G29:J33)
  sheet.getRow(29).height = 23;
  sheet.getRow(30).height = 26;
  sheet.getRow(31).height = 22;
  sheet.getRow(32).height = 22;
  sheet.getRow(33).height = 42;

  sheet.mergeCells('G29:J29');
  sheet.getCell('G29').value = 'ขอรับรองว่าข้อมูลถูกต้อง';
  sheet.mergeCells('G30:J30');
  sheet.mergeCells('G31:J31');
  sheet.getCell('G31').value = 'ลงชื่อ ..................................................';
  sheet.mergeCells('G32:J32');
  sheet.getCell('G32').value = `(${meta.signerName})`;
  sheet.mergeCells('G33:J33');
  sheet.getCell('G33').value = `ตำแหน่ง ${meta.signerPosition}\n${meta.signDate}`;

  for (let r = 29; r <= 33; r++) {
    for (let c = 7; c <= 10; c++) {
      const cell = sheet.getCell(r, c);
      cell.font = { name: FONT_NAME, size: 15, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: r === 29 ? THIN_BLACK : undefined,
        bottom: r === 33 ? THIN_BLACK : undefined,
        left: c === 7 ? THIN_BLACK : undefined,
        right: c === 10 ? THIN_BLACK : undefined,
      };
    }
  }

  // Row 34: Yellow Formula Legend
  sheet.getRow(34).height = 22;
  const legendBox = sheet.getCell('C34');
  legendBox.fill = FILLS.formulaYellow;
  legendBox.border = {
    top: THIN_BLACK,
    bottom: THIN_BLACK,
    left: THIN_BLACK,
    right: THIN_BLACK,
  };
  sheet.mergeCells('D34:G34');
  const legendText = sheet.getCell('D34');
  legendText.value = 'คือ แถบสูตรการคำนวณ ห้ามลบหรือแก้ไข';
  legendText.font = { name: FONT_NAME, size: 15, color: { argb: 'FF000000' } };
  legendText.alignment = { horizontal: 'left', vertical: 'middle' };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanName = school.school_name.replace(/\s+/g, '_');
  link.href = url;
  link.download = `แบบรายงานปริมาณงาน_${cleanName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
