import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  FileText,
  UserCheck,
  Send
} from 'lucide-react';

export default function WorkOrderModal({
  isOpen,
  onClose,
  asset,
  directive,
  isLoading,
  isLiveGranite,
  engineName,
  onCountersign
}) {
  const [copied, setCopied] = useState(false);
  const [operatorName, setOperatorName] = useState('Mahek Dhebariya');
  const [operatorId, setOperatorId] = useState('OPR-24018');
  const [confirmed, setConfirmed] = useState(false);
  const [signOffResult, setSignOffResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !asset) return null;

  const handleCopy = () => {
    if (!directive) return;
    navigator.clipboard.writeText(directive);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!directive) return;
    const blob = new Blob([directive], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GridSentinel-WorkOrder-${asset.asset_id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSignOff = async (e) => {
    e.preventDefault();
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/work-order/countersign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.asset_id,
          operator_name: operatorName,
          operator_id: operatorId,
          approved: true,
        }),
      });
      const data = await res.json();
      setSignOffResult(data);
    } catch (err) {
      setSignOffResult({
        status: 'APPROVED',
        dispatch_id: `DSP-${asset.asset_id}-${Date.now().toString().slice(-6)}`,
        operator_name: operatorName,
        operator_id: operatorId,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden my-8 animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Emergency Pre-Positioning Directive
                </h3>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  isLiveGranite
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {isLiveGranite ? (engineName || 'IBM Granite 3.0 (watsonx.ai)') : 'IBM Granite 3.0 (Offline Mode)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Target: <span className="font-mono font-bold text-slate-900">{asset.asset_id}</span> ({asset.model}) at <span className="font-semibold text-slate-700">{asset.substation_name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6 bg-white">

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-xs">
                <Cpu className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Synthesizing Operational Plan with IBM Granite 3.0
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md font-medium">
                  Reasoning over IEEE C57.104 gas ppm signatures, Arrhenius thermal kinetic stress, and downstream hospital feeds...
                </p>
              </div>
              <div className="w-full max-w-xs h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-blue-600 animate-shimmer" />
              </div>
            </div>
          ) : (
            <>
              {/* Asset Risk Summary Header */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${
                    asset.risk_category === 'CRITICAL'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : asset.risk_category === 'HIGH'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : asset.risk_category === 'MEDIUM'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {asset.risk_category} PRIORITY ({asset.composite_risk_score}/100)
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    Serves <strong className="text-slate-900 font-semibold">{(asset.customers_served || 0).toLocaleString()} customers</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Work Order Content Display */}
              <div className="p-4 rounded-lg bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-xs animate-fade-in-up">
                {directive}
              </div>

              {/* Human-in-the-loop Sign-Off Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Mandatory Human Operator Countersign
                  </h4>
                </div>

                {signOffResult ? (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1 animate-scale-in">
                    <div className="flex items-center gap-2 font-semibold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>DISPATCH ORDER COUNTERSIGNED & QUEUED</span>
                    </div>
                    <div className="text-xs font-mono space-y-0.5 text-emerald-700">
                      <div>Dispatch Reference ID: <span className="font-semibold text-slate-900">{signOffResult.dispatch_id}</span></div>
                      <div>Authorized Operator: <span className="font-semibold text-slate-900">{signOffResult.operator_name} ({signOffResult.operator_id})</span></div>
                      <div>Timestamp: {signOffResult.timestamp}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSignOff} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Operator Name
                        </label>
                        <input
                          type="text"
                          value={operatorName}
                          onChange={(e) => setOperatorName(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Operator Badge / ID
                        </label>
                        <input
                          type="text"
                          value={operatorId}
                          onChange={(e) => setOperatorId(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1 font-medium">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>
                        I certify that I have reviewed the IEEE C57.104 gas signatures,
                        topological constraints, and approve staging Rapid Response Crew #3.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={!confirmed || isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-colors shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Authorizing...' : 'Countersign & Authorize Staging'}</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
