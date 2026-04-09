import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../store";
import Sidebar from "../components/Sidebar";
import { SendIcon, PlusIcon } from "../icons";
import { API_URL } from "../config";

export default function ReviewEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReport, addChatMessage, getAiResponse, updateReportStatus, updateSection, updateReportSections } = useApp();
  const report = getReport(id);

  const [input, setInput] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentLang, setCurrentLang] = useState("English");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const chatEndRef = useRef(null);

  const languages = ["English", "Spanish", "French", "Arabic", "Hindi", "Mandarin", "Portuguese", "Vietnamese", "Italian", "German", "Greek", "Turkish", "Korean", "Japanese", "Thai"];

  const handleTranslate = async (lang) => {
    if (lang === currentLang) { setShowLangMenu(false); return; }
    setShowLangMenu(false);
    setIsTranslating(true);

    const sectionsText = report.sections
      .filter(s => s.id !== "takeaways")
      .map(s => `## ${s.title}\n${s.content}`)
      .join("\n\n");

    const takeawaySection = report.sections.find(s => s.id === "takeaways" || s.title === "Key Takeaways");
    const takeawaysText = takeawaySection ? `\n\nKey Takeaways: ${takeawaySection.content}` : "";

    const prompt = lang === "English"
      ? `Translate the following patient pathology explanation back to English. Keep the same section structure. Return as JSON: { "sections": [{ "title": "...", "content": "..." }] }${takeawaysText ? `, "takeaways": ["..."]` : ""}\n\n${sectionsText}${takeawaysText}`
      : `Translate the following patient pathology explanation into ${lang}. Keep the same section structure and tone — warm, clear, patient-friendly. Translate headings too. Return as JSON: { "sections": [{ "title": "...", "content": "..." }]${takeawaysText ? `, "takeaways": ["..."]` : ""} }\n\n${sectionsText}${takeawaysText}`;

    try {
      const res = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportText: prompt }),
      });

      if (!res.ok) throw new Error("Translation failed");

      const data = await res.json();

      if (data.sections && Array.isArray(data.sections)) {
        const translated = data.sections.map((s, i) => ({
          id: report.sections[i]?.id || `section_${i}`,
          title: s.title,
          content: s.content,
          edited: false,
          added: null,
        }));

        if (data.takeaways && data.takeaways.length > 0) {
          translated.push({
            id: "takeaways",
            title: lang === "English" ? "Key Takeaways" : data.sections.length > 0 ? "Key Takeaways" : "Key Takeaways",
            content: data.takeaways.join(" · "),
            edited: false,
            added: null,
          });
        }

        updateReportSections(id, translated);
        setCurrentLang(lang);
        addChatMessage(id, "ai", `Report translated to ${lang}.`);
      }
    } catch {
      addChatMessage(id, "ai", `Translation to ${lang} failed. Please try again.`);
    }

    setIsTranslating(false);
  };

  const globalPrompts = ["Simplify the language", "Make the tone warmer", "Shorten the explanation", "Restructure sections"];
  const secPrompts = {
    diagnosis: ["Make this more direct", "Soften the opening", "Remove a detail"],
    grade: ["Simplify this", "Less technical", "Explain differently"],
    expect: ["More reassuring", "Add treatment context", "Less specific"],
    steps: ["Add more detail", "Mention specific tests", "Make more practical"],
  };
  const activePrompts = selectedSection ? (secPrompts[selectedSection] || globalPrompts) : globalPrompts;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [report?.chatHistory?.length, isAiTyping]);
  useEffect(() => {
    if (!showLangMenu) return;
    const close = () => setShowLangMenu(false);
    setTimeout(() => document.addEventListener("click", close), 0);
    return () => document.removeEventListener("click", close);
  }, [showLangMenu]);

  if (!report) return <div className="flex h-screen items-center justify-center"><p className="text-base text-ink-muted">Report not found</p></div>;

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    addChatMessage(id, "user", msg);
    setIsAiTyping(true);

    try {
      const currentSections = report.sections.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      const prompt = `Here is the current patient pathology explanation with sections:\n\n${currentSections}\n\nThe doctor wants the following change:\n"${msg}"\n\nApply the change. You may add, remove, rewrite, or modify any sections as needed. Return the complete updated explanation as JSON:\n{ "sections": [{ "title": "section heading", "content": "section content" }] }\n\nOnly return sections that should remain. If the doctor asks to remove a section, do not include it in the response.`;

      const res = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportText: prompt }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      if (data.sections && Array.isArray(data.sections)) {
        const updated = data.sections.map((s, i) => ({
          id: `section_${i}`,
          title: s.title,
          content: s.content,
          edited: true,
          added: null,
        }));
        updateReportSections(id, updated);
        addChatMessage(id, "ai", "Done. I've updated the explanation based on your instruction. Changes are shown on the right.");
      } else {
        addChatMessage(id, "ai", getAiResponse());
      }
    } catch {
      addChatMessage(id, "ai", getAiResponse());
    }

    setIsAiTyping(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleApprove = () => { updateReportStatus(id, "Approved"); navigate(`/report/${id}/approved`); };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar collapsed />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-stroke flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")} className="text-sm text-ink-muted hover:text-ink cursor-pointer transition-colors">
              ← Back
            </button>
            <span className="text-[0.9375rem] font-semibold text-ink">{report.id}</span>
            <span className="text-sm text-ink-muted">Male, 82 Years</span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Language selector */}
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)} disabled={isTranslating}
                className="h-9 px-3.5 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors flex items-center gap-2 disabled:opacity-50">
                {isTranslating ? "Translating..." : currentLang}
                <span className="text-xs text-ink-faint">▾</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-11 w-44 bg-surface border border-stroke rounded-lg shadow-lg z-50 max-h-64 overflow-auto py-1">
                  {languages.map((lang) => (
                    <button key={lang} onClick={() => handleTranslate(lang)}
                      className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                        lang === currentLang ? "bg-blue-100 text-blue-900 font-medium" : "text-ink-secondary hover:bg-surface-raised"
                      }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleApprove}
              className="h-9 px-5 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
              Approve & Share
            </button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Left: Chat */}
          <div className="w-1/2 border-r border-stroke flex flex-col">
            <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
              {/* Acknowledgement — always shown */}
              <div className="rounded-lg bg-surface-raised px-5 py-3 mb-4 animate-fade-up">
                <p className="text-sm text-ink-secondary">
                  {report.chatHistory.find(m => m.role === "system")?.text || "Report uploaded successfully. Analyzing your document now..."}
                </p>
              </div>

              {/* View Original Report — always below acknowledgement */}
              <div>
                <button onClick={() => setShowOriginal(!showOriginal)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                  {showOriginal ? "Hide Original Report" : "View Original Report"} ▾
                </button>
                {showOriginal && (
                  <div className="mt-3 rounded-lg border border-stroke bg-surface-raised px-5 py-4 space-y-2 text-sm text-ink-secondary leading-relaxed">
                    <p><strong className="text-ink">Specimen:</strong> Left breast, core biopsy</p>
                    <p><strong className="text-ink">Diagnosis:</strong> Invasive ductal carcinoma, Grade 3 (Nottingham score 8/9)</p>
                    <p><strong className="text-ink">Tumor Size:</strong> 2.3 cm</p>
                    <p><strong className="text-ink">Margins:</strong> Not applicable (core biopsy)</p>
                    <p><strong className="text-ink">Receptor Status:</strong> ER positive (90%), PR positive (60%), HER2 negative</p>
                    <p><strong className="text-ink">Ki-67:</strong> 35%</p>
                    <p><strong className="text-ink">Lymphovascular Invasion:</strong> Not identified</p>
                  </div>
                )}
              </div>

              {/* Chat messages (skip system messages since we render acknowledgement above) */}
              {report.chatHistory.map((msg, i) => {
                if (msg.role === "system") return null;
                if (msg.role === "user") {
                  return (
                    <div key={i} className="flex flex-col items-end animate-fade-up">
                      <div className="rounded-2xl rounded-br-sm bg-surface-sunken px-5 py-3 max-w-[75%]">
                        <p className="text-[0.9375rem] text-ink">{msg.text}</p>
                      </div>
                      {msg.time && <p className="text-xs text-ink-faint mt-1 mr-1">{msg.time}</p>}
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex flex-col items-start animate-fade-up">
                    <div className="rounded-2xl rounded-bl-sm bg-surface border border-stroke px-5 py-3 max-w-[75%]">
                      <p className="text-[0.9375rem] text-ink-secondary">{msg.text}</p>
                    </div>
                    <p className="text-xs text-ink-faint mt-1 ml-1">MediReport AI</p>
                  </div>
                );
              })}

              {isAiTyping && (
                <div className="flex flex-col items-start animate-fade-up">
                  <div className="rounded-2xl rounded-bl-sm bg-surface border border-stroke px-5 py-3.5 inline-flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-ink-faint rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="px-6 py-4 border-t border-stroke flex-shrink-0">
              {/* Prompt chips above input, same bg as user messages */}
              <div className="mb-3">
                {selectedSection && (
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <span className="text-sm text-ink-muted">Editing:</span>
                    <span className="text-sm text-ink font-medium">{report.sections.find((s) => s.id === selectedSection)?.title}</span>
                    <button onClick={() => setSelectedSection(null)} className="text-sm text-ink-faint hover:text-ink-muted cursor-pointer ml-0.5">✕</button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {activePrompts.map((p, i) => (
                    <button key={i} onClick={() => handleSend(p)}
                      className="flex items-center gap-1.5 bg-surface-sunken rounded-full px-3.5 py-1.5 cursor-pointer hover:bg-surface-raised border border-transparent hover:border-stroke transition-colors">
                      <PlusIcon size={10} className="text-ink-muted" />
                      <span className="text-xs text-ink-secondary">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Input row — no avatar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-11 rounded-full border border-stroke flex items-center px-5 focus-wrapper transition-all">
                  <input type="text" placeholder="Type a correction or instruction..."
                    value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    className="w-full text-[0.9375rem] text-ink focus:outline-none bg-transparent" />
                </div>
                <button onClick={() => handleSend()} disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center cursor-pointer flex-shrink-0 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity">
                  <SendIcon size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Report sections */}
          <div className="w-1/2 flex flex-col">
            <div className="h-14 flex items-center justify-between px-6 border-b border-stroke flex-shrink-0">
              <span className="text-xs text-ink-muted uppercase tracking-widest font-medium">
                AI-Generated Explanation
              </span>
              <div className="flex items-center gap-2">
                {report.sections.some(s => s.edited) && (
                  <span className="text-xs text-blue-500 font-medium bg-blue-100 px-2.5 py-1 rounded-full">Edited</span>
                )}
                {currentLang !== "English" && (
                  <span className="text-xs text-blue-500 font-medium bg-blue-100 px-2.5 py-1 rounded-full">{currentLang}</span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto px-8 py-6" style={{ position: 'relative' }}>
                {isTranslating && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100%', backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="text-center" style={{ position: 'sticky', top: '40%' }}>
                      <div className="inline-flex gap-1.5 items-center mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <p className="text-sm text-ink-muted">Translating report...</p>
                    </div>
                  </div>
                )}
                <>
                  {report.sections.map((s, i) => {
                    const isSelected = selectedSection === s.id;
                    const isEditing = editingId === s.id;
                    const isTakeaways = s.id === "takeaways" || s.title === "Key Takeaways";

                    if (isTakeaways) {
                      const pills = s.content.split(" · ").map(t => t.trim()).filter(Boolean);
                      return (
                        <div key={i} className="mb-1 p-3 rounded-xl border border-transparent">
                          <h3 className="text-lg font-semibold text-ink mb-3">{s.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            {pills.map((t, j) => (
                              <span key={j} className="border border-stroke rounded-full px-4 py-1.5 text-sm text-ink-secondary">{t}</span>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={i}
                        onClick={() => { if (!isEditing) setSelectedSection(isSelected ? null : s.id); }}
                        className={`mb-1 p-3 rounded-xl transition-all ${
                          isEditing ? "border border-blue-500/30 bg-blue-100/40" : "border border-transparent hover:border-stroke cursor-pointer"
                        }`}>
                        <h3 className="text-lg font-semibold text-ink mb-1.5">{s.title}</h3>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={() => { setEditingId(s.id); setSelectedSection(s.id); }}
                          onBlur={(e) => {
                            const newText = e.currentTarget.textContent;
                            if (newText !== s.content) updateSection(id, s.id, newText);
                            setEditingId(null);
                          }}
                          className="text-[0.9375rem] text-ink-secondary leading-[1.65] focus:outline-none"
                        >{s.content}</p>
                      </div>
                    );
                  })}
                  <div className="mt-3 p-4 rounded-lg bg-surface-raised">
                    <p className="text-sm text-ink-faint">ℹ This explanation is for informational purposes only and is not a substitute for professional medical advice.</p>
                  </div>
                </>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
