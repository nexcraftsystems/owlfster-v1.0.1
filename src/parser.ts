/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedFMS {
  cif: string;
  amount: number;
  eventType: string;
  riskScore: string;
  modeChannel: string;
  ruleId: string;
  fmsStatus: string;
  assignedOfficer: string;
  policyAction: string;
  caseCreatedTime: string;
  caseAssignedTime: string;
  caseModifiedTime?: string;
  org?: string;
  mode?: string;
  ipDetails?: string;
}

/**
 * Robustly parses copy-pasted string rows from an internal FMS system or dashboard.
 * Supports TSV, key-value pairs, or loose text extraction.
 */
export function parseFMSInput(rawInput: string): Partial<ParsedFMS> {
  const result: Partial<ParsedFMS> = {
    assignedOfficer: "PS101435", // Default
    caseAssignedTime: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) + " " + new Date().toLocaleTimeString("en-US") + " MYT",
    caseCreatedTime: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) + " " + new Date().toLocaleTimeString("en-US") + " MYT",
    caseModifiedTime: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) + " " + new Date().toLocaleTimeString("en-US") + " MYT",
    mode: "PROD",
    fmsStatus: "IN_PROGRESS",
    eventType: "PAYMENT",
    riskScore: "85",
    ipDetails: "127.0.0.1 (MY)",
    ruleId: "Total Transaction Amount Monitoring",
    policyAction: "CHALLENGE"
  };

  if (!rawInput || rawInput.trim() === "") {
    return result;
  }

  // 1. Check for tab-separated row (standard copy-paste from table cells)
  const tabs = rawInput.split('\t').map(p => p.trim());
  if (tabs.length >= 8) {
    const cleanCell = (str: string) => str ? str.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim() : "";
    
    result.caseCreatedTime = cleanCell(tabs[0]);
    result.caseModifiedTime = cleanCell(tabs[1]);
    
    const userOrg = cleanCell(tabs[2]);
    if (userOrg) {
      const tokens = userOrg.split(" ");
      result.cif = tokens[0] || "";
      result.org = tokens[1] || "";
    }
    
    result.mode = cleanCell(tabs[3]) || "PROD";
    result.fmsStatus = cleanCell(tabs[4]) || "IN_PROGRESS";
    result.eventType = cleanCell(tabs[5]) || "PAYMENT";
    result.riskScore = cleanCell(tabs[6]) || "85";
    result.ipDetails = cleanCell(tabs[7]) || "127.0.0.1 (MY)";
    result.ruleId = cleanCell(tabs[8]) || "Total Transaction Amount Monitoring";
    result.policyAction = cleanCell(tabs[9]) || "CHALLENGE";
    result.assignedOfficer = cleanCell(tabs[10]) || "PS101435";
    
    // Fallback amount parsing if any amount-like number is in the text
    const amtMatch = rawInput.match(/(?:RM|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i);
    if (amtMatch) {
      result.amount = parseFloat(amtMatch[1].replace(/,/g, ""));
    } else {
      result.amount = 0;
    }
    
    return result;
  }

  // 2. Check for newline-separated values (vertical copy-paste list)
  const lines = rawInput.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length >= 12) {
    // Let's check if the first cell looks like Date components: "Jun 28, 2026", "2:39:01 PM", "MYT"
    const isDate0 = lines[0].includes(",") && /\d{4}/.test(lines[0]);
    const isTime1 = lines[1].includes(":") && (lines[1].toLowerCase().includes("pm") || lines[1].toLowerCase().includes("am"));
    
    if (isDate0 && isTime1) {
      result.caseCreatedTime = `${lines[0]} ${lines[1]} ${lines[2]}`;
      result.caseModifiedTime = `${lines[3]} ${lines[4]} ${lines[5]}`;
      result.cif = lines[6];
      result.org = lines[7];
      result.mode = lines[8];
      result.fmsStatus = lines[9];
      result.eventType = lines[10];
      result.riskScore = lines[11];
      
      if (lines[12] && lines[13] && lines[13].startsWith("(")) {
        result.ipDetails = `${lines[12]} ${lines[13]}`;
        result.ruleId = lines[14] || "Total Transaction Amount Monitoring";
        result.policyAction = lines[15] || "CHALLENGE";
        result.assignedOfficer = lines[16] || "PS101435";
      } else {
        result.ipDetails = lines[12];
        result.ruleId = lines[13] || "Total Transaction Amount Monitoring";
        result.policyAction = lines[14] || "CHALLENGE";
        result.assignedOfficer = lines[15] || "PS101435";
      }
      
      result.amount = 0;
      return result;
    }
  }

  // 3. Fallback: Opportunistic parsing from unstructured text or individual KV pairs
  let kvMatched = false;
  lines.forEach((line) => {
    const cleaned = line.replace(/\s+/g, " ");
    const match = cleaned.match(/^(CIF|CIF Number|User ID|Amount|Risk|Event|Rule|Mode|Status|Action)[:\-=\t](.*)$/i);
    if (match) {
      kvMatched = true;
      const key = match[1].toLowerCase().trim();
      const val = match[2].trim();
      
      if (key.includes("cif") || key.includes("user")) {
        const cifMatch = val.match(/\d+/);
        if (cifMatch) result.cif = cifMatch[0];
      } else if (key.includes("amount")) {
        const amtStr = val.replace(/[^\d.]/g, "");
        const parsedAmt = parseFloat(amtStr);
        if (!isNaN(parsedAmt)) result.amount = parsedAmt;
      } else if (key.includes("event")) {
        result.eventType = val;
      } else if (key.includes("risk")) {
        result.riskScore = val;
      } else if (key.includes("mode")) {
        result.mode = val;
      } else if (key.includes("rule")) {
        result.ruleId = val;
      } else if (key.includes("status")) {
        result.fmsStatus = val;
      } else if (key.includes("action")) {
        result.policyAction = val;
      }
    }
  });

  if (kvMatched) {
    return result;
  }

  // Opportunistic search on unstructured text words
  const allWords = rawInput.split(/[\s\t,]+/);
  const cifsFound = allWords.filter(word => /^\d{8,12}$/.test(word));
  if (cifsFound.length > 0) {
    result.cif = cifsFound[0];
  }

  const amountRegex = /(?:RM|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i;
  const amtMatch = rawInput.match(amountRegex);
  if (amtMatch) {
    const cleanAmt = amtMatch[1].replace(/,/g, "");
    const parsedAmt = parseFloat(cleanAmt);
    if (!isNaN(parsedAmt)) {
      result.amount = parsedAmt;
    }
  }

  if (rawInput.toUpperCase().includes("AFFINRIBMY")) {
    result.org = "AFFINRIBMY";
    result.ruleId = "Total Transaction Amount Monitoring";
  }

  if (rawInput.toUpperCase().includes("TRANSFER")) {
    result.eventType = "TRANSFER_RT";
  } else if (rawInput.toUpperCase().includes("LOGIN") || rawInput.toUpperCase().includes("LOG IN")) {
    result.eventType = "RIB_LOGIN";
  } else if (rawInput.toUpperCase().includes("PAYMENT")) {
    result.eventType = "PAYMENT";
  }

  if (rawInput.toUpperCase().includes("CHALLENGE")) {
    result.policyAction = "CHALLENGE";
  } else if (rawInput.toUpperCase().includes("DENY")) {
    result.policyAction = "DENY";
  } else if (rawInput.toUpperCase().includes("HOLD")) {
    result.policyAction = "HOLD";
  }

  if (rawInput.toUpperCase().includes("IN_PROGRESS")) {
    result.fmsStatus = "IN_PROGRESS";
  } else if (rawInput.toUpperCase().includes("LOCKED")) {
    result.fmsStatus = "LOCKED";
  }

  const scoreMatch = rawInput.match(/\b(1000|[1-9]?[0-9]{2})\b/);
  if (scoreMatch && !result.cif?.includes(scoreMatch[0])) {
    result.riskScore = scoreMatch[0];
  }

  if (rawInput.toUpperCase().includes("PROD")) {
    result.mode = "PROD";
  } else if (rawInput.toUpperCase().includes("UAT")) {
    result.mode = "UAT";
  }

  return result;
}
