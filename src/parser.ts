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
  };

  if (!rawInput || rawInput.trim() === "") {
    return result;
  }

  const lines = rawInput.split(/\r?\n/);
  
  // 1. Try parsing key-value lines (e.g., "CIF Number: 350028093" or "Amount: RM20500")
  let kvMatched = false;
  lines.forEach((line) => {
    // Standardize separators
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
        // Strip RM, currencies, commas
        const amtStr = val.replace(/[^\d.]/g, "");
        const parsedAmt = parseFloat(amtStr);
        if (!isNaN(parsedAmt)) result.amount = parsedAmt;
      } else if (key.includes("event")) {
        result.eventType = val;
      } else if (key.includes("risk")) {
        result.riskScore = val;
      } else if (key.includes("mode")) {
        result.modeChannel = val;
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

  // 2. Fallback to extracting information opportunistically from loose text / tabs
  // Search for any 9 to 12 digit number (typical CIF or account number)
  const allWords = rawInput.split(/[\s\t,]+/);
  
  // Look for sequences of digits
  const cifsFound = allWords.filter(word => /^\d{9,12}$/.test(word));
  if (cifsFound.length > 0) {
    result.cif = cifsFound[0];
  }

  // Look for and extract Amount
  // search for "RM" or "$" followed by digits, or numbers with decimals like "20,500.00"
  const amountRegex = /(?:RM|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i;
  const amtMatch = rawInput.match(amountRegex);
  if (amtMatch) {
    const cleanAmt = amtMatch[1].replace(/,/g, "");
    const parsedAmt = parseFloat(cleanAmt);
    if (!isNaN(parsedAmt)) {
      result.amount = parsedAmt;
    }
  } else {
    // opportunistic number search that has a dot and digits
    const dotAmtMatch = rawInput.match(/\b\d+\.\d{2}\b/);
    if (dotAmtMatch) {
      const parsedAmt = parseFloat(dotAmtMatch[0]);
      if (!isNaN(parsedAmt)) result.amount = parsedAmt;
    }
  }

  // Auto-set rules and event types if detected in raw string
  if (rawInput.toUpperCase().includes("AFFINRIBMY")) {
    result.ruleId = "AFFINRIBMY";
  } else {
    const ruleMatch = rawInput.match(/([A-Z]{3,}_[A-Z0-9_]{3,})/i);
    if (ruleMatch) result.ruleId = ruleMatch[1].toUpperCase();
  }

  if (rawInput.toUpperCase().includes("TRANSFER")) {
    result.eventType = "TRANSFER_RT";
  } else if (rawInput.toUpperCase().includes("LOGIN") || rawInput.toUpperCase().includes("LOG IN")) {
    result.eventType = "RIB_LOGIN";
  } else {
    result.eventType = "SUSPICIOUS_PAYMENT";
  }

  if (rawInput.toUpperCase().includes("DENY")) {
    result.policyAction = "DENY";
  } else if (rawInput.toUpperCase().includes("HOLD")) {
    result.policyAction = "HOLD";
  } else {
    result.policyAction = "REVIEW";
  }

  if (rawInput.toUpperCase().includes("LOCKED")) {
    result.fmsStatus = "LOCKED";
  } else {
    result.fmsStatus = "SUSPENDED";
  }

  // Risk Score: extract any number from 0-100 or "High/Medium/Low"
  const scoreMatch = rawInput.match(/\b(100|[1-9]?[0-9])\b/);
  if (scoreMatch && !result.cif?.includes(scoreMatch[0])) {
    result.riskScore = scoreMatch[0];
  } else if (rawInput.toUpperCase().includes("HIGH")) {
    result.riskScore = "95";
  } else {
    result.riskScore = "80";
  }

  if (rawInput.toUpperCase().includes("MOBILE")) {
    result.modeChannel = "MOBILE_APP";
  } else {
    result.modeChannel = "RIB_PORTAL";
  }

  return result;
}
