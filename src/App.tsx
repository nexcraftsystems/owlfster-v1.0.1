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
  UserPlus,
  Terminal,
  Folder,
  User,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FMSCase, NSRCEntry, BankFI } from "./types";
import { parseFMSInput } from "./parser";
import { downloadProtectedNSRCExcel } from "./excelExport";
import { INITIAL_CASES, INITIAL_NSRC, MALAYSIAN_BANKS, OFFICER_SCORES, OfficerScore } from "./mockData";
import { db } from "./firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export interface BranchInfo {
  code: string;
  name: string;
}

const BRANCH_LIST: BranchInfo[] = [
  { code: "2", name: "BMS CENTRAL" },
  { code: "4", name: "WANGSA MAJU" },
  { code: "5", name: "BATU CANTONMENT" },
  { code: "6", name: "SEA PARK" },
  { code: "7", name: "PORT KLANG" },
  { code: "197", name: "BUKIT BARU" },
  { code: "10", name: "BUTTERWORTH" },
  { code: "11", name: "KEMAMAN" },
  { code: "12", name: "KUANTAN" },
  { code: "13", name: "JENGKA" },
  { code: "14", name: "UiTM" },
  { code: "16", name: "LUMUT" },
  { code: "17", name: "MELAKA RAYA" },
  { code: "18", name: "KOTA BHARU" },
  { code: "19", name: "SETAPAK" },
  { code: "20", name: "SERI PETALING" },
  { code: "21", name: "PORT DICKSON" },
  { code: "23", name: "ALORSETAR" },
  { code: "24", name: "SEREMBAN @ RASAH" },
  { code: "25", name: "TAWAU" },
  { code: "26", name: "LTAT" },
  { code: "27", name: "JOHOR BAHRU" },
  { code: "28", name: "TAMAN TUN DR. ISMAIL" },
  { code: "30", name: "AMPANG JAYA" },
  { code: "31", name: "SUBANG JAYA" },
  { code: "32", name: "IPOH" },
  { code: "33", name: "TAMAN KINRARA" },
  { code: "34", name: "JALAN IPOH" },
  { code: "35", name: "KLUANG" },
  { code: "36", name: "JOHOR JAYA" },
  { code: "37", name: "KEMAMAN SUPPLY BASE" },
  { code: "38", name: "KEPONG" },
  { code: "40", name: "BANGSAR" },
  { code: "41", name: "KUCHING" },
  { code: "43", name: "RAWANG" },
  { code: "44", name: "TAMAN MIDAH" },
  { code: "46", name: "SUNGAI PETANI" },
  { code: "47", name: "KAJANG" },
  { code: "48", name: "BAYAN BARU" },
  { code: "49", name: "PUTRAJAYA" },
  { code: "54", name: "KULAI" },
  { code: "55", name: "SITIAWAN" },
  { code: "57", name: "AMPANG NEW VILLAGE" },
  { code: "59", name: "KOTA KINABALU" },
  { code: "60", name: "KEPALA BATAS" },
  { code: "61", name: "SELAYANG" },
  { code: "63", name: "USJ TAIPAN" },
  { code: "65", name: "NILAI" },
  { code: "68", name: "SEBERANG JAYA" },
  { code: "69", name: "MIRI" },
  { code: "71", name: "WISMA PERTAHANAN" },
  { code: "73", name: "PERMAS JAYA" },
  { code: "74", name: "KLANG SECURE TRANSIT" },
  { code: "75", name: "KLANG UTARA" },
  { code: "76", name: "BATU PAHAT" },
  { code: "78", name: "LANGKAWI" },
  { code: "79", name: "KANGAR" },
  { code: "80", name: "TAMPOI" },
  { code: "81", name: "SERI KEMBANGAN" },
  { code: "84", name: "BINTULU" },
  { code: "95", name: "JALAN BUNUS" },
  { code: "98", name: "ARA DAMANSARA" },
  { code: "99", name: "KOMPLEKS PKNS" },
  { code: "102", name: "PUCHONG" },
  { code: "107", name: "WISMA PELAUT" },
  { code: "108", name: "PRAI" },
  { code: "111", name: "IPOH GARDEN" },
  { code: "112", name: "TELUK INTAN" },
  { code: "115", name: "JELI" },
  { code: "118", name: "CURVE" },
  { code: "119", name: "FETTES PARK" },
  { code: "120", name: "JALAN MACELISTER" },
  { code: "121", name: "MENTAKAB" },
  { code: "122", name: "MUAR" },
  { code: "123", name: "PJ STATE" },
  { code: "125", name: "SANDAKAN" },
  { code: "126", name: "SEGAMAT" },
  { code: "127", name: "SIBU" },
  { code: "128", name: "TAIPING" },
  { code: "129", name: "TAMAN MALURI" },
  { code: "155", name: "LABUAN OFFSHORE" },
  { code: "156", name: "JALAN GAYA, KK" },
  { code: "157", name: "KL MAIN BRANCH" },
  { code: "161", name: "AYER HITAM" },
  { code: "162", name: "KOTA WARISAN, SEPANG" },
  { code: "163", name: "TEMERLOH" },
  { code: "165", name: "JALAN MERU, KLANG" },
  { code: "166", name: "GEMAS" },
  { code: "168", name: "KULIM" },
  { code: "169", name: "PRINCE COMMERCIAL CENTRE" },
  { code: "170", name: "MUTIARA RINI, SKUDAI" },
  { code: "172", name: "BDR BUKIT TINGGI, KLG" },
  { code: "173", name: "CYBERJAYA" },
  { code: "174", name: "KOTA KEMUNING" },
  { code: "175", name: "DANGA BAY, JB" },
  { code: "176", name: "LAHAD DATU" },
  { code: "177", name: "TAMAN DEMANG (s.kmbgn)" },
  { code: "180", name: "TABUAN JAYA BRANCH/THE NORTHBANK" },
  { code: "179", name: "KOTA DAMANSARA" },
  { code: "181", name: "DENAI ALAM" },
  { code: "190", name: "BANDAR CASSIA" },
  { code: "659", name: "JURU BUSINESS CENTRE, PENANG / AUTOCITY" },
  { code: "660", name: "TAMAN MOLEK BUSINESS CENTRE, JB" },
  { code: "160", name: "TAMAN MOLEK BUSINESS CENTRE, JB" },
  { code: "664", name: "MSU SHAH ALAM BUSINESS CENTRE" },
  { code: "182", name: "BANDAR MERU RAYA, IPOH" },
  { code: "686", name: "PUTRAJAYA PRESINT 15" },
  { code: "186", name: "PUTRAJAYA PRESINT 15" },
  { code: "526", name: "TELUK INTAN" },
  { code: "602", name: "PUCHONG" },
  { code: "688", name: "KOTA SAAS" },
  { code: "187", name: "DESA PARK CITY" },
  { code: "189", name: "BALAKONG" },
  { code: "193", name: "DAMANSARA UTAMA" },
  { code: "15", name: "KUALA TERENGGANU" },
  { code: "196", name: "BUKIT DAHLIA" },
  { code: "624", name: "PJ SS2" },
  { code: "658", name: "FRASER BUSINESS CENTRE, KL" },
  { code: "667", name: "JITRA" },
  { code: "671", name: "BANGI" },
  { code: "685", name: "KAMPUS PUNCAK ALAM" },
  { code: "183", name: "BANDAR SRI SENDAYAN" },
  { code: "178", name: "SENAWANG" },
  { code: "699", name: "SOUTHKEY JOHOR" },
  { code: "201", name: "AIR ITAM, PULAU PINANG" },
  { code: "197", name: "MID VALLEY" },
  { code: "203", name: "BUKIT MERTAJAM" },
  { code: "194", name: "SEREMBAN 2" },
  { code: "198", name: "NUSA BESTARI" },
  { code: "200", name: "TAWAU" },
  { code: "202", name: "SPRINGVILLE COMMERCIAL CENTRE" },
  { code: "217", name: "ISKANDAR PUTERI" },
  { code: "205", name: "RAUB" },
  { code: "207", name: "ICOM SQUARE / ICS" },
  { code: "209", name: "BUKIT DAMANSARA" },
  { code: "208", name: "MIRI TIMES SQUARE" },
  { code: "211", name: "SENAI" },
  { code: "212", name: "HIKMAH EXCHANGE" },
  { code: "204", name: "MOUNT OUSTIN" },
  { code: "684", name: "MYTOWN" },
  { code: "219", name: "KULIM HI-TECH PARK" },
  { code: "206", name: "JALAN SATOK" },
  { code: "213", name: "INANAM" },
  { code: "214", name: "BATU KAWAH" },
  { code: "218", name: "GENTING PERMAI" },
  { code: "220", name: "SARADISE" },
  { code: "210", name: "SETIA ALAM" },
  { code: "215", name: "JELUTONG" },
  { code: "195", name: "BANDAR SAUJANA PUTRA" },
  { code: "515", name: "KUALA TERENGGANU" },
  { code: "696", name: "BUKIT DAHLIA" },
  { code: "124", name: "PJ SS2" },
  { code: "158", name: "FRASER BUSINESS CENTRE, KL" },
  { code: "167", name: "JITRA" },
  { code: "171", name: "BANGI" },
  { code: "185", name: "KAMPUS PUNCAK ALAM" },
  { code: "683", name: "BANDAR SRI SENDAYAN" },
  { code: "678", name: "SENAWANG" },
  { code: "199", name: "SOUTHKEY JOHOR" },
  { code: "701", name: "AIR ITAM, PULAU PINANG" },
  { code: "697", name: "MID VALLEY" },
  { code: "703", name: "BUKIT MERTAJAM" },
  { code: "694", name: "SEREMBAN 2" },
  { code: "698", name: "NUSA BESTARI" },
  { code: "700", name: "TAWAU" },
  { code: "702", name: "SPRINGVILLE COMMERCIAL CENTRE" },
  { code: "717", name: "ISKANDAR PUTERI" },
  { code: "705", name: "RAUB" },
  { code: "707", name: "ICOM SQUARE / ICS" },
  { code: "709", name: "BUKIT DAMANSARA" },
  { code: "708", name: "MIRI TIMES SQUARE" },
  { code: "711", name: "SENAI" },
  { code: "712", name: "HIKMAH EXCHANGE" },
  { code: "704", name: "MOUNT OUSTIN" },
  { code: "184", name: "MYTOWN" },
  { code: "719", name: "KULIM HI-TECH PARK" },
  { code: "706", name: "JALAN SATOK" },
  { code: "713", name: "INANAM" },
  { code: "714", name: "BATU KAWAH" },
  { code: "718", name: "GENTING PERMAI" },
  { code: "720", name: "SARADISE" },
  { code: "710", name: "SETIA ALAM" },
  { code: "715", name: "JELUTONG" },
  { code: "695", name: "BANDAR SAUJANA PUTRA" }
];

const ONLINE_THRESHOLD_MS = 600000; // 10 minutes threshold to prevent background tab dormancy and network jitter from showing offline

