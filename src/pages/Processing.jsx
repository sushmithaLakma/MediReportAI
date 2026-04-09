import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../store";
import Sidebar from "../components/Sidebar";
import { FileIcon, CheckIcon, SendIcon } from "../icons";
import { API_URL } from "../config";

const steps = [
  { t: "Reading document...", d: "Extracting text from your file" },
  { t: "Identifying key findings...", d: "Diagnosis, staging, markers" },
  { t: "Generating plain-language explanation...", d: "Creating patient-friendly summary" },
  { t: "Ready for your review", d: "Processing complete" },
];

export default function Processing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReport, updateReportStatus, updateReportSections, user } = useApp();
  const report = getReport(id);
  const [currentStep, setCurrentStep] = useState(0);
  const [apiError, setApiError] = useState(null);
  const [cancelled, setCancelled] = useState(false);
  const [invalidFile, setInvalidFile] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);

  const pathologyKeywords = /pathology|specimen|diagnosis|biopsy|carcinoma|tumor|tumour|histolog|cytolog|margin|receptor|grade|stage|lymph|node|excision|resection|malignant|benign|invasive|ductal|lobular|adenocarcinoma|squamous|neoplasm|lesion/i;

  const parseHtmlSections = useCallback((html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const sections = [];
    const headings = doc.querySelectorAll("h1, h2, h3");
    if (headings.length > 0) {
      headings.forEach((heading, i) => {
        const content = [];
        let el = heading.nextElementSibling;
        while (el && !["H1", "H2", "H3"].includes(el.tagName)) {
          content.push(el.textContent.trim());
          el = el.nextElementSibling;
        }
        const sectionIds = ["diagnosis", "grade", "expect", "steps"];
        sections.push({
          id: sectionIds[i] || `section_${i}`,
          title: heading.textContent.trim(),
          content: content.join("\n\n") || "",
          edited: false,
          added: null,
        });
      });
    }
    if (sections.length === 0) {
      const bodyText = doc.body?.textContent?.trim();
      if (bodyText) {
        sections.push({ id: "diagnosis", title: "Report Content", content: bodyText, edited: false, added: null });
      }
    }
    return sections.length > 0 ? sections : null;
  }, []);

  const processWithGemini = useCallback(async (reportText) => {
    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportText }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Server returned ${res.status}` }));
        throw new Error(err.error || `Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.sections && Array.isArray(data.sections)) {
        const sections = data.sections.map((s, i) => ({
          id: `section_${i}`,
          title: s.title,
          content: s.content,
          edited: false,
          added: null,
        }));

        if (data.summary) {
          sections.unshift({
            id: "summary",
            title: "Summary",
            content: data.summary,
            edited: false,
            added: null,
          });
        }

        if (data.takeaways && data.takeaways.length > 0) {
          sections.push({
            id: "takeaways",
            title: "Key Takeaways",
            content: data.takeaways.join(" · "),
            edited: false,
            added: null,
          });
        }

        updateReportSections(id, sections);
      }
      return true;
    } catch (err) {
      setApiError(err.message);
      return false;
    }
  }, [id, updateReportSections]);

  const processWithApi = useCallback(async () => {
    if (!user.apiEndpoint) return false;

    try {
      const res = await fetch(user.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: id,
          fileName: report?.fileName,
          type: report?.type,
        }),
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        const html = await res.text();
        const sections = parseHtmlSections(html);
        if (sections) updateReportSections(id, sections);
      } else {
        const data = await res.json();
        if (data.sections && Array.isArray(data.sections)) {
          updateReportSections(id, data.sections);
        } else if (data.html) {
          const sections = parseHtmlSections(data.html);
          if (sections) updateReportSections(id, sections);
        }
      }
      return true;
    } catch (err) {
      setApiError(err.message);
      return false;
    }
  }, [user.apiEndpoint, id, report, parseHtmlSections, updateReportSections]);

  // Build report text from available sources
  const getReportText = useCallback(() => {
    if (report?.htmlContent) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(report.htmlContent, "text/html");
      return doc.body?.textContent?.trim() || "";
    }
    return report?.type || "";
  }, [report]);

  useEffect(() => {
    if (cancelled || invalidFile) return;
    if (currentStep < steps.length - 1) {
      const hasApi = user.apiEndpoint;
      const reportText = getReportText();
      const useGemini = reportText && !hasApi;
      const delay = currentStep === 1 ? 1200 : currentStep === 2 ? (useGemini || hasApi ? 3000 : 1200) : 1200;
      const timer = setTimeout(() => {
        // After reading document (step 0→1), validate content
        if (currentStep === 0) {
          const defaultType = "Breast carcinoma, Grade 3";
          const hasCustomContent = reportText || (report?.type && report.type !== defaultType);
          const textToCheck = reportText || (report?.type !== defaultType ? report?.type : "") || "";

          // Text-based files: check for pathology keywords
          if (hasCustomContent && textToCheck && !pathologyKeywords.test(textToCheck)) {
            setInvalidFile(true);
            return;
          }

          // All files: check filename for obviously non-medical files
          const name = (report?.fileName || "").toLowerCase();
          const nonReportExts = [".mp3", ".mp4", ".mov", ".avi", ".zip", ".rar", ".exe", ".dmg", ".iso", ".psd", ".ai", ".sketch", ".fig", ".svg", ".gif", ".mp3", ".wav", ".aac", ".csv", ".xls", ".xlsx", ".ppt", ".pptx", ".json", ".xml", ".yaml", ".yml", ".js", ".ts", ".py", ".java", ".c", ".cpp", ".rb", ".go", ".rs"];
          const nonReportNames = /selfie|screenshot|wallpaper|vacation|holiday|family|party|meme|logo|banner|icon|avatar|profile|cover|thumbnail|photo_\d|img_\d|dsc_?\d|dcim|camera/i;
          if (nonReportExts.some(ext => name.endsWith(ext))) {
            setInvalidFile(true);
            return;
          }
          if (nonReportNames.test(name)) {
            setInvalidFile(true);
            return;
          }
        }
        if (currentStep === 1 && hasApi) {
          processWithApi().then(() => setCurrentStep((s) => s + 1));
        } else if (currentStep === 1 && reportText) {
          processWithGemini(reportText).then(() => setCurrentStep((s) => s + 1));
        } else {
          setCurrentStep((s) => s + 1);
        }
      }, delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        updateReportStatus(id, "Draft");
        navigate(`/report/${id}/review`, { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, id, navigate, updateReportStatus, user.apiEndpoint, processWithApi, processWithGemini, getReportText, cancelled, invalidFile, report]);

  if (!report) return <div className="flex h-screen items-center justify-center"><p className="text-base text-ink-muted">Report not found</p></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar collapsed />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between px-6 border-b border-stroke flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowStopDialog(true)} className="text-sm text-ink-muted hover:text-ink cursor-pointer transition-colors">
              ← Back
            </button>
            <span className="text-[0.9375rem] font-semibold text-ink">{report.id}</span>
            <span className="text-sm text-ink-muted">New report</span>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Left */}
          <div className="w-1/2 border-r border-stroke flex flex-col">
            <div className="flex-1 overflow-auto p-8">
              <div className="rounded-lg bg-surface-raised px-5 py-4 mb-6">
                <p className="text-sm text-ink-secondary leading-relaxed">Report uploaded successfully. Analyzing your document now...</p>
              </div>
              <div className="rounded-lg border border-stroke p-4 flex items-center gap-4 mb-8">
                <div className="w-11 h-11 rounded-lg bg-surface-raised flex items-center justify-center text-ink-faint flex-shrink-0">
                  <FileIcon size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{report.fileName}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{report.fileSize} · Uploaded just now</div>
                </div>
              </div>

              {apiError && (
                <div className="rounded-lg px-4 py-3 mb-6" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p className="text-sm font-medium" style={{ color: '#dc2626' }}>API error: {apiError}. Using default explanation.</p>
                </div>
              )}

              {invalidFile && (
                <div className="rounded-lg px-4 py-3 mb-6" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p className="text-sm font-medium" style={{ color: '#dc2626' }}>Wrong file input</p>
                  <p className="text-xs mt-1" style={{ color: '#dc2626', opacity: 0.8 }}>This doesn't appear to be a pathology report. Please check and upload the correct file.</p>
                </div>
              )}

              {cancelled && !invalidFile ? (
                <p className="text-sm text-ink-muted text-center leading-relaxed px-6">Processing was stopped.</p>
              ) : !invalidFile && (
                <p className="text-sm text-ink-faint text-center leading-relaxed px-6">
                  The explanation will appear on the right when processing is complete.
                </p>
              )}
            </div>
            <div className="px-6 py-5 border-t border-stroke flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-11 rounded-full border border-stroke flex items-center px-5 opacity-40">
                  <span className="text-sm text-ink-faint">Type a correction or instruction...</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center opacity-40">
                  <SendIcon size={16} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="w-1/2 flex flex-col">
            <header className="h-14 flex items-center px-6 border-b border-stroke flex-shrink-0">
              <span className="text-[0.9375rem] font-medium text-ink-secondary">Analyzing Report</span>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center px-12">
              <h2 className="text-lg font-bold text-ink mb-10 tracking-tight">Processing Your Report</h2>
              <div className="w-full max-w-[20rem] space-y-0">
                {steps.map((s, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  const pending = i > currentStep;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                          done ? "bg-blue-900" : active ? "border-2 border-blue-900" : "border-2 border-stroke"
                        }`}>
                          {done && <CheckIcon size={13} className="text-white" />}
                          {active && <div className="w-3 h-3 rounded-full bg-blue-900" />}
                        </div>
                        {i < steps.length - 1 && <div className={`w-px h-7 my-1 transition-colors duration-500 ${done ? "bg-ink-faint" : "bg-stroke"}`} />}
                      </div>
                      <div className="pt-1.5">
                        <div className={`text-sm font-medium transition-colors duration-500 ${
                          pending ? "text-ink-faint/50" : active ? "text-ink" : "text-ink-secondary"
                        }`}>{s.t}</div>
                        <div className="text-xs text-ink-muted mt-0.5">{s.d}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {cancelled ? (
                <div className="mt-10 text-center">
                  <p className="text-sm text-ink-muted mb-4">Processing stopped.</p>
                  <div className="flex gap-2.5 justify-center">
                    <button onClick={() => navigate("/dashboard")}
                      className="h-9 px-4 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                      Upload new
                    </button>
                    <button onClick={() => navigate("/dashboard")}
                      className="h-9 px-4 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                      Back to dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-ink-faint mt-12">Usually takes 10–15 seconds</p>
                  <button onClick={() => setCancelled(true)}
                    className="mt-4 text-sm text-ink-muted hover:text-ink cursor-pointer transition-colors">
                    Stop processing
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invalid file dialog */}
      {invalidFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
          <div className="relative bg-surface rounded-xl border border-stroke shadow-lg p-6 max-w-[22rem] w-full mx-4 text-center">
            <h3 className="text-[0.9375rem] font-semibold text-ink mb-2">Wrong file input</h3>
            <p className="text-sm text-ink-muted mb-5">This doesn't appear to be a pathology report. Please check and upload the correct file.</p>
            <div className="flex gap-2.5 justify-center">
              <button onClick={() => navigate("/dashboard")}
                className="h-9 px-4 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                Upload new
              </button>
              <button onClick={() => navigate("/dashboard")}
                className="h-9 px-4 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop processing confirmation dialog */}
      {showStopDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setShowStopDialog(false)} />
          <div className="relative bg-surface rounded-xl border border-stroke shadow-lg p-6 max-w-[20rem] w-full mx-4 text-center">
            <h3 className="text-[0.9375rem] font-semibold text-ink mb-2">Stop processing?</h3>
            <p className="text-sm text-ink-muted mb-5">Are you sure you want to stop? The current report will not be saved.</p>
            <div className="flex gap-2.5 justify-center">
              <button onClick={() => { setCancelled(true); setShowStopDialog(false); navigate("/dashboard"); }}
                className="h-9 px-4 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                Stop
              </button>
              <button onClick={() => setShowStopDialog(false)}
                className="h-9 px-4 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
