import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store";
import Sidebar from "../components/Sidebar";
import { FileIcon, CameraIcon, PenIcon } from "../icons";

export default function Dashboard() {
  const { addReport } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState("");
  const [fileWarning, setFileWarning] = useState(null);

  const pathologyKeywords = /pathology|specimen|diagnosis|biopsy|carcinoma|tumor|tumour|histolog|cytolog|margin|receptor|grade|stage|lymph|node|excision|resection|malignant|benign|invasive|ductal|lobular|adenocarcinoma|squamous|neoplasm|lesion/i;

  const handleUpload = () => { setShowTypeInput(false); setDiagnosisText(""); fileInputRef.current?.click(); };
  const handleScan = () => { setShowTypeInput(false); setDiagnosisText(""); cameraInputRef.current?.click(); };

  // Check filename/type for obviously wrong files
  const nonReportExts = /\.(mp3|mp4|mov|avi|zip|rar|exe|dmg|iso|psd|ai|sketch|fig|svg|gif|wav|aac|csv|xls|xlsx|ppt|pptx|json|xml|yaml|yml|js|ts|py|java|c|cpp|rb|go|rs)$/i;
  const nonReportNames = /selfie|screenshot|wallpaper|vacation|holiday|family|party|meme|logo|banner|icon|avatar|profile|cover|thumbnail/i;

  const validateFileName = (name) => {
    if (nonReportExts.test(name)) return false;
    if (nonReportNames.test(name)) return false;
    return true;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const size = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    const name = file.name.toLowerCase();
    // Clear warning from previous attempt
    setFileWarning(null);

    // Step 1: Check filename for obviously wrong files
    if (!validateFileName(name)) {
      setFileWarning("This doesn't appear to be a pathology report. Please upload a PDF, Word document, or image of a pathology report.");
      return;
    }

    // Step 2: Images — check if filename suggests it's a report
    if (file.type.startsWith("image/")) {
      const looksLikeReport = /report|path|biopsy|lab|specimen|diagnosis|medical|clinical|hist|result/i.test(name);
      if (!looksLikeReport) {
        setFileWarning("This image doesn't appear to be a pathology report. Please upload a clear image of your pathology report.");
        return;
      }
      const id = addReport(file.name, size);
      navigate(`/report/${id}/processing`);
      return;
    }

    // Step 3: For text-readable files, read and check content
    if (name.endsWith(".txt")) {
      const text = await file.text();
      if (!pathologyKeywords.test(text)) {
        setFileWarning("This file doesn't contain pathology report content. Please check and upload a valid report.");
        return;
      }
      const id = addReport(file.name, size, text);
      navigate(`/report/${id}/processing`);
      return;
    }

    if (name.endsWith(".html") || name.endsWith(".htm")) {
      const html = await file.text();
      if (!pathologyKeywords.test(html)) {
        setFileWarning("This file doesn't contain pathology report content. Please check and upload a valid report.");
        return;
      }
      const id = addReport(file.name, size, "Imported HTML report", html);
      navigate(`/report/${id}/processing`);
      return;
    }

    // Step 3: For Word docs, try reading as text
    if (name.endsWith(".doc") || name.endsWith(".docx")) {
      try {
        const text = await file.text();
        if (text.length > 100 && !pathologyKeywords.test(text)) {
          setFileWarning("This document doesn't appear to contain pathology report content. Please check and upload a valid report.");
          return;
        }
      } catch { /* can't read, proceed */ }
    }

    // Step 4: Images and PDFs — can't read content, proceed to processing
    // Processing page will validate via Gemini response if needed
    const id = addReport(file.name, size);
    navigate(`/report/${id}/processing`);
  };


  const handleCameraChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const size = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    const id = addReport(file.name, size, "Scanned report");
    navigate(`/report/${id}/processing`);
  };

  const handleTypeDiagnosis = () => {
    if (!diagnosisText.trim()) return;
    const id = addReport("typed_diagnosis.txt", "0.1 MB", diagnosisText.trim());
    navigate(`/report/${id}/processing`);
  };

  const handleTypeKeyDown = (e) => {
    if (e.key === "Enter") handleTypeDiagnosis();
    if (e.key === "Escape") { setShowTypeInput(false); setDiagnosisText(""); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.html,.htm,.txt" onChange={handleFileChange} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraChange} className="hidden" />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="w-[65%] max-w-[48rem]">
            <h1 className="text-xl font-bold text-ink text-center mb-10 tracking-tight">
              What report would you like to interpret?
            </h1>

            {/* Upload cards */}
            <div className="flex gap-5 mb-6">
              {[
                { icon: <FileIcon size={22} className="text-ink-faint" />, title: "Upload File", l1: "PDF, Word, or image", l2: "Drag and drop or browse", onClick: handleUpload },
                { icon: <CameraIcon size={22} className="text-ink-faint" />, title: "Scan Report", l1: "Take a photo of a", l2: "printed report", onClick: handleScan },
                { icon: <PenIcon size={22} className="text-ink-faint" />, title: "Type Diagnosis", l1: "Enter diagnosis", l2: "or medical terms", onClick: () => setShowTypeInput(true) },
              ].map((c, i) => (
                <button key={i} onClick={c.onClick}
                  className="flex-1 rounded-xl border border-stroke p-6 text-center cursor-pointer hover:border-ink-faint hover:shadow-sm transition-all group bg-surface">
                  <div className="w-12 h-12 rounded-lg bg-surface-raised flex items-center justify-center mx-auto mb-4 group-hover:bg-surface-sunken transition-colors">
                    {c.icon}
                  </div>
                  <div className="text-[0.9375rem] font-semibold text-ink mb-1.5">{c.title}</div>
                  <div className="text-sm text-ink-muted leading-relaxed">{c.l1}<br />{c.l2}</div>
                </button>
              ))}
            </div>

            {/* Inline file warning */}
            {fileWarning && (
              <div className="rounded-lg px-4 py-3 mb-6 animate-fade-up flex items-start gap-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                <span className="text-sm mt-0.5" style={{ color: '#dc2626' }}>!</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: '#dc2626' }}>Wrong file input</p>
                  <p className="text-xs mt-1" style={{ color: '#dc2626', opacity: 0.8 }}>{fileWarning}</p>
                </div>
                <button onClick={() => { setFileWarning(null); }} className="text-xs cursor-pointer mt-0.5" style={{ color: '#dc2626', opacity: 0.6 }}>✕</button>
              </div>
            )}

            {/* Type diagnosis inline input */}
            {showTypeInput && (
              <div className="rounded-xl border border-stroke p-5 mb-6 animate-fade-up">
                <label className="text-sm font-medium text-ink-muted mb-2 block">Enter diagnosis or medical terms</label>
                <textarea
                  value={diagnosisText}
                  onChange={(e) => setDiagnosisText(e.target.value)}
                  onKeyDown={handleTypeKeyDown}
                  placeholder="e.g. Breast carcinoma, Grade 3"
                  rows={4}
                  className="w-full rounded-lg border border-stroke px-4 py-3 text-sm text-ink-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none mb-3"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={handleTypeDiagnosis} disabled={!diagnosisText.trim()}
                    className="h-11 px-5 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    Interpret
                  </button>
                  <button onClick={() => { setShowTypeInput(false); setDiagnosisText(""); }}
                    className="h-11 px-4 rounded-lg border border-stroke text-sm text-ink-muted cursor-pointer hover:bg-surface-raised transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* File warning dialog */}

      </div>
    </div>
  );
}
