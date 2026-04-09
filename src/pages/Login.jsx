import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store";
import { CheckIcon } from "../icons";

const loginBgs = ["/login-bg.jpg", "/login-bg-2.jpg", "/login-bg-3.jpg", "/login-bg-4.jpg"];
const randomBg = loginBgs[Math.floor(Math.random() * loginBgs.length)];

export default function Login() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email) newErrors.email = "Please enter your email";
    if (!password) newErrors.password = "Please enter your password";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsLoggedIn(true);
    navigate("/dashboard");
  };

  return (
    <div className="h-screen flex">
      {/* Left branding with background image */}
      <div className="relative flex items-center justify-center overflow-hidden z-10" style={{ width: '46%', padding: '0 56px 0 40px' }}>
        {/* Background image */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url(${randomBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.35)',
        }} />

        {/* Glassmorphism card */}
        <div className="relative z-10" style={{ backgroundColor: 'rgba(255,255,255,0.12)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '40px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-8" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight tracking-tight mb-1.5">MediReport AI</h1>
          <p className="text-lg mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>Pathology Report Interpreter</p>
          <p className="text-base leading-relaxed mb-6 max-w-[20rem]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Translate complex pathology findings into clear, patient-friendly explanations.
          </p>
          <div className="space-y-4">
            {["Doctor-curated AI explanations", "Review and edit before sharing", "Patient gets a clear, approved report"].map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckIcon size={16} style={{ color: 'rgba(255,255,255,0.6)' }} className="flex-shrink-0" />
                <span className="text-[0.9375rem]" style={{ color: 'rgba(255,255,255,0.85)' }}>{t}</span>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-8 md:px-16 relative z-20" style={{ width: '55%', borderRadius: '16px 0 0 16px', backgroundColor: '#ffffff', marginLeft: '-16px' }}>
        <div className="w-full max-w-[26rem]">
          <h2 className="text-2xl font-bold text-ink leading-tight tracking-tight mb-1">Welcome back</h2>
          <p className="text-base text-ink-muted mb-8">Log in to your account</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
              <input type="email" placeholder="doctor@hospital.com" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => { const n = {...prev}; delete n.email; return n; }); }}
                className="w-full h-12 rounded-xl border px-4 text-base text-ink bg-surface focus:outline-none focus:ring-2 transition-all border-stroke focus:ring-blue-500/10 focus:border-blue-500"
                style={errors.email ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' } : {}} />
              {errors.email && <p className="font-medium mt-1.5" style={{ fontSize: '14px', color: '#dc2626' }}>! {errors.email}</p>}
            </div>

            <div className="mb-3">
              <label className="text-sm font-medium text-ink mb-1.5 block">Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => { const n = {...prev}; delete n.password; return n; }); }}
                className="w-full h-12 rounded-xl border px-4 text-base text-ink bg-surface focus:outline-none focus:ring-2 transition-all border-stroke focus:ring-blue-500/10 focus:border-blue-500"
                style={errors.password ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' } : {}} />
              {errors.password && <p className="font-medium mt-1.5" style={{ fontSize: '14px', color: '#dc2626' }}>! {errors.password}</p>}
            </div>

            <div className="flex items-center justify-between mb-7">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" className="w-[1.125rem] h-[1.125rem] rounded border-stroke accent-blue-900" />
                <span className="text-sm text-ink-secondary">Remember me</span>
              </label>
              <span className="text-sm text-blue-500 cursor-pointer hover:text-blue-700 transition-colors">Forgot password?</span>
            </div>

            <button type="submit" className="w-full h-12 rounded-xl bg-blue-900 text-white text-base font-semibold cursor-pointer hover:bg-blue-700 transition-colors mb-6">
              Log In
            </button>
          </form>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-stroke" />
            <span className="text-sm text-ink-faint">or sign in with</span>
            <div className="flex-1 h-px bg-stroke" />
          </div>

          <div className="flex gap-3 mb-6">
            <button className="flex-1 h-12 rounded-xl border border-stroke flex items-center justify-center gap-2.5 hover:bg-surface-raised transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded-md border border-stroke flex items-center justify-center text-[0.625rem] text-ink-faint font-medium">G</span>
              <span className="text-sm text-ink-secondary">Google</span>
            </button>
            <button className="flex-1 h-12 rounded-xl border border-stroke flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer">
              <span className="text-sm text-ink-secondary">Hospital SSO</span>
            </button>
          </div>

          <p className="text-center text-sm text-ink-faint">Don't have an account? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
