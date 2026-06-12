/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  Activity, 
  Database, 
  Layers, 
  Clock, 
  Copy, 
  Check, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  UserCheck, 
  Building2, 
  CornerDownRight, 
  Coins, 
  Download, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  PhoneCall, 
  Smartphone, 
  FileSpreadsheet, 
  Plus,
  ArrowRight,
  Info,
  UserPlus 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FMSCase, NSRCEntry, BankFI } from "./types";
import { parseFMSInput } from "./parser";
import { downloadProtectedNSRCExcel } from "./excelExport";
import { INITIAL_CASES, INITIAL_NSRC, MALAYSIAN_BANKS, OFFICER_SCORES, OfficerScore } from "./mockData";

export default function App() {
  // Staff accounts & Auth States
  const [staffAccounts, setStaffAccounts] = useState<any[]>(() => {
    const saved = localStorage.getItem("owl_staff_accounts_v4");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.some((u: any) => u.psid === "PS101435")) {
        return parsed;
      }
    }
    const initial = [
      {
        psid: "PS101435",
        name: "Zaim",
        role: "Admin",
        status: "Active",
        password: "Affin123",
        mustChangePassword: true,
      },
      {
        psid: "PS101436",
        name: "Faris",
        role: "Admin",
        status: "Active",
        password: "Affin123",
        mustChangePassword: true,
      },
      {
        psid: "PS101477",
        name: "Nabil",
        role: "Staff",
        status: "Active",
        password: "Affin123",
        mustChangePassword: true,
      },
      {
        psid: "PS101405",
        name: "Naja",
        role: "Staff",
        status: "Active",
        password: "Affin123",
        mustChangePassword: true,
      },
      {
        psid: "PS101480",
        name: "Izzat",
        role: "Staff",
        status: "Active",
        password: "Affin123",
        mustChangePassword: true,
      }
    ];
    localStorage.setItem("owl_staff_accounts_v4", JSON.stringify(initial));
    return initial;
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem("owl_current_user_v4");
    return saved ? JSON.parse(saved) : null;
  });

  // State variables backboned by standard localStorage
  const [cases, setCases] = useState<FMSCase[]>(() => {
    const saved = localStorage.getItem("owl_cases_v4");
    return saved ? JSON.parse(saved) : INITIAL_CASES;
  });

  const [nsrcEntries, setNsrcEntries] = useState<NSRCEntry[]>(() => {
    const saved = localStorage.getItem("owl_nsrc_entries_v4");
    return saved ? JSON.parse(saved) : INITIAL_NSRC;
  });

  const [sessionLogs, setSessionLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem("owl_session_logs_v4");
    if (saved) return JSON.parse(saved);
    const initial: any[] = [];
    localStorage.setItem("owl_session_logs_v4", JSON.stringify(initial));
    return initial;
  });

  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "CASE" | "DATABASE" | "SEARCH FI" | "NSRC" | "ADMIN">("CASE");

  // Save to persistence
  useEffect(() => {
    localStorage.setItem("owl_cases_v4", JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem("owl_nsrc_entries_v4", JSON.stringify(nsrcEntries));
  }, [nsrcEntries]);

  useEffect(() => {
    localStorage.setItem("owl_session_logs_v4", JSON.stringify(sessionLogs));
  }, [sessionLogs]);

  useEffect(() => {
    localStorage.setItem("owl_staff_accounts_v4", JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("owl_current_user_v4", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("owl_current_user_v4");
    }
  }, [currentUser]);

  // Global search & tools
  const [globalSearchCif, setGlobalSearchCif] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active officer session resolver
  const currentOfficer = currentUser || {
    psid: "PS101435",
    name: "Zaim",
    role: "Admin"
  };

  // Login Input State
  const [loginPsid, setLoginPsid] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Admin New Staff State
  const [newStaffPsid, setNewStaffPsid] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"Staff" | "Admin">("Staff");
  const [adminMessage, setAdminMessage] = useState("");

  // NSRC Autofill suggestion match state
  const [autofillSuggestion, setAutofillSuggestion] = useState<any | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // --- 1. CASE INGESTION & WORKFLOW STATES ---
  const [caseMode, setCaseMode] = useState<"CREATE" | "UPDATE">("CREATE");
  const [rawInput, setRawInput] = useState("");
  const [ingestStatus, setIngestStatus] = useState("WAITING_FOR_RAW_DATA");
  
  // Custom case state elements
  const [caseCif, setCaseCif] = useState("");
  const [caseAmount, setCaseAmount] = useState<number>(0);
  const [caseEventType, setCaseEventType] = useState("-");
  const [caseRiskScore, setCaseRiskScore] = useState("-");
  const [caseModeChannel, setCaseModeChannel] = useState("-");
  const [caseRuleId, setCaseRuleId] = useState("-");
  const [caseFmsStatus, setCaseFmsStatus] = useState("-");
  const [casePolicyAction, setCasePolicyAction] = useState("-");
  const [caseCreatedTime, setCaseCreatedTime] = useState("");
  const [caseAssignedTime, setCaseAssignedTime] = useState("");

  // Resolution & conditional formatting
  const [selectedPreset, setSelectedPreset] = useState("");
  const [callResponse, setCallResponse] = useState("");
  const [resolution, setResolution] = useState("");
  const [remarks, setRemarks] = useState("");

  // Timeline & calls (Update vs create state tracking)
  const [firstCallTime, setFirstCallTime] = useState("");
  const [firstCallRemarks, setFirstCallRemarks] = useState("");
  const [secondCallTime, setSecondCallTime] = useState("");
  const [secondCallRemarks, setSecondCallRemarks] = useState("");
  const [thirdCallTime, setThirdCallTime] = useState("");
  const [thirdCallRemarks, setThirdCallRemarks] = useState("");

  const [statusAction, setStatusAction] = useState("No status change...");
  const [escalateTeam, setEscalateTeam] = useState("No / Local Agent Only");

  // Multi-Preset Configurations defined in specifications
  const PRESET_OPTIONS = [
    {
      id: "Preset1",
      name: "Close Screen Verification / Assume Genuine - Manual",
      callResponse: "Close Screen Verification",
      resolution: "Assume Genuine - Manual",
      template: "Account reviewed, no susp activity seen, assume genuine, checks done."
    },
    {
      id: "Preset2",
      name: "Close Screen Verification / Assume Genuine - CC",
      callResponse: "Close Screen Verification",
      resolution: "Assume Genuine - CC",
      template: "Customer contacted CC to unlock FMS within 30 minutes."
    },
    {
      id: "Preset3",
      name: "Unable to Contact / In Progress",
      callResponse: "Unable to Contact",
      resolution: "In Progress",
      template: "Call Attempt Notes - Normal Called on [TIMESTAMP] but voicemail and inactive RIB locked. If customer calls in, kindly verify and confirm the red flag activity before unlocking."
    },
    {
      id: "Preset4",
      name: "Unable to Contact / Suspected Fraud",
      callResponse: "Unable to Contact",
      resolution: "Suspected Fraud",
      template: "Called on [TIMESTAMP] but voicemail. RIB locked. If customer calls in, kindly advise customer visit branch to preform biometric verification."
    },
    {
      id: "Preset5",
      name: "Contacted / Confirmed Genuine",
      callResponse: "Contacted",
      resolution: "Confirmed Genuine",
      template: "Customer contacted [TIMESTAMP] and confirmed log in to RIB and performed transfer with verify 2+1."
    },
    {
      id: "Preset6",
      name: "Contacted / Suspected Fraud",
      callResponse: "Contacted",
      resolution: "Suspected Fraud",
      template: "Customer contacted [TIMESTAMP] and advised to visit the branch for biometric verification. RIB locked."
    }
  ];

  // Apply chosen FMS preset configuration
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = PRESET_OPTIONS.find(p => p.id === presetId);
    if (found) {
      setCallResponse(found.callResponse);
      setResolution(found.resolution);
      
      // format template with current real-time timestamp if placeholders exist
      const nowString = new Date().toLocaleDateString("en-GB") + ", " + new Date().toLocaleTimeString("en-GB", { hour12: false });
      let formattedRemarks = found.template;
      formattedRemarks = formattedRemarks.replace(/\[timestamp\]/gi, nowString);
      formattedRemarks = formattedRemarks.replace(/\[TIMESTAMP\]/gi, nowString);
      setRemarks(formattedRemarks);
    } else {
      setCallResponse("");
      setResolution("");
      setRemarks("");
    }
  };

  // Raw FMS Data parsing triggering
  const handleParseRawData = () => {
    if (!rawInput.trim()) {
      setIngestStatus("PASTE_IS_EMPTY");
      return;
    }
    setIngestStatus("PARSING...");
    setTimeout(() => {
      const parsed = parseFMSInput(rawInput);
      setCaseCif(parsed.cif || "");
      setCaseAmount(parsed.amount || 0);
      setCaseEventType(parsed.eventType || "SUSPICIOUS_PAYMENT");
      setCaseRiskScore(parsed.riskScore || "85");
      setCaseModeChannel(parsed.modeChannel || "RIB_PORTAL");
      setCaseRuleId(parsed.ruleId || "AFFINRIBMY");
      setCaseFmsStatus(parsed.fmsStatus || "LOCKED");
      setCasePolicyAction(parsed.policyAction || "DENY");
      setCaseCreatedTime(parsed.caseCreatedTime || "");
      setCaseAssignedTime(parsed.caseAssignedTime || "");
      setIngestStatus("SUCCESSFULLY_PARSED");
    }, 350);
  };

  const handleClearRawPane = () => {
    setRawInput("");
    setIngestStatus("WAITING_FOR_RAW_DATA");
  };

  const handleResetUI = () => {
    setCaseCif("");
    setCaseAmount(0);
    setCaseEventType("-");
    setCaseRiskScore("-");
    setCaseModeChannel("-");
    setCaseRuleId("-");
    setCaseFmsStatus("-");
    setCasePolicyAction("-");
    setCaseCreatedTime("");
    setCaseAssignedTime("");
    setSelectedPreset("");
    setCallResponse("");
    setResolution("");
    setRemarks("");
    setFirstCallTime("");
    setFirstCallRemarks("");
    setSecondCallTime("");
    setSecondCallRemarks("");
    setThirdCallTime("");
    setThirdCallRemarks("");
    setRawInput("");
    setIngestStatus("WAITING_FOR_RAW_DATA");
  };

  // Save the FMS case inside system
  const handleCommitCaseEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseCif) {
      alert("CIF Identification is required.");
      return;
    }

    const newCase: FMSCase = {
      id: "fms-" + Date.now(),
      cif: caseCif,
      amount: Number(caseAmount),
      eventType: caseEventType === "-" ? "MANUAL_INGESTION" : caseEventType,
      riskScore: caseRiskScore === "-" ? "0" : caseRiskScore,
      modeChannel: caseModeChannel === "-" ? "CUSTOMER_CARE" : caseModeChannel,
      ruleId: caseRuleId === "-" ? "MANUAL_BYPASS" : caseRuleId,
      fmsStatus: caseFmsStatus === "-" ? "ACTIVE" : caseFmsStatus,
      assignedOfficer: currentOfficer.psid,
      policyAction: casePolicyAction === "-" ? "REVIEW" : casePolicyAction,
      caseCreatedTime: caseCreatedTime || new Date().toLocaleString(),
      caseAssignedTime: caseAssignedTime || new Date().toLocaleString(),
      callResponse,
      resolution,
      remarks,
      firstCallTime,
      firstCallRemarks,
      secondCallTime,
      secondCallRemarks,
      thirdCallTime,
      thirdCallRemarks,
      statusAction,
      escalateTeam,
      createdAt: new Date().toISOString()
    };

    // Replace if updating or exist already
    const existsIdx = cases.findIndex(c => c.cif === caseCif);
    if (caseMode === "UPDATE" && existsIdx >= 0) {
      const updated = [...cases];
      updated[existsIdx] = {
        ...updated[existsIdx],
        ...newCase,
        id: updated[existsIdx].id, // retain original ID
        createdAt: updated[existsIdx].createdAt // retain original registration stamp
      };
      setCases(updated);
      alert(`Case updated successfully for CIF: ${caseCif}`);
    } else {
      setCases([newCase, ...cases]);
      alert(`Case committed successfully for CIF: ${caseCif}`);
    }
    
    handleResetUI();
  };

  // Helper timestamps sets functions
  const handleSetCurrentTimestamp = (callIndex: 1 | 2 | 3) => {
    const nowString = new Date().toLocaleDateString("en-GB") + ", " + new Date().toLocaleTimeString("en-GB", { hour12: false });
    if (callIndex === 1) {
      setFirstCallTime(nowString);
      setFirstCallRemarks(prev => prev || "Call 1 Attempt initiated.");
    } else if (callIndex === 2) {
      setSecondCallTime(nowString);
      setSecondCallRemarks(prev => prev || "Call 2 Attempt initiated.");
    } else if (callIndex === 3) {
      setThirdCallTime(nowString);
      setThirdCallRemarks(prev => prev || "Call 3 Attempt completed.");
    }
  };

  const handleLoadCaseForUpdate = (cifNum: string) => {
    const found = cases.find(c => c.cif === cifNum);
    if (found) {
      setCaseCif(found.cif);
      setCaseAmount(found.amount);
      setCaseEventType(found.eventType);
      setCaseRiskScore(found.riskScore);
      setCaseModeChannel(found.modeChannel);
      setCaseRuleId(found.ruleId);
      setCaseFmsStatus(found.fmsStatus);
      setCasePolicyAction(found.policyAction);
      setCaseCreatedTime(found.caseCreatedTime);
      setCaseAssignedTime(found.caseAssignedTime);
      setCallResponse(found.callResponse);
      setResolution(found.resolution);
      setRemarks(found.remarks);
      setFirstCallTime(found.firstCallTime || "");
      setFirstCallRemarks(found.firstCallRemarks || "");
      setSecondCallTime(found.secondCallTime || "");
      setSecondCallRemarks(found.secondCallRemarks || "");
      setThirdCallTime(found.thirdCallTime || "");
      setThirdCallRemarks(found.thirdCallRemarks || "");
      setStatusAction(found.statusAction || "No status change...");
      setEscalateTeam(found.escalateTeam || "No / Local Agent Only");
      setCaseMode("UPDATE");
      setActiveTab("CASE");
      alert(`Case data loaded for CIF ${cifNum}. Edit values in the sidebar.`);
    } else {
      alert(`No record found in database of cases for CIF: ${cifNum}`);
    }
  };


  // --- 2. SEARCH FI STATES & ENGINE ---
  const [fiSearchTerm, setFiSearchTerm] = useState("");
  const [matchedBanks, setMatchedBanks] = useState<BankFI[]>([]);

  // Trigger search suggestion matching precision logic
  useEffect(() => {
    if (!fiSearchTerm.trim()) {
      setMatchedBanks([]);
      return;
    }
    const cleanNum = fiSearchTerm.trim().replace(/\s+/g, "");
    const len = cleanNum.length;

    // Calculate match probability
    const results = MALAYSIAN_BANKS.map((bank) => {
      let score = 30; // base score

      // length rules
      if (bank.code === "CIMB" && len === 14) score += 35;
      if (bank.code === "OCBC" && len === 10) score += 35;
      if (bank.code === "BAY" && len === 12) score += 35;
      if (bank.code === "PBB" && len === 10) score += 35;
      if (bank.code === "RHB" && len === 14) score += 30;
      if (bank.code === "AFFIN" && (len === 10 || len === 12)) score += 35;
      if (bank.code === "HLB" && len === 11) score += 35;
      if (bank.code === "AMB" && len === 13) score += 35;
      if (bank.code === "BIMB" && len === 14) score += 35;
      if (bank.code === "ALB" && len === 15) score += 35;

      // prefix patterns matching
      if (bank.code === "CIMB" && (cleanNum.startsWith("70") || cleanNum.startsWith("76") || cleanNum.startsWith("80") || cleanNum.startsWith("86"))) {
        score += 30;
      }
      if (bank.code === "BAY" && (cleanNum.startsWith("1") || cleanNum.startsWith("5") || cleanNum.startsWith("11") || cleanNum.startsWith("51") || cleanNum.startsWith("56"))) {
        score += 32;
      }
      if (bank.code === "PBB" && (cleanNum.startsWith("3") || cleanNum.startsWith("4") || cleanNum.startsWith("6"))) {
        score += 28;
      }
      if (bank.code === "AFFIN" && cleanNum.startsWith("10")) {
        score += 32;
      }
      if (bank.code === "AMB" && cleanNum.startsWith("88")) {
        score += 30;
      }
      if (bank.code === "BIMB" && cleanNum.startsWith("04")) {
        score += 30;
      }
      
      const capped = Math.min(score, 98); // Max precision capped at 98%
      return { ...bank, matchScore: capped };
    });

    // sort showing highest matched on top
    const filteredAndSorted = results
      .filter(b => b.matchScore > 35)
      .sort((a, b) => b.matchScore - a.matchScore);

    setMatchedBanks(filteredAndSorted);
  }, [fiSearchTerm]);


  // --- 3. NSRC INTEGRATION STATES ---
  const [nsrcAccNum, setNsrcAccNum] = useState("");
  const [nsrcCif, setNsrcCif] = useState("");
  const [nsrcRegNo, setNsrcRegNo] = useState("");
  const [nsrcName, setNsrcName] = useState("");
  const [nsrcBlockType, setNsrcBlockType] = useState("");
  const [nsrcBusinessUnit, setNsrcBusinessUnit] = useState("");
  const [nsrcClassification, setNsrcClassification] = useState("");
  const [nsrcBlockDesc, setNsrcBlockDesc] = useState("");
  const [nsrcEarmarkAmount, setNsrcEarmarkAmount] = useState("");
  const [nsrcEarmark, setNsrcEarmark] = useState("");
  const [nsrcRemarks, setNsrcRemarks] = useState("");
  const [nsrcReason, setNsrcReason] = useState("");
  const [nsrcDateStamp, setNsrcDateStamp] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Automated populating Based on prefix '1' of NSRC account number!
  useEffect(() => {
    if (!nsrcAccNum) return;
    
    if (nsrcAccNum.trim().startsWith("1")) {
      setNsrcBlockType("Account blocking, Acc Balance");
      setNsrcBusinessUnit("AffinMax");
      setNsrcClassification("Current");
      setNsrcRegNo("20260109658");
      setNsrcEarmarkAmount("RM1,450.00");
      setNsrcEarmark("Yes");
      setNsrcReason("SUSPECTED SCAM FUND TRACING");
      
      // format date stamps for code blocks
      const cleanDate = nsrcDateStamp || new Date().toISOString().split("T")[0];
      const stampParts = cleanDate.split("-"); // [YYYY, MM, DD]
      const ddmmyyyy = stampParts.length === 3 ? `${stampParts[2]}${stampParts[1]}${stampParts[0]}` : "12062026";
      const formattedDateText = stampParts.length === 3 ? `${stampParts[2]}/${stampParts[1]}/${stampParts[0]}` : "12/06/2026";
      
      setNsrcBlockDesc(`Total account block [${formattedDateText}]`);
      setNsrcRemarks(`SUSPECTED FRAUD SCAM NSRC DATED ${ddmmyyyy}`);
    }
  }, [nsrcAccNum, nsrcDateStamp]);

  const handleSaveNSRC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nsrcCif || !nsrcName || !nsrcAccNum) {
      alert("NSRC report registration requires Account number, CIF, and Name inputs.");
      return;
    }

    const newNSRC: NSRCEntry = {
      id: "nsrc-" + Date.now(),
      cif: nsrcCif,
      regNo: nsrcRegNo || "20260109658",
      name: nsrcName.toUpperCase(),
      accountNumber: nsrcAccNum,
      accountBlockingType: nsrcBlockType || "Account Block - General",
      businessUnit: nsrcBusinessUnit || "Retail Division",
      accountClassification: nsrcClassification || "Savings",
      statusBlockDesc: nsrcBlockDesc || `Account locked on registration`,
      earmarkAmount: nsrcEarmarkAmount || "RM0.00",
      earmark: nsrcEarmark || "No",
      remarks: nsrcRemarks || "NSRC SUSPECT BANNER ACTIVATED",
      reason: nsrcReason || "NSRC REQUESTED",
      dateStamp: nsrcDateStamp,
      createdAt: new Date().toISOString()
    };

    setNsrcEntries([newNSRC, ...nsrcEntries]);
    alert("NSRC Report saved in localized operational database.");
    
    // reset NSRC inputs
    setNsrcAccNum("");
    setNsrcCif("");
    setNsrcRegNo("");
    setNsrcName("");
    setNsrcBlockType("");
    setNsrcBusinessUnit("");
    setNsrcClassification("");
    setNsrcBlockDesc("");
    setNsrcEarmarkAmount("");
    setNsrcEarmark("");
    setNsrcRemarks("");
    setNsrcReason("");
  };

  // Real-time lookup for CIF/Account in standard case records or NSRC records for seamless auto-fill
  useEffect(() => {
    const searchCif = nsrcCif.trim();
    const searchAcc = nsrcAccNum.trim();
    
    if (!searchCif && !searchAcc) {
      setAutofillSuggestion(null);
      return;
    }
    
    let matchObj: any = null;
    let type: "CASE" | "NSRC" = "CASE";
    
    if (searchCif && searchCif.length >= 3) {
      const foundNsrc = nsrcEntries.find(n => n.cif === searchCif);
      if (foundNsrc) {
        matchObj = foundNsrc;
        type = "NSRC";
      } else {
        const foundCase = cases.find(c => c.cif === searchCif);
        if (foundCase) {
          matchObj = foundCase;
          type = "CASE";
        }
      }
    } else if (searchAcc && searchAcc.length >= 4) {
      const foundNsrc = nsrcEntries.find(n => n.accountNumber === searchAcc);
      if (foundNsrc) {
        matchObj = foundNsrc;
        type = "NSRC";
      }
    }
    
    if (matchObj) {
      setAutofillSuggestion({
        type: type,
        cif: matchObj.cif,
        name: type === "NSRC" ? matchObj.name : ("VALUED CLIENT " + matchObj.cif),
        accountNumber: type === "NSRC" ? matchObj.accountNumber : ("10" + matchObj.cif + "99"),
        blockType: type === "NSRC" ? matchObj.accountBlockingType : "Account blocking, Acc Balance",
        businessUnit: type === "NSRC" ? matchObj.businessUnit : "Retail Division",
        classification: type === "NSRC" ? matchObj.accountClassification : "Savings",
        blockDesc: type === "NSRC" ? matchObj.statusBlockDesc : `Total account block [${new Date().toLocaleDateString("en-GB")}]`,
        remarks: type === "NSRC" ? matchObj.remarks : `SUSPECTED FRAUD SCAM NSRC DATED ${new Date().toLocaleDateString("en-GB").replace(/\//g,"")}`,
        regNo: type === "NSRC" ? (matchObj.regNo || "20260109658") : "20260109658",
        earmarkAmount: type === "NSRC" ? (matchObj.earmarkAmount || "RM1,450.00") : `RM${matchObj.amount || "1,450.00"}`,
        earmark: type === "NSRC" ? (matchObj.earmark || "Yes") : "Yes",
        reason: type === "NSRC" ? (matchObj.reason || "SUSPECTED SCAM FUND TRACING") : "SUSPECTED SCAM FUND TRACING"
      });
    } else {
      setAutofillSuggestion(null);
    }
  }, [nsrcCif, nsrcAccNum, cases, nsrcEntries]);

  const handleApplyAutofill = () => {
    if (!autofillSuggestion) return;
    setNsrcCif(autofillSuggestion.cif);
    setNsrcName(autofillSuggestion.name.toUpperCase());
    setNsrcAccNum(autofillSuggestion.accountNumber);
    setNsrcBlockType(autofillSuggestion.blockType);
    setNsrcBusinessUnit(autofillSuggestion.businessUnit);
    setNsrcClassification(autofillSuggestion.classification);
    setNsrcBlockDesc(autofillSuggestion.blockDesc);
    setNsrcRemarks(autofillSuggestion.remarks);
    setNsrcRegNo(autofillSuggestion.regNo || "");
    setNsrcEarmarkAmount(autofillSuggestion.earmarkAmount || "");
    setNsrcEarmark(autofillSuggestion.earmark || "");
    setNsrcReason(autofillSuggestion.reason || "");
    setAutofillSuggestion(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const psidInput = loginPsid.trim().toUpperCase();
    
    // Restriction: Only authorized users can access this system
    const ALLOWED_PSIDS = ["PS101435", "PS101436", "PS101477", "PS101405", "PS101480"];
    if (!ALLOWED_PSIDS.includes(psidInput)) {
      setLoginError("Access Denied: This PSID is not authorized to access this system.");
      return;
    }

    const account = staffAccounts.find(s => s.psid.toUpperCase() === psidInput);
    if (!account) {
      setLoginError("Invalid PSID. Contact administrator for compliance clearance.");
      return;
    }
    if (account.password !== loginPassword) {
      setLoginError("Incorrect password. Default first-time password is 'Affin123'.");
      return;
    }
    
    // Log standard LOGIN event
    const newLog = {
      id: "log-" + Date.now(),
      psid: account.psid,
      name: account.name,
      action: "LOGIN",
      timestamp: new Date().toLocaleString(),
      details: `Session Authenticated (Role: ${account.role === "Admin" ? "Root Admin" : "Officer"})`
    };
    setSessionLogs(prev => [newLog, ...prev]);

    setCurrentUser(account);
    setLoginPsid("");
    setLoginPassword("");
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    // Verify old password
    const liveAccount = staffAccounts.find(s => s.psid === currentUser.psid);
    if (liveAccount && liveAccount.password !== oldPassword) {
      setPasswordError("The current password you entered is incorrect.");
      return;
    }
    if (newPassword === "Affin123") {
      setPasswordError("New password cannot be the insecure default 'Affin123'.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation fields do not match.");
      return;
    }
    
    const updatedStaff = staffAccounts.map(s => {
      if (s.psid === currentUser.psid) {
        return {
          ...s,
          password: newPassword,
          mustChangePassword: false
        };
      }
      return s;
    });
    
    setStaffAccounts(updatedStaff);
    
    const updatedUser = {
      ...currentUser,
      password: newPassword,
      mustChangePassword: false
    };
    setCurrentUser(updatedUser);
    
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    alert("Password successfully updated. Security compliance cleared!");
  };

  const handleLogout = () => {
    if (currentUser) {
      // Log LOGOUT event
      const newLog = {
        id: "log-" + Date.now(),
        psid: currentUser.psid,
        name: currentUser.name,
        action: "LOGOUT",
        timestamp: new Date().toLocaleString(),
        details: "Session Terminated"
      };
      setSessionLogs(prev => [newLog, ...prev]);
    }
    setCurrentUser(null);
    setActiveTab("CASE");
  };

  const handleCreateNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMessage("");
    const cleanPsid = newStaffPsid.trim().toUpperCase();
    if (!cleanPsid || !newStaffName) {
      setAdminMessage("Please fill in all officer details.");
      return;
    }
    if (!cleanPsid.startsWith("PS")) {
      setAdminMessage("Officer PSID must start with standard code prefix 'PS' (e.g. PS202409).");
      return;
    }
    
    // Restriction during admin additions
    const ALLOWED_PSIDS = ["PS101435", "PS101436", "PS101477", "PS101405", "PS101480"];
    if (!ALLOWED_PSIDS.includes(cleanPsid)) {
      setAdminMessage("Error: Only pre-authorized system compliance officers (Zaim, Faris, Nabil, Naja, Izzat) are allowed to access this system.");
      return;
    }

    if (staffAccounts.some(s => s.psid.toUpperCase() === cleanPsid)) {
      setAdminMessage("Officer with this PSID already registered.");
      return;
    }
    
    const newOfficer = {
      psid: cleanPsid,
      name: newStaffName.trim(),
      role: newStaffRole,
      status: "Active",
      password: "Affin123",
      mustChangePassword: true,
    };
    
    setStaffAccounts([...staffAccounts, newOfficer]);
    setNewStaffPsid("");
    setNewStaffName("");
    setAdminMessage(`Successfully registered officer ${newOfficer.name} (${newOfficer.psid}) with default password 'Affin123'!`);
  };

  const handleAdminResetPassword = (psid: string) => {
    const updated = staffAccounts.map(s => {
      if (s.psid === psid) {
        return {
          ...s,
          password: "Affin123",
          mustChangePassword: true
        };
      }
      return s;
    });
    setStaffAccounts(updated);
    
    if (currentUser && currentUser.psid === psid) {
      setCurrentUser({
        ...currentUser,
        password: "Affin123",
        mustChangePassword: true
      });
    }
    alert(`Successfully reset password for officer ${psid} back to 'Affin123'. They will be required to change it on their next login session.`);
  };

  const handleAdminDeleteStaff = (psid: string) => {
    if (psid === "PS101436") {
      alert("Error: Root administrator (PS101436) cannot be deleted.");
      return;
    }
    if (confirm(`Are you sure you want to delete staff account ${psid}?`)) {
      setStaffAccounts(staffAccounts.filter(s => s.psid !== psid));
      alert(`Staff account ${psid} deleted.`);
    }
  };

  const [nsrcToExport, setNsrcToExport] = useState<NSRCEntry | null>(null);
  const [exportPassword, setExportPassword] = useState("");
  const [passwordModalError, setPasswordModalError] = useState("");

  const triggerNSRCExport = (entry: NSRCEntry) => {
    setNsrcToExport(entry);
    setExportPassword("");
    setPasswordModalError("");
  };

  const handlePasswordModalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (exportPassword === "Affin123") {
      if (!nsrcToExport) return;
      const res = await downloadProtectedNSRCExcel(nsrcToExport);
      if (res.success) {
        setNsrcToExport(null);
        alert(`Success: Secure NSRC file decrypted and exported successfully as "${res.filename}"!`);
      } else {
        setPasswordModalError("Error generating workbook compilation.");
      }
    } else {
      setPasswordModalError("Access Denied: Incorrect password code.");
    }
  };

  const handleExportNSRCExcel = (entry: NSRCEntry) => {
    triggerNSRCExport(entry);
  };


  // --- 4. DYNAMIC ANALYTICS CALCULATIONS ---
  const totalFinancialValue = cases.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalFreudHighlight = cases.filter(c => c.resolution.toLowerCase().includes("fraud") || c.remarks.toLowerCase().includes("fraud")).length;
  const uniqueCifs = new Set(cases.map(c => c.cif)).size;
  const totalResolved = cases.filter(c => c.callResponse && c.resolution).length;

  // Filter cases & NSRC by CIF search
  const filteredCases = cases.filter(c => {
    if (!globalSearchCif) return true;
    return c.cif.includes(globalSearchCif) || c.ruleId.toLowerCase().includes(globalSearchCif.toLowerCase());
  });

  const filteredNSRC = nsrcEntries.filter(n => {
    if (!globalSearchCif) return true;
    return n.cif.includes(globalSearchCif) || n.accountNumber.includes(globalSearchCif) || n.name.toLowerCase().includes(globalSearchCif.toLowerCase());
  });

  // Dynamic conditional formatting helpers for Call Verification Area
  const getResolutionStyle = () => {
    const r = (callResponse || "").toLowerCase();
    const s = (resolution || "").toLowerCase();

    if (r.includes("close screen verification") || r.includes("close")) {
      if (s.includes("manual")) {
        return {
          bg: "bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-3xs",
          label: "Close Screen Verification • Assume Genuine - Manual",
          badge: "bg-emerald-600 text-white",
          desc: "Compliance Cleared. Account safe to unlock manually.",
          icon: "CheckCircle"
        };
      }
      if (s.includes("cc") || s.includes("contact center")) {
        return {
          bg: "bg-teal-50/90 border-teal-300 text-teal-900 shadow-3xs",
          label: "Close Screen Verification • Assume Genuine - CC",
          badge: "bg-teal-600 text-white",
          desc: "Customer contacted Call Center. Release locking protocols.",
          icon: "Smartphone"
        };
      }
    }
    
    if (r.includes("unable") || s.includes("progress")) {
      return {
        bg: "bg-amber-50/90 border-amber-300 text-amber-950 shadow-3xs",
        label: "Unable to Contact • Operational In Progress",
        badge: "bg-amber-500 text-amber-950",
        desc: "Active cooling period. Voicemail triggered. Inactive RIB remains locked.",
        icon: "Clock"
      };
    }

    if (s.includes("fraud") || s.includes("suspect")) {
      return {
        bg: "bg-red-50/90 border-red-300 text-red-950 shadow-3xs",
        label: "High Suspicion • Security Lock Required",
        badge: "bg-red-600 text-white",
        desc: "Advisable biometric / branch check in accordance with scam parameters.",
        icon: "AlertTriangle"
      };
    }

    if (r || s) {
      return {
        bg: "bg-blue-50/90 border-blue-200 text-blue-900 shadow-3xs",
        label: "Draft Resolution Process Active",
        badge: "bg-blue-600 text-white",
        desc: "Custom or user-modified active workflow state.",
        icon: "Info"
      };
    }

    return {
      bg: "bg-slate-50 border-slate-200 text-slate-500",
      label: "Awaiting Action Ingestion",
      badge: "bg-slate-500 text-white",
      desc: "Select preset dropdown or manual input response above to trigger validation formatting.",
      icon: "Shield"
    };
  };

  const getResolutionIcon = (iconName: string) => {
    switch (iconName) {
      case "CheckCircle":
        return <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />;
      case "Smartphone":
        return <Smartphone className="h-5 w-5 text-teal-600 shrink-0" />;
      case "Clock":
        return <Clock className="h-5 w-5 text-amber-600 shrink-0 animate-pulse" />;
      case "AlertTriangle":
        return <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 animate-bounce" />;
      case "Info":
        return <Info className="h-5 w-5 text-blue-600 shrink-0" />;
      default:
        return <Shield className="h-5 w-5 text-slate-400 shrink-0" />;
    }
  };

  const resStyle = getResolutionStyle();

  // Evaluate dynamic user authentication and security status
  const liveDBUser = currentUser ? staffAccounts.find(s => s.psid.toUpperCase() === currentUser.psid.toUpperCase()) : null;
  const enforcementRequired = liveDBUser ? liveDBUser.mustChangePassword : false;

  // 1. LOGIN SCREEN ENFORCEMENT
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        {/* Subtle decorative iOS-like light glowing backdrops */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-[360px] bg-white border border-[#e8e8ed] rounded-2xl p-6 md:p-8 shadow-xl relative z-10 transition-all">
          <div className="text-center mb-6">
            <div className="mx-auto bg-[#f5f5f7] p-3 rounded-2xl border border-[#e8e8ed] inline-flex items-center justify-center shadow-xs mb-3.5">
              <svg className="h-9 w-9 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21c-5 0-9-4-9-9 0-3 1.5-5 3.5-6.5L9 9h6l2.5-3.5c2 1.5 3.5 3.5 3.5 6.5 0 5-4 9-9 9Z" />
                <circle cx="8.5" cy="12.5" r="2.5" />
                <circle cx="15.5" cy="12.5" r="2.5" />
                <circle cx="8.5" cy="12.5" r="1" fill="currentColor" />
                <circle cx="15.5" cy="12.5" r="1" fill="currentColor" />
                <path d="m12 13 1 2h-2z" fill="currentColor" />
                <path d="M6 16c1.5 1 3.5 1 5 0M13 16c1.5 1 3.5 1 5 0" />
              </svg>
            </div>
            
            <h1 className="font-sans font-semibold text-xl tracking-tight text-[#1d1d1f]">
              Owl<span className="font-light text-slate-500">Fraudster</span>
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mt-1 font-semibold">Risk Ingestion Framework</p>
          </div>
          
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] py-2 px-3 rounded-xl mb-4 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <span className="font-medium">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold font-sans">Officer PSID</label>
              <input
                type="text"
                required
                value={loginPsid}
                onChange={(e) => setLoginPsid(e.target.value)}
                placeholder="e.g. PS101436"
                className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-3 py-2 text-xs text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
              />
            </div>
            
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold font-sans">Workspace Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-3 py-2 text-xs text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-98 text-white font-semibold py-2 rounded-lg text-xs transition-all shadow-md shadow-blue-500/10 tracking-wide flex items-center justify-center space-x-1.5 mt-2 cursor-pointer"
            >
              <span>Unlock Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>


        </div>
      </div>
    );
  }

  // 2. ONE-TIME PASSWORD COMPLIANCE ENFORCEMENT
  if (enforcementRequired) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-[360px] bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-xl relative z-20">
          <div className="text-center mb-5">
            <div className="mx-auto bg-red-50 p-3 rounded-2xl border border-red-100 inline-flex items-center justify-center mb-3">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="font-sans font-semibold text-lg tracking-tight text-[#1d1d1f]">Security Action Required</h2>
            <p className="text-[9px] uppercase font-mono tracking-widest text-slate-400 mt-0.5">Define Your Secure Passcode</p>
            <div className="bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg p-2.5 mt-3 text-left text-[10px] text-slate-650 leading-relaxed font-sans">
              Welcome, <span className="text-[#0071e3] font-bold">{currentUser.name}</span> (<span className="text-slate-800 font-mono">{currentUser.psid}</span>). As a secure compliance officer, please update the temporary password <span className="font-mono bg-white border px-1 rounded text-slate-755">Affin123</span> to continue.
            </div>
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-[10px] py-2 px-2.5 rounded-lg mb-3 flex items-center space-x-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">State Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Usually Affin123"
                className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-2.5 py-1.5 text-xs text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">New Secure Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-2.5 py-1.5 text-xs text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Must match exactly"
                className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-2.5 py-1.5 text-xs text-[#1d1d1f] placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold py-2 rounded-lg text-xs transition-all tracking-wide flex items-center justify-center space-x-1.5 mt-1 pointer-events-auto cursor-pointer shadow-md shadow-blue-500/5"
            >
              <Shield className="h-4 w-4" />
              <span>Update & Unlock Session</span>
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-[10px] text-slate-400 hover:text-slate-650 transition-all underline font-medium"
            >
              Return to Login Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col antialiased">
      {/* HEADER BAR */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#e8e8ed] sticky top-0 z-50 px-5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[#1d1d1f]">
        <div className="flex items-center space-x-3.5">
          <div className="bg-[#1d1d1f] p-1.5 rounded-xl flex items-center justify-center shadow-md shadow-black/5">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21c-5 0-9-4-9-9 0-3 1.5-5 3.5-6.5L9 9h6l2.5-3.5c2 1.5 3.5 3.5 3.5 6.5 0 5-4 9-9 9Z" />
              <circle cx="8.5" cy="12.5" r="2.5" />
              <circle cx="15.5" cy="12.5" r="2.5" />
              <circle cx="8.5" cy="12.5" r="1" fill="currentColor" />
              <circle cx="15.5" cy="12.5" r="1" fill="currentColor" />
              <path d="m12 13 1 2h-2z" fill="currentColor" />
              <path d="M6 16c1.5 1 3.5 1 5 0M13 16c1.5 1 3.5 1 5 0" />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="font-sans font-bold text-base tracking-tight text-[#1d1d1f]">Owl</span>
              <span className="font-sans font-light text-base tracking-tight text-slate-500">Fraudster</span>
            </div>
            <span className="hidden sm:inline-block text-[9px] uppercase tracking-widest text-slate-400 font-semibold font-sans">Risk Ingestion Framework</span>
          </div>
        </div>

        {/* APPLE SEGMENTED CONTROL TAB BAR */}
        <nav className="bg-[#e3e3e6] p-0.5 rounded-lg flex space-x-0.5 items-center border border-black/5">
          {((currentUser?.role === "Admin")
            ? ["DASHBOARD", "CASE", "DATABASE", "SEARCH FI", "NSRC", "ADMIN"] as const
            : ["DASHBOARD", "CASE", "DATABASE", "SEARCH FI", "NSRC"] as const
          ).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                id={`nav-link-${tab.toLowerCase().replace(" ", "-")}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-[6px] text-xs transition-all tracking-normal outline-none cursor-pointer select-none ${
                  isActive
                    ? "bg-white text-[#1d1d1f] font-semibold shadow-xs border border-black/5"
                    : "text-slate-650 hover:text-[#1d1d1f] font-medium"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        {/* ACTIVE AGENT SIGNATURE & LOGOUT */}
        <div className="flex items-center space-x-3.5 text-xs">
          <div className="hidden lg:flex flex-col text-right leading-tight">
            <span className="font-semibold text-slate-800">{currentOfficer.name} <span className="font-mono text-slate-500 text-[11px]">({currentOfficer.psid})</span></span>
            <span className="text-[9px] text-slate-400 uppercase font-semibold">{currentOfficer.role} Account</span>
          </div>
          <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 uppercase shadow-3xs">
            {currentOfficer.name[0]}
          </div>
          <button
            onClick={handleLogout}
            className="bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] hover:border-[#acacb1] text-[#1d1d1f] px-2.5 py-1 rounded-md text-[10px] font-medium shadow-3xs transition-all cursor-pointer font-sans"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* COMPACT FLOATING CLIPBOARD TOOLTIP */}
      <AnimatePresence>
        {copiedText && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border border-[#e8e8ed] text-slate-800 text-xs px-4.5 py-2.5 rounded-full shadow-lg flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-slate-800">{copiedText} copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* CORE WORKSPACE container */}
      <main className="flex-1 p-5 max-w-[1600px] w-full mx-auto flex flex-col space-y-4 font-sans">
        
        {/* GLOBAL CIF SEARCH BAR AVAILABLE ALWAYS */}
        <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-[#e8e8ed] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Operational Status:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Secure Database Ingestor Active
            </span>
          </div>
 
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <input
              id="cif-global-search"
              type="text"
              placeholder="Search database records by CIF..."
              value={globalSearchCif}
              onChange={(e) => setGlobalSearchCif(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#f5f5f7] border border-[#e8e8ed] text-xs rounded-full focus:border-[#0071e3] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-sans placeholder-slate-400"
            />
            {globalSearchCif && (
              <button 
                onClick={() => setGlobalSearchCif("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* TAB WORKSPACES CHOREOGRAPHIES */}
        <AnimatePresence mode="wait">
          
          {/* 1. DASHBOARD VIEW */}
          {activeTab === "DASHBOARD" && (
            <motion.div
              key="tab-dashboard"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* TOP METRICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. FINANCIAL VALUE */}
                <div id="stat-financial-value" className="bg-white p-5 rounded-2xl border border-[#e8e8ed] shadow-xs hover:shadow-sm transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Day Financial Value</p>
                      <h3 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 font-sans">
                        RM {totalFinancialValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div className="bg-[#0071e3]/10 p-2 rounded-xl text-[#0071e3] shadow-3xs">
                      <Coins className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-2.5 text-[10px] text-slate-500 flex items-center space-x-1.5 font-sans">
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">RM {cases.length > 0 ? (totalFinancialValue / cases.length).toFixed(0) : 0} avg</span>
                    <span>per raw ingestion</span>
                  </div>
                </div>

                {/* 2. FRAUDS LOCKED */}
                <div id="stat-frauds-highlight" className="bg-white p-5 rounded-2xl border border-[#e8e8ed] shadow-xs hover:shadow-sm transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Day Frauds Highlight</p>
                      <h3 className="text-2xl font-bold tracking-tight mt-1 text-[#ff3b30] font-sans">
                        {totalFreudHighlight}
                      </h3>
                    </div>
                    <div className="bg-[#ff3b30]/10 p-2 rounded-xl text-[#ff3b30] shadow-3xs">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-2.5 text-[10px] text-slate-500 flex items-center space-x-1.5 font-sans">
                    <span className="text-[#ff3b30] font-bold bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">Risk Mitigation:</span>
                    <span>{cases.filter(c => c.statusAction === "LOCKED" && c.resolution.toLowerCase().includes("fraud")).length} locked</span>
                  </div>
                </div>

                {/* 3. TOTAL UNIQUE CIFS */}
                <div id="stat-total-cifs" className="bg-white p-5 rounded-2xl border border-[#e8e8ed] shadow-xs hover:shadow-sm transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Day Total CIFs</p>
                      <h3 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 font-sans">
                        {uniqueCifs}
                      </h3>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 shadow-3xs">
                      <UserCheck className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-3.5 text-[10px] text-slate-400 font-sans">
                    <span>Active client targets flagged in logs</span>
                  </div>
                </div>

                {/* 4. TOTAL RESOLVED */}
                <div id="stat-resolved-cases" className="bg-white p-5 rounded-2xl border border-[#e8e8ed] shadow-xs hover:shadow-sm transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Day Resolved Cases</p>
                      <h3 className="text-2xl font-bold tracking-tight mt-1 text-[#34c759] font-sans">
                        {totalResolved}
                      </h3>
                    </div>
                    <div className="bg-[#34c759]/10 p-2 rounded-xl text-[#34c759] shadow-3xs">
                      <CheckCircle className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-2.5 text-[10px] text-slate-500 flex items-center space-x-1.5 font-sans">
                    <span className="bg-[#34c759]/5 border border-[#34c759]/20 px-1.5 py-0.5 rounded-md font-semibold text-[#34c759]">{Math.round((totalResolved / (cases.length || 1)) * 100)}%</span>
                    <span>resolution response rate</span>
                  </div>
                </div>

              </div>

              {/* DASHBOARD trend visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Visualizer 1 - CHRONOLOGICAL CASES DAILY TREND (SHARP LINE GRAPH) */}
                <div className="bg-white p-5 rounded-2xl border border-[#e8e8ed] shadow-xs lg:col-span-2">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#f5f5f7]">
                    <div>
                      <h4 className="font-sans font-semibold text-xs text-slate-800 uppercase tracking-wider">Chronological Daily Cases Ingestion Loads</h4>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">Sharp-edge daily tracking of total financial exposures</p>
                    </div>
                    <span className="text-[9px] bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md font-sans font-semibold text-indigo-700 uppercase tracking-wide">Sharp Daily Edge</span>
                  </div>
                  
                  {/* Real-time calculated Sharp SVG Line Graph */}
                  {(() => {
                    const chartData = [
                      { date: "Jun 5", count: 3, val: 54000 },
                      { date: "Jun 6", count: 1, val: 12000 },
                      { date: "Jun 7", count: 4, val: 84000 },
                      { date: "Jun 8", count: 2, val: 40000 },
                      { date: "Jun 9", count: 8, val: 130000 },
                      { date: "Jun 10", count: 5, val: 95000 },
                      { date: "Jun 11", count: 9, val: 198000 },
                      { date: "Jun 12", count: cases.length, val: totalFinancialValue }
                    ];

                    const maxVal = Math.max(...chartData.map(d => d.val), 200000);
                    const width = 600;
                    const height = 150;
                    const padX = 40;
                    const padY = 25;
                    const effW = width - padX * 2;
                    const effH = height - padY * 2;

                    // Compute points coordinates
                    const points = chartData.map((item, idx) => {
                      const x = padX + idx * (effW / (chartData.length - 1));
                      const y = height - padY - (item.val / maxVal) * effH;
                      return { x, y, ...item };
                    });

                    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");
                    const pathArea = `${padX},${height - padY} ${polylinePoints} ${width - padX},${height - padY}`;

                    return (
                      <div className="mt-4 flex flex-col">
                        <div className="relative w-full overflow-hidden" style={{ height: "160px" }}>
                          {/* Main SVG drawing board */}
                          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full animate-fade-in" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="sharp-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0071e3" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#0071e3" stopOpacity="0.01" />
                              </linearGradient>
                            </defs>

                            {/* Guideline Y ticks */}
                            {[0, 0.5, 1].map((ratio, i) => {
                              const y = padY + ratio * effH;
                              return (
                                <line 
                                  key={i} 
                                  x1={padX} 
                                  y1={y} 
                                  x2={width - padX} 
                                  y2={y} 
                                  stroke="#f0f1f3" 
                                  strokeWidth="1" 
                                  strokeDasharray="4 4" 
                                />
                              );
                            })}

                            {/* Guideline X ticks */}
                            {points.map((p, i) => (
                              <line 
                                key={i} 
                                x1={p.x} 
                                y1={padY} 
                                x2={p.x} 
                                y2={height - padY} 
                                stroke="#f5f5f7" 
                                strokeWidth="1" 
                                strokeDasharray="3 3" 
                              />
                            ))}

                            {/* Shadowed fill area (sharp polygon) */}
                            <polygon points={pathArea} fill="url(#sharp-grad)" />

                            {/* Crisp sharp line connection */}
                            <polyline 
                              points={polylinePoints} 
                              fill="none" 
                              stroke="#0071e3" 
                              strokeWidth="2.8" 
                              className="stroke-linecap-round stroke-linejoin-miter"
                            />

                            {/* Vertices indicator circles */}
                            {points.map((p, i) => (
                              <circle 
                                key={i} 
                                cx={p.x} 
                                cy={p.y} 
                                r="4.5" 
                                fill="#ffffff" 
                                stroke="#0071e3" 
                                strokeWidth="2.2" 
                                className="transition-all hover:r-6 cursor-pointer"
                              />
                            ))}
                          </svg>

                          {/* Hover elements overlay */}
                          <div className="absolute inset-0 top-[25px] bottom-[25px] left-[40px] right-[40px] flex justify-between pointer-events-none">
                            {points.map((p, i) => {
                              const pctLeft = ((p.x - padX) / effW) * 100;
                              return (
                                <div 
                                  key={i}
                                  className="absolute group pointer-events-auto cursor-pointer"
                                  style={{ 
                                    left: `calc(${pctLeft}% - 20px)`, 
                                    width: "40px", 
                                    height: "100px",
                                    top: "0" 
                                  }}
                                >
                                  {/* Custom Tooltip on Hover */}
                                  <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 bg-slate-900 border border-slate-800 text-white p-2 rounded-xl text-center shadow-lg -top-16 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap min-w-28 select-none">
                                    <p className="font-sans font-bold text-[9px] text-[#34c759] uppercase tracking-wider">{p.date}</p>
                                    <p className="font-sans text-[11px] font-bold mt-0.5">{p.count} Active Cases</p>
                                    <p className="font-mono text-[10px] text-slate-300">RM {p.val.toLocaleString()}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* X-Axis labels */}
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 px-7 mt-1.5 border-t border-slate-50 pt-1">
                          {chartData.map((item, idx) => (
                            <span key={idx} className="font-sans select-none">{item.date}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Visualizer 2 - EVENT TYPE DISTRIBUTION RING */}
                <div className="bg-white p-5 rounded-2xl border border-[#e8e8ed] shadow-xs flex flex-col">
                  <div className="pb-3 border-b border-[#f5f5f7]">
                    <h4 className="font-sans font-semibold text-xs text-slate-800 uppercase tracking-wider">Day Resolution Mix</h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">Overall decisions parsed on daily logs</p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center py-4">
                    <div className="relative h-32 w-32 flex items-center justify-center">
                      {/* Simple CSS ring or graphics */}
                      <svg className="absolute transform -rotate-90" width="120" height="120" viewBox="0 0 100 100">
                        {/* Circle background */}
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e8e8ed" strokeWidth="8" />
                        {/* Segment 1: Confirmed Fraud (Red) */}
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="transparent" 
                          stroke="#ef4444" 
                          strokeWidth="8" 
                          strokeDasharray="251.2" 
                          strokeDashoffset={`${251.2 * (1 - (cases.filter(c => c.resolution.includes("Suspected") || c.resolution.includes("Fraud")).length / (cases.length || 1)))}`}
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-3xl font-mono font-bold text-slate-900">{cases.length}</span>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400">Total Entries</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="flex items-center text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                        Suspected/Confirmed Fraud
                      </span>
                      <span className="font-bold font-mono text-slate-700">{cases.filter(c => c.resolution.toLowerCase().includes("fraud") || c.remarks.toLowerCase().includes("fraud")).length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="flex items-center text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                        Confirmed/Assume Genuine
                      </span>
                      <span className="font-bold font-mono text-slate-700">{cases.filter(c => c.resolution.toLowerCase().includes("genuine") || c.remarks.toLowerCase().includes("genuine")).length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="flex items-center text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                        In Progress Calls
                      </span>
                      <span className="font-bold font-mono text-slate-700">{cases.filter(c => c.resolution.toLowerCase().includes("progress")).length}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* OFFICER STATS SCORECARD */}
              <div id="stat-scorecard-table" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-semibold text-xs text-slate-800 uppercase tracking-wider">PSID Team Daily Scorecard Graph</h4>
                    <p className="text-[10px] text-slate-400">Real-time status tracking per security officer</p>
                  </div>
                  <button 
                    onClick={() => {
                      alert("Daily PSID Excel log compiler triggering...");
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded hover:bg-slate-700 transition"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Excel Log</span>
                  </button>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                        <th className="px-3 py-2">Officer PSID</th>
                        <th className="px-3 py-2 text-center text-red-600">Confirm Fraud</th>
                        <th className="px-3 py-2 text-center text-amber-500">Suspected Fraud</th>
                        <th className="px-3 py-2 text-center text-green-600">Confirm Genuine</th>
                        <th className="px-3 py-2 text-center text-blue-600">Assume Genuine</th>
                        <th className="px-3 py-2 text-center">Total Workload</th>
                        <th className="px-3 py-2 text-center text-indigo-600">Contacted</th>
                        <th className="px-3 py-2 text-center text-slate-500">No Contact</th>
                        <th className="px-3 py-2 text-center">Close Manual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {OFFICER_SCORES.map((score) => {
                        const isCurrent = score.psid === currentOfficer.psid;
                        return (
                          <tr key={score.psid} className={`hover:bg-slate-50 transition-colors ${isCurrent ? "bg-amber-50/40" : ""}`}>
                            <td className="px-3 py-2.5 font-bold text-slate-800 flex items-center space-x-1.5">
                              {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>}
                              <span>{score.psid}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({score.name})</span>
                            </td>
                            <td className="px-3 py-2.5 text-center font-semibold text-red-600 font-mono">{score.confirmFraud}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-amber-600 font-mono">{score.suspectedFraud}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-green-600 font-mono">{score.confirmGenuine}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-blue-600 font-mono">{score.assumeGenuine}</td>
                            <td className="px-3 py-2.5 text-center font-bold font-mono">{score.totalWorkload}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-indigo-600 font-mono">{score.contacted}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-slate-500 font-mono">{score.noContact}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-slate-700 font-mono">{score.closeManual}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}


          {/* 2. CASE VIEW (COMPACT DESIGN, NO SCROLLING DOWN) */}
          {activeTab === "CASE" && (
            <motion.div
              key="tab-case"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* SUB HEADER ACTIONS */}
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-3xs flex items-center justify-between">
                <div className="flex space-x-1">
                  <button
                    id="case-btn-create"
                    onClick={() => {
                      setCaseMode("CREATE");
                    }}
                    className={`flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                      caseMode === "CREATE"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>CREATE CASE</span>
                  </button>
                  <button
                    id="case-btn-update"
                    onClick={() => {
                      setCaseMode("UPDATE");
                    }}
                    className={`flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                      caseMode === "UPDATE"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>UPDATE CASE</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider flex items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  Active Mode: <strong className="text-slate-700 ml-1">{caseMode} CASE MODE</strong>
                </div>
              </div>

              {/* THREE-COLUMN INTEGRATED COMPACT WORKSPACE */}
              <form onSubmit={handleCommitCaseEntry} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* COLUMN 1 (4 cols Span) - RAW INGESTION */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col lg:col-span-3 min-h-[460px]">
                  <div className="pb-2.5 border-b border-slate-100 mb-3 flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">RAW INGESTION</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Paste the complete row copy-pasted directly from your FMS dashboard to parse instantly.
                  </p>
                  
                  <textarea
                    id="raw-ingest-text"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder="Paste FMS raw data rows/columns here..."
                    className="flex-1 w-full p-2 bg-slate-50 border border-slate-200 text-xs font-mono rounded-md focus:outline-none focus:border-indigo-500 resize-none mb-3 h-48 lg:h-auto"
                  />

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button
                      id="btn-parse-data"
                      type="button"
                      onClick={handleParseRawData}
                      className="w-full text-center py-2 bg-slate-800 font-bold text-white text-[11px] rounded hover:bg-slate-700 transition"
                    >
                      PARSE RAW DATA
                    </button>
                    <button
                      id="btn-clear-pane"
                      type="button"
                      onClick={handleClearRawPane}
                      className="w-full text-center py-2 bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[11px] rounded hover:bg-slate-200 transition"
                    >
                      CLEAR RAW PANE
                    </button>
                  </div>
                </div>


                {/* COLUMN 2 (4 cols Span) - SYSTEM METADATA AUTOMATED VIEW (READONLY) */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col lg:col-span-4 min-h-[460px]">
                  <div className="pb-2.5 border-b border-slate-100 mb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">SYSTEM METADATA</h4>
                    </div>
                    {caseMode === "UPDATE" && (
                      <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase">
                        Case Selection Pending
                      </span>
                    )}
                  </div>

                  {/* ONLY EDITABLE ARE CIF (with copy feature) and AMOUNT */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CIF Number / User ID</label>
                      <div className="relative">
                        <input
                          id="meta-input-cif"
                          type="text"
                          required
                          value={caseCif}
                          onChange={(e) => setCaseCif(e.target.value)}
                          placeholder="Enter CIF..."
                          className="w-full pl-2 pr-8 py-1.5 border border-slate-300 rounded font-mono font-bold text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                        />
                        {caseCif && (
                          <button
                            type="button"
                            onClick={() => handleCopy(caseCif, `CIF ${caseCif}`)}
                            title="Click to copy CIF"
                            className="absolute right-1 top-1 p-1 rounded hover:bg-slate-100 text-blue-600 cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (RM)</label>
                      <input
                        id="meta-input-amount"
                        type="number"
                        value={caseAmount || ""}
                        onChange={(e) => setCaseAmount(Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-bold text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex-1 space-y-2.5 text-xs overflow-y-auto">
                    <h5 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 font-mono pb-1 border-b border-slate-200">
                      Parsed FMS Fields (Read-Only)
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Event Type:</span>
                        <span className="font-medium text-slate-800 text-[11px] block font-mono bg-white px-2 py-0.5 rounded border border-slate-100 truncate">{caseEventType}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Risk Score:</span>
                        <span className="font-mono font-bold text-[11px] block text-red-600 bg-white px-2 py-0.5 rounded border border-slate-100">{caseRiskScore}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Mode / Channel:</span>
                        <span className="font-medium text-slate-800 text-[11px] block font-mono bg-white px-2 py-0.5 rounded border border-slate-100 truncate">{caseModeChannel}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Rule ID:</span>
                        <span className="font-semibold text-slate-800 text-[11px] block font-mono bg-white px-2 py-0.5 rounded border border-slate-100 truncate">{caseRuleId}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">FMS Case Status:</span>
                        <span className="font-bold text-[10px] block font-mono bg-white px-2 py-0.5 rounded border border-slate-100 truncate text-amber-600">{caseFmsStatus}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Assigned Officer:</span>
                        <span className="font-semibold text-slate-800 text-[11px] block font-mono bg-white px-2 py-0.5 rounded border border-slate-100">{currentOfficer.psid}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Policy Action:</span>
                      <span className="font-semibold text-xs block font-mono text-red-700 bg-white px-2 py-0.5 rounded border border-slate-100">{casePolicyAction}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Case Created Time:</span>
                      <span className="font-mono text-[10px] text-slate-600 block bg-white px-2 py-0.5 rounded border border-slate-100">{caseCreatedTime || "-"}</span>
                    </div>

                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Case Assigned Time:</span>
                      <span className="font-mono text-[10px] text-slate-600 block bg-white px-2 py-0.5 rounded border border-slate-100">{caseAssignedTime || "-"}</span>
                    </div>

                  </div>

                  <div className="mt-3 pt-2 text-[10px] text-slate-400 text-center font-mono uppercase bg-slate-50 rounded border border-slate-100 py-1">
                    Ingestion Status: <strong className="text-slate-600">{ingestStatus}</strong>
                  </div>
                </div>


                {/* COLUMN 3 (5 cols Span) - RESOLUTION & CONDITIONAL FORMATTED PRESETS */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col lg:col-span-5 min-h-[460px]">
                  <div className="pb-2.5 border-b border-slate-100 mb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <PhoneCall className="h-4 w-4 text-emerald-500" />
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">VERIFICATION WORKFLOW</h4>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold uppercase">Compact view</span>
                  </div>

                  {/* PRESET INTEGRATED DROPDOWN */}
                  <div className="mb-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      FMS Call & Resolution Presets
                    </label>
                    <select
                      id="fms-preset-select"
                      value={selectedPreset}
                      onChange={(e) => handlePresetSelect(e.target.value)}
                      className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-emerald-500 bg-emerald-50/20 text-slate-800"
                    >
                      <option value="">Select Preset (populates Response, Status, Remarks)...</option>
                      {PRESET_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* READONLY AUTOLOAD FIELDS BASED ON OPTION (but can be manually filled) */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Call Response</label>
                      <input
                        id="call-response"
                        type="text"
                        value={callResponse}
                        onChange={(e) => setCallResponse(e.target.value)}
                        placeholder="e.g. In Progress"
                        className="w-full px-2 py-1.5 border border-slate-200 bg-slate-100/50 rounded text-slate-800 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Resolution</label>
                      <input
                        id="call-resolution"
                        type="text"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="e.g. Suspected"
                        className="w-full px-2 py-1.5 border border-slate-200 bg-slate-100/50 rounded text-slate-800 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* ACTIVE CONDITIONAL FORMATTING WORKFLOW DIAGNOSTIC BADGE */}
                  <div className={`mb-3 p-2.5 rounded-lg border flex items-center space-x-2.5 transition-all duration-300 ${resStyle.bg}`}>
                    <div className="shadow-xs bg-white p-1.5 rounded-md flex items-center justify-center border border-slate-100">
                      {getResolutionIcon(resStyle.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] tracking-wider font-mono uppercase font-black opacity-60">Status Validation</span>
                        <span className="text-[8px] bg-slate-900/10 font-bold px-1.5 py-0.2 rounded font-mono truncate uppercase">Real-Time</span>
                      </div>
                      <span className="block font-sans font-bold text-[11px] truncate leading-tight mt-0.5">{resStyle.label}</span>
                      <p className="text-[9px] font-medium opacity-80 truncate leading-tight mt-0.5">{resStyle.desc}</p>
                    </div>
                  </div>

                  {/* TIMELINE HISTORY CALL TRIGGERS: 1st, 2nd, 3rd calls */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-2 space-y-2">
                    <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                      Call Attempt History Logs
                    </span>

                    {caseMode === "CREATE" ? (
                      /* Create Mode: Standard Log fields */
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1">
                          <span className="text-[9px] font-bold text-slate-400 w-11">1st Call:</span>
                          <button
                            type="button"
                            onClick={() => handleSetCurrentTimestamp(1)}
                            className="bg-slate-200 hover:bg-slate-300 p-1 rounded hover:text-blue-600 transition"
                            title="Set current time"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <input
                            id="field-call-1-time"
                            type="text"
                            placeholder="Timestamp (automatic)"
                            value={firstCallTime}
                            onChange={(e) => setFirstCallTime(e.target.value)}
                            className="flex-1 px-1.5 py-0.5 border border-slate-200 bg-white rounded font-mono text-[10px]"
                          />
                          <input
                            type="text"
                            placeholder="1st attempt specific notes..."
                            value={firstCallRemarks}
                            onChange={(e) => setFirstCallRemarks(e.target.value)}
                            className="w-32 px-1.5 py-0.5 border border-slate-200 bg-white rounded text-[10px]"
                          />
                        </div>

                        <div className="flex items-center space-x-1">
                          <span className="text-[9px] font-bold text-slate-400 w-11">2nd Call:</span>
                          <button
                            type="button"
                            onClick={() => handleSetCurrentTimestamp(2)}
                            className="bg-slate-200 hover:bg-slate-300 p-1 rounded hover:text-blue-600 transition"
                            title="Set current time"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <input
                            id="field-call-2-time"
                            type="text"
                            placeholder="Timestamp"
                            value={secondCallTime}
                            onChange={(e) => setSecondCallTime(e.target.value)}
                            className="flex-1 px-1.5 py-0.5 border border-slate-200 bg-white rounded font-mono text-[10px]"
                          />
                          <input
                            type="text"
                            placeholder="2nd attempt specific notes..."
                            value={secondCallRemarks}
                            onChange={(e) => setSecondCallRemarks(e.target.value)}
                            className="w-32 px-1.5 py-0.5 border border-slate-200 bg-white rounded text-[10px]"
                          />
                        </div>

                        <div className="flex items-center space-x-1">
                          <span className="text-[9px] font-bold text-slate-400 w-11">3rd Call:</span>
                          <button
                            type="button"
                            onClick={() => handleSetCurrentTimestamp(3)}
                            className="bg-slate-200 hover:bg-slate-300 p-1 rounded hover:text-blue-600 transition"
                            title="Set current time"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <input
                            id="field-call-3-time"
                            type="text"
                            placeholder="Timestamp"
                            value={thirdCallTime}
                            onChange={(e) => setThirdCallTime(e.target.value)}
                            className="flex-1 px-1.5 py-0.5 border border-slate-200 bg-white rounded font-mono text-[10px]"
                          />
                          <input
                            type="text"
                            placeholder="3rd attempt specific notes..."
                            value={thirdCallRemarks}
                            onChange={(e) => setThirdCallRemarks(e.target.value)}
                            className="w-32 px-1.5 py-0.5 border border-slate-200 bg-white rounded text-[10px]"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Update Mode: Side-by-side Remarks table */
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-5 flex items-center space-x-1">
                            <span className="text-[9px] font-bold text-slate-500 w-6">1st:</span>
                            <button
                              type="button"
                              onClick={() => handleSetCurrentTimestamp(1)}
                              className="bg-slate-200 p-1 rounded hover:bg-slate-300 text-blue-600 shrink-0"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="text"
                              placeholder="Timestamp"
                              value={firstCallTime}
                              onChange={(e) => setFirstCallTime(e.target.value)}
                              className="w-full px-1 py-0.5 border border-slate-200 bg-white rounded font-mono text-[10px]"
                            />
                          </div>
                          <div className="col-span-7">
                            <input
                              type="text"
                              placeholder="Remarks side-by-side 1st Call"
                              value={firstCallRemarks}
                              onChange={(e) => setFirstCallRemarks(e.target.value)}
                              className="w-full px-1.5 py-0.5 border border-slate-200 bg-amber-50 rounded text-[10px] italic font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-5 flex items-center space-x-1">
                            <span className="text-[9px] font-bold text-slate-500 w-6">2nd:</span>
                            <button
                              type="button"
                              onClick={() => handleSetCurrentTimestamp(2)}
                              className="bg-slate-200 p-1 rounded hover:bg-slate-300 text-blue-600 shrink-0"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="text"
                              value={secondCallTime}
                              onChange={(e) => setSecondCallTime(e.target.value)}
                              placeholder="Timestamp"
                              className="w-full px-1 py-0.5 border border-slate-200 bg-white rounded font-mono text-[10px]"
                            />
                          </div>
                          <div className="col-span-7">
                            <input
                              type="text"
                              placeholder="Remarks side-by-side 2nd Call"
                              value={secondCallRemarks}
                              onChange={(e) => setSecondCallRemarks(e.target.value)}
                              className="w-full px-1.5 py-0.5 border border-slate-200 bg-amber-50 rounded text-[10px] italic font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-5 flex items-center space-x-1">
                            <span className="text-[9px] font-bold text-slate-500 w-6">3rd:</span>
                            <button
                              type="button"
                              onClick={() => handleSetCurrentTimestamp(3)}
                              className="bg-slate-200 p-1 rounded hover:bg-slate-300 text-blue-600 shrink-0"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="text"
                              placeholder="Timestamp"
                              value={thirdCallTime}
                              onChange={(e) => setThirdCallTime(e.target.value)}
                              className="w-full px-1 py-0.5 border border-slate-200 bg-white rounded font-mono text-[10px]"
                            />
                          </div>
                          <div className="col-span-7">
                            <input
                              type="text"
                              placeholder="Remarks side-by-side 3rd Call"
                              value={thirdCallRemarks}
                              onChange={(e) => setThirdCallRemarks(e.target.value)}
                              className="w-full px-1.5 py-0.5 border border-slate-200 bg-amber-50 rounded text-[10px] italic font-semibold"
                            />
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* EDITABLE REMARKS TEXT AREA & QUICK ACTION CONTROLS */}
                  <div className="flex-1 flex flex-col min-h-[140px]">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Compiled Audit Remarks (Editable)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleCopy(remarks, "Remarks compilation")}
                        className="text-[9px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy Remarks</span>
                      </button>
                    </div>

                    <textarea
                      id="remarks-textarea"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Detailed sequential logs list..."
                      className="w-full p-2 border border-slate-300 rounded text-xs leading-relaxed focus:outline-none focus:border-emerald-500 flex-1 bg-white resize-none h-24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 mb-2">
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">FMS Status Action</label>
                      <select 
                        value={statusAction}
                        onChange={(e) => setStatusAction(e.target.value)}
                        className="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded focus:outline-none"
                      >
                        <option value="No status change...">No status change...</option>
                        <option value="LOCKED">LOCKED</option>
                        <option value="UNLOCKED">UNLOCKED</option>
                        <option value="PERMANENT BLOCK">PERMANENT BLOCK</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Escalate Team</label>
                      <select
                        value={escalateTeam}
                        onChange={(e) => setEscalateTeam(e.target.value)}
                        className="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded focus:outline-none"
                      >
                        <option value="No / Local Agent Only">No / Local Agent Only</option>
                        <option value="FRAUD OPS SQUAD">Fraud Ops Squad</option>
                        <option value="MANAGEMENT ESCALATE">Management Escalation</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 mt-auto">
                    <button
                      id="btn-commit-case"
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-[11px] rounded hover:from-emerald-700 hover:to-teal-600 transition shadow-xs cursor-pointer"
                    >
                      {caseMode === "CREATE" ? "COMMIT CASE ENTRY" : "COMMIT CASE UPDATE"}
                    </button>
                    <button
                      id="btn-reset-form"
                      type="button"
                      onClick={handleResetUI}
                      className="w-full py-2 bg-slate-100 text-slate-600 font-bold text-[11px] rounded hover:bg-slate-200 transition border border-slate-200"
                    >
                      RESET UI
                    </button>
                  </div>

                </div>

              </form>
            </motion.div>
          )}


          {/* 3. CONSOLIDATED DATABASE TAB */}
          {activeTab === "DATABASE" && (
            <motion.div
              key="tab-database"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* UPPER SUB ACTION SHEETS */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800">Operational Database Registry</h4>
                  <p className="text-[10px] text-slate-400">Chronological list of ingested FMS Cases and secure NSRC records</p>
                </div>

                <div className="flex space-x-1.5">
                  <button 
                    onClick={() => {
                      if (confirm("Reset operational DB back to standard initial seeds?")) {
                        setCases(INITIAL_CASES);
                        setNsrcEntries(INITIAL_NSRC);
                      }
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-xs text-slate-600 font-bold transition flex items-center space-x-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Re-Sync Seeds</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you absolutely sure you want to completely erase the client-side local registry? This operation is IRREVERSIBLE.")) {
                        setCases([]);
                        setNsrcEntries([]);
                      }
                    }}
                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Database</span>
                  </button>
                </div>
              </div>

              {/* TWO REGISTRIES EXPANSIONS */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* PART A: INGESTED FMS CASES REGISTRY */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2">
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4.5 w-4.5 text-blue-500" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">FMS CASES ARCHIVE ({filteredCases.length})</span>
                    </div>
                    {globalSearchCif && <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold font-mono">Filtered by CIF {globalSearchCif}</span>}
                  </div>

                  {filteredCases.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No operational records matches your active filter query inside FMS queue.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                            <th className="px-3 py-2">Case Date</th>
                            <th className="px-3 py-2">CIF Number</th>
                            <th className="px-3 py-2">Assigned To</th>
                            <th className="px-3 py-2 text-right">Amount (RM)</th>
                            <th className="px-3 py-2 text-center">FMS Status</th>
                            <th className="px-3 py-2">Resolution</th>
                            <th className="px-3 py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCases.map((cs) => {
                            const isFraud = cs.resolution.toLowerCase().includes("fraud") || cs.remarks.toLowerCase().includes("fraud");
                            const isGenuine = cs.resolution.toLowerCase().includes("genuine") || cs.remarks.toLowerCase().includes("genuine");
                            
                            return (
                              <React.Fragment key={cs.id}>
                                <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="px-3 py-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                    {cs.caseCreatedTime || new Date(cs.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-3 font-mono font-bold text-slate-900 flex items-center space-x-1">
                                    <span>{cs.cif}</span>
                                    <button 
                                      onClick={() => handleCopy(cs.cif, "CIF")}
                                      className="p-0.5 hover:bg-slate-100 rounded text-slate-400"
                                      title="Copy CIF to clipboard"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </td>
                                  <td className="px-3 py-3 font-mono text-slate-600">{cs.assignedOfficer}</td>
                                  <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                                    RM {cs.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                                      cs.statusAction === "LOCKED" || cs.fmsStatus === "LOCKED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}>
                                      {cs.statusAction || cs.fmsStatus}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      isFraud 
                                        ? "bg-red-50 text-red-600" 
                                        : isGenuine 
                                          ? "bg-emerald-50 text-emerald-600" 
                                          : "bg-blue-50 text-blue-600"
                                    }`}>
                                      {cs.resolution}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 flex space-x-1 whitespace-nowrap">
                                    <button 
                                      onClick={() => handleLoadCaseForUpdate(cs.cif)}
                                      className="px-2 py-0.5 font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[10px] transition"
                                    >
                                      Load
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (confirm(`Erase FMS log of CIF ${cs.cif}?`)) {
                                          setCases(cases.filter(c => c.id !== cs.id));
                                        }
                                      }}
                                      className="p-1 text-slate-300 hover:text-red-500 rounded transition"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                                {/* Accenting Sequential remarks sub-block for verification proof */}
                                <tr>
                                  <td colSpan={7} className="bg-slate-50/50 px-4 py-2 border-b border-slate-100">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                                      <div className="flex items-center space-x-1">
                                        <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="font-semibold text-slate-600">Verification Remarks:</span>
                                        <span className="font-mono text-slate-800 ml-1 italic">"{cs.remarks}"</span>
                                      </div>
                                      <div className="flex items-center space-x-1 shrink-0 font-mono text-[10px]">
                                        <Clock className="h-3 w-3" />
                                        <span>TAT Status: <strong className="text-slate-700">Committed</strong></span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* PART B: NSRC DATABASE SHEET REGISTRY */}
                <div id="nsrc-database" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-500" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">NSRC REPORT REGISTRY ({filteredNSRC.length})</span>
                    </div>
                    <span className="text-[9px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono font-bold uppercase">Password Protected: Affin123</span>
                  </div>

                  {filteredNSRC.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No NSRC entries mapped inside registry query. Choose 'NSRC' menu above to add data.
                    </div>
                  ) : (
                    <div className="overflow-x-auto font-sans">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                            <th className="px-3 py-2">Customer Name</th>
                            <th className="px-3 py-2">CIF Number</th>
                            <th className="px-3 py-2">Account Number</th>
                            <th className="px-3 py-2">Business Unit</th>
                            <th className="px-3 py-2">Classification</th>
                            <th className="px-3 py-2">NSRC DateStamp</th>
                            <th className="px-3 py-2 text-center">Export Protected</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredNSRC.map((ns) => (
                            <React.Fragment key={ns.id}>
                              <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2.5 font-bold text-slate-800 uppercase">{ns.name}</td>
                                <td className="px-3 py-2.5 font-mono text-slate-700">{ns.cif}</td>
                                <td className="px-3 py-2.5 font-mono text-slate-700">{ns.accountNumber}</td>
                                <td className="px-3 py-2.5 text-slate-700 font-medium">{ns.businessUnit}</td>
                                <td className="px-3 py-2.5 text-slate-500 font-mono">{ns.accountClassification}</td>
                                <td className="px-3 py-2.5 text-indigo-700 font-bold font-mono text-[10px]">{ns.dateStamp}</td>
                                <td className="px-2 py-1.5 text-center">
                                  <button
                                    onClick={() => handleExportNSRCExcel(ns)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded text-[10px] flex items-center inline-flex space-x-1 transition shadow-3xs"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>Protected Excel</span>
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={7} className="bg-slate-50/50 px-4 py-1.5 border-b border-slate-100">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-1.5">
                                    <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                                      <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                      <span className="font-semibold text-slate-500">Classification Details:</span>
                                      <span className="bg-slate-200 border border-slate-300 text-[10px] px-1.5 py-0.2 rounded font-bold text-slate-700"> {ns.accountBlockingType} </span>
                                    </div>
                                    <div className="flex items-center text-[10px] text-slate-600 truncate max-w-lg">
                                      <strong>Generated Remarks: </strong>&nbsp;<span className="italic"> "{ns.remarks}"</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Erase NSRC record for "${ns.name}"?`)) {
                                          setNsrcEntries(nsrcEntries.filter(i => i.id !== ns.id));
                                        }
                                      }}
                                      className="p-1 hover:text-red-500 text-slate-300 transition"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* PART C: SYSTEM SESSIONS LOCK-AUDIT LOGS */}
                <div id="system-audit-logs" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4.5 w-4.5 text-indigo-500" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">SYSTEM SESSIONS CONSOLIDATED LOGIN & LOGOUT REAL-TIME LOGS ({sessionLogs.length})</span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Reset audit session history?")) {
                          setSessionLogs([]);
                        }
                      }}
                      className="text-[9px] bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded font-mono uppercase font-bold transition"
                    >
                      Reset Audit Trail
                    </button>
                  </div>

                  {sessionLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No session logs captured in active runtime.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs-700">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                            <th className="px-3 py-2">Timestamp</th>
                            <th className="px-3 py-2">Officer PSID</th>
                            <th className="px-3 py-2">Officer Name</th>
                            <th className="px-3 py-2 text-center">Auth Event Action</th>
                            <th className="px-3 py-2 text-right">Activity Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {sessionLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                              <td className="px-3 py-2 font-bold text-[#0071e3]">{log.psid}</td>
                              <td className="px-3 py-2 text-slate-800 uppercase font-sans font-semibold text-xs">{log.name}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                  log.action === "LOGIN" 
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                    : "bg-rose-50 text-rose-800 border border-rose-100"
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600 text-right font-sans">{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

            </motion.div>
          )}


          {/* 4. SEARCH FI COMPACT DIVISION VIEW */}
          {activeTab === "SEARCH FI" && (
            <motion.div
              key="tab-search-fi"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4"
            >
              {/* LEFT COLUMN: SEARCH FI CONTROLS (5 Columns) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs md:col-span-5 flex flex-col justify-between min-h-[400px]">
                <div>
                  <div className="pb-3 border-b border-slate-100 mb-3.5 flex items-center space-x-2">
                    <Building2 className="h-4.5 w-4.5 text-blue-500" />
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">Search Financial Institution</h4>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 mb-3">
                    Input Malaysian Bank Account number digits below. The automated match engine computes rules precision instantly based on routing prefixes.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Malaysian Bank Account Number
                      </label>
                      <input
                        id="fi-account-input"
                        type="text"
                        value={fiSearchTerm}
                        onChange={(e) => setFiSearchTerm(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="Type or paste Malaysian bank account digits..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs text-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400"
                      />
                    </div>

                    {/* QUICK SELECTION LINKS */}
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-1.5">Quick Inputs:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: "Maybank (12D)", digits: "164212345678" },
                          { name: "CIMB (14D)", digits: "70421234567890" },
                          { name: "Affin Bank (10D)", digits: "1002123456" },
                          { name: "RHB Bank (14D)", digits: "21212345678912" }
                        ].map((btn) => (
                          <button
                            key={btn.name}
                            type="button"
                            onClick={() => setFiSearchTerm(btn.digits)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded text-[10px] text-slate-600 font-mono tracking-tighter"
                          >
                            {btn.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-6 md:mt-0 bg-blue-50/20 p-2.5 rounded">
                  <span className="flex items-center font-semibold text-xs text-blue-700">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-1.5" />
                    Instant Match Engine active
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">Rules mapped: 10 FIs</span>
                </div>
              </div>


              {/* RIGHT COLUMN: PRECISE SUGGESTIONS (7 Columns) (Max 3 lines, single columns card) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs md:col-span-7 flex flex-col min-h-[400px]">
                <div className="pb-3 border-b border-slate-100 mb-3.5">
                  <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800">Matched Bank Recommendations</h4>
                  <p className="text-[10px] text-slate-400">Target probability sorted by compliance factors</p>
                </div>

                {!fiSearchTerm.trim() ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                    <Building2 className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="font-semibold">WAITING FOR SEARCH TERM</p>
                    <p className="max-w-xs mt-1">Enter bank account digits in the search box left side to evaluate routing rules with visual percentage breakdowns.</p>
                  </div>
                ) : matchedBanks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                    <AlertTriangle className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-500">No Precise Matched bank matches</p>
                    <p className="max-w-xs mt-1">Length parsed {fiSearchTerm.length} does not overlap standard Malaysian prefixes.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-start space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block font-mono">
                      {matchedBanks.length} matches found
                    </span>

                    {/* COMPACT CARD STYLINGS: 3 lines maximum, ONLY 1 column show logo/name/percentage on right */}
                    {matchedBanks.slice(0, 3).map((bank) => (
                      <div
                        key={bank.name}
                        className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between hover:border-blue-400 hover:bg-blue-50/10 transition-all shadow-xs relative overflow-hidden"
                      >
                        <div className="flex items-center space-x-3.5">
                          {/* Logo letters design */}
                          <div className="h-10 w-10 rounded bg-indigo-700/10 font-mono font-bold text-indigo-700 border border-indigo-700/20 text-xs flex items-center justify-center uppercase shrink-0">
                            {bank.logoLetter}
                          </div>

                          <div className="text-xs">
                            <span className="bg-red-100 text-red-800 text-[8px] font-bold px-1.5 py-0.2 rounded font-mono mr-1.5 uppercase">
                              {bank.code}
                            </span>
                            <h5 className="font-bold text-slate-800 inline-block font-sans">{bank.name}</h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">{bank.description}</p>
                            
                            <div className="flex items-center space-x-2 mt-1 font-mono text-[9px] text-slate-400 font-semibold">
                              <span>Match precision:</span>
                              <span className="text-emerald-600">Length ✓</span>
                              <span>•</span>
                              <span className="text-emerald-600">Prefix ✓</span>
                            </div>
                          </div>
                        </div>

                        {/* MATCH PERCENTAGE ON VERY RIGHT */}
                        <div className="text-right shrink-0">
                          <span className="block text-2xl font-mono font-bold text-emerald-600">{bank.matchScore}%</span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">MATCH</span>
                          
                          <button
                            onClick={() => handleCopy(`Bank: ${bank.name}\nCode: ${bank.code}\nAccount: ${fiSearchTerm}`, "Bank specs")}
                            className="mt-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded text-[9px] font-bold transition flex items-center space-x-1"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy Combined</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          )}


          {/* 5. NSRC NEW REGISTER & TABLE TAB */}
          {activeTab === "NSRC" && (
            <motion.div
              key="tab-nsrc"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* DOUBLE DECKER INPUT TABLE: UPPER IS TITLE AND BELOW IS INPUT */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                
                <div className="pb-3 border-b border-indigo-100 flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    <div>
                      <h4 className="font-display font-black text-sm uppercase tracking-wider text-slate-800">
                        NSRC FRAUD REGISTRATION SHEET (AFFIN SECURE DOCK)
                      </h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Enforce compliant cell integrity with password protection "Affin123"</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block text-[10px] bg-slate-900 text-slate-200 font-mono font-bold border border-slate-800 px-3 py-1 rounded">
                    Prefix Action: Starts on 1 triggers Auto-Fill
                  </span>
                </div>

                <form onSubmit={handleSaveNSRC} className="space-y-4 text-xs font-sans">
                  
                  {/* REAL-TIME OPERATION AUTO-FILL BANNER */}
                  {autofillSuggestion && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex sm:flex-row flex-col sm:items-center justify-between gap-3 text-slate-800 animate-pulse shadow-sm">
                      <div className="flex items-start space-x-2.5">
                        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-blue-900 text-xs">Existed Reference Entry Detected!</p>
                          <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                            We matched operational records in <span className="font-bold text-slate-900">{autofillSuggestion.type} DB</span> under CIF <span className="font-mono font-bold bg-blue-100/60 px-1 text-slate-950">{autofillSuggestion.cif}</span> ({autofillSuggestion.name}). Would you like to autofill?
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyAutofill}
                        className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded transition-all text-[11px] uppercase tracking-wide shrink-0 inline-flex items-center space-x-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Autofill Form</span>
                      </button>
                    </div>
                  )}

                  {/* TWO-LAYERED LAYOUT TABLE: UPPER HEADER ACCENTS, LOWER VALUE CHOREOGRAPHY */}
                  <div className="border border-slate-200 rounded overflow-hidden">
                    
                    {/* ROW 1: UPPER LAYER (LABEL HEADERS) */}
                    <div className="grid grid-cols-1 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">
                      <div className="py-2 px-3">Target Account Number</div>
                      <div className="py-2 px-3">Account Blocking Type</div>
                      <div className="py-2 px-3">Business Unit</div>
                      <div className="py-2 px-3">Account Classification</div>
                      <div className="py-2 px-3">Status/Block Description</div>
                      <div className="py-2 px-3">Target blocking Remarks</div>
                    </div>

                    {/* ROW 2: LOWER LAYER (INPUT CONTROLS) */}
                    <div className="grid grid-cols-1 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
                      
                      {/* INPUT 1: Account number */}
                      <div className="p-2 flex items-center">
                        <input
                          id="nsrc-input-accnum"
                          type="text"
                          required
                          value={nsrcAccNum}
                          onChange={(e) => setNsrcAccNum(e.target.value.replace(/[^\d]/g, ""))}
                          placeholder="Starts with 1..."
                          className="w-full h-8 px-2 font-mono font-bold border border-slate-200 hover:border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-800"
                        />
                      </div>

                      {/* INPUT 2: Account Blocking Type */}
                      <div className="p-2 flex items-center">
                        <input
                          type="text"
                          value={nsrcBlockType}
                          onChange={(e) => setNsrcBlockType(e.target.value)}
                          placeholder="Account Block Type"
                          className="w-full h-8 px-2 border border-slate-200 rounded focus:outline-none text-slate-700"
                        />
                      </div>

                      {/* INPUT 3: Business unit */}
                      <div className="p-2 flex items-center">
                        <input
                          type="text"
                          value={nsrcBusinessUnit}
                          onChange={(e) => setNsrcBusinessUnit(e.target.value)}
                          placeholder="e.g. AffinMax"
                          className="w-full h-8 px-2 border border-slate-200 rounded focus:outline-none text-slate-700"
                        />
                      </div>

                      {/* INPUT 4: Classification */}
                      <div className="p-2 flex items-center">
                        <input
                          type="text"
                          value={nsrcClassification}
                          onChange={(e) => setNsrcClassification(e.target.value)}
                          placeholder="e.g. Current"
                          className="w-full h-8 px-2 border border-slate-200 rounded focus:outline-none text-slate-700 font-mono"
                        />
                      </div>

                      {/* INPUT 5: status Block Description */}
                      <div className="p-2 flex items-center">
                        <input
                          type="text"
                          value={nsrcBlockDesc}
                          onChange={(e) => setNsrcBlockDesc(e.target.value)}
                          placeholder="Block Stamp"
                          className="w-full h-8 px-2 border border-slate-200 rounded focus:outline-none text-[11px] font-mono text-slate-600"
                        />
                      </div>

                      {/* INPUT 6: target block remarks */}
                      <div className="p-2 flex items-center">
                        <input
                          type="text"
                          value={nsrcRemarks}
                          onChange={(e) => setNsrcRemarks(e.target.value)}
                          placeholder="Remarks..."
                          className="w-full h-8 px-2 border border-slate-200 rounded focus:outline-none text-[11px]"
                        />
                      </div>

                    </div>
                  </div>

                  {/* BOTTOM REQUISITES: CUSTOMER IDENTIFIERS FOR FILE MATCHING REGULATION */}
                  <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Customer Identification (CIF)
                        </label>
                        <input
                          id="nsrc-input-cif"
                          type="text"
                          required
                          value={nsrcCif}
                          onChange={(e) => setNsrcCif(e.target.value)}
                          placeholder="CIF (eg: 350028093)"
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-mono font-semibold focus:outline-none focus:border-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Company/Officer Reg No
                        </label>
                        <input
                          type="text"
                          value={nsrcRegNo}
                          onChange={(e) => setNsrcRegNo(e.target.value)}
                          placeholder="Reg No (eg: 20260109658)"
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-mono font-semibold focus:outline-none focus:border-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Official Customer Name
                        </label>
                        <input
                          id="nsrc-input-name"
                          type="text"
                          required
                          value={nsrcName}
                          onChange={(e) => setNsrcName(e.target.value)}
                          placeholder="NAME OF USER"
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-sans uppercase font-bold text-xs focus:outline-none focus:border-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Data Block DateStamp
                        </label>
                        <input
                          type="date"
                          value={nsrcDateStamp}
                          onChange={(e) => setNsrcDateStamp(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-mono focus:outline-none focus:border-slate-400"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1.5">

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Earmark Amount (RM)
                        </label>
                        <input
                          type="text"
                          value={nsrcEarmarkAmount}
                          onChange={(e) => setNsrcEarmarkAmount(e.target.value)}
                          placeholder="eg: RM1,450.00"
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-mono font-semibold focus:outline-none focus:border-slate-400 text-emerald-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Earmark Status/Action
                        </label>
                        <select
                          value={nsrcEarmark}
                          onChange={(e) => setNsrcEarmark(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-semibold text-slate-700 focus:outline-none focus:border-slate-400"
                        >
                          <option value="Yes">Yes (Confirm Earmark)</option>
                          <option value="No">No (Bypass Earmark)</option>
                          <option value="Pending">Pending Audit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Audit / Regulatory Reason
                        </label>
                        <input
                          type="text"
                          value={nsrcReason}
                          onChange={(e) => setNsrcReason(e.target.value)}
                          placeholder="eg: SUSPECTED MDD/MULE TRACING"
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-sans font-medium focus:outline-none focus:border-slate-400"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          id="btn-save-nsrc"
                          type="submit"
                          className="w-full py-2 bg-slate-900 border border-slate-800 text-white font-bold rounded hover:bg-slate-700 transition flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="h-4 w-4 text-emerald-400" />
                          <span>Save NSRC Report</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </form>
              </div>

              {/* TABLE NSRC ENTRIES ALREADY STORED SUBMENU */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-3.5 border-b border-indigo-100 mb-3 block">
                  <div>
                    <h5 className="font-display font-bold text-xs uppercase tracking-wider text-indigo-900">
                      NSRC Saved Database List
                    </h5>
                    <p className="text-[10px] text-slate-400">Total stored: {nsrcEntries.length} items. Select individual item row below to download official protected Excel sheet.</p>
                  </div>
                  <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono uppercase text-slate-500 font-bold">SQLITE SYNCHRONIZED LIVE</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-[9px] tracking-widest">
                        <th className="px-3 py-2">Customer Name</th>
                        <th className="px-3 py-2">CIF Number</th>
                        <th className="px-3 py-2">Account Number</th>
                        <th className="px-3 py-2">Blocked Status</th>
                        <th className="px-3 py-2">Business Unit</th>
                        <th className="px-3 py-2 text-center">Protected Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {nsrcEntries.map(it => (
                        <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3 font-bold uppercase text-slate-800">{it.name}</td>
                          <td className="px-3 py-3 font-mono font-semibold text-slate-700">{it.cif}</td>
                          <td className="px-3 py-3 font-mono text-slate-500">{it.accountNumber}</td>
                          <td className="px-3 py-3 font-mono text-red-600 font-bold text-[10px]">{it.accountBlockingType}</td>
                          <td className="px-3 py-3 font-bold text-slate-700">{it.businessUnit}</td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleExportNSRCExcel(it)}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 font-bold text-white rounded text-[10px] inline-flex items-center space-x-1 shadow-3xs"
                            >
                              <Download className="h-3 w-3" />
                              <span>Export excel Protected File</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </motion.div>
          )}

          {activeTab === "ADMIN" && currentUser?.role === "Admin" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 max-w-7xl mx-auto w-full p-4 font-sans"
            >
              {/* ADMIN PANEL HEADER */}
              <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
                      Root Administrator Authorization Enforced
                    </span>
                    <h2 className="font-sans font-bold text-xl tracking-tight mt-2 text-slate-900">
                      Faris's Command Registry & Admin Panel
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Provision authorized compliance officer profiles, reset passwords, and audit login states securely.
                    </p>
                  </div>
                  <div className="bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-4 py-3 sm:text-right">
                    <span className="text-[9px] text-slate-500 block font-semibold uppercase tracking-wider">STAFF ROLES VOLUME</span>
                    <span className="font-sans font-bold text-[#0071e3]">{staffAccounts.length} ACTIVE CONTROLLERS</span>
                  </div>
                </div>
              </div>

              {/* ADMIN GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* COLUMN 1: CREATE NEW STAFF ACCOUNT */}
                <div className="bg-white border border-[#e8e8ed] rounded-2xl p-5 shadow-xs lg:col-span-1">
                  <div className="pb-3 border-b border-slate-100 mb-4 flex items-center space-x-2">
                    <UserPlus className="h-4 w-4 text-[#0071e3]" />
                    <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                      Register Compliance Officer
                    </h3>
                  </div>

                  {adminMessage && (
                    <div className="bg-blue-50 text-blue-900 text-[11px] p-3 rounded-xl mb-4 leading-relaxed border border-blue-105">
                      {adminMessage}
                    </div>
                  )}

                  <form onSubmit={handleCreateNewStaff} className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-sans">Officer PSID (Code prefix PS)</label>
                      <input
                        type="text"
                        required
                        value={newStaffPsid}
                        onChange={(e) => setNewStaffPsid(e.target.value)}
                        placeholder="e.g. PS101439"
                        className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-3 py-2 text-slate-850 placeholder-slate-400 font-mono focus:outline-none focus:border-[#0071e3] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-sans">Officer Official Name</label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="e.g. Muhammad Adam"
                        className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-3 py-2 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-[#0071e3] uppercase text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-sans">Authorized Permission Role</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:border-[#0071e3] font-semibold text-xs"
                      >
                        <option value="Staff Officer">Staff Officer (Analyst)</option>
                        <option value="Senior Executive">Senior Executive (Lead)</option>
                        <option value="Operations Manager">Operations Manager (SME)</option>
                      </select>
                    </div>

                    <div className="bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl p-3">
                      <span className="text-[10px] text-slate-500 block leading-normal font-sans">
                        • Initial Session Password will be defaulted securely to <b className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-[#e8e8ed]">Affin123</b>.<br />
                        • Officer will be automatically locked out on first load and forced to assign a private, customized passcode of at least 6 characters.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold py-2.5 rounded-xl uppercase tracking-wider text-[11px] transition duration-205 cursor-pointer"
                    >
                      Provision Officer Account
                    </button>
                  </form>
                </div>

                {/* COLUMN 2 & 3: STAFF REGISTRY AND PASSWORD OVERRIDE */}
                <div className="bg-white border border-[#e8e8ed] rounded-2xl p-5 shadow-xs lg:col-span-2">
                  <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-[#0071e3]" />
                      <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                        Staff Accounts Registry Table
                      </h3>
                    </div>
                    <span className="text-[9px] bg-red-50 text-red-650 border border-red-100 px-2.5 py-0.5 rounded-full font-bold">AUTHENTICATOR ENFORCED</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f5f5f7] border-b border-[#e8e8ed] text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="px-3 py-2.5">PSID</th>
                          <th className="px-3 py-2.5">Officer Name</th>
                          <th className="px-3 py-2.5">Workspace Role</th>
                          <th className="px-3 py-2.5">Session Password</th>
                          <th className="px-3 py-2.5 text-center">First Change Required</th>
                          <th className="px-3 py-2.5 text-center">Operational Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staffAccounts.map((account) => {
                          const isRootAdmin = account.psid === "PS101436";
                          return (
                            <tr key={account.psid} className="hover:bg-slate-50/50 transition">
                              <td className="px-3 py-3 font-mono font-bold text-slate-900">{account.psid}</td>
                              <td className="px-3 py-3 uppercase font-semibold text-slate-700 text-[11px]">{account.name}</td>
                              <td className="px-3 py-3 text-slate-500 font-medium text-[11px]">{account.role}</td>
                              <td className="px-3 py-3 font-mono text-[11px] text-slate-400 italic font-bold">
                                {account.password}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                  account.mustChangePassword
                                    ? "bg-amber-50 text-amber-800 border border-amber-100"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                }`}>
                                  {account.mustChangePassword ? "YES (Pending)" : "NO (Secured)"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center space-x-1.5 font-sans">
                                  <button
                                    onClick={() => handleAdminResetPassword(account.psid)}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px] transition cursor-pointer"
                                    title="Reset targeted password back to 'Affin123'"
                                  >
                                    Reset Password
                                  </button>
                                  
                                  {!isRootAdmin && (
                                    <button
                                      onClick={() => handleAdminDeleteStaff(account.psid)}
                                      className="p-1 hover:bg-red-50 text-slate-405 hover:text-red-500 rounded transition cursor-pointer"
                                      title="Delete Staff Account"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 p-3.5 bg-blue-50/50 rounded-xl border border-blue-105 flex items-start space-x-2.5 text-slate-700 text-xs">
                    <Info className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-900">Administrator Notice on Credentials Management</p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-sans">
                        To maintain secure system operations under standard bank audit guidelines, once a password is reset, the corresponding staff account will immediately be required to create a new custom password during their next login session. Password reset actions are instantaneous and apply automatically across all browser tabs.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER BAR */}
      <footer className="text-slate-405 text-[11px] py-6 mt-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#e8e8ed] bg-white/40">
        <div className="font-sans text-slate-500">
          © 2026 OwlFraudster Fraud Risk Ingestion Engine
        </div>
        <div className="text-[10px] text-slate-400 font-sans">
          Internal Compliance Portal • All Rights Reserved
        </div>
      </footer>

      {/* 5. PASSWORD DECRYPTION ACCESSIBILITY DIALOG LAYER */}
      <AnimatePresence>
        {nsrcToExport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[9999] px-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
            >
              <div className="bg-[#f5f5f7] border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-[#ffc000]" />
                  <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider font-mono">XLSX Decryption Key</span>
                </div>
                <button 
                  onClick={() => setNsrcToExport(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handlePasswordModalSubmit(); }} className="p-5 space-y-4">
                <div className="text-center space-y-1.5">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Secure Export Protection</p>
                  <p className="text-[13px] text-slate-600 font-medium">
                    The report of <strong className="text-slate-900 uppercase">'{nsrcToExport.name}'</strong> is encrypted. Please enter the compliance master password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <input 
                    type="password"
                    required
                    autoFocus
                    value={exportPassword}
                    onChange={(e) => {
                      setExportPassword(e.target.value);
                      setPasswordModalError("");
                    }}
                    placeholder="Enter Affin password..."
                    className="w-full text-center tracking-widest text-[#0071e3] font-bold py-2 px-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-lg text-sm bg-slate-50"
                  />
                  {passwordModalError && (
                    <p className="text-center text-xs text-red-600 font-bold font-mono">
                      {passwordModalError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNsrcToExport(null)}
                    className="py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Decrypt & Save</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
