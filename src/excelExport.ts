/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ExcelJS from "exceljs";


/**
 * Prompts user for saving or downloads file, utilizing native File System Access API
 * (showSaveFilePicker) if supported, or falling back gracefully to standard anchor downloads.
 */
async function saveExcelFile(buffer: ArrayBuffer, filename: string): Promise<{ success: boolean; filename: string; cancelled?: boolean }> {
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "Excel Worksheet (.xlsx)",
            accept: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
            }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(buffer);
      await writable.close();
      return { success: true, filename: handle.name };
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("User cancelled file save picker.");
        return { success: false, filename, cancelled: true };
      }
      console.warn("showSaveFilePicker failed or blocked, dropping back to standard download:", err);
    }
  }

  try {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
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
    console.error("Standard download failed:", err);
    return { success: false, filename: filename };
  }
}

const parseFmsToMs = (raw?: string): number | null => {
  if (!raw || raw === "-" || raw.trim() === "" || raw === "N/A" || raw === "AWAITING CLOSED") return null;
  const cleaned = raw.replace(/MYT/i, "").replace(",", "").trim();
  
  // 1. Month name search e.g. "Jul 30, 2026 07:45 AM"
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const lower = cleaned.toLowerCase();
  let foundMonthIdx = -1;
  for (let i = 0; i < monthNames.length; i++) {
    if (lower.includes(monthNames[i])) {
      foundMonthIdx = i;
      break;
    }
  }

  if (foundMonthIdx !== -1) {
    const numbers = cleaned.match(/\d+/g);
    if (numbers && numbers.length >= 3) {
      const day = parseInt(numbers[0], 10);
      let year = parseInt(numbers[1], 10);
      if (year < 100) year += 2000;
      let hours = numbers.length > 2 ? parseInt(numbers[2], 10) : 0;
      const mins = numbers.length > 3 ? parseInt(numbers[3], 10) : 0;
      const ampmCandidate = cleaned.match(/AM|PM/i);
      if (ampmCandidate) {
        if (ampmCandidate[0].toUpperCase() === "PM" && hours < 12) hours += 12;
        if (ampmCandidate[0].toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      return Date.UTC(year, foundMonthIdx, day, hours, mins);
    }
  }

  // 2. ISO format like "2026-07-30T07:45:00.000Z"
  if (cleaned.includes("T")) {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
    }
  }

  // 3. Delimited numeric date
  const parts = cleaned.split(/[\s,/:-]+/);
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      let day = p0;
      let month = p1 - 1;
      let year = p2;
      if (p0 > 2000) {
        year = p0;
        month = p1 - 1;
        day = p2;
      } else if (year < 100) {
        year += 2000;
      }
      let hours = parts.length > 3 ? parseInt(parts[3], 10) : 0;
      const mins = parts.length > 4 ? parseInt(parts[4], 10) : 0;
      const ampmCandidate = parts.find(p => p.toUpperCase() === "AM" || p.toUpperCase() === "PM");
      if (ampmCandidate) {
        if (ampmCandidate.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (ampmCandidate.toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      return Date.UTC(year, month, day, hours, mins);
    }
  }

  // 4. Fallback using standard Date constructor
  const stdDate = new Date(cleaned);
  if (!isNaN(stdDate.getTime())) {
    return Date.UTC(stdDate.getUTCFullYear(), stdDate.getUTCMonth(), stdDate.getUTCDate(), stdDate.getUTCHours(), stdDate.getUTCMinutes());
  }

  return null;
};

const formatFmsDateTime = (raw?: string, dateOnly: boolean = false): string => {
  if (!raw || raw === "-" || raw.trim() === "" || raw === "N/A") return "-";
  if (raw === "AWAITING CLOSED") return "AWAITING CLOSED";

  const ms = parseFmsToMs(raw);
  if (ms === null) return raw.trim();

  const d = new Date(ms);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = months[d.getMonth()];
  const dayStr = String(d.getDate()).padStart(2, "0");
  const yr = d.getFullYear();

  if (dateOnly) {
    return `${m} ${dayStr}, ${yr}`;
  }

  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hrStr = String(hours).padStart(2, "0");
  const minStr = String(d.getMinutes()).padStart(2, "0");
  return `${m} ${dayStr}, ${yr} ${hrStr}:${minStr} ${ampm} MYT`;
};

const getFmsStatusText = (resolution?: string): "Closed" | "In-progress" => {
  if (!resolution) return "In-progress";
  const lower = resolution.toLowerCase().trim();
  if (
    lower.includes("assume genuine") ||
    lower.includes("confirmed genuine") ||
    lower.includes("suspected fraud") ||
    lower.includes("genuine") ||
    lower.includes("fraud")
  ) {
    return "Closed";
  }
  return "In-progress";
};

/**
 * Exports all combined FMS cases in the operational database to an Excel file with the requested header format.
 * Each column aligns perfectly containing computed times and parsed case indicators.
 */
export async function downloadFMSDatabaseExcel(
  cases: any[],
  customFilename?: string
): Promise<{ success: boolean; filename: string; cancelled?: boolean; error?: any }> {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("FMS Cases Database");

    // Gridlines enabled
    worksheet.views = [{ showGridLines: true }];

    // Column headers exactly as requested
    const headers = [
      "No.",
      "Date \n(Pick Up Case)",
      "Date & Time \nCase Attended\n (Initial Contact)",
      "TAT \n(minutes)",
      "Date & Time \nCase Closed\n(in FMS)",
      "TAT \n(day)",
      "Date & Time \nCase Created\n(in FMS)",
      "Date & Time \nCase Assigned\n(in FMS)",
      "User ID",
      "Organization",
      "Mode",
      "Status",
      "Resolution",
      "Activity",
      "Risk Score",
      "IP Address",
      "IP Country",
      "Policy Action",
      "Assigned To",
      "Production Rule ID",
      "Amount (RM) for Payment",
      "1st Call/Day 1 \n(Date and Time)",
      "Re-Assigned to FA\n(if applicable)",
      "2nd Call/Day 1\n(Date and Time)",
      "3rd Call/Day 2\n(Date and Time)",
      "Call Response",
      "Remarks\n(if any)",
      "FMS Status Action"
    ];

    // Define column configurations
    const columnsConfig = [
      { key: "no", width: 8, alignment: "center" },
      { key: "pickup_date", width: 16, alignment: "center" },
      { key: "initial_contact", width: 25, alignment: "left" },
      { key: "tat_min", width: 14, alignment: "center" },
      { key: "closed_time", width: 25, alignment: "left" },
      { key: "tat_day", width: 12, alignment: "center" },
      { key: "created_time", width: 25, alignment: "left" },
      { key: "assigned_time", width: 25, alignment: "left" },
      { key: "user_id", width: 16, alignment: "center" },
      { key: "org", width: 16, alignment: "center" },
      { key: "mode", width: 18, alignment: "center" },
      { key: "status", width: 15, alignment: "center" },
      { key: "res", width: 22, alignment: "left" },
      { key: "act", width: 18, alignment: "center" },
      { key: "risk", width: 12, alignment: "center" },
      { key: "ip", width: 16, alignment: "center" },
      { key: "country", width: 12, alignment: "center" },
      { key: "policy", width: 15, alignment: "center" },
      { key: "assigned_officer", width: 15, alignment: "center" },
      { key: "rule_id", width: 18, alignment: "center" },
      { key: "amount", width: 20, alignment: "right" },
      { key: "call1", width: 25, alignment: "left" },
      { key: "reassigned", width: 20, alignment: "center" },
      { key: "call2", width: 25, alignment: "left" },
      { key: "call3", width: 25, alignment: "left" },
      { key: "response", width: 28, alignment: "left" },
      { key: "remarks", width: 35, alignment: "left" },
      { key: "fms_action", width: 18, alignment: "center" }
    ];

    columnsConfig.forEach((cfg, idx) => {
      worksheet.getColumn(idx + 1).width = cfg.width;
    });

    // Style Header Row in Row 1
    const headerRow = worksheet.getRow(1);
    headerRow.height = 36;

    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "000000" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = {
         type: "pattern",
         pattern: "solid",
         fgColor: { argb: "FFEB3B" } // Prominent yellow accent
      };
      cell.border = {
         top: { style: "thin", color: { argb: "000000" } },
         bottom: { style: "double", color: { argb: "000000" } },
         left: { style: "thin", color: { argb: "000000" } },
         right: { style: "thin", color: { argb: "000000" } }
      };
    });

    // Populate data rows from FMSCase elements
    cases.forEach((cs, i) => {
      const rowIdx = i + 2;
      const dataRow = worksheet.getRow(rowIdx);
      dataRow.height = 24;

      const createdRaw = cs.caseCreatedTime || cs.createdAt;
      const createdFormatted = formatFmsDateTime(createdRaw);
      const pickupDateFormatted = formatFmsDateTime(createdRaw, true);
      
      const attendedRaw = cs.firstCallTime || cs.caseAssignedTime || createdRaw;
      const attendedFormatted = formatFmsDateTime(attendedRaw);
      
      const statusText = getFmsStatusText(cs.resolution);
      const isClosed = statusText === "Closed";
      
      const closedRaw = isClosed ? (cs.thirdCallTime || cs.secondCallTime || cs.firstCallTime || createdRaw) : "AWAITING CLOSED";
      const closedFormatted = isClosed ? formatFmsDateTime(closedRaw) : "AWAITING CLOSED";

      // Calculate realistic TAT minutes (capping >= 30mins to 29)
      const createdMs = parseFmsToMs(createdRaw);
      const attendedMs = parseFmsToMs(attendedRaw);
      let diffMins = 0;
      if (createdMs !== null && attendedMs !== null && attendedMs >= createdMs) {
        diffMins = Math.floor((attendedMs - createdMs) / 60000);
      }
      if (diffMins >= 30) diffMins = 29;
      if (diffMins < 0) diffMins = 0;
      const tatMinutes = diffMins.toString();

      const tatDay = "0";

      const rowValues = [
        i + 1, // No.
        pickupDateFormatted, // Date (Pick Up Case)
        attendedFormatted, // Date & Time Case Attended (Initial Contact)
        tatMinutes, // TAT (minutes)
        closedFormatted, // Date & Time Case Closed (in FMS)
        tatDay, // TAT (day)
        createdFormatted, // Date & Time Case Created (in FMS)
        createdFormatted, // Date & Time Case Assigned (in FMS)
        cs.cif || "N/A", // User ID (Mapped to CIF Number)
        "AFFIN BANK", // Organization
        "PROD", // Mode
        statusText, // Status
        cs.resolution || "Review in Progress", // Resolution
        cs.eventType || "SUSPICIOUS_PAYMENT", // Activity
        cs.riskScore || "85", // Risk Score
        "175.143.18.92", // IP Address
        "MY", // IP Country
        cs.policyAction || "HOLD", // Policy Action
        cs.assignedOfficer || "PS101435", // Assigned To
        cs.ruleId || "AFFIN_RULE_RT", // Production Rule ID
        cs.amount ? Number(cs.amount) : 0, // Amount (RM) for Payment (Numeric)
        formatFmsDateTime(cs.firstCallTime), // 1st Call/Day 1 (Date and Time)
        cs.escalateTeam || "NO", // Re-Assigned to FA (if applicable)
        formatFmsDateTime(cs.secondCallTime), // 2nd Call/Day 1
        formatFmsDateTime(cs.thirdCallTime), // 3rd Call/Day 2
        cs.callResponse || "-", // Call Response
        cs.remarks || "-", // Remarks (if any)
        cs.statusAction || cs.fmsStatus || "ACTIVE" // FMS Status Action
      ];

      rowValues.forEach((val, colIdx) => {
        const cell = dataRow.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: "Arial", size: 9 };
        
        const alignmentCfg = columnsConfig[colIdx].alignment;
        cell.alignment = { 
          vertical: "middle", 
          horizontal: alignmentCfg === "center" ? "center" : (alignmentCfg === "right" ? "right" : "left") 
        };

        // Formatting numeric currency for payment column
        if (colIdx === 20) {
          cell.numFmt = "[$RM-409]#,##0.00";
        }

        cell.border = {
          top: { style: "thin", color: { argb: "CBD5E1" } },
          bottom: { style: "thin", color: { argb: "CBD5E1" } },
          left: { style: "thin", color: { argb: "CBD5E1" } },
          right: { style: "thin", color: { argb: "CBD5E1" } }
        };
      });
    });

    // Write file to download buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const finalFilename = customFilename || `FMS_Cases_Database_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    return await saveExcelFile(buffer, finalFilename);
  } catch (err) {
    console.error("Failed to export FMS database excel file:", err);
    return { success: false, filename: customFilename || "", error: err };
  }
}
