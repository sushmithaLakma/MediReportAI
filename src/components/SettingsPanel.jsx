import { useState } from "react";
import { useApp } from "../store";

export default function SettingsPanel({ onClose }) {
  const { user, setUser } = useApp();
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);

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
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel — slides in from the left, after the sidebar */}
      <div className="relative ml-14 w-[22rem] h-full bg-surface border-r border-stroke shadow-lg overflow-auto animate-fade-up">
        <div className="px-6 pt-8 pb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">Settings</h2>
              <p className="text-sm text-ink-muted mt-0.5">Profile and practice details</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg border border-stroke flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer" title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {fields.map((group) => (
            <div key={group.section} className="mb-8">
              <h3 className="text-xs text-ink-muted uppercase tracking-widest font-medium mb-4">{group.section}</h3>
              <div className="space-y-4">
                {group.items.map((f) => (
                  <div key={f.key}>
                    <label className="text-sm font-medium text-ink-muted mb-1.5 block">{f.label}</label>
                    {f.key === "address" ? (
                      <textarea
                        value={form[f.key] || ""}
                        onChange={(e) => update(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        rows={2}
                        className="w-full rounded-lg border border-stroke px-3.5 py-2.5 text-sm text-ink-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                      />
                    ) : (
                      <input
                        type={f.key === "email" ? "email" : "text"}
                        value={form[f.key] || ""}
                        onChange={(e) => update(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full h-10 rounded-lg border border-stroke px-3.5 text-sm text-ink-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      />
                    )}
                    {f.hint && <p className="text-xs text-ink-faint mt-1">{f.hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button onClick={handleSave}
              className="h-9 px-6 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
            {saved && <span className="text-sm text-accent-green font-medium animate-fade-up">Saved</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
