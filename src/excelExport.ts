/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ExcelJS from "exceljs";

export interface NSRCExcelInput {
  cif: string;
  regNo: string;
  name: string;
  accountNumber: string;
  accountBlockingType: string;
  businessUnit: string;
  accountClassification: string;
  statusBlockDesc: string;
  amount?: string;
  earmarkAmount: string;
  earmark: string;
  remarks: string;
  reason: string;
  dateStamp: string;
}

/**
 * Generates and downloads a password-protected, styled XLSX spreadsheet for NSRC reports
 * using a horizontal layout matching the specific template style requested.
 * The worksheet is protected with password "Affin123".
 */
export async function downloadProtectedNSRCExcel(entry: NSRCExcelInput) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("NSRC Report List");

    // Gridlines enabled
    worksheet.views = [{ showGridLines: true }];

    // Column headers
    const headers = [
      "No",
      "Customer",
      "Reg No",
      "Account No",
      "NSRC Request",
      "RIB / Affinmax",
      "Account Type",
      "Action Taken",
      "Disputed Amount",
      "Earmark Amount",
      "Remark",
      "Reason"
    ];

    // Align with widths
    worksheet.getColumn("A").width = 6;   // No
    worksheet.getColumn("B").width = 45;  // Customer
    worksheet.getColumn("C").width = 16;  // Reg No
    worksheet.getColumn("D").width = 16;  // Account No
    worksheet.getColumn("E").width = 28;  // NSRC Request
    worksheet.getColumn("F").width = 18;  // RIB / Affinmax
    worksheet.getColumn("G").width = 16;  // Account Type
    worksheet.getColumn("H").width = 30;  // Action Taken
    worksheet.getColumn("I").width = 18;  // Disputed Amount
    worksheet.getColumn("J").width = 18;  // Earmark Amount
    worksheet.getColumn("K").width = 40;  // Remark
    worksheet.getColumn("L").width = 20;  // Reason

    // Header Row in Row 1
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;

    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "000000" } };
      cell.alignment = { vertical: "middle", horizontal: idx === 0 ? "center" : "left" };
      cell.fill = {
         type: "pattern",
         pattern: "solid",
         fgColor: { argb: "FFFF00" } // Core Yellow
      };
      cell.border = {
         top: { style: "thin", color: { argb: "000000" } },
         bottom: { style: "double", color: { argb: "000000" } },
         left: { style: "thin", color: { argb: "000000" } },
         right: { style: "thin", color: { argb: "000000" } }
      };
    });

    // Data row in Row 2
    const dataRow = worksheet.getRow(2);
    dataRow.height = 24;

    const dataValues = [
      1, // No
      `${entry.name.toUpperCase()} (${entry.cif})`, // Customer
      entry.regNo || "", // Reg No
      entry.accountNumber || "", // Account No
      entry.accountBlockingType || "", // NSRC Request (accountBlockingType)
      entry.businessUnit || "", // RIB / Affinmax (businessUnit)
      entry.accountClassification || "", // Account Type (accountClassification)
      entry.statusBlockDesc || "", // Action Taken (statusBlockDesc)
      entry.amount || "", // Disputed Amount
      entry.earmarkAmount || "", // Earmark Amount
      entry.remarks || "", // Remark (remarks)
      entry.reason || "" // Reason (reason)
    ];

    dataValues.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val;
      cell.font = { name: "Arial", size: 9, color: { argb: "0F172A" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: idx === 0 || idx === 2 || idx === 3 ? "center" : "left"
      };

      // Nice corporative blue-indigo background highlight for columns B-K
      if (idx > 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "E8EEF8" } // Soft compliance blueish-gray tint
        };
      } else {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F8FAFC" }
        };
      }

      cell.border = {
        top: { style: "thin", color: { argb: "A6B9D0" } },
        bottom: { style: "thin", color: { argb: "A6B9D0" } },
        left: { style: "thin", color: { argb: "A6B9D0" } },
        right: { style: "thin", color: { argb: "A6B9D0" } }
      };

      // Keep cells writable but protected
      cell.protection = { locked: false };
    });

    // Enforce Excel password protection
    await worksheet.protect("Affin123", {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: true,
      formatColumns: false,
      formatRows: false
    });

    // Write file to download buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    
    const filename = `${entry.name.trim().replace(/[^a-zA-Z0-9_\-\s]/g, "")} (${entry.cif.trim()}).xlsx`;

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    return { success: true, filename };
  } catch (err) {
    console.error("Failed to export secure NSRC Excel file:", err);
    return { success: false, error: err };
  }
}