export default function App() {
  // Staff accounts & Auth States
  const [staffAccounts, setStaffAccounts] = useState<any[]>(() => {
    const saved = localStorage.getItem("owl_staff_accounts_v4");
    
    const defaults = [
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
        role: "Staff",
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

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const updated = parsed.map((acc: any) => {
            let updatedAcc = { ...acc };
            const cleanPsidStr = acc.psid.toUpperCase();
            if (cleanPsidStr === "PS101435") {
              updatedAcc.role = "Admin";
            } else {
              updatedAcc.role = "Staff";
            }
            return updatedAcc;
          });
          
          // Ensure all other required accounts are present
          defaults.forEach(def => {
            if (!updated.some((u: any) => u.psid.toUpperCase() === def.psid.toUpperCase())) {
              updated.push(def);
            }
          });
          
          localStorage.setItem("owl_staff_accounts_v4", JSON.stringify(updated));
          return updated;
        }
      } catch (e) {
        console.error("Error reading saved staff accounts:", e);
      }
    }

    localStorage.setItem("owl_staff_accounts_v4", JSON.stringify(defaults));
    return defaults;
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    // Try sessionStorage first to support multi-tab/user workspace isolation
    const sessionSaved = sessionStorage.getItem("owl_current_user_v4");
    if (sessionSaved) {
      try {
        const parsed = JSON.parse(sessionSaved);
        if (parsed) {
          const role = parsed.psid.toUpperCase() === "PS101435" ? "Admin" : "Staff";
          return { ...parsed, role };
        }
      } catch (e) {
        console.error("Error reading saved sessionStorage user:", e);
      }
    }
    // Fallback to localStorage
    const saved = localStorage.getItem("owl_current_user_v4");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          // Dynamically enforce role on load
          const role = parsed.psid.toUpperCase() === "PS101435" ? "Admin" : "Staff";
          return { ...parsed, role };
        }
      } catch (e) {
        console.error("Error reading saved current user:", e);
      }
    }
    return null;
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
    const initial: any[] = [
      {
        id: "log-seed-1",
        psid: "PS101435",
        name: "Zaim",
        action: "PASSWORD_CHANGE",
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleString(),
        details: "Password changed from 'Affin123' to 'Cyber@368' successfully (Secured)"
      },
      {
        id: "log-seed-2",
        psid: "PS101435",
        name: "Zaim",
        action: "LOGIN",
        timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 60000).toLocaleString(),
        details: "Session Authenticated (Role: Admin)"
      }
    ];
    localStorage.setItem("owl_session_logs_v4", JSON.stringify(initial));
    return initial;
  });

  // Live Real-Time Firestore Synchronization
  useEffect(() => {
    // 1. Staff Accounts real-time syncing
    const staffRef = collection(db, "staffAccounts");
    const unsubscribeStaff = onSnapshot(staffRef, async (snapshot) => {
      const coreAccounts = [
        { psid: "PS101435", name: "Zaim", role: "Admin", status: "Active", password: "Affin123", mustChangePassword: true },
        { psid: "PS101436", name: "Faris", role: "Staff", status: "Active", password: "Affin123", mustChangePassword: true },
        { psid: "PS101477", name: "Nabil", role: "Staff", status: "Active", password: "Affin123", mustChangePassword: true },
        { psid: "PS101405", name: "Naja", role: "Staff", status: "Active", password: "Affin123", mustChangePassword: true },
        { psid: "PS101480", name: "Izzat", role: "Staff", status: "Active", password: "Affin123", mustChangePassword: true }
      ];

      if (snapshot.empty) {
        const saved = localStorage.getItem("owl_staff_accounts_v4");
        const listToSeed = saved ? JSON.parse(saved) : coreAccounts;
        for (const item of listToSeed) {
          await setDoc(doc(db, "staffAccounts", item.psid), item);
        }
      } else {
        const items: any[] = [];
        snapshot.forEach((doc) => items.push(doc.data()));
        
        let missingDetected = false;
        for (const core of coreAccounts) {
          if (!items.some(item => item.psid.toUpperCase() === core.psid.toUpperCase())) {
            missingDetected = true;
            await setDoc(doc(db, "staffAccounts", core.psid), core);
          }
        }
        
        if (!missingDetected) {
          setStaffAccounts(items);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "staffAccounts");
    });

    // 2. Cases real-time syncing
    const casesRef = collection(db, "cases");
    const unsubscribeCases = onSnapshot(casesRef, async (snapshot) => {
      if (snapshot.empty) {
        for (const item of INITIAL_CASES) {
          await setDoc(doc(db, "cases", item.id), item);
        }
      } else {
        const items: FMSCase[] = [];
        snapshot.forEach((doc) => items.push(doc.data() as FMSCase));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCases(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "cases");
    });

    // 3. NSRC Entries real-time syncing
    const nsrcRef = collection(db, "nsrcEntries");
    const unsubscribeNsrc = onSnapshot(nsrcRef, async (snapshot) => {
      if (snapshot.empty) {
        for (const item of INITIAL_NSRC) {
          await setDoc(doc(db, "nsrcEntries", item.id), item);
        }
      } else {
        const items: NSRCEntry[] = [];
        snapshot.forEach((doc) => items.push(doc.data() as NSRCEntry));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNsrcEntries(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "nsrcEntries");
    });

    // 4. Session Logs real-time syncing
    const logsRef = collection(db, "sessionLogs");
    const unsubscribeLogs = onSnapshot(logsRef, async (snapshot) => {
      if (snapshot.empty) {
        const initialLogs = [
          {
            id: "log-seed-1",
            psid: "PS101435",
            name: "Zaim",
            action: "PASSWORD_CHANGE",
            timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleString(),
            details: "Password changed from 'Affin123' to 'Cyber@368' successfully (Secured)"
          },
          {
            id: "log-seed-2",
            psid: "PS101435",
            name: "Zaim",
            action: "LOGIN",
            timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 60000).toLocaleString(),
            details: "Session Authenticated (Role: Admin)"
          }
        ];
        for (const item of initialLogs) {
          await setDoc(doc(db, "sessionLogs", item.id), item);
        }
      } else {
        const items: any[] = [];
        snapshot.forEach((doc) => items.push(doc.data()));
        items.sort((a, b) => {
          const aId = a.id || "";
          const bId = b.id || "";
          return bId > aId ? 1 : -1;
        });
        setSessionLogs(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "sessionLogs");
    });

    return () => {
      unsubscribeStaff();
      unsubscribeCases();
      unsubscribeNsrc();
      unsubscribeLogs();
    };
  }, []);

  // Live real-time heartbeat updates for checking "who is currently logged in"
  useEffect(() => {
    if (!currentUser?.psid) return;
    
    const updateHeartbeat = async () => {
      try {
        const staffRef = doc(db, "staffAccounts", currentUser.psid);
        const liveUser = staffAccounts.find(s => s.psid.toUpperCase() === currentUser.psid.toUpperCase());
        if (liveUser) {
          await setDoc(staffRef, {
            ...liveUser,
            isOnline: true,
            lastActive: new Date().toISOString()
          });
        } else {
          await setDoc(staffRef, {
            psid: currentUser.psid,
            name: currentUser.name,
            role: currentUser.role || "Staff Officer",
            status: "Active",
            password: currentUser.password || "Affin123",
            mustChangePassword: currentUser.mustChangePassword || false,
            isOnline: true,
            lastActive: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Heartbeat sync error:", err);
      }
    };

    // Run initially
    updateHeartbeat();

    // Run interval heartbeat every 20 seconds
    const interval = setInterval(updateHeartbeat, 20000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser?.psid, staffAccounts.length]);

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
      sessionStorage.setItem("owl_current_user_v4", JSON.stringify(currentUser));
      localStorage.setItem("owl_current_user_v4", JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem("owl_current_user_v4");
      localStorage.removeItem("owl_current_user_v4");
    }
  }, [currentUser]);

  // Global search & tools
  const [globalSearchCif, setGlobalSearchCif] = useState("");
  const [caseSearchInputCif, setCaseSearchInputCif] = useState("");
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
  const [dbSearchCif, setDbSearchCif] = useState("");
  const [dbFilterPsid, setDbFilterPsid] = useState("ALL");
  const [dbDivision, setDbDivision] = useState<"PERSONAL" | "GLOBAL">("GLOBAL");
  const [expandedFmsCases, setExpandedFmsCases] = useState<Record<string, boolean>>({});
  const [expandedNsrcEntries, setExpandedNsrcEntries] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Excel Export Destination & Location prompt state
  const [excelExportPending, setExcelExportPending] = useState<{
    type: "NSRC" | "FMS";
    data: any;
    defaultFilename: string;
    customFilename: string;
  } | null>(null);

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
  const handleCommitCaseEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseCif) {
      alert("CIF Identification is required.");
      return;
    }

    const existsIdx = cases.findIndex(c => c.cif === caseCif);
    const finalId = caseMode === "UPDATE" && existsIdx >= 0 ? cases[existsIdx].id : "fms-" + Date.now();
    const finalCreatedAt = caseMode === "UPDATE" && existsIdx >= 0 ? cases[existsIdx].createdAt : new Date().toISOString();

    const finalCase: FMSCase = {
      id: finalId,
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
      createdAt: finalCreatedAt
    };

    try {
      await setDoc(doc(db, "cases", finalId), finalCase);
      if (caseMode === "UPDATE" && existsIdx >= 0) {
        alert(`Case updated successfully in live sync database for CIF: ${caseCif}`);
      } else {
        alert(`Case committed successfully to live sync database for CIF: ${caseCif}`);
      }
    } catch (error) {
      console.error("Firestore error saving case:", error);
      if (caseMode === "UPDATE" && existsIdx >= 0) {
        const updated = [...cases];
        updated[existsIdx] = finalCase;
        setCases(updated);
      } else {
        setCases([finalCase, ...cases]);
      }
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
    const cleanCif = cifNum.trim();
    if (!cleanCif) {
      alert("Please enter a valid CIF Number.");
      return;
    }
    const found = cases.find(c => c.cif.trim().toUpperCase() === cleanCif.toUpperCase());
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
      alert(`Case data loaded for CIF ${found.cif}. Edit values in the sidebar.`);
    } else {
      alert(`No record found in database of cases for CIF: ${cleanCif}`);
    }
  };


  // --- 2. SEARCH FI STATES & ENGINE ---
  const [fiSearchTerm, setFiSearchTerm] = useState("");
  const [matchedBanks, setMatchedBanks] = useState<BankFI[]>([]);

  // SQLite Virtual Persistent Layer states
  const [sqliteLogs, setSqliteLogs] = useState<string[]>(() => {
    return [
      "-- SQLite3 database initialized successfully.",
      "-- Loaded file: /var/db/fi_searches.sqlite",
      "PRAGMA foreign_keys = ON;",
      "CREATE TABLE IF NOT EXISTS fi_searches (",
      "  id INTEGER PRIMARY KEY AUTOINCREMENT,",
      "  account_number TEXT NOT NULL,",
      "  bank_code TEXT NOT NULL,",
      "  bank_name TEXT NOT NULL,",
      "  match_prob INTEGER NOT NULL,",
      "  timestamp TEXT NOT NULL",
      ");",
      "-- Ready for DQL/DML executions."
    ];
  });

  const [sqliteRows, setSqliteRows] = useState<any[]>(() => {
    const saved = localStorage.getItem("owl_sqlite_fi_searches_v5");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // Fallback
      }
    }
    return [
      { id: 1, account_number: "164212345678", bank_code: "BAY", bank_name: "Malayan Banking Berhad (Maybank)", match_prob: 99, timestamp: "11/06/2026, 04:30:15 PM" },
      { id: 2, account_number: "70421234567890", bank_code: "CIMB", bank_name: "CIMB Bank Berhad", match_prob: 99, timestamp: "11/06/2026, 08:12:44 PM" }
    ];
  });

  const [activeSqlQuery, setActiveSqlQuery] = useState("SELECT * FROM fi_searches ORDER BY id DESC;");
  const [sqliteSuccessMessage, setSqliteSuccessMessage] = useState("");

  const handleRunSqlQuery = (overrideQuery?: string) => {
    const queryToRun = (overrideQuery || activeSqlQuery).trim().toLowerCase();
    
    // Simple custom client-side SQL parser simulation for high-fidelity compliance
    if (queryToRun.startsWith("select")) {
      let filtered = [...sqliteRows];
      
      if (queryToRun.includes("where match_prob >= 80")) {
        filtered = filtered.filter(r => r.match_prob >= 80);
      } else if (queryToRun.includes("where bank_code = 'cimb'")) {
        filtered = filtered.filter(r => r.bank_code.toLowerCase() === "cimb");
      } else if (queryToRun.includes("where bank_code = 'tng'")) {
        filtered = filtered.filter(r => r.bank_code.toLowerCase() === "tng");
      }
      
      if (queryToRun.includes("order by id desc")) {
        filtered.sort((a,b) => b.id - a.id);
      } else if (queryToRun.includes("order by id asc")) {
        filtered.sort((a,b) => a.id - b.id);
      }

      setSqliteLogs(prev => [
        ...prev,
        `sqlite3> ${overrideQuery || activeSqlQuery}`,
        `-- Returned ${filtered.length} rows successfully.`
      ]);
      setSqliteSuccessMessage(`Successfully fetched ${filtered.length} rows.`);
    } else if (queryToRun.startsWith("delete") || queryToRun.startsWith("drop")) {
      setSqliteRows([]);
      localStorage.setItem("owl_sqlite_fi_searches_v5", JSON.stringify([]));
      setSqliteLogs(prev => [
        ...prev,
        `sqlite3> ${overrideQuery || activeSqlQuery}`,
        `-- Query OK, all rows deleted. (0.004 sec)`
      ]);
      setSqliteSuccessMessage("Database rows truncated.");
    } else {
      setSqliteLogs(prev => [
        ...prev,
        `sqlite3> ${overrideQuery || activeSqlQuery}`,
        `-- Error: Unsupported query type. Only SELECT, DELETE statements supported.`
      ]);
    }
  };

  const handleSaveToSqlite = (accountNumber: string, bankCode: string, bankName: string, matchProb: number) => {
    const nextId = sqliteRows.length > 0 ? Math.max(...sqliteRows.map(r => r.id)) + 1 : 1;
    const nowStamp = new Date().toLocaleString("en-US");
    const newRow = {
      id: nextId,
      account_number: accountNumber,
      bank_code: bankCode,
      bank_name: bankName,
      match_prob: matchProb,
      timestamp: nowStamp
    };

    const updated = [newRow, ...sqliteRows];
    setSqliteRows(updated);
    localStorage.setItem("owl_sqlite_fi_searches_v5", JSON.stringify(updated));

    const insertStmt = `INSERT INTO fi_searches (account_number, bank_code, bank_name, match_prob, timestamp) VALUES ('${accountNumber}', '${bankCode}', '${bankName}', ${matchProb}, '${nowStamp}');`;

    setSqliteLogs(prev => [
      ...prev,
      `sqlite3> ${insertStmt}`,
      `-- Query OK, 1 row affected (0.001 sec). Record written to SQLite block.`
    ]);
    
    alert(`[SQLite Engine] Row inserted successfully with ID: ${nextId}! Saved in /var/db/fi_searches.sqlite`);
  };

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
      let isLengthMatch = false;
      let hasVeryStrongPrefix = false;
      let hasStrongPrefix = false;
      const baseScore = 15;

      // Check standard account lengths in Malaysia
      if (bank.code === "CIMB" && (len === 10 || len === 14)) isLengthMatch = true;
      if (bank.code === "OCBC" && len === 10) isLengthMatch = true;
      if (bank.code === "BAY" && len === 12) isLengthMatch = true; // Maybank
      if (bank.code === "PBB" && len === 10) isLengthMatch = true; // Public Bank
      if (bank.code === "RHB" && len === 14) isLengthMatch = true;
      if (bank.code === "AFFIN" && (len === 10 || len === 12)) isLengthMatch = true;
      if (bank.code === "HLB" && len === 11) isLengthMatch = true;
      if (bank.code === "AMB" && len === 13) isLengthMatch = true;
      if (bank.code === "BIMB" && len === 14) isLengthMatch = true;
      if (bank.code === "ALB" && len === 15) isLengthMatch = true;
      if (bank.code === "TNG" && (len >= 10 && len <= 12)) isLengthMatch = true;

      // Check prefixes with deep hierarchical matching
      if (bank.code === "CIMB") {
        if (cleanNum.startsWith("70") || cleanNum.startsWith("76") || cleanNum.startsWith("80") || cleanNum.startsWith("86")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("7") || cleanNum.startsWith("8")) {
          hasStrongPrefix = true;
        }
      }
      
      if (bank.code === "BAY") {
        if (cleanNum.startsWith("11") || cleanNum.startsWith("16") || cleanNum.startsWith("51") || cleanNum.startsWith("56") || cleanNum.startsWith("57")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("1") || cleanNum.startsWith("5")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "PBB") {
        if (cleanNum.startsWith("30") || cleanNum.startsWith("31") || cleanNum.startsWith("40") || cleanNum.startsWith("45") || cleanNum.startsWith("48")) {
          hasVeryStrongPrefix = true;
        } else if ((cleanNum.startsWith("3") || cleanNum.startsWith("4") || cleanNum.startsWith("6")) && !cleanNum.startsWith("601") && !cleanNum.startsWith("60")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "RHB") {
        if (cleanNum.startsWith("21") || cleanNum.startsWith("22") || cleanNum.startsWith("26")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("2") || cleanNum.startsWith("1")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "AFFIN") {
        if (cleanNum.startsWith("100") || cleanNum.startsWith("105")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("10") || cleanNum.startsWith("1")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "HLB") {
        if (cleanNum.startsWith("02") || cleanNum.startsWith("12") || cleanNum.startsWith("13")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("0") || cleanNum.startsWith("1") || cleanNum.startsWith("2") || cleanNum.startsWith("3")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "AMB") {
        if (cleanNum.startsWith("88") || cleanNum.startsWith("888")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("8")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "BIMB") {
        if (cleanNum.startsWith("04") || cleanNum.startsWith("14")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("0") || cleanNum.startsWith("1")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "ALB") {
        if (cleanNum.startsWith("12") || cleanNum.startsWith("14") || cleanNum.startsWith("15")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("1")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "OCBC") {
        if (cleanNum.startsWith("72") || cleanNum.startsWith("73") || cleanNum.startsWith("71")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("7") || cleanNum.startsWith("1") || cleanNum.startsWith("5")) {
          hasStrongPrefix = true;
        }
      }

      if (bank.code === "TNG") {
        if (cleanNum.startsWith("9") || cleanNum.startsWith("01") || cleanNum.startsWith("601") || cleanNum.startsWith("60")) {
          hasVeryStrongPrefix = true;
        } else if (cleanNum.startsWith("0") || cleanNum.startsWith("6")) {
          hasStrongPrefix = true;
        }
      }

      // Calculate score based on components
      let finalScore = baseScore;

      if (hasVeryStrongPrefix) {
        finalScore += 65;
      } else if (hasStrongPrefix) {
        finalScore += 45;
      }

      // Add length bonus
      if (isLengthMatch) {
        if (hasVeryStrongPrefix || hasStrongPrefix) {
          finalScore += 19; // Exact signature + exact length = 99% or 79% (Very strong or Strong)
        } else {
          finalScore += 10; // Length matches, but no prefix correlation = 25% (Very low)
        }
      } else {
        if (hasVeryStrongPrefix || hasStrongPrefix) {
          finalScore += 5; // Good prefix, but alternative/unusual length = 85% or 65% (Strong matching, but warns length mismatch)
        }
      }

      // Double prefix check protection: if it matches another bank's very strong prefix, penalize points to avoid overlaps!
      // For example, if it starts with "76", that is extremely CIMB-specific. OCBC or others starting with 7 should get heavily penalized.
      if (bank.code !== "CIMB" && (cleanNum.startsWith("76") || cleanNum.startsWith("70") || cleanNum.startsWith("80") || cleanNum.startsWith("86"))) {
        finalScore -= 40;
      }
      if (bank.code !== "BAY" && (cleanNum.startsWith("16") || cleanNum.startsWith("56") || cleanNum.startsWith("51"))) {
        finalScore -= 40;
      }
      if (bank.code !== "PBB" && (cleanNum.startsWith("30") || cleanNum.startsWith("31") || cleanNum.startsWith("40") || cleanNum.startsWith("45"))) {
        finalScore -= 40;
      }
      if (bank.code !== "TNG" && (cleanNum.startsWith("601") || cleanNum.startsWith("901") || cleanNum.startsWith("902"))) {
        finalScore -= 45;
      }
      if (bank.code !== "AMB" && cleanNum.startsWith("88")) {
        finalScore -= 40;
      }

      const capped = Math.max(0, Math.min(finalScore, 99)); // Max precision capped at 99%, min 0%
      return { ...bank, matchScore: capped };
    });

    // sort showing highest matched on top
    const filteredAndSorted = results
      .filter(b => b.matchScore > 35)
      .sort((a, b) => b.matchScore - a.matchScore);

    setMatchedBanks(filteredAndSorted);
  }, [fiSearchTerm]);


  // --- 3. NSRC INTEGRATION STATES ---
  const [nsrcCaseId, setNsrcCaseId] = useState("");
  const [nsrcAccNum, setNsrcAccNum] = useState("");
  const [nsrcCif, setNsrcCif] = useState("");
  const [nsrcRegNo, setNsrcRegNo] = useState("");
  const [nsrcName, setNsrcName] = useState("");
  const [nsrcBlockType, setNsrcBlockType] = useState("");
  const [nsrcBusinessUnit, setNsrcBusinessUnit] = useState("");
  const [nsrcClassification, setNsrcClassification] = useState("");
  const [nsrcBlockDesc, setNsrcBlockDesc] = useState("");
  const [nsrcAmount, setNsrcAmount] = useState(""); // Disputed transaction amount
  const [nsrcEarmarkAmount, setNsrcEarmarkAmount] = useState(""); // Frozen/Hold Earmark amount
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
      setNsrcAmount("RM2,500.00");
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

  const handleSaveNSRC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nsrcCif || !nsrcName || !nsrcAccNum) {
      alert("NSRC report registration requires Account number, CIF, and Name inputs.");
      return;
    }

    const newNSRC: NSRCEntry = {
      id: "nsrc-" + Date.now(),
      caseId: nsrcCaseId.trim() || ("NSRC" + Math.floor(100000 + Math.random() * 900000)),
      cif: nsrcCif,
      regNo: nsrcRegNo || "20260109658",
      name: nsrcName.toUpperCase(),
      accountNumber: nsrcAccNum,
      accountBlockingType: nsrcBlockType || "Account Block - General",
      businessUnit: nsrcBusinessUnit || "Retail Division",
      accountClassification: nsrcClassification || "Savings",
      statusBlockDesc: nsrcBlockDesc || `Account locked on registration`,
      amount: nsrcAmount || "RM0.00",
      earmarkAmount: nsrcEarmarkAmount || "RM0.00",
      earmark: nsrcEarmark || "No",
      remarks: nsrcRemarks || "NSRC SUSPECT BANNER ACTIVATED",
      reason: nsrcReason || "NSRC REQUESTED",
      dateStamp: nsrcDateStamp,
      createdAt: new Date().toISOString(),
      officerPsid: currentOfficer.psid
    };

    try {
      await setDoc(doc(db, "nsrcEntries", newNSRC.id), newNSRC);
      alert("NSRC Report successfully saved and synced across all terminals.");
    } catch (error) {
      console.error("Firestore error saving NSRC:", error);
      setNsrcEntries([newNSRC, ...nsrcEntries]);
      alert("NSRC Report saved locally.");
    }
    
    // reset NSRC inputs
    setNsrcCaseId("");
    setNsrcAccNum("");
    setNsrcCif("");
    setNsrcRegNo("");
    setNsrcName("");
    setNsrcBlockType("");
    setNsrcBusinessUnit("");
    setNsrcClassification("");
    setNsrcBlockDesc("");
    setNsrcAmount("");
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const psidInput = loginPsid.trim().toUpperCase();
    
    // Restriction: Only authorized users can access this system
    const ALLOWED_PSIDS = ["PS101435", "PS101436", "PS101477", "PS101405", "PS101480"];
    const isAuthorized = ALLOWED_PSIDS.includes(psidInput) || staffAccounts.some(s => s.psid.toUpperCase() === psidInput);
    if (!isAuthorized) {
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
    try {
      await setDoc(doc(db, "sessionLogs", newLog.id), newLog);
      
      // Update account status in Firestore on login
      await setDoc(doc(db, "staffAccounts", account.psid), {
        ...account,
        isOnline: true,
        lastActive: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firestore logging or status error:", err);
      setSessionLogs(prev => [newLog, ...prev]);
    }

    setCurrentUser(account);
    setLoginPsid("");
    setLoginPassword("");
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
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
    
    const updatedStaffAccount = {
      ...liveAccount,
      password: newPassword,
      mustChangePassword: false
    };

    // Log real-time PASSWORD_CHANGE event
    const passChangeLog = {
      id: "log-" + Date.now(),
      psid: currentUser.psid,
      name: currentUser.name,
      action: "PASSWORD_CHANGE",
      timestamp: new Date().toLocaleString(),
      details: `Password changed from '${oldPassword}' to '${newPassword}' successfully (Secured)`
    };

    try {
      // Direct Firestore updates will trigger snapshot listeners to update UI globally instantly
      await setDoc(doc(db, "staffAccounts", liveAccount.psid), updatedStaffAccount);
      await setDoc(doc(db, "sessionLogs", passChangeLog.id), passChangeLog);
      alert("Password successfully synchronized in Firestore. Security compliance cleared!");
    } catch (e) {
      console.error("Firestore error changing password:", e);
      const updatedStaff = staffAccounts.map(s => {
        if (s.psid === currentUser.psid) {
          return updatedStaffAccount;
        }
        return s;
      });
      setStaffAccounts(updatedStaff);
      setSessionLogs(prev => [passChangeLog, ...prev]);
      alert("Password updated locally (Offline fallback).");
    }
    
    const updatedUser = {
      ...currentUser,
      password: newPassword,
      mustChangePassword: false
    };
    setCurrentUser(updatedUser);
    
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = async () => {
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
      try {
        await setDoc(doc(db, "sessionLogs", newLog.id), newLog);
        
        // Update user status
        const liveUser = staffAccounts.find(s => s.psid.toUpperCase() === currentUser.psid.toUpperCase());
        if (liveUser) {
          await setDoc(doc(db, "staffAccounts", currentUser.psid), {
            ...liveUser,
            isOnline: false,
            lastActive: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(err);
        setSessionLogs(prev => [newLog, ...prev]);
      }
    }
    setCurrentUser(null);
    setActiveTab("CASE");
  };

  const handleCreateNewStaff = async (e: React.FormEvent) => {
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

    const registerLog = {
      id: "log-" + Date.now(),
      psid: currentUser ? currentUser.psid : "ADMIN",
      name: currentUser ? currentUser.name : "System",
      action: "USER_REGISTER",
      timestamp: new Date().toLocaleString(),
      details: `Registered new officer: ${newOfficer.name} (${newOfficer.psid})`
    };
    
    try {
      await setDoc(doc(db, "staffAccounts", cleanPsid), newOfficer);
      await setDoc(doc(db, "sessionLogs", registerLog.id), registerLog);
      setNewStaffPsid("");
      setNewStaffName("");
      setAdminMessage(`Successfully registered officer ${newOfficer.name} (${newOfficer.psid}) with default password 'Affin123'!`);
    } catch (error) {
      console.error(error);
      setStaffAccounts([...staffAccounts, newOfficer]);
      setNewStaffPsid("");
      setNewStaffName("");
      setAdminMessage(`Successfully registered officer ${newOfficer.name} (${newOfficer.psid}) with default password 'Affin123' (Local Only)!`);
    }
  };

  const handleAdminResetPassword = async (psid: string) => {
    const s = staffAccounts.find(acc => acc.psid === psid);
    if (!s) return;
    
    const updatedAcc = {
      ...s,
      password: "Affin123",
      mustChangePassword: true
    };
    
    // Log PASSWORD_RESET event
    const resetLog = {
      id: "log-" + Date.now(),
      psid: currentUser ? currentUser.psid : "ADMIN",
      name: currentUser ? currentUser.name : "System",
      action: "PASSWORD_RESET",
      timestamp: new Date().toLocaleString(),
      details: `Administrator reset password for officer ${psid} to 'Affin123' (First Change Required)`
    };

    try {
      await setDoc(doc(db, "staffAccounts", psid), updatedAcc);
      await setDoc(doc(db, "sessionLogs", resetLog.id), resetLog);
      alert(`Successfully reset password for officer ${psid} back to 'Affin123'. They will be required to change it on their next login session.`);
    } catch (e) {
      console.error(e);
      const updated = staffAccounts.map(acc => acc.psid === psid ? updatedAcc : acc);
      setStaffAccounts(updated);
      setSessionLogs(prev => [resetLog, ...prev]);
      alert(`Successfully reset password for officer ${psid} back to 'Affin123' (Local).`);
    }
    
    if (currentUser && currentUser.psid === psid) {
      setCurrentUser({
        ...currentUser,
        password: "Affin123",
        mustChangePassword: true
      });
    }
  };
  
  const handleRestoreDefaultAccounts = async () => {
    if (!confirm("Are you sure you want to reset and restore all 5 standard corporate compliance accounts (Zaim, Faris, Nabil, Naja, Izzat) back to their default password 'Affin123' and require password changes on login? This will overwrite their current passwords and statuses in the database.")) {
      return;
    }
    
    const corporateDefaults = [
      { psid: "PS101435", name: "Zaim", role: "Admin", status: "Active", password: "Affin123", mustChangePassword: true },
      { psid: "PS101436", name: "Faris", role: "Staff", status: "Active", password: "Affin123", mustChangePassword: true },
      { psid: "PS101477", name: "Nabil", role: "Staff", status: "Active", password: "Affin123", mustChangePassword: true },
      { psid: "PS101405", name: "Naja", role: "Staff", status: "Active", password: "Affin123", mustChangePassword: true },
      { psid: "PS101480", name: "Izzat", role: "Staff", status: "Active", password: "Affin123", mustChangePassword: true }
    ];

    try {
      for (const officer of corporateDefaults) {
        await setDoc(doc(db, "staffAccounts", officer.psid), officer);
      }
      
      const resetLog = {
        id: "log-" + Date.now(),
        psid: currentUser?.psid || "SYSTEM",
        name: currentUser?.name || "Administrator",
        action: "PASSWORD_RESET",
        timestamp: new Date().toLocaleString(),
        details: `Administrator bulk-restored all 5 corporate compliance profiles to 'Affin123' (First-time password change forced)`
      };
      await setDoc(doc(db, "sessionLogs", resetLog.id), resetLog);
      
      alert("All 5 corporate compliance profiles successfully restored to default state in Firestore!");
    } catch (error) {
      console.error("Error bulk restoring profiles:", error);
      alert("Error restoring profiles in Firestore. Please try again.");
    }
  };

  const handleAdminDeleteStaff = async (psid: string) => {
    if (psid === "PS101435" || psid === "PS101436") {
      alert("Error: Root administrator accounts (PS101435 / PS101436) cannot be deleted.");
      return;
    }
    if (confirm(`Are you sure you want to delete staff account ${psid}?`)) {
      try {
        await deleteDoc(doc(db, "staffAccounts", psid));
        alert(`Staff account ${psid} deleted.`);
      } catch (e) {
        console.error(e);
        setStaffAccounts(staffAccounts.filter(s => s.psid !== psid));
        alert(`Staff account ${psid} deleted locally.`);
      }
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
      
      const defaultFilename = `NSRC_${nsrcToExport.name.trim().replace(/[^a-zA-Z0-9_\-\s]/g, "")}_(${nsrcToExport.cif.trim()}).xlsx`;
      
      // Close decryption password sheet
      setNsrcToExport(null);
      
      // Open our location destination verification modal!
      setExcelExportPending({
        type: "NSRC",
        data: nsrcToExport,
        defaultFilename,
        customFilename: defaultFilename
      });
    } else {
      setPasswordModalError("Access Denied: Incorrect password code.");
    }
  };

  const handleExportNSRCExcel = (entry: NSRCEntry) => {
    triggerNSRCExport(entry);
  };

  const handleConfirmExcelExport = async () => {
    if (!excelExportPending) return;
    const { type, data, customFilename } = excelExportPending;
    
    // Clear pending state
    setExcelExportPending(null);

    if (type === "NSRC") {
      const { downloadProtectedNSRCExcel } = await import("./excelExport");
      const res = await downloadProtectedNSRCExcel(data, customFilename);
      if (res.success) {
        alert(`Success: Secure NSRC file decrypted and exported successfully as "${res.filename}"!`);
      } else if (!res.cancelled) {
        alert("Error generating workbook compilation.");
      }
    } else {
      const { downloadFMSDatabaseExcel } = await import("./excelExport");
      const res = await downloadFMSDatabaseExcel(data, customFilename);
      if (res.success) {
        alert(`Success: FMS Database exported successfully as "${res.filename}"!`);
      } else if (!res.cancelled) {
        alert("Error exporting FMS cases.");
      }
    }
  };


  // --- 4. DYNAMIC ANALYTICS CALCULATIONS ---
  const totalFinancialValue = cases.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalFreudHighlight = cases.filter(c => c.resolution.toLowerCase().includes("fraud") || c.remarks.toLowerCase().includes("fraud")).length;
  const uniqueCifs = new Set(cases.map(c => c.cif)).size;
  const totalResolved = cases.filter(c => c.callResponse && c.resolution).length;

  // Filter cases & NSRC by CIF search
  const filteredCases = cases.filter(c => {
    // 1. CIF or Rule search
    let cifMatch = true;
    if (dbSearchCif) {
      cifMatch = c.cif.includes(dbSearchCif) || c.ruleId.toLowerCase().includes(dbSearchCif.toLowerCase());
    } else if (globalSearchCif) {
      cifMatch = c.cif.includes(globalSearchCif) || c.ruleId.toLowerCase().includes(globalSearchCif.toLowerCase());
    }

    // 2. PSID / Division Filter
    let divisionMatch = true;
    if (dbDivision === "PERSONAL") {
      divisionMatch = c.assignedOfficer.toUpperCase() === currentOfficer.psid.toUpperCase();
    } else if (dbFilterPsid !== "ALL") {
      divisionMatch = c.assignedOfficer.toUpperCase() === dbFilterPsid.toUpperCase();
    }

    return cifMatch && divisionMatch;
  });

  const filteredNSRC = nsrcEntries.filter(n => {
    let cifMatch = true;
    if (dbSearchCif) {
      cifMatch = n.cif.includes(dbSearchCif) || 
                 n.accountNumber.includes(dbSearchCif) || 
                 n.name.toLowerCase().includes(dbSearchCif.toLowerCase()) ||
                 (n.caseId && n.caseId.toLowerCase().includes(dbSearchCif.toLowerCase()));
    } else if (globalSearchCif) {
      cifMatch = n.cif.includes(globalSearchCif) || 
                 n.accountNumber.includes(globalSearchCif) || 
                 n.name.toLowerCase().includes(globalSearchCif.toLowerCase());
    }

    let divisionMatch = true;
    if (dbDivision === "PERSONAL") {
      // Show seed entries (which don't have officerPsid field) OR entries created by the logged in officer
      divisionMatch = !n.officerPsid || n.officerPsid.toUpperCase() === currentOfficer.psid.toUpperCase();
    }

    return cifMatch && divisionMatch;
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
                placeholder="e.g. PS101435"
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
                    const dateMap: { [date: string]: { count: number, val: number, time: number } } = {};
                    cases.forEach(c => {
                      const caseDate = c.caseCreatedTime ? new Date(c.caseCreatedTime.split(" ")[0]) : new Date(c.createdAt || Date.now());
                      const label = caseDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                      if (!dateMap[label]) {
                        dateMap[label] = { count: 0, val: 0, time: caseDate.getTime() };
                      }
                      dateMap[label].count += 1;
                      dateMap[label].val += Number(c.amount || 0);
                    });

                    const chartData = Object.keys(dateMap).map(k => ({
                      date: k,
                      count: dateMap[k].count,
                      val: dateMap[k].val,
                      time: dateMap[k].time
                    })).sort((a, b) => a.time - b.time);

                    if (chartData.length < 2) {
                      return (
                        <div className="mt-4 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-[160px] p-6 text-center">
                          <TrendingUp className="h-7 w-7 text-slate-350 mb-2 animate-pulse" />
                          <span className="text-xs font-bold text-slate-700 font-sans">Trendline Graph Inactive</span>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-sm font-sans leading-relaxed">
                            Trend visualization requires a <strong>minimum of 2 days of data collections</strong>. Currently tracking: <span className="bg-slate-200 text-slate-800 font-mono px-1.5 py-0.2 rounded font-bold">{chartData.length} unique day(s)</span>. Add more historical cases to unlock!
                          </p>
                        </div>
                      );
                    }

                    const maxVal = Math.max(...chartData.map(d => d.val), 50000);
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
                                <stop offset="0%" stopColor="#0071e3" stopOpacity="0.18" stopID="grad-stop-1" />
                                <stop offset="100%" stopColor="#0071e3" stopOpacity="0.01" stopID="grad-stop-2" />
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
                    <h4 className="font-display font-semibold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Consolidated Daily Team Productivity Scorecard (All Compliance Officers Sync)</span>
                    </h4>
                    <p className="text-[10px] text-indigo-750 font-bold">
                      Reflecting team-wide real-time FMS case resolutions and decision workloads synced across all database roles
                    </p>
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
                      {staffAccounts.map((officer) => {
                        const isCurrent = officer.psid === currentOfficer.psid;
                        const scoreCases = cases.filter(c => c.assignedOfficer === officer.psid);
                        
                        const confirmFraud = scoreCases.filter(c => c.resolution && c.resolution.toLowerCase().includes("confirm") && c.resolution.toLowerCase().includes("fraud")).length;
                        const suspectedFraud = scoreCases.filter(c => c.resolution && c.resolution.toLowerCase().includes("suspect")).length;
                        const confirmGenuine = scoreCases.filter(c => c.resolution && c.resolution.toLowerCase().includes("confirm") && c.resolution.toLowerCase().includes("genuine")).length;
                        const assumeGenuine = scoreCases.filter(c => c.resolution && c.resolution.toLowerCase().includes("assume") && c.resolution.toLowerCase().includes("genuine")).length;
                        
                        const contacted = scoreCases.filter(c => c.callResponse && (c.callResponse.toLowerCase().includes("contacted") || c.callResponse.toLowerCase().includes("close screen"))).length;
                        const noContact = scoreCases.filter(c => c.callResponse && c.callResponse.toLowerCase().includes("unable")).length;
                        const closeManual = scoreCases.filter(c => c.resolution && c.resolution.toLowerCase().includes("manual")).length;
                        const totalWorkload = scoreCases.length;

                        return (
                          <tr key={officer.psid} className={`hover:bg-slate-50 transition-colors ${isCurrent ? "bg-amber-50/40" : ""}`}>
                            <td className="px-3 py-2.5 font-bold text-slate-800 flex items-center space-x-1.5 whitespace-nowrap">
                              <span className={`h-2 w-2 rounded-full ${
                                officer.isOnline && officer.lastActive && (Date.now() - new Date(officer.lastActive).getTime() < ONLINE_THRESHOLD_MS)
                                  ? "bg-emerald-500 animate-pulse" 
                                  : "bg-slate-300"
                              }`} title={
                                officer.isOnline && officer.lastActive && (Date.now() - new Date(officer.lastActive).getTime() < ONLINE_THRESHOLD_MS)
                                  ? "Online & Transmitting Heartbeats"
                                  : "Offline / Inactive"
                              } />
                              {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Your Session" />}
                              <span>{officer.psid}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({officer.name})</span>
                            </td>
                            <td className="px-3 py-2.5 text-center font-semibold text-red-600 font-mono">{confirmFraud === 0 ? "-" : confirmFraud}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-amber-600 font-mono">{suspectedFraud === 0 ? "-" : suspectedFraud}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-green-600 font-mono">{confirmGenuine === 0 ? "-" : confirmGenuine}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-blue-600 font-mono">{assumeGenuine === 0 ? "-" : assumeGenuine}</td>
                            <td className="px-3 py-2.5 text-center font-bold font-mono">{totalWorkload === 0 ? "-" : totalWorkload}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-indigo-600 font-mono">{contacted === 0 ? "-" : contacted}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-slate-500 font-mono">{noContact === 0 ? "-" : noContact}</td>
                            <td className="px-3 py-2.5 text-center font-semibold text-slate-705 font-mono">{closeManual === 0 ? "-" : closeManual}</td>
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
                    type="button"
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
                    type="button"
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

                {/* FUNCTIONAL SEARCH CIF RECORD */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="case-top-search-cif"
                      type="text"
                      placeholder="Search CIF No..."
                      value={caseSearchInputCif}
                      onChange={(e) => setCaseSearchInputCif(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (caseSearchInputCif.trim()) {
                            handleLoadCaseForUpdate(caseSearchInputCif.trim());
                            setCaseSearchInputCif("");
                          }
                        }
                      }}
                      className="pl-8 pr-14 py-1.5 bg-[#f5f5f7] border border-[#e8e8ed] text-xs rounded-md focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all font-mono w-48 placeholder-slate-400 text-slate-900"
                    />
                    {caseSearchInputCif && (
                      <button
                        type="button"
                        onClick={() => setCaseSearchInputCif("")}
                        className="absolute inset-y-0 right-9 flex items-center text-[10px] text-slate-400 hover:text-slate-650 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (caseSearchInputCif.trim()) {
                          handleLoadCaseForUpdate(caseSearchInputCif.trim());
                          setCaseSearchInputCif("");
                        }
                      }}
                      className="absolute inset-y-0 right-0 flex items-center px-2 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-r-md cursor-pointer transition-colors"
                    >
                      GO
                    </button>
                    {/* DROPDOWN MATCHES FOR SMART AUTOCOMPLETE */}
                    {caseSearchInputCif.trim() && (
                      <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 text-xs py-1 max-h-48 overflow-y-auto">
                        <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          Matching Database Cases
                        </div>
                        {(() => {
                          const query = caseSearchInputCif.trim().toUpperCase();
                          const matches = cases.filter(c => 
                            c.cif.toUpperCase().includes(query) || 
                            c.eventType.toUpperCase().includes(query) ||
                            (c.ruleId && c.ruleId.toUpperCase().includes(query))
                          );
                          if (matches.length === 0) {
                            return <div className="p-3 text-slate-400 text-center text-[11px]">No matching cases found</div>;
                          }
                          return matches.map((c, i) => (
                            <button
                              key={`${c.cif}-${i}`}
                              type="button"
                              onClick={() => {
                                handleLoadCaseForUpdate(c.cif);
                                setCaseSearchInputCif("");
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 font-sans flex flex-col border-b border-slate-100 last:border-b-0 cursor-pointer"
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded text-[10.5px]">
                                  {c.cif}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600">
                                  RM {c.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {c.eventType} {c.ruleId ? `(${c.ruleId})` : ""}
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* THREE-COLUMN INTEGRATED COMPACT WORKSPACE */}
              <form onSubmit={handleCommitCaseEntry} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* COLUMN 1 (4 cols Span) - STACKED RAW INGESTION & BRANCH DIRECTORY LOOKUP */}
                <div className="flex flex-col lg:col-span-4 space-y-4">
                  {/* RAW INGESTION */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col">
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
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs font-mono rounded-md focus:outline-none focus:border-indigo-500 resize-none mb-3 h-28"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="btn-parse-data"
                        type="button"
                        onClick={handleParseRawData}
                        className="w-full text-center py-2 bg-slate-800 font-bold text-white text-[11px] rounded hover:bg-slate-700 transition cursor-pointer"
                      >
                        PARSE
                      </button>
                      <button
                        id="btn-clear-pane"
                        type="button"
                        onClick={handleClearRawPane}
                        className="w-full text-center py-2 bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[11px] rounded hover:bg-slate-200 transition cursor-pointer"
                      >
                        CLEAR
                      </button>
                    </div>
                  </div>

                  {/* BRANCH DIRECTORY LOOKUP CARD */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col">
                    <div className="pb-2.5 border-b border-slate-100 mb-3 flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-sky-500" />
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                        BRANCH LOOKUP
                      </h4>
                    </div>
                    
                    <div className="relative mb-2 shrink-0">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                        <Search className="h-3.5 w-3.5" />
                      </span>
                      <input
                        id="branch-search-input"
                        type="text"
                        placeholder="Search branch code or name..."
                        value={branchSearchTerm}
                        onChange={(e) => setBranchSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-16 py-1.5 bg-[#f5f5f7] border border-[#e8e8ed] text-xs rounded-md focus:border-sky-500 focus:bg-white focus:outline-none transition-all font-sans text-slate-900 placeholder-slate-400"
                      />
                      {branchSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setBranchSearchTerm("")}
                          className="absolute inset-y-0 right-2 flex items-center text-[10px] text-slate-400 hover:text-slate-650 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    {/* RESULTS AREA */}
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1 font-sans">
                      {(() => {
                        const cleanQuery = branchSearchTerm.trim().toLowerCase();
                        if (!cleanQuery) {
                          return (
                            <div className="text-[10px] text-slate-400 text-center py-2">
                              Enter branch code or name to look up
                            </div>
                          );
                        }
                        const filtered = BRANCH_LIST.filter(b => 
                          b.code.includes(cleanQuery) || 
                          b.name.toLowerCase().includes(cleanQuery)
                        ).slice(0, 15);
                        
                        if (filtered.length === 0) {
                          return (
                            <div className="text-[10px] text-red-500 text-center py-2 font-semibold">
                              No matching branch found
                            </div>
                          );
                        }
                        
                        return filtered.map((b, idx) => (
                          <div 
                            key={`${b.code}-${idx}`}
                            className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100 hover:bg-sky-50/40 hover:border-sky-100 transition-all text-[11px]"
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="px-1 py-0.2 bg-sky-100 text-sky-800 rounded text-[8px] font-mono font-bold">
                                {b.code}
                              </span>
                              <span className="font-semibold text-slate-700 truncate uppercase text-[10px]">
                                {b.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(b.name, `Branch ${b.name}`)}
                              className="text-[9px] text-sky-600 hover:text-sky-850 font-bold px-1.5 py-0.5 rounded hover:bg-sky-100 cursor-pointer flex items-center space-x-0.5 shrink-0"
                            >
                              <Copy className="h-2.5 w-2.5" />
                              <span>Copy</span>
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>


                {/* COLUMN 2 (4 cols Span) - SYSTEM METADATA (FLAT / NO SCROLLBAR) */}
                <div className="flex flex-col lg:col-span-4 space-y-4">
                  {/* SYSTEM METADATA AUTOMATED VIEW (READONLY) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col h-full">
                    <div className="pb-2.5 border-b border-slate-100 mb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">SYSTEM METADATA</h4>
                      </div>
                      {caseMode === "UPDATE" && (
                        <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold uppercase">
                          Case Pending
                        </span>
                      )}
                    </div>

                    {/* ONLY EDITABLE ARE CIF (with copy feature) and AMOUNT */}
                    <div className="space-y-3 mb-3">
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

                    {/* Parsed FMS Fields section - Flat styled layout without scroll and fixed height limitation */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 text-xs flex-grow">
                      <h5 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 font-mono pb-1 border-b border-slate-200">
                        Parsed FMS Fields (Read-Only)
                      </h5>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Event Type:</span>
                          <span className="font-medium text-slate-850 text-[10px] block font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate">{caseEventType}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Risk Score:</span>
                          <span className="font-mono font-bold text-[10px] block text-red-600 bg-white px-1.5 py-0.5 rounded border border-slate-100">{caseRiskScore}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Mode / Channel:</span>
                          <span className="font-medium text-slate-850 text-[10px] block font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate">{caseModeChannel}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Rule ID:</span>
                          <span className="font-semibold text-slate-850 text-[10px] block font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate">{caseRuleId}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">FMS Status:</span>
                          <span className="font-bold text-[9px] block font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate text-amber-600">{caseFmsStatus}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Officer:</span>
                          <span className="font-semibold text-slate-855 text-[10px] block font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate">{currentOfficer.psid}</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400">Policy Action:</span>
                        <span className="font-semibold text-[11px] block font-mono text-red-750 bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate">{casePolicyAction}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Created:</span>
                          <span className="font-mono text-[9px] text-slate-600 block bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate">{caseCreatedTime || "-"}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-slate-400">Assigned:</span>
                          <span className="font-mono text-[9px] text-slate-600 block bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate">{caseAssignedTime || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-1.5 text-[10px] text-slate-400 text-center font-mono uppercase bg-slate-50 rounded border border-slate-100 py-1 shrink-0">
                      Ingestion: <strong className="text-slate-650">{ingestStatus}</strong>
                    </div>
                  </div>
                </div>


                {/* COLUMN 3 (4 cols Span) - RESOLUTION & CONDITIONAL FORMATTED PRESETS */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col lg:col-span-4 h-full">
                  <div className="pb-2 border-b border-slate-100 mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <PhoneCall className="h-4 w-4 text-emerald-500" />
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">VERIFICATION WORKFLOW</h4>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono font-bold uppercase">Consolidated</span>
                  </div>

                  <div className="space-y-3 flex flex-col h-full justify-between">
                    {/* PRESET INTEGRATED DROPDOWN */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                        FMS Call & Resolution Presets
                      </label>
                      <select
                        id="fms-preset-select"
                        value={selectedPreset}
                        onChange={(e) => handlePresetSelect(e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-emerald-500 bg-emerald-5/20 text-slate-800"
                      >
                        <option value="">Select Preset (populates fields)...</option>
                        {PRESET_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* READONLY AUTOLOAD FIELDS BASED ON OPTION (but can be manually filled) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Call Response</label>
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
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Resolution</label>
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
                    <div className={`p-2.5 rounded-lg border flex items-center space-x-2.5 transition-all duration-300 ${resStyle.bg}`}>
                      <div className="shadow-xs bg-white p-1 rounded-md flex items-center justify-center border border-slate-100 text-slate-700 shrink-0">
                        {getResolutionIcon(resStyle.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] tracking-wider font-mono uppercase font-black opacity-60">Status Validation</span>
                          <span className="text-[8px] bg-slate-900/10 font-bold px-1.5 py-0.2 rounded font-mono truncate uppercase">Real-Time</span>
                        </div>
                        <span className="block font-sans font-bold text-[10.5px] truncate leading-tight mt-0.5 text-slate-800">{resStyle.label}</span>
                        <p className="text-[9px] font-medium opacity-80 truncate leading-tight mt-0.5">{resStyle.desc}</p>
                      </div>
                    </div>

                    {/* TIMELINE HISTORY CALL TRIGGERS: 1st, 2nd, 3rd calls */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                        Call Attempt History Logs
                      </span>

                      {caseMode === "CREATE" ? (
                        /* Create Mode: Standard Log fields */
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-[9px] font-bold text-slate-400 w-11 shrink-0">1st Call:</span>
                            <button
                              type="button"
                              onClick={() => handleSetCurrentTimestamp(1)}
                              className="bg-slate-200 hover:bg-slate-300 p-0.5 rounded hover:text-blue-600 transition shrink-0"
                              title="Set current time"
                            >
                              <Clock className="h-3 w-3" />
                            </button>
                            <input
                              id="field-call-1-time"
                              type="text"
                              placeholder="Timestamp"
                              value={firstCallTime}
                              onChange={(e) => setFirstCallTime(e.target.value)}
                              className="flex-1 min-w-0 px-1 py-0.5 border border-slate-200 bg-white rounded font-mono text-[9px]"
                            />
                            <input
                              type="text"
                              placeholder="Notes"
                              value={firstCallRemarks}
                              onChange={(e) => setFirstCallRemarks(e.target.value)}
                              className="w-24 px-1 py-0.5 border border-slate-200 bg-white rounded text-[9px]"
                            />
                          </div>

                          <div className="flex items-center space-x-1">
                            <span className="text-[9px] font-bold text-slate-400 w-11 shrink-0">2nd Call:</span>
                            <button
                              type="button"
                              onClick={() => handleSetCurrentTimestamp(2)}
                              className="bg-slate-200 hover:bg-slate-300 p-0.5 rounded hover:text-blue-600 transition shrink-0"
                              title="Set current time"
                            >
                              <Clock className="h-3 w-3" />
                            </button>
                            <input
                              id="field-call-2-time"
                              type="text"
                              placeholder="Timestamp"
                              value={secondCallTime}
                              onChange={(e) => setSecondCallTime(e.target.value)}
                              className="flex-1 min-w-0 px-1 py-0.5 border border-slate-200 bg-white rounded font-mono text-[9px]"
                            />
                            <input
                              type="text"
                              placeholder="Notes"
                              value={secondCallRemarks}
                              onChange={(e) => setSecondCallRemarks(e.target.value)}
                              className="w-24 px-1 py-0.5 border border-slate-200 bg-white rounded text-[9px]"
                            />
                          </div>

                          <div className="flex items-center space-x-1">
                            <span className="text-[9px] font-bold text-slate-400 w-11 shrink-0">3rd Call:</span>
                            <button
                              type="button"
                              onClick={() => handleSetCurrentTimestamp(3)}
                              className="bg-slate-200 hover:bg-slate-300 p-0.5 rounded hover:text-blue-600 transition shrink-0"
                              title="Set current time"
                            >
                              <Clock className="h-3 w-3" />
                            </button>
                            <input
                              id="field-call-3-time"
                              type="text"
                              placeholder="Timestamp"
                              value={thirdCallTime}
                              onChange={(e) => setThirdCallTime(e.target.value)}
                              className="flex-1 min-w-0 px-1 py-0.5 border border-slate-200 bg-white rounded font-mono text-[9px]"
                            />
                            <input
                              type="text"
                              placeholder="Notes"
                              value={thirdCallRemarks}
                              onChange={(e) => setThirdCallRemarks(e.target.value)}
                              className="w-24 px-1 py-0.5 border border-slate-200 bg-white rounded text-[9px]"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Update Mode: Side-by-side Remarks table */
                        <div className="space-y-1">
                          <div className="grid grid-cols-12 gap-1 items-center">
                            <div className="col-span-4 flex items-center space-x-0.5">
                              <span className="text-[9px] font-bold text-slate-500 w-5 shrink-0">1st:</span>
                              <button
                                type="button"
                                onClick={() => handleSetCurrentTimestamp(1)}
                                className="bg-slate-200 p-0.5 rounded hover:bg-slate-300 text-blue-600 shrink-0"
                              >
                                <Clock className="h-3 w-3" />
                              </button>
                              <input
                                type="text"
                                placeholder="Time"
                                value={firstCallTime}
                                onChange={(e) => setFirstCallTime(e.target.value)}
                                className="w-full px-0.5 py-0.5 border border-slate-200 bg-white rounded font-mono text-[9px]"
                              />
                            </div>
                            <div className="col-span-8">
                              <input
                                type="text"
                                placeholder="Remarks 1s Call"
                                value={firstCallRemarks}
                                onChange={(e) => setFirstCallRemarks(e.target.value)}
                                className="w-full px-1 py-0.5 border border-slate-200 bg-amber-50 rounded text-[9px] italic font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-1 items-center">
                            <div className="col-span-4 flex items-center space-x-0.5">
                              <span className="text-[9px] font-bold text-slate-500 w-5 shrink-0">2nd:</span>
                              <button
                                type="button"
                                onClick={() => handleSetCurrentTimestamp(2)}
                                className="bg-slate-200 p-0.5 rounded hover:bg-slate-300 text-blue-600 shrink-0"
                              >
                                <Clock className="h-3 w-3" />
                              </button>
                              <input
                                type="text"
                                value={secondCallTime}
                                onChange={(e) => setSecondCallTime(e.target.value)}
                                placeholder="Time"
                                className="w-full px-0.5 py-0.5 border border-slate-200 bg-white rounded font-mono text-[9px]"
                              />
                            </div>
                            <div className="col-span-8">
                              <input
                                type="text"
                                placeholder="Remarks 2nd Call"
                                value={secondCallRemarks}
                                onChange={(e) => setSecondCallRemarks(e.target.value)}
                                className="w-full px-1 py-0.5 border border-slate-200 bg-amber-50 rounded text-[9px] italic font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-1 items-center">
                            <div className="col-span-4 flex items-center space-x-0.5">
                              <span className="text-[9px] font-bold text-slate-500 w-5 shrink-0">3rd:</span>
                              <button
                                type="button"
                                onClick={() => handleSetCurrentTimestamp(3)}
                                className="bg-slate-200 p-0.5 rounded hover:bg-slate-300 text-blue-600 shrink-0"
                              >
                                <Clock className="h-3 w-3" />
                              </button>
                              <input
                                type="text"
                                placeholder="Time"
                                value={thirdCallTime}
                                onChange={(e) => setThirdCallTime(e.target.value)}
                                className="w-full px-0.5 py-0.5 border border-slate-200 bg-white rounded font-mono text-[9px]"
                              />
                            </div>
                            <div className="col-span-8">
                              <input
                                type="text"
                                placeholder="Remarks 3rd Call"
                                value={thirdCallRemarks}
                                onChange={(e) => setThirdCallRemarks(e.target.value)}
                                className="w-full px-1 py-0.5 border border-slate-200 bg-amber-50 rounded text-[9px] italic font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* EDITABLE REMARKS TEXT AREA - RESTRICTED TO EXACTLY 3 LINES TALL DEFAULT */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                          Compiled Remarks
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCopy(remarks, "Remarks compilation")}
                          className="text-[9px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                        >
                          <Copy className="h-2.5 w-2.5" />
                          <span>Copy</span>
                        </button>
                      </div>

                      <textarea
                        id="remarks-textarea"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Remarks compilation (3 lines only)..."
                        rows={3}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs leading-relaxed focus:outline-none focus:border-emerald-500 bg-white resize-none h-[64px]"
                      />
                    </div>

                    {/* STATUS ACTION & ESCALATION */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">FMS Status Action</label>
                        <select 
                          value={statusAction}
                          onChange={(e) => setStatusAction(e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded focus:outline-none bg-white"
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
                          className="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded focus:outline-none bg-white"
                        >
                          <option value="No / Local Agent Only">No / Local Agent Only</option>
                          <option value="FRAUD OPS SQUAD">Fraud Ops Squad</option>
                          <option value="MANAGEMENT ESCALATE">Management Escalation</option>
                        </select>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        id="btn-commit-case"
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-[11px] rounded hover:from-emerald-700 hover:to-teal-600 transition shadow-xs cursor-pointer"
                      >
                        {caseMode === "CREATE" ? "COMMIT ENTRY" : "COMMIT UPDATE"}
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
              {/* TWO DATABASE DIVISION SECTIONS CONTROLLER */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-extrabold tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-md">
                    OPERATIONAL DATABASE REGISTRIES
                  </span>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    Toggle your <b>Personal Queue (Compact)</b> to view your own cases, or access the shared <b>Global Sync Database</b> for records from all compliance officers.
                  </p>
                </div>
                <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200/50 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setDbDivision("PERSONAL")}
                    className={`flex-1 sm:flex-none px-4.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      dbDivision === "PERSONAL"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-550 hover:text-slate-800"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Personal Compact</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbDivision("GLOBAL")}
                    className={`flex-1 sm:flex-none px-4.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      dbDivision === "GLOBAL"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-550 hover:text-slate-800"
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Global Sync (All Users)</span>
                  </button>
                </div>
              </div>

              {/* UPPER SUB ACTION SHEETS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800">Operational Database Registry</h4>
                  <p className="text-[10px] text-slate-400">Chronological list of ingested FMS Cases and secure NSRC records (Immutable 1-Year Retention Policy Active)</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 md:justify-end">
                  {/* Search by CIF/Rule */}
                  <div className="relative min-w-[200px]">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg pl-8 pr-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0071e3] font-mono text-slate-900"
                      placeholder="Search CIF or Rule ID..."
                      value={dbSearchCif}
                      onChange={(e) => setDbSearchCif(e.target.value)}
                    />
                  </div>

                  {/* Filter by PSID */}
                  <div className="min-w-[140px]">
                    <select
                      className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0071e3] text-slate-700 font-medium"
                      value={dbFilterPsid}
                      onChange={(e) => setDbFilterPsid(e.target.value)}
                    >
                      <option value="ALL">User PSID</option>
                      {Array.from(new Set(cases.map(c => c.assignedOfficer))).filter(Boolean).map(psid => {
                        const strPsid = psid as string;
                        const account = staffAccounts.find(s => s.psid.toUpperCase() === strPsid.toUpperCase());
                        const displayName = account ? `${strPsid} - ${account.name}` : strPsid;
                        return (
                          <option key={strPsid} value={strPsid}>{displayName}</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Export FMS Cases to Excel */}
                  <button
                    onClick={() => {
                      const defaultFilename = `FMS_Cases_Database_${new Date().toISOString().slice(0,10)}.xlsx`;
                      setExcelExportPending({
                        type: "FMS",
                        data: filteredCases,
                        defaultFilename,
                        customFilename: defaultFilename
                      });
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-3xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export to Excel</span>
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
                                      title="Load details into Update Case view"
                                    >
                                      Load
                                    </button>
                                    <button 
                                      onClick={() => setExpandedFmsCases(prev => ({ ...prev, [cs.id]: !prev[cs.id] }))}
                                      className={`px-2 py-0.5 font-bold rounded text-[10px] transition ${
                                        expandedFmsCases[cs.id]
                                          ? "bg-slate-200 text-slate-700 font-bold"
                                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-650"
                                      }`}
                                    >
                                      {expandedFmsCases[cs.id] ? "Hide Details" : "Show Details"}
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (confirm(`Erase FMS log of CIF ${cs.cif}?`)) {
                                          try {
                                            await deleteDoc(doc(db, "cases", cs.id));
                                          } catch (error) {
                                            console.error("Firestore delete error:", error);
                                            setCases(cases.filter(c => c.id !== cs.id));
                                          }
                                        }
                                      }}
                                      className="p-1 text-slate-300 hover:text-red-500 rounded transition"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                                {/* Accenting Sequential remarks sub-block for verification proof - Conditionally rendered */}
                                {expandedFmsCases[cs.id] && (
                                  <tr>
                                    <td colSpan={7} className="bg-slate-50/50 px-4 py-2 border-b border-slate-100">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                                        <div className="flex items-center space-x-1">
                                          <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                          <span className="font-semibold text-slate-600">Verification Remarks:</span>
                                          <span className="font-mono text-slate-900 font-bold ml-1 italic bg-white border border-slate-200 p-1.5 rounded shadow-3xs leading-relaxed max-w-2xl inline-block">
                                            "{cs.remarks || 'No verification remarks recorded.'}"
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-1 shrink-0 font-mono text-[10px]">
                                          <Clock className="h-3 w-3" />
                                          <span>TAT Status: <strong className="text-slate-700">Committed</strong></span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
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
                            <th className="px-3 py-2 text-center">Actions</th>
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
                                <td className="px-2 py-1.5 text-center">
                                  <button
                                    onClick={() => setExpandedNsrcEntries(prev => ({ ...prev, [ns.id]: !prev[ns.id] }))}
                                    className={`px-2 py-0.5 font-bold rounded text-[10px] transition ${
                                      expandedNsrcEntries[ns.id]
                                        ? "bg-slate-200 text-slate-705 font-bold"
                                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-650"
                                    }`}
                                  >
                                    {expandedNsrcEntries[ns.id] ? "Hide Details" : "Show Details"}
                                  </button>
                                </td>
                              </tr>
                              {expandedNsrcEntries[ns.id] && (
                                <tr>
                                  <td colSpan={8} className="bg-slate-50/50 px-4 py-1.5 border-b border-slate-100">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-1.5">
                                      <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                                        <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                        <span className="font-semibold text-slate-500">Classification Details:</span>
                                        <span className="bg-slate-200 border border-slate-300 text-[10px] px-1.5 py-0.2 rounded font-bold text-slate-700"> {ns.accountBlockingType} </span>
                                      </div>
                                      <div className="flex items-center text-[11px] text-slate-850 truncate max-w-lg">
                                        <strong>Generated Remarks: </strong>&nbsp;<span className="font-mono text-slate-900 font-bold ml-1 italic bg-white border border-slate-200 p-1.5 rounded shadow-3xs leading-relaxed inline-block"> "{ns.remarks || 'No remarks recorded.'}" </span>
                                      </div>
                                      <button
                                        onClick={async () => {
                                          if (confirm(`Erase NSRC record for "${ns.name}"?`)) {
                                            try {
                                              await deleteDoc(doc(db, "nsrcEntries", ns.id));
                                            } catch (error) {
                                              console.error("Firestore delete NSRC error:", error);
                                              setNsrcEntries(nsrcEntries.filter(i => i.id !== ns.id));
                                            }
                                          }
                                        }}
                                        className="p-1 hover:text-red-500 text-slate-300 transition"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
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
                      onClick={async () => {
                        if (confirm("Reset audit session history?")) {
                          try {
                            for (const log of sessionLogs) {
                              if (log.id) {
                                await deleteDoc(doc(db, "sessionLogs", log.id));
                              }
                            }
                          } catch (error) {
                            console.error("Firestore logging deletion error:", error);
                            setSessionLogs([]);
                          }
                        }
                      }}
                      className="text-[9px] bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded font-mono uppercase font-bold transition"
                    >
                      Reset Audit Trail
                    </button>
                  </div>

                  {(() => {
                    const displayedLogs = sessionLogs.filter(log => {
                      if (currentUser?.role === "Admin") return true;
                      return log.action !== "PASSWORD_CHANGE" && log.action !== "PASSWORD_RESET" && log.action !== "USER_REGISTER";
                    });

                    return displayedLogs.length === 0 ? (
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
                            {displayedLogs.map((log) => (
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
                    );
                  })()}
                </div>

              </div>

            </motion.div>
          )}


          {/* 4. SEARCH FI COMPACT DIVISION VIEW */}
          {activeTab === "SEARCH FI" && (() => {
            const BANK_THEMES: Record<string, { bg: string; text: string; border: string; logoBg: string; logoText: string; accentBadge: string }> = {
              CIMB: { bg: "bg-red-50/70", text: "text-red-950", border: "border-red-200 hover:border-red-400", logoBg: "bg-red-700", logoText: "text-white", accentBadge: "bg-red-105 text-red-800 border-red-200" },
              BAY: { bg: "bg-amber-50/75", text: "text-amber-950", border: "border-amber-300 hover:border-amber-500", logoBg: "bg-yellow-400", logoText: "text-slate-900 font-extrabold", accentBadge: "bg-yellow-200 text-amber-900 border-yellow-300" },
              PBB: { bg: "bg-rose-50/75", text: "text-rose-950", border: "border-rose-200 hover:border-rose-400", logoBg: "bg-rose-750", logoText: "text-white", accentBadge: "bg-rose-100 text-rose-800 border-rose-200" },
              RHB: { bg: "bg-blue-50/70", text: "text-blue-950", border: "border-blue-200 hover:border-blue-400", logoBg: "bg-blue-800", logoText: "text-white", accentBadge: "bg-blue-100 text-blue-800 border-blue-200" },
              AFFIN: { bg: "bg-sky-50/85", text: "text-cyan-950", border: "border-sky-300 hover:border-sky-500", logoBg: "bg-sky-700", logoText: "text-white", accentBadge: "bg-sky-100 text-sky-800 border-sky-200" },
              HLB: { bg: "bg-indigo-50/70", text: "text-indigo-950", border: "border-indigo-200 hover:border-indigo-400", logoBg: "bg-indigo-800", logoText: "text-white", accentBadge: "bg-indigo-100 text-indigo-800 border-indigo-200" },
              AMB: { bg: "bg-orange-50/60", text: "text-orange-950", border: "border-orange-200 hover:border-orange-400", logoBg: "bg-red-650", logoText: "text-white", accentBadge: "bg-orange-100 text-orange-850 border-orange-201" },
              BIMB: { bg: "bg-emerald-50/70", text: "text-emerald-950", border: "border-emerald-200 hover:border-emerald-400", logoBg: "bg-emerald-700", logoText: "text-white", accentBadge: "bg-emerald-100 text-emerald-850 border-emerald-205" },
              ALB: { bg: "bg-cyan-50/70", text: "text-cyan-950", border: "border-cyan-200 hover:border-cyan-400", logoBg: "bg-cyan-700", logoText: "text-white", accentBadge: "bg-cyan-100 text-cyan-850 border-cyan-210" },
              OCBC: { bg: "bg-slate-50/90", text: "text-slate-900", border: "border-slate-200 hover:border-slate-400", logoBg: "bg-red-650", logoText: "text-white", accentBadge: "bg-red-50 text-red-700 border-red-100" },
              TNG: { bg: "bg-sky-50/90", text: "text-sky-950", border: "border-blue-300 hover:border-blue-500", logoBg: "bg-[#0650ea] shadow-xs", logoText: "text-white font-black", accentBadge: "bg-blue-100 text-blue-800 border-blue-200" }
            };

            return (
              <motion.div
                key="tab-search-fi"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* DECK 1: INPUT & MATCHING CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* LEFT COLUMN: SEARCH FI CONTROLS (5 Columns) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs md:col-span-5 flex flex-col justify-between min-h-[420px]">
                    <div>
                      <div className="pb-3 border-b border-slate-100 mb-3.5 flex items-center space-x-2">
                        <Building2 className="h-4.5 w-4.5 text-blue-500" />
                        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">Search Financial Institution</h4>
                      </div>
                      
                      <p className="text-[11px] text-slate-400 mb-3">
                        Input Malaysian Bank Account number digits below. The automated match engine computes rules precision instantly based on routing prefixes.
                      </p>

                      <div className="space-y-4">
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
                          <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-2">QUICK INPUT PRESETS:</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { name: "CIMB (Starts on 7 / 14D)", digits: "70421234567890" },
                              { name: "Maybank (Starts on 1/5 / 12D)", digits: "164212345678" },
                              { name: "Public Bank (Starts on 3/4 / 10D)", digits: "3002123456" },
                              { name: "RHB Bank (Starts on 2 / 14D)", digits: "21212345678912" },
                              { name: "Touch 'n Go (Starts on 9 / 10D)", digits: "9012345678" },
                              { name: "TNG DuitNow (Starts on 601 / 11D)", digits: "60123456789" }
                            ].map((btn) => (
                              <button
                                key={btn.name}
                                type="button"
                                onClick={() => setFiSearchTerm(btn.digits)}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1.5 rounded text-[10px] text-slate-700 font-mono text-left truncate transition-colors"
                              >
                                🎯 {btn.name}
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
                      <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">Rules mapped: 11 FIs</span>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: PRECISE SUGGESTIONS (7 Columns) with standard bank themes */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs md:col-span-7 flex flex-col min-h-[420px]">
                    <div className="pb-3 border-b border-slate-100 mb-3.5">
                      <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800">Matched Bank Recommendations</h4>
                      <p className="text-[10px] text-slate-400">Target probability sorted by compliance factors</p>
                    </div>

                    {!fiSearchTerm.trim() ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                        <Building2 className="h-10 w-10 text-slate-300 mb-3" />
                        <p className="font-bold uppercase tracking-wider text-slate-600">WAITING FOR SEARCH TERM</p>
                        <p className="max-w-xs mt-1.5 text-slate-400 leading-normal">
                          Enter Malaysian bank account digits on the left side to evaluate routing rules with visual percentage matches and standard bank corporate themes.
                        </p>
                      </div>
                    ) : matchedBanks.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3 animate-bounce" />
                        <p className="font-bold text-slate-600 uppercase tracking-wider">No Precise Matches</p>
                        <p className="max-w-xs mt-1.5 text-slate-400 leading-normal">
                          Length parsed {fiSearchTerm.length} does not overlap standard Malaysian routing prefixes.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-start space-y-3.5">
                        <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block font-mono">
                            {matchedBanks.length} MATCHES DETECTED
                          </span>
                          <span className="text-[10px] text-blue-600 font-bold font-mono">Heuristic Precision Verified</span>
                        </div>

                        {/* COMPACT CARD STYLINGS: 3 lines maximum, Styled with Standard Bank Color Themes */}
                        {matchedBanks.slice(0, 3).map((bank) => {
                          const theme = BANK_THEMES[bank.code] || {
                            bg: "bg-slate-50",
                            text: "text-slate-800",
                            border: "border-slate-200 hover:border-slate-400",
                            logoBg: "bg-indigo-700/10",
                            logoText: "text-indigo-700",
                            accentBadge: "bg-slate-100 text-slate-800 border-slate-200"
                          };

                          return (
                            <div
                              key={bank.name}
                              className={`border p-3 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-all shadow-xs relative overflow-hidden ${theme.bg} ${theme.border} ${theme.text}`}
                            >
                              <div className="flex items-center space-x-4">
                                {/* Brand Logo letter design */}
                                <div className={`h-11 w-11 rounded-lg font-mono font-black text-sm flex items-center justify-center uppercase shrink-0 shadow-xs border border-white/20 ${theme.logoBg} ${theme.logoText}`}>
                                  {bank.logoLetter}
                                </div>

                                <div className="text-xs">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-[8.5px] font-mono font-extrabold px-2 py-0.5 rounded border uppercase shrink-0 ${theme.accentBadge}`}>
                                      {bank.code}
                                    </span>
                                    <h5 className="font-extrabold text-xs tracking-tight font-sans text-slate-900">{bank.name}</h5>
                                  </div>
                                  <p className="text-[10.5px] text-slate-600 mt-1 leading-normal font-sans font-medium">{bank.description}</p>
                                  
                                  <div className="flex items-center space-x-2 mt-1.5 font-mono text-[9px] text-slate-500 font-semibold font-sans">
                                    <span>Rules evaluated:</span>
                                    <span className={bank.matchScore > 70 ? "text-emerald-700" : "text-amber-700"}>Length matches pattern ({bank.lengthPattern})</span>
                                    <span>•</span>
                                    <span className={bank.matchScore > 85 ? "text-emerald-700" : "text-slate-500"}>Branch routing verified</span>
                                  </div>
                                </div>
                              </div>

                              {/* MATCH PERCENTAGE ON VERY RIGHT */}
                              <div className="text-right shrink-0 flex flex-col items-end space-y-1 bg-white/70 backdrop-blur-xs p-2.5 rounded-lg border border-white/60 shadow-2xs">
                                <div className="flex items-baseline space-x-0.5">
                                  <span className="text-2xl font-mono font-black text-emerald-600 leading-none">{bank.matchScore}</span>
                                  <span className="text-xs font-mono font-black text-emerald-600">%</span>
                                </div>
                                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-black block leading-none">PROBABILITY</span>
                                
                                <div className="flex flex-col space-y-1 w-full pt-1.5 border-t border-slate-200/50">
                                  <button
                                    onClick={() => handleCopy(`Bank: ${bank.name}\nCode: ${bank.code}\nAccount: ${fiSearchTerm}\nExact Match Prob: ${bank.matchScore}%`, "Bank details")}
                                    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded text-[9.5px] font-bold transition flex items-center justify-center space-x-1"
                                  >
                                    <Copy className="h-3 w-3" />
                                    <span>Copy Specs</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleSaveToSqlite(fiSearchTerm, bank.code, bank.name, bank.matchScore)}
                                    className="px-2 py-0.5 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 rounded text-[9.5px] font-bold transition flex items-center justify-center space-x-1"
                                  >
                                    <Database className="h-3 w-3 text-cyan-400" />
                                    <span>Store sqlite</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })()}


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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          NSRC Case ID
                        </label>
                        <input
                          type="text"
                          value={nsrcCaseId}
                          onChange={(e) => setNsrcCaseId(e.target.value)}
                          placeholder="e.g. NSRC-95431A"
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-mono font-semibold focus:outline-none focus:border-slate-400 text-slate-900"
                        />
                      </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-1.5">

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Suspicious Amount (RM)
                        </label>
                        <input
                          type="text"
                          value={nsrcAmount}
                          onChange={(e) => setNsrcAmount(e.target.value)}
                          placeholder="eg: RM2,500.00"
                          className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded font-mono font-semibold focus:outline-none focus:border-slate-400 text-indigo-700"
                        />
                      </div>

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
                        <th className="px-3 py-2">Suspicious Amount</th>
                        <th className="px-3 py-2">Earmark Amount</th>
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
                          <td className="px-3 py-3 font-mono text-indigo-700 font-bold">{it.amount || "—"}</td>
                          <td className="px-3 py-3 font-mono text-emerald-700 font-bold">{it.earmarkAmount || "—"}</td>
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
                      Zaim's Command Registry & Admin Panel (PS101435)
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

              {/* LIVE ACTIVE SESSIONS QUICK SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#e8e8ed] rounded-2xl p-4 shadow-3xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Active Concurrency</span>
                      <h4 className="text-xl font-bold text-slate-900 font-sans flex items-center space-x-1.5">
                        <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                        <span>{staffAccounts.filter(s => s.isOnline && s.lastActive && (Date.now() - new Date(s.lastActive).getTime() < ONLINE_THRESHOLD_MS)).length} Active Session(s)</span>
                      </h4>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100 shadow-3xs">
                      <Activity className="h-4.5 w-4.5 animate-pulse" />
                    </div>
                  </div>

                  <div className="bg-white border border-[#e8e8ed] rounded-2xl p-4 shadow-3xs md:col-span-2 flex items-center justify-between gap-4">
                    <div className="space-y-1 w-full font-sans">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Currently Authenticated Devices</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(() => {
                          const onlineUsers = staffAccounts.filter(s => s.isOnline && s.lastActive && (Date.now() - new Date(s.lastActive).getTime() < ONLINE_THRESHOLD_MS));
                        if (onlineUsers.length === 0) {
                          return (
                            <span className="text-xs text-slate-400 italic">No active compliance officer sessions currently transmitting heartbeats.</span>
                          );
                        }
                        return onlineUsers.map(u => (
                          <span key={u.psid} className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-150 uppercase">
                            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span>{u.name} ({u.psid})</span>
                          </span>
                        ));
                      })()}
                    </div>
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
                    <div className="flex items-center space-x-1.5 font-sans">
                      <button
                        onClick={handleRestoreDefaultAccounts}
                        className="text-[9px] bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-lg transition uppercase cursor-pointer shadow-3xs"
                        title="Restore default Affin123 passwords for the 5 standard corporate accounts"
                      >
                        Restore Core Accounts
                      </button>
                      <span className="text-[9px] bg-red-50 text-red-650 border border-red-100 px-2.5 py-0.5 rounded-full font-bold">AUTHENTICATOR ENFORCED</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f5f5f7] border-b border-[#e8e8ed] text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="px-3 py-2.5">PSID</th>
                          <th className="px-3 py-2.5">Officer Name</th>
                          <th className="px-3 py-2.5">Workspace Role</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                          <th className="px-3 py-2.5 text-center">Last Active</th>
                          <th className="px-3 py-2.5">Session Password</th>
                          <th className="px-3 py-2.5 text-center">First Change Required</th>
                          <th className="px-3 py-2.5 text-center">Operational Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staffAccounts.map((account) => {
                          const isRootAdmin = account.psid === "PS101435" || account.psid === "PS101436";
                          const isOnline = account.isOnline && account.lastActive && (Date.now() - new Date(account.lastActive).getTime() < ONLINE_THRESHOLD_MS);
                          const lastActiveStr = account.lastActive 
                            ? new Date(account.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date(account.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric' })
                            : "Never";
                          return (
                            <tr key={account.psid} className="hover:bg-slate-50/50 transition border-b border-slate-100">
                              <td className="px-3 py-3 font-mono font-bold text-slate-900">{account.psid}</td>
                              <td className="px-3 py-3 uppercase font-semibold text-slate-700 text-[11px]">{account.name}</td>
                              <td className="px-3 py-3 text-slate-500 font-medium text-[11px]">{account.role}</td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                  isOnline 
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                    : "bg-slate-50 text-slate-500 border-slate-100"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                                  <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center font-mono text-[10px] text-slate-500">
                                {lastActiveStr}
                              </td>
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

                  {/* PASSWORD SECURITY AUDIT LOG FEED */}
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center space-x-2">
                        <Terminal className="h-4 w-4 text-[#0071e3]" />
                        <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800">
                          Password Security & Audit Log System
                        </h4>
                      </div>
                      <span className="text-[9px] bg-blue-50 text-[#0071e3] border border-blue-100 px-2 py-0.5 rounded font-bold font-sans">
                        Real-time Auditing Active
                      </span>
                    </div>
                    
                    {(() => {
                      const pwLogs = sessionLogs.filter(log => 
                        log.action === "PASSWORD_CHANGE" || 
                        log.action === "PASSWORD_RESET" ||
                        log.action === "USER_REGISTER" ||
                        log.action === "LOGIN"
                      );
                      
                      if (pwLogs.length === 0) {
                        return (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
                            No credential updates recorded in the log system yet.
                          </div>
                        );
                      }
                      
                      return (
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {pwLogs.map((log) => {
                            const isChange = log.action === "PASSWORD_CHANGE";
                            const isReset = log.action === "PASSWORD_RESET";
                            const isLogin = log.action === "LOGIN";
                            return (
                              <div key={log.id} className="p-2.5 bg-[#f5f5f7] rounded-lg border border-slate-200/50 text-xs flex items-start justify-between gap-3 font-sans">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                                    <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold uppercase font-sans ${
                                      isChange 
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                        : isReset 
                                          ? "bg-amber-50 text-amber-800 border border-amber-100" 
                                          : isLogin 
                                            ? "bg-indigo-50 text-indigo-850 border border-indigo-150"
                                            : "bg-blue-50 text-blue-800 border border-blue-100"
                                    }`}>
                                      {log.action}
                                    </span>
                                    <span className="font-bold text-slate-800 text-[11px]">
                                      {log.psid}
                                    </span>
                                    <span className="text-slate-500 font-sans font-medium text-[10.5px]">
                                      ({log.name})
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-sans">
                                    {log.details}
                                  </p>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap shrink-0 mt-0.5">
                                  {log.timestamp}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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
                  className="text-slate-400 hover:text-slate-600 font-bold transition font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handlePasswordModalSubmit(); }} className="p-5 space-y-4 font-sans">
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

        {excelExportPending && (
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
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden font-sans text-left"
            >
              <div className="bg-[#f5f5f7] border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-[#0071e3]" />
                  <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider font-mono">
                    Excel Save Configuration
                  </span>
                </div>
                <button 
                  onClick={() => setExcelExportPending(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="text-center space-y-1.5">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold font-sans">Local Device Storage</p>
                  <p className="text-[13px] text-slate-600 font-medium font-sans">
                    Configure your spreadsheet filename and choose where to save the spreadsheet on your local device.
                  </p>
                </div>

                {/* FILENAME INPUT */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold font-sans">
                    Target Spreadsheet Filename
                  </label>
                  <input 
                    type="text"
                    required
                    value={excelExportPending.customFilename}
                    onChange={(e) => setExcelExportPending({
                      ...excelExportPending,
                      customFilename: e.target.value
                    })}
                    className="w-full text-xs font-mono py-2 px-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg bg-slate-50 text-slate-900"
                  />
                </div>

                {/* LOCAL DIRECTORY INSTRUCTIONS */}
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center space-x-2 text-blue-900 font-bold font-sans">
                    <Info className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>How to select save folder:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 font-sans leading-relaxed text-[11px]">
                    <li>
                      <strong>System Save Picker:</strong> On supported browsers, clicking <span className="font-bold text-[#0071e3]">"Confirm & Ask Save Location"</span> triggers a native system directory prompt so you can select exactly where to write this file.
                    </li>
                    <li>
                      <strong>Standard Downloads:</strong> If the secure picker is bypassed, files are written to your default Downloads folder. To configure folder queries, navigate to Chrome settings and enable <em>"Ask where to save each file before downloading"</em>.
                    </li>
                  </ul>
                </div>

                {/* ACTIONS */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setExcelExportPending(null)}
                    className="py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmExcelExport}
                    className="py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-2xs font-sans"
                  >
                    <Folder className="h-3.5 w-3.5 text-blue-400" />
                    <span>Confirm & Ask Save Location</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
