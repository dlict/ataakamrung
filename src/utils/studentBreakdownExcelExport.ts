import ExcelJS from 'exceljs';
import type { SchoolStudentBreakdown } from '../types/staffing';

const FONT_NAME = 'TH Sarabun New';

const THIN_BLACK: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: 'FF000000' },
};

export async function exportStudentBreakdownExcel(
  records: SchoolStudentBreakdown[],
  semesterLabel: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'สพป.แม่ฮ่องสอน เขต 1';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const sheet = workbook.addWorksheet('นักเรียนแยกชั้นแยกห้อง', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  const headers = [
    'ที่',
    'รหัสโรงเรียน',
    'ชื่อโรงเรียน',
    'อ.1',
    'อ.2',
    'อ.3',
    'ป.1',
    'ป.2',
    'ป.3',
    'ป.4',
    'ป.5',
    'ป.6',
    'ม.1',
    'ม.2',
    'ม.3',
    'ม.4',
    'ม.5',
    'ม.6',
    'ชาย',
    'หญิง',
    'รวม นร.',
    'รวมห้อง',
  ];

  const widths = [5.5, 12.5, 28, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 8, 8, 9.5, 9];
  widths.forEach((w, idx) => {
    sheet.getColumn(idx + 1).width = w;
  });

  sheet.getRow(1).height = 28;
  sheet.mergeCells(1, 1, 1, headers.length);
  const title = sheet.getCell(1, 1);
  title.value = `ข้อมูลจำนวนนักเรียนแยกชั้นแต่ละโรงเรียน (SchoolMIS ภาคเรียน ${semesterLabel}) · สพป.แม่ฮ่องสอน เขต 1`;
  title.font = { name: FONT_NAME, size: 17, bold: true };
  title.alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.getRow(2).height = 18;
  sheet.mergeCells(2, 1, 2, headers.length);
  const sub = sheet.getCell(2, 1);
  sub.value = `จำนวน ${records.length} โรงเรียน`;
  sub.font = { name: FONT_NAME, size: 14 };
  sub.alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.getRow(3).height = 26;
  headers.forEach((h, idx) => {
    const cell = sheet.getCell(3, idx + 1);
    cell.value = h;
    cell.font = { name: FONT_NAME, size: 14, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
  });

  const startRow = 4;
  records.forEach((r, idx) => {
    const rowNum = startRow + idx;
    const row = sheet.getRow(rowNum);
    row.height = 20;

    const values: Array<string | number | { formula: string; result: number }> = [
      idx + 1,
      r.school_code,
      r.school_name,
      r.k0_students,
      r.k1_students,
      r.k2_students,
      r.p1_students,
      r.p2_students,
      r.p3_students,
      r.p4_students,
      r.p5_students,
      r.p6_students,
      r.m1_students,
      r.m2_students,
      r.m3_students,
      r.m4_students,
      r.m5_students,
      r.m6_students,
      r.total_male,
      r.total_female,
      { formula: `SUM(D${rowNum}:R${rowNum})`, result: r.total_students },
      r.total_rooms,
    ];

    values.forEach((val, colIdx) => {
      const cell = sheet.getCell(rowNum, colIdx + 1);
      cell.value = val;
      cell.font = { name: FONT_NAME, size: 14, bold: colIdx === 20 };
      cell.alignment = {
        horizontal: colIdx === 2 ? 'left' : 'center',
        vertical: 'middle',
      };
      if (colIdx >= 3 || colIdx === 0) {
        cell.numFmt = '#,##0';
      }
      cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
    });
  });

  if (records.length > 0) {
    const endRow = startRow + records.length - 1;
    const totalRowNum = endRow + 1;
    sheet.getRow(totalRowNum).height = 24;
    sheet.mergeCells(totalRowNum, 1, totalRowNum, 3);
    const labelCell = sheet.getCell(totalRowNum, 1);
    labelCell.value = `รวมทั้งหมด (${records.length} โรงเรียน)`;
    labelCell.font = { name: FONT_NAME, size: 15, bold: true };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };

    for (let c = 1; c <= 3; c++) {
      const cell = sheet.getCell(totalRowNum, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
      cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
    }

    for (let c = 4; c <= headers.length; c++) {
      const colLetter = sheet.getColumn(c).letter;
      const cell = sheet.getCell(totalRowNum, c);
      cell.value = { formula: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` };
      cell.font = { name: FONT_NAME, size: 15, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.numFmt = '#,##0';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
      cell.border = { top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `นักเรียนแยกชั้น_${semesterLabel}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
