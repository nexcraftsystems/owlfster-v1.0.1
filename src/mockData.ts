/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FMSCase, NSRCEntry, BankFI } from "./types";

export const INITIAL_CASES: FMSCase[] = [];

export const INITIAL_NSRC: NSRCEntry[] = [];

export const MALAYSIAN_BANKS: BankFI[] = [
  {
    name: "CIMB Bank Berhad",
    code: "CIMB",
    matchScore: 0,
    logoLetter: "C",
    lengthPattern: "14 digits",
    prefixPattern: "Starts with 70, 76, 80, 86, or similar",
    description: "Commonly 14 digits. Custom series starting with 70, 76, 80, or 86."
  },
  {
    name: "OCBC Bank (Malaysia) Berhad",
    code: "OCBC",
    matchScore: 0,
    logoLetter: "O",
    lengthPattern: "10 digits",
    prefixPattern: "Standard 10-digit formats",
    description: "Standard 10-digit savings/current accounts with high tracking metrics."
  },
  {
    name: "Malayan Banking Berhad (Maybank)",
    code: "BAY",
    matchScore: 0,
    logoLetter: "M",
    lengthPattern: "12 digits",
    prefixPattern: "Starts with 1, 5, or 11/51/56 ranges",
    description: "Largest financial services group in Malaysia. Typically 12 digits configuration."
  },
  {
    name: "Public Bank Berhad",
    code: "PBB",
    matchScore: 0,
    logoLetter: "P",
    lengthPattern: "10 digits",
    prefixPattern: "Starts with 3, 4, or 6",
    description: "High compliance retail accounts. Standard accounts use exactly 10 digits."
  },
  {
    name: "RHB Bank Berhad",
    code: "RHB",
    matchScore: 0,
    logoLetter: "R",
    lengthPattern: "14 digits",
    prefixPattern: "Starts with 1 or 2 series",
    description: "Typically 14 digits (sometimes 10) beginning with 1 or 2 series."
  },
  {
    name: "Affin Bank Berhad",
    code: "AFFIN",
    matchScore: 0,
    logoLetter: "A",
    lengthPattern: "10 or 12 digits",
    prefixPattern: "Typical savings starts with 10",
    description: "Affin savings & current accounts are typically 10 or 12 digits."
  },
  {
    name: "Hong Leong Bank",
    code: "HLB",
    matchScore: 0,
    logoLetter: "H",
    lengthPattern: "11 digits",
    prefixPattern: "Starts with 0, 1, 2, or 3",
    description: "Common HLB premium saving accounts configuration of 11 characters."
  },
  {
    name: "AmBank Berhad",
    code: "AMB",
    matchScore: 0,
    logoLetter: "Am",
    lengthPattern: "13 digits",
    prefixPattern: "Starts with 88 series",
    description: "Commonly 13 digits, heavily oriented towards commercial services."
  },
  {
    name: "Bank Islam Malaysia",
    code: "BIMB",
    matchScore: 0,
    logoLetter: "BI",
    lengthPattern: "14 digits",
    prefixPattern: "Starts with 04 series",
    description: "Pure islamic personal banking structure with standard 14 digits routing."
  },
  {
    name: "Alliance Bank Berhad",
    code: "ALB",
    matchScore: 0,
    logoLetter: "AL",
    lengthPattern: "15 digits",
    prefixPattern: "Starts with 12",
    description: "Standard alliance corporate & commercial account numbers spanning 15 digits."
  },
  {
    name: "Touch 'n Go eWallet (TNG Digital)",
    code: "TNG",
    matchScore: 0,
    logoLetter: "TNG",
    lengthPattern: "10 to 12 digits",
    prefixPattern: "Starts with 9, 01, or 601 (DuitNow proxy phone)",
    description: "Major digital wallet in Malaysia. Integrated with dynamic DuitNow transfers."
  }
];

export interface OfficerScore {
  psid: string;
  name: string;
  confirmFraud: number;
  suspectedFraud: number;
  confirmGenuine: number;
  assumeGenuine: number;
  totalWorkload: number;
  contacted: number;
  noContact: number;
  closeManual: number;
}

export const OFFICER_SCORES: OfficerScore[] = [
  {
    psid: "PS101435",
    name: "Zaim",
    confirmFraud: 4,
    suspectedFraud: 8,
    confirmGenuine: 12,
    assumeGenuine: 18,
    totalWorkload: 42,
    contacted: 24,
    noContact: 10,
    closeManual: 8
  },
  {
    psid: "PS101436",
    name: "Faris",
    confirmFraud: 2,
    suspectedFraud: 5,
    confirmGenuine: 9,
    assumeGenuine: 14,
    totalWorkload: 30,
    contacted: 18,
    noContact: 7,
    closeManual: 5
  },
  {
    psid: "PS101477",
    name: "Nabil",
    confirmFraud: 3,
    suspectedFraud: 4,
    confirmGenuine: 15,
    assumeGenuine: 21,
    totalWorkload: 43,
    contacted: 30,
    noContact: 8,
    closeManual: 5
  },
  {
    psid: "PS101405",
    name: "Naja",
    confirmFraud: 1,
    suspectedFraud: 3,
    confirmGenuine: 10,
    assumeGenuine: 15,
    totalWorkload: 29,
    contacted: 16,
    noContact: 9,
    closeManual: 4
  },
  {
    psid: "PS101480",
    name: "Izzat",
    confirmFraud: 5,
    suspectedFraud: 6,
    confirmGenuine: 8,
    assumeGenuine: 12,
    totalWorkload: 31,
    contacted: 15,
    noContact: 11,
    closeManual: 5
  }
];
