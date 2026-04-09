import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../store";
import { SearchIcon, PlusIcon, LogOutIcon } from "../icons";

function CollapseIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />
    </svg>
  );
}

export default function Sidebar({ collapsed: initialCollapsed }) {
  const { user, reports, addReport, setIsLoggedIn, stats, sidebarCollapsed, setSidebarCollapsed, showDiscardDialog, setShowDiscardDialog } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (initialCollapsed !== undefined) setSidebarCollapsed(initialCollapsed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const collapsed = sidebarCollapsed;
  const setCollapsed = setSidebarCollapsed;

  const filtered = reports.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach((r) => {
    const key = r.date || "Older";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const handleNewReport = () => {
    if (location.pathname.includes("/report/")) {
      setShowDiscardDialog(true);
      return;
    }
    navigate("/dashboard");
  };

  const confirmNewReport = () => {
    setShowDiscardDialog(false);
    navigate("/dashboard");
  };

  const handleReportClick = (r) => {
    if (r.status === "Approved") navigate(`/report/${r.id}/approved`);
    else if (r.status === "Processing") navigate(`/report/${r.id}/processing`);
    else navigate(`/report/${r.id}/review`);
  };

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleSettingsClick = () => {
    if (location.pathname === "/settings") navigate(-1);
    else navigate("/settings");
  };

  const isOnSettings = location.pathname === "/settings";

  /* ── Collapsed ── */
  if (collapsed) {
    const recentReports = reports.slice(0, 4);

    return (
      <aside className="w-14 h-full flex flex-col items-center py-4 gap-2 flex-shrink-0" style={{ backgroundColor: '#1E3A5F', color: '#ffffff' }}>
        <button onClick={() => setCollapsed(false)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer mb-1" style={{ opacity: 0.6 }} title="Expand sidebar">
          <CollapseIcon size={16} />
        </button>
        <button onClick={handleNewReport} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} title="New report">
          <PlusIcon size={16} />
        </button>
        <button onClick={() => setCollapsed(false)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer" style={{ opacity: 0.6 }} title="Search">
          <SearchIcon size={15} />
        </button>

        <div className="w-full px-3 mt-2 space-y-2">
          {recentReports.map((r) => (
            <div
              key={r.id}
              className="w-full px-1 py-0.5"
            >
              <div className="w-full h-[2px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} />
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          style={{ backgroundColor: '#ffffff' }}
          onClick={handleSettingsClick}
          title="Settings"
        >
          <span className="text-sm font-bold" style={{ color: '#4a4a3a' }}>{user.initials.charAt(0)}</span>
        </div>
        {showDiscardDialog && <ConfirmDialog title="Discard current report?" message="You have a report in progress. Discarding will leave the current report." confirmLabel="Discard" onConfirm={confirmNewReport} onCancel={() => setShowDiscardDialog(false)} />}
        {showLogoutDialog && <ConfirmDialog title="Log out?" message="Are you sure you want to log out?" confirmLabel="Log out" onConfirm={confirmLogout} onCancel={() => setShowLogoutDialog(false)} />}
      </aside>
    );
  }

  /* ── Expanded ── */
  return (<>
    <aside className="w-[20%] min-w-[14rem] max-w-[18rem] border-r border-stroke flex flex-col h-full flex-shrink-0 bg-surface">
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center">
              <span className="text-white font-bold text-[0.6rem]">M</span>
            </div>
            <span className="font-semibold text-ink text-[0.9375rem]">MediReport AI</span>
          </div>
          <button onClick={() => setCollapsed(true)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer">
            <CollapseIcon size={15} className="text-ink-faint" />
          </button>
        </div>
        <button onClick={handleNewReport} className="w-full h-10 rounded-lg bg-blue-900 text-white text-sm font-medium flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors mb-3">
          + New Report
        </button>
        <div className="relative h-9 rounded-lg border border-stroke flex items-center pl-8 pr-3 focus-wrapper transition-all">
          <SearchIcon size={14} className="text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="text" placeholder="Search reports" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-ink bg-transparent placeholder:text-ink-faint focus:outline-none" />
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="text-[0.6875rem] text-ink-muted font-medium uppercase tracking-wider mb-2.5">Your Activity</div>
        <div className="flex gap-2">
          {[
            { n: stats.processed, l: "Reports" },
            { n: stats.shared, l: "Shared" },
          ].map((s, i) => (
            <div key={i} className="flex-1 rounded-md border border-stroke py-1.5 text-center">
              <div className="text-[1rem] font-bold text-ink leading-none">{s.n}</div>
              <div className="text-[0.6875rem] text-ink-muted mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <div className="px-2.5 pt-5 pb-2">
              <span className="text-[0.6875rem] text-ink-muted font-medium uppercase tracking-wider">{group}</span>
            </div>
            {items.map((r) => {
              const isActive = location.pathname.includes(r.id);
              return (
                <div key={r.id} onClick={() => handleReportClick(r)}
                  className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-0.5 ${isActive ? "bg-surface-raised" : "hover:bg-surface-raised"}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[0.8125rem] text-ink font-medium">{r.id}</span>
                    <span className={`text-[0.625rem] font-medium px-1.5 py-0.5 rounded leading-none ${
                      r.status === "Approved" ? "bg-surface-sunken text-ink-muted" :
                      r.status === "Processing" ? "bg-accent-amber-bg text-accent-amber" :
                      "border border-stroke text-ink-muted"
                    }`}>{r.status}</span>
                  </div>
                  <div className="text-xs text-ink-muted truncate">{r.type}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleSettingsClick}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#E8EFF7' }}>
              <span className="text-sm font-bold" style={{ color: '#1E3A5F' }}>{user.initials.charAt(0)}</span>
            </div>
            <div>
              <div className="text-[0.8125rem] font-medium text-ink leading-tight">{user.name}</div>
              <div className="text-xs text-ink-muted leading-tight">Settings</div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-ink-faint hover:text-ink-muted transition-colors cursor-pointer p-1">
            <LogOutIcon size={15} />
          </button>
        </div>
      </div>
    </aside>
    {showDiscardDialog && <ConfirmDialog title="Discard current report?" message="You have a report in progress. Discarding will leave the current report." confirmLabel="Discard" onConfirm={confirmNewReport} onCancel={() => setShowDiscardDialog(false)} />}
        {showLogoutDialog && <ConfirmDialog title="Log out?" message="Are you sure you want to log out?" confirmLabel="Log out" onConfirm={confirmLogout} onCancel={() => setShowLogoutDialog(false)} />}
  </>);
}

function ConfirmDialog({ title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={onCancel} />
      <div className="relative bg-surface rounded-xl border border-stroke shadow-lg p-6 max-w-[20rem] w-full mx-4 text-center">
        <h3 className="text-[0.9375rem] font-semibold text-ink mb-2">{title}</h3>
        <p className="text-sm text-ink-muted mb-5">{message}</p>
        <div className="flex gap-2.5 justify-center">
          <button onClick={onConfirm}
            className="h-9 px-4 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="h-9 px-4 rounded-lg border border-stroke text-sm text-ink-secondary cursor-pointer hover:bg-surface-raised transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
