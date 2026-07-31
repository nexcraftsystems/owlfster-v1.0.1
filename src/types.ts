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
  caseModifiedTime?: string;
  org?: string;
  mode?: string;
  ipDetails?: string;
  
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

