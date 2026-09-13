import React, { useState } from 'react';
import GridAnimation from '../components/GridAnimation';
import { 
  Zap, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function SignupPage({ onSignup, onNavigateToLogin }) {
  const [fullName, setFullName] = useState('Elena Vance');
  const [email, setEmail] = useState('dispatcher@gridsentinel.ai');
  const [org, setOrg] = useState('Metro Power Authority');
  const [role, setRole] = useState('Senior Reliability Dispatcher');
  const [password, setPassword] = useState('Sentinel2026!');
  const [confirmPassword, setConfirmPassword] = useState('Sentinel2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-blue-600', 'bg-emerald-600'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the operational safeguarding terms.');
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const initials = fullName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'EV';

      onSignup({
        name: fullName,
        email: email,
        role: role,
        org: org,
        avatar: initials
      });
    }, 450);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 font-sans">
      
      {/* Left Panel: Subtle Electrical Grid Visualization */}
      <div className="lg:w-1/2 relative min-h-[320px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-14 overflow-hidden bg-[#070c18]">
        <div className="absolute inset-0 z-0">
          <GridAnimation />
        </div>

        {/* Top Branding */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">GridSentinel</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                AI
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
              OPERATOR ONBOARDING: <strong className="text-emerald-400 font-bold">ACTIVE</strong>
            </span>
            <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
              SECURITY PROTOCOL: <strong className="text-blue-400 font-bold">SCADA SSL</strong>
            </span>
          </div>
        </div>

        {/* Center Product Statement */}
        <div className="relative z-10 max-w-md my-auto py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
            Equip your dispatch center with predictive intelligence.
          </h1>
          <p className="text-sm text-slate-300 mt-2.5 font-normal leading-relaxed">
            Gain immediate access to continuous IEEE dissolved gas analysis, meteorological storm compounding, and automated crew pre-positioning directives.
          </p>
        </div>

        {/* Bottom Technical Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>SCADA Access Gateway • Port 8000</span>
          </div>
          <span className="text-slate-400">Team Mantra • AI Track</span>
        </div>
      </div>

      {/* Right Panel: Clean Registration Card */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#f8fafc]">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-5">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-slate-900">GridSentinel AI</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Create operator profile
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Join the IEEE C57.104 automated grid monitoring fleet.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Grid Utility / Org
                </label>
                <input
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer font-medium"
                >
                  <option value="Senior Reliability Dispatcher">Reliability Dispatcher</option>
                  <option value="Transmission Operations Engineer">Transmission Engineer</option>
                  <option value="Substation Asset Specialist">Substation Specialist</option>
                  <option value="DGA Chemical Analyst">DGA Analyst</option>
                </select>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Password Strength */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Security Rating:</span>
                <span className="font-bold text-slate-700">{strengthLabels[strength]}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-full rounded-full transition-all ${
                      i <= strength ? strengthColors[strength] : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 pt-1 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>I confirm adherence to IEEE C57.104 protocols and SCADA dispatch authorizations.</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-1">
            <span>Already have an authorized profile? </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              Sign In
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
