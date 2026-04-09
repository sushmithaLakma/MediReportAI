import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../store";
import Sidebar from "../components/Sidebar";
import { CheckIcon, LinkIcon, FileIcon } from "../icons";

export default function ApproveShare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReport, user } = useApp();
  const report = getReport(id);
  const [phone, setPhone] = useState("");
  const [toast, setToast] = useState("");
  const [shared, setShared] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleBack = () => {
    navigate(`/report/${id}/review`);
  };

  // Build plain text version of the report for sharing
  const buildReportText = useCallback(() => {
    if (!report) return "";
    const lines = [];
    lines.push(`Pathology Report — ${report.id}`);
    lines.push(`Prepared by ${user.name} · ${user.hospital}`);
    lines.push(`Patient ID: ${report.id} | Age: 82 | Gender: Male | Date: 5 Apr 2026`);
    lines.push("");
    lines.push("Your pathology report shows a diagnosis of breast carcinoma. This cancer was caught and your medical team will plan the most appropriate next steps for you.");
    lines.push("");
    report.sections.forEach((s) => {
      lines.push(s.title);
      lines.push(s.content);
      lines.push("");
    });
    lines.push("Key Takeaways: Breast carcinoma confirmed · Grade 3 · Treatment options available · Oncologist appointment next");
    lines.push("");
    lines.push("This explanation is for informational purposes only and is not a substitute for professional medical advice.");
    return lines.join("\n");
  }, [report, user]);

  // Generate and download PDF — mirrors approved screen exactly
  const handleDownloadPDF = useCallback(() => {
    const takeawayPills = ["Breast carcinoma confirmed", "Grade 3", "Treatment options available", "Oncologist appointment next"];

    // Create a hidden iframe to render and print without opening a new tab
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <title>Pathology Report — ${report.id}</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          max-width: 672px;
          margin: 0 auto;
          padding: 40px 32px;
          color: #1a1d2b;
          line-height: 1.45;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Box layout — matches approved screen */
        .box {
          border: 1px solid #e4e5eb;
          border-radius: 12px;
          padding: 32px;
          background: #ffffff;
        }
        .box + .box { margin-top: 16px; }

        /* Doctor details — text-lg font-bold text-ink */
        .doctor-name { font-size: 18px; font-weight: 700; color: #1a1d2b; }
        /* text-sm text-ink-muted */
        .doctor-dept { font-size: 14px; color: #8b8ea0; margin-top: 2px; }
        /* text-sm text-ink-faint */
        .doctor-detail { font-size: 14px; color: #b4b7c6; margin-top: 2px; }
        /* text-xs text-ink-faint */
        .doctor-license { font-size: 12px; color: #b4b7c6; margin-top: 4px; }

        /* Patient row — matches flex gap-10 border-b */
        .patient-row {
          display: flex;
          gap: 40px;
          padding-bottom: 24px;
          margin-bottom: 24px;
          border-bottom: 1px solid #e4e5eb;
        }
        /* text-xs text-ink-muted uppercase tracking-widest font-medium */
        .patient-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #8b8ea0;
          font-weight: 500;
          margin-bottom: 4px;
        }
        /* text-base font-semibold text-ink */
        .patient-value { font-size: 16px; font-weight: 600; color: #1a1d2b; }

        /* Summary — text-base text-ink-secondary leading-[1.6] */
        .summary { font-size: 16px; color: #4a4d5e; line-height: 1.6; margin-bottom: 32px; }

        /* Sections — text-lg font-bold + text-base text-ink-secondary */
        .section { margin-bottom: 24px; }
        .section-title { font-size: 18px; font-weight: 700; color: #1a1d2b; margin-bottom: 6px; }
        .section-content { font-size: 16px; color: #4a4d5e; line-height: 1.6; }

        /* Takeaways — border-t + pills */
        .takeaways { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e5eb; }
        .takeaways-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #8b8ea0;
          font-weight: 500;
          margin-bottom: 12px;
        }
        /* text-sm text-ink-secondary border rounded-full */
        .pill {
          display: inline-block;
          border: 1px solid #e4e5eb;
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 14px;
          color: #4a4d5e;
          margin: 0 6px 8px 0;
        }

        /* Disclaimer — text-sm text-ink-faint */
        .disclaimer { margin-top: 24px; font-size: 14px; color: #b4b7c6; }

        @page {
          margin: 20mm 15mm;
          size: A4;
        }
        @media print {
          body { padding: 0; margin: 0; }
        }
      </style>
    </head><body>

      <div class="box">
        ${user.logo ? `<img src="${user.logo}" alt="Logo" style="height:40px;object-fit:contain;margin-bottom:12px;" />` : ""}
        <div class="doctor-name">${user.name}</div>
        <div class="doctor-dept">${user.department} · ${user.hospital}</div>
        <div class="doctor-detail">${user.address}</div>
        <div class="doctor-detail">${user.phone} · ${user.email}</div>
        ${user.license ? `<div class="doctor-license">License: ${user.license}</div>` : ""}
      </div>

      <div class="box">
        <div class="patient-row">
          <div><div class="patient-label">Patient ID</div><div class="patient-value">${report.id}</div></div>
          <div><div class="patient-label">Age</div><div class="patient-value">82</div></div>
          <div><div class="patient-label">Gender</div><div class="patient-value">Male</div></div>
          <div><div class="patient-label">Date</div><div class="patient-value">5 Apr 2026</div></div>
        </div>

        <div class="summary">Your pathology report shows a diagnosis of breast carcinoma. This cancer was caught and your medical team will plan the most appropriate next steps for you.</div>

        ${report.sections.map(s => `<div class="section"><div class="section-title">${s.title}</div><div class="section-content">${s.content}</div></div>`).join("")}

        <div class="takeaways">
          <div class="takeaways-label">Key Takeaways</div>
          <div>${takeawayPills.map(t => `<span class="pill">${t}</span>`).join("")}</div>
        </div>

        <div class="disclaimer">ℹ This explanation is for informational purposes only and is not a substitute for professional medical advice.</div>
      </div>

    </body></html>`);
    doc.close();

    // Wait for font to load, then trigger print (Save as PDF)
    iframe.contentWindow.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    };

    showToast("Preparing PDF...");
    setShared(true);
  }, [report, user]);

  // Copy shareable link
  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/patient/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link copied to clipboard");
      setShared(true);
      }).catch(() => {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showToast("Link copied to clipboard");
      setShared(true);
      });
  }, [id]);

  // Send via WhatsApp
  const handleWhatsApp = useCallback(() => {
    const cleanPhone = phone.replace(/\s+/g, "").replace(/^0/, "");
    const phoneNum = cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone;
    if (!phoneNum || phoneNum.length < 8) {
      showToast("Please enter a valid phone number");
      return;
    }
    const text = encodeURIComponent(
      `Your pathology report (${report.id}) has been reviewed and approved by ${user.name}.\n\n` +
      `View the full explanation here: ${window.location.origin}/patient/${id}\n\n` +
      `If you have questions, contact ${user.hospital} at ${user.phone}.`
    );
    window.open(`https://wa.me/${phoneNum}?text=${text}`, "_blank");
    showToast("Opening WhatsApp...");
    setShared(true);
  }, [phone, report, user, id]);

  // Send via SMS
  const handleSMS = useCallback(() => {
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      showToast("Please enter a valid phone number");
      return;
    }
    const text = encodeURIComponent(
      `Your pathology report (${report.id}) has been reviewed by ${user.name}. ` +
      `View it here: ${window.location.origin}/patient/${id}`
    );
    window.open(`sms:${cleanPhone}?body=${text}`, "_self");
    showToast("Opening SMS...");
    setShared(true);
  }, [phone, report, user, id]);

  if (!report) return <div className="flex h-screen items-center justify-center"><p className="text-base text-ink-muted">Report not found</p></div>;

  const takeaways = ["Breast carcinoma confirmed", "Grade 3", "Treatment options available", "Oncologist appointment next"];

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar collapsed />

      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between px-6 border-b border-stroke flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="text-sm text-ink-muted hover:text-ink cursor-pointer transition-colors">
              ← Back
            </button>
            <span className="text-[0.9375rem] font-semibold text-ink">{report.id}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate(`/report/${id}/review`)}
              className="h-9 px-4 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
              Edit
            </button>
            <button className="h-9 px-5 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
              Approve & Share
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-[42rem] mx-auto pt-10 px-8 pb-16">

            {/* ── Doctor details ── */}
            <div className="bg-surface rounded-xl border border-stroke p-8 mb-4">
              {user.logo && (
                <div className="mb-4">
                  <img src={user.logo} alt="Practice logo" className="h-10 object-contain" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold text-ink">{user.name}</div>
                  <div className="text-sm text-ink-muted mt-0.5">{user.department} &middot; {user.hospital}</div>
                  <div className="text-sm text-ink-faint mt-0.5">{user.address}</div>
                  <div className="text-sm text-ink-faint">{user.phone} &middot; {user.email}</div>
                  {user.license && <div className="text-xs text-ink-faint mt-1">License: {user.license}</div>}
                </div>
                <div className="flex items-center gap-1.5 border border-green-200 bg-accent-green-bg px-3.5 py-1.5 rounded-full flex-shrink-0">
                  <CheckIcon size={12} className="text-accent-green" />
                  <span className="text-sm text-accent-green font-medium">Approved</span>
                </div>
              </div>
            </div>

            {/* ── Patient details + Report content ── */}
            <div className="bg-surface rounded-xl border border-stroke p-8 mb-10">

              {/* Patient details */}
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

              {/* Report content */}
              <p className="text-base text-ink-secondary leading-[1.6] mb-8">
                Your pathology report shows a diagnosis of breast carcinoma. This cancer was caught and your medical team will plan the most appropriate next steps for you.
              </p>

              {report.sections.filter(s => s.id !== "takeaways" && s.title !== "Key Takeaways").map((s, i) => (
                <div key={i} className="mb-6">
                  <h3 className="text-lg font-bold text-ink mb-1.5">{s.title}</h3>
                  <p className="text-base text-ink-secondary leading-[1.6]">{s.content}</p>
                </div>
              ))}

              {/* Key Takeaways */}
              {(() => {
                const tw = report.sections.find(s => s.id === "takeaways" || s.title === "Key Takeaways");
                const pills = tw ? tw.content.split(" · ").map(t => t.trim()).filter(Boolean) : takeaways;
                return (
                  <div className="mt-8 pt-6 border-t border-stroke">
                    <div className="text-xs text-ink-muted uppercase tracking-widest font-medium mb-3">Key Takeaways</div>
                    <div className="flex flex-wrap gap-2">
                      {pills.map((t, i) => (
                        <span key={i} className="border border-stroke rounded-full px-4 py-1.5 text-sm text-ink-secondary">{t}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Disclaimer */}
              <div className="mt-6">
                <p className="text-sm text-ink-faint">ℹ This explanation is for informational purposes only and is not a substitute for professional medical advice.</p>
              </div>
            </div>

            {/* ── Share with Patient ── */}
            <div id="share-section" className="rounded-xl border border-stroke bg-surface-raised p-8">
              <h3 className="text-lg font-bold text-ink mb-1">Share with Patient</h3>
              <p className="text-sm text-ink-muted mb-5">Send the approved explanation to the patient.</p>

              <div className="mb-5">
                <label className="text-sm font-medium text-ink mb-2 block">Patient's Phone Number</label>
                <input
                  type="tel"
                  placeholder="+61 4XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 rounded-xl border border-stroke px-4 text-base text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-3 mb-5">
                <button onClick={handleWhatsApp}
                  className="h-11 px-6 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                  Send via WhatsApp
                </button>
                <button onClick={handleSMS}
                  className="h-11 px-6 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                  Send via SMS
                </button>
              </div>

              <hr className="border-stroke mb-5" />

              <div className="flex gap-3 flex-wrap">
                <button onClick={handleCopyLink}
                  className="h-11 px-5 rounded-lg border border-stroke flex items-center gap-2 text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                  <LinkIcon size={15} className="text-ink-faint" />
                  Copy Link
                </button>
                <button onClick={handleDownloadPDF}
                  className="h-11 px-5 rounded-lg border border-stroke flex items-center gap-2 text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                  <FileIcon size={15} className="text-ink-faint" />
                  Download PDF
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-900 text-white px-6 py-3 rounded-lg shadow-2xl text-sm font-medium z-50 animate-fade-up">
          {toast}
        </div>
      )}

      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setShowLeaveDialog(false)} />
          <div className="relative bg-surface rounded-xl border border-stroke shadow-lg p-6 max-w-[22rem] w-full mx-4 text-center">
            <h3 className="text-[0.9375rem] font-semibold text-ink mb-2">Report not shared yet</h3>
            <p className="text-sm text-ink-muted mb-5">You haven't shared this report with the patient. Would you like to share it now or come back later?</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => { setShowLeaveDialog(false); document.getElementById("share-section")?.scrollIntoView({ behavior: "smooth" }); }}
                className="h-9 px-4 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                Share now
              </button>
              <button onClick={() => navigate("/dashboard")}
                className="h-9 px-4 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                Share later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
