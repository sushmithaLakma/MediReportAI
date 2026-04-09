import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store";
import Sidebar from "../components/Sidebar";

export default function Settings() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      update("logo", ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setUser({ ...form, initials: form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const fields = [
    { section: "Personal Information", items: [
      { key: "name", label: "Full Name", placeholder: "Dr. Jane Smith" },
      { key: "email", label: "Email Address", placeholder: "doctor@hospital.com" },
      { key: "phone", label: "Phone Number", placeholder: "+61 4XX XXX XXX" },
      { key: "license", label: "Medical License Number", placeholder: "MED-XXXX-XXXXX" },
    ]},
    { section: "Hospital & Practice", items: [
      { key: "hospital", label: "Hospital / Practice Name", placeholder: "Royal Melbourne Hospital" },
      { key: "department", label: "Department", placeholder: "Pathology" },
      { key: "address", label: "Practice Address", placeholder: "300 Grattan St, Parkville VIC 3050" },
    ]},
    { section: "API Configuration", items: [
      { key: "apiEndpoint", label: "Report Processing API Endpoint", placeholder: "https://your-api.com/process-report", hint: "API can return JSON with sections array or HTML content" },
    ]},
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-[36rem] mx-auto pt-12 px-8 pb-16">
          {/* Header with close */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-xl font-bold text-ink mb-1 tracking-tight">Settings</h1>
              <p className="text-sm text-ink-muted">Manage your profile and practice details.</p>
            </div>
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg border border-stroke flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer" title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Branding */}
          <div className="mb-10">
            <h2 className="text-sm text-ink-secondary uppercase tracking-widest font-semibold mb-5">Branding</h2>
            <label className="text-sm font-medium text-ink-muted mb-2.5 block">Practice Logo</label>
            <div className="flex items-center gap-4">
              {form.logo ? (
                <div className="w-16 h-16 rounded-lg border border-stroke overflow-hidden flex-shrink-0 bg-surface-raised">
                  <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border border-stroke flex items-center justify-center flex-shrink-0 bg-surface-raised">
                  <span className="text-xs text-ink-faint">No logo</span>
                </div>
              )}
              <div className="flex gap-2">
                <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg" onChange={handleLogoUpload} className="hidden" />
                <button onClick={() => logoInputRef.current?.click()}
                  className="h-9 px-4 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
                  {form.logo ? "Change" : "Upload"}
                </button>
                {form.logo && (
                  <button onClick={() => update("logo", "")}
                    className="h-9 px-4 rounded-lg border border-stroke text-sm text-ink-muted cursor-pointer hover:bg-surface-raised transition-colors">
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-ink-faint mt-2">PNG, JPG, or SVG. Shown on reports and PDFs.</p>
          </div>

          {fields.map((group) => (
            <div key={group.section} className="mb-10">
              <h2 className="text-sm text-ink-secondary uppercase tracking-widest font-semibold mb-5">{group.section}</h2>
              <div className="flex flex-col gap-2.5">
                {group.items.map((f) => (
                  <div key={f.key}>
                    <label className="text-sm font-medium text-ink-muted mb-1.5 block">{f.label}</label>
                    {f.key === "address" ? (
                      <textarea
                        value={form[f.key] || ""}
                        onChange={(e) => update(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        rows={2}
                        className="w-full rounded-lg border border-stroke px-4 py-3 text-sm text-ink-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                      />
                    ) : (
                      <input
                        type={f.key === "email" ? "email" : "text"}
                        value={form[f.key] || ""}
                        onChange={(e) => update(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full h-11 rounded-lg border border-stroke px-4 text-sm text-ink-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      />
                    )}
                    {f.hint && <p className="text-xs text-ink-faint mt-1.5">{f.hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button onClick={handleSave}
              className="h-10 px-8 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
            {saved && <span className="text-sm text-accent-green font-medium animate-fade-up">Saved</span>}
          </div>
        </div>
      </main>
    </div>
  );
}
