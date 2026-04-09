import { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext(null);

const defaultSections = [
  {
    id: "diagnosis",
    title: "What Your Diagnosis Means",
    content:
      "Your pathology report shows a diagnosis of breast carcinoma, which is a type of cancer that starts in the breast tissue. It has been graded as Grade 3, which means the cancer cells look quite different from normal cells under a microscope.",
    edited: false,
    added: null,
  },
  {
    id: "grade",
    title: "What the Grade Means",
    content:
      "Pathologists grade cancers from 1 to 3 based on how the cells appear under a microscope. Grade 3 indicates cells that are growing more actively. This is one piece of the bigger picture your doctors will use.",
    edited: false,
    added: null,
  },
  {
    id: "expect",
    title: "What to Expect",
    content:
      "Your treating team will consider the grade alongside other factors to recommend the best approach for your situation. They will explain all available options.",
    edited: false,
    added: null,
  },
  {
    id: "steps",
    title: "Your Next Steps",
    content:
      "We recommend discussing this report with your oncologist who can explain what each finding means specifically for you and your treatment plan.",
    edited: false,
    added: null,
  },
];

const aiResponses = [
  "Done. I've updated the explanation — softened the language and made it more patient-friendly. Changes are highlighted on the right.",
  "Good suggestion. I've added that detail to the relevant section. You can review the update on the right panel.",
  "Updated. I've restructured that section to be clearer and more reassuring for the patient.",
  "I've made that change. The section now reads in a warmer, more approachable tone.",
  "Done. I've simplified the medical terminology and added a brief plain-language explanation.",
];

const initialReports = [
  {
    id: "RPT-2026-0342",
    type: "Breast carcinoma, Grade 3",
    status: "Approved",
    date: "Today",
    fileName: "pathology_report_342.pdf",
    fileSize: "1.8 MB",
    sections: defaultSections.map((s) => ({ ...s })),
    chatHistory: [
      { role: "system", text: "Report uploaded and analyzed." },
      { role: "user", text: "Simplify the diagnosis section.", time: "2h ago" },
      { role: "ai", text: "Done. Simplified the diagnosis section for better readability." },
    ],
  },
  {
    id: "RPT-2026-0341",
    type: "Non-small cell lung, Stage 2",
    status: "Draft",
    date: "Today",
    fileName: "lung_biopsy_report.pdf",
    fileSize: "2.1 MB",
    sections: defaultSections.map((s) => ({ ...s })),
    chatHistory: [],
  },
  {
    id: "RPT-2026-0340",
    type: "Pancreatic adenocarcinoma",
    status: "Approved",
    date: "Yesterday",
    fileName: "pancreatic_path.pdf",
    fileSize: "3.2 MB",
    sections: defaultSections.map((s) => ({ ...s })),
    chatHistory: [
      { role: "system", text: "Report uploaded and analyzed." },
    ],
  },
  {
    id: "RPT-2026-0339",
    type: "Colorectal, Stage 1",
    status: "Approved",
    date: "Yesterday",
    fileName: "colorectal_report.pdf",
    fileSize: "1.5 MB",
    sections: defaultSections.map((s) => ({ ...s })),
    chatHistory: [
      { role: "system", text: "Report uploaded and analyzed." },
    ],
  },
];

let reportCounter = 343;

export function AppProvider({ children }) {
  const [user, setUser] = useState({
    name: "Dr. Amir",
    initials: "DA",
    email: "dr.amir@hospital.com",
    hospital: "Royal Melbourne Hospital",
    department: "Pathology",
    phone: "+61 3 9342 7000",
    address: "300 Grattan St, Parkville VIC 3050",
    license: "MED-2024-08172",
    apiEndpoint: "",
    logo: "",
  });
  const [reports, setReports] = useState(initialReports);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const addReport = useCallback((fileName = "pathology_report.pdf", fileSize = "2.4 MB", type = "Breast carcinoma, Grade 3", htmlContent = null) => {
    const id = `RPT-2026-0${reportCounter++}`;
    const report = {
      id,
      type,
      status: "Processing",
      date: "Today",
      fileName,
      fileSize,
      htmlContent,
      sections: defaultSections.map((s) => ({ ...s })),
      chatHistory: [{ role: "system", text: "Report uploaded successfully. Analyzing your document now..." }],
    };
    setReports((prev) => [report, ...prev]);
    return id;
  }, []);

  const updateReportStatus = useCallback((reportId, status) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status } : r))
    );
  }, []);

  const addChatMessage = useCallback((reportId, role, text) => {
    const time = role === "user" ? "just now" : undefined;
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, chatHistory: [...r.chatHistory, { role, text, time }] }
          : r
      )
    );
  }, []);

  const getAiResponse = useCallback(() => {
    return aiResponses[Math.floor(Math.random() * aiResponses.length)];
  }, []);

  const updateSection = useCallback((reportId, sectionId, content) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              sections: r.sections.map((s) =>
                s.id === sectionId ? { ...s, content, edited: true } : s
              ),
            }
          : r
      )
    );
  }, []);

  const updateReportSections = useCallback((reportId, sections) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, sections } : r
      )
    );
  }, []);

  const getReport = useCallback(
    (reportId) => reports.find((r) => r.id === reportId),
    [reports]
  );

  const stats = {
    processed: reports.length,
    shared: reports.filter((r) => r.status === "Approved").length,
    questions: 3,
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        reports,
        isLoggedIn,
        setIsLoggedIn,
        darkMode,
        setDarkMode,
        sidebarCollapsed,
        setSidebarCollapsed,
        showDiscardDialog,
        setShowDiscardDialog,
        addReport,
        updateReportStatus,
        addChatMessage,
        getAiResponse,
        updateSection,
        updateReportSections,
        getReport,
        stats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
