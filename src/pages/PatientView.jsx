import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../store";

export default function PatientView() {
  const { id } = useParams();
  const { getReport, user } = useApp();
  const report = getReport(id);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const sections = report?.sections?.filter(s => s.id !== "takeaways" && s.title !== "Key Takeaways") || [];
  const takeawaySection = report?.sections?.find(s => s.id === "takeaways" || s.title === "Key Takeaways");
  const takeaways = takeawaySection
    ? takeawaySection.content.split(" · ").map(t => t.trim()).filter(Boolean)
    : ["Breast carcinoma confirmed", "Grade 3", "Treatment options available", "Oncologist appointment next"];

  const buildReadText = useCallback(() => {
    const lines = [];
    lines.push("Your pathology report shows a diagnosis of breast carcinoma. This cancer was caught and your medical team will plan the most appropriate next steps for you.");
    sections.forEach((s) => {
      lines.push(s.title);
      lines.push(s.content);
    });
    if (takeaways.length > 0) {
      lines.push("Key Takeaways");
      lines.push(takeaways.join(". "));
    }
    return lines.join(". ");
  }, [sections, takeaways]);

  const handleReadAloud = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (isReading && !isPaused) {
      synth.pause();
      setIsPaused(true);
      return;
    }
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(buildReadText());
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = synth.getVoices();
    const preferred = voices.find(v => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Google") || v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => { setIsReading(false); setIsPaused(false); };
    utterance.onerror = () => { setIsReading(false); setIsPaused(false); };

    synth.cancel();
    synth.speak(utterance);
    setIsReading(true);
    setIsPaused(false);
  }, [isReading, isPaused, buildReadText]);

  const handleStopReading = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsReading(false);
    setIsPaused(false);
  }, []);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center px-6">
          <div className="w-12 h-12 rounded-xl bg-blue-900 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-bold">M</span>
          </div>
          <h1 className="text-xl font-bold text-ink mb-2">Report not found</h1>
          <p className="text-sm text-ink-muted">This report may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-raised">
      {/* Header */}
      <header className="bg-surface border-b border-stroke">
        <div className="max-w-[42rem] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {user.logo ? (
              <img src={user.logo} alt="Logo" className="h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
            )}
            <span className="font-semibold text-ink text-[0.9375rem]">MediReport AI</span>
          </div>

          {/* Read Aloud controls */}
          <div className="flex items-center gap-2">
            <button onClick={handleReadAloud}
              className={`h-10 px-4 rounded-lg border flex items-center gap-2 text-sm cursor-pointer transition-colors ${
                isReading ? "border-blue-500 text-blue-900 bg-blue-100" : "border-stroke text-ink-secondary hover:bg-surface-raised"
              }`}>
              <span>{isReading && !isPaused ? "⏸" : "▶"}</span>
              {isReading && !isPaused ? "Pause" : isReading && isPaused ? "Resume" : "Read Aloud"}
            </button>
            {isReading && (
              <button onClick={handleStopReading}
                className="h-10 px-3 rounded-lg border border-stroke flex items-center gap-1.5 text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                <span>⏹</span>
                Stop
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[42rem] mx-auto px-6 py-10">
        {/* Doctor details */}
        <div className="bg-surface rounded-xl border border-stroke p-8 mb-4">
          {user.logo && (
            <div className="mb-4">
              <img src={user.logo} alt="Practice logo" className="h-10 object-contain" />
            </div>
          )}
          <div className="text-lg font-bold text-ink">{user.name}</div>
          <div className="text-sm text-ink-muted mt-0.5">{user.department} &middot; {user.hospital}</div>
          <div className="text-sm text-ink-faint mt-0.5">{user.address}</div>
          <div className="text-sm text-ink-faint">{user.phone} &middot; {user.email}</div>
        </div>

        {/* Patient details + Report */}
        <div className="bg-surface rounded-xl border border-stroke p-8">
          {/* Patient info */}
          <div className="flex gap-10 mb-6 pb-6 border-b border-stroke">
            <div>
              <div className="text-xs text-ink-muted uppercase tracking-widest font-medium mb-1">Patient ID</div>
              <div className="text-base font-semibold text-ink">{report.id}</div>
            </div>
            <div>
              <div className="text-xs text-ink-muted uppercase tracking-widest font-medium mb-1">Age</div>
              <div className="text-base font-semibold text-ink">82</div>
            </div>
            <div>
              <div className="text-xs text-ink-muted uppercase tracking-widest font-medium mb-1">Gender</div>
              <div className="text-base font-semibold text-ink">Male</div>
            </div>
            <div>
              <div className="text-xs text-ink-muted uppercase tracking-widest font-medium mb-1">Date</div>
              <div className="text-base font-semibold text-ink">5 Apr 2026</div>
            </div>
          </div>

          {/* Summary */}
          <p className="text-base text-ink-secondary leading-[1.6] mb-8">
            Your pathology report shows a diagnosis of breast carcinoma. This cancer was caught and your medical team will plan the most appropriate next steps for you.
          </p>

          {/* Sections */}
          {sections.map((s, i) => (
            <div key={i} className="mb-6">
              <h3 className="text-lg font-bold text-ink mb-1.5">{s.title}</h3>
              <p className="text-base text-ink-secondary leading-[1.6]">{s.content}</p>
            </div>
          ))}

          {/* Key Takeaways */}
          <div className="mt-8 pt-6 border-t border-stroke">
            <div className="text-xs text-ink-muted uppercase tracking-widest font-medium mb-3">Key Takeaways</div>
            <div className="flex flex-wrap gap-2">
              {takeaways.map((t, i) => (
                <span key={i} className="border border-stroke rounded-full px-4 py-1.5 text-sm text-ink-secondary">{t}</span>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6">
            <p className="text-sm text-ink-faint">ℹ This explanation is for informational purposes only and is not a substitute for professional medical advice.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-xs text-ink-faint">Generated by MediReport AI &middot; Reviewed and approved by {user.name}</p>
          <p className="text-xs text-ink-faint mt-1">If you have questions, contact {user.hospital} at {user.phone}</p>
        </div>
      </main>
    </div>
  );
}
