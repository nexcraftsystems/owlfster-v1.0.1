/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FMSCase {
  id: string;
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
  
  // Resolution fields
  callResponse: string;
  resolution: string;
  remarks: string;
  
  // Call details
  firstCallTime: string;
  firstCallRemarks: string;
  secondCallTime: string;
  secondCallRemarks: string;
  thirdCallTime: string;
  thirdCallRemarks: string;
  
  statusAction: string;
  escalateTeam: string;
  createdAt: string;
}

export interface NSRCEntry {
  id: string;
  cif: string;
  regNo: string;               // Company/Officer registration number (Reg No)
  name: string;
  accountNumber: string;
  accountBlockingType: string; // "NSRC Request"
  businessUnit: string;        // "RIB / Affinmax"
  accountClassification: string; // "Account Type"
  statusBlockDesc: string;     // "Action Taken"
  earmarkAmount: string;       // "Earmark Amount" (Amount field requested)
  earmark: string;             // "Earmark" (Earmark field requested)
  remarks: string;             // "Remark"
  reason: string;              // "Reason"
  dateStamp: string;
  createdAt: string;
}

export interface BankFI {
  name: string;
  code: string;
  matchScore: number;
  logoUrl?: string;
  logoLetter: string;
  lengthPattern: string;
  prefixPattern: string;
  description: string;
}
