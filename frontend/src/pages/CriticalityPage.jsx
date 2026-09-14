import React, { useState } from 'react';
import CriticalityPanel from '../components/CriticalityPanel';
import {
  Network,
  Building2,
  HeartPulse,
  Train,
  Droplets,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';

const DEFAULT_SUBSTATIONS = [
  {
    substation_id: 'SUB-METRO-09',
    name: 'Metro Central Transit Substation',
    customers_served: 85000,
    hospital_connected: true,
    water_plant_connected: true,
    transit_connected: true,
    computed_criticality: 100,
  },
  {
    substation_id: 'SUB-NORTH-01',
    name: 'North Regional Healthcare Hub',
    customers_served: 45000,
    hospital_connected: true,
    water_plant_connected: false,
    transit_connected: false,
    computed_criticality: 45,
  },
  {
    substation_id: 'SUB-WEST-02',
    name: 'Harbor Industrial Step-Down',
    customers_served: 38000,
    hospital_connected: false,
    water_plant_connected: true,
    transit_connected: false,
    computed_criticality: 30,
  },
  {
    substation_id: 'SUB-EAST-04',
    name: 'Pine Crest Residential Feeder',
    customers_served: 22000,
    hospital_connected: false,
    water_plant_connected: false,
    transit_connected: false,
    computed_criticality: 10,
  },
];

export default function CriticalityPage({ substations = [] }) {
  const displaySubs = substations.length > 0 ? substations : DEFAULT_SUBSTATIONS;
  const [selectedSub, setSelectedSub] = useState(displaySubs[0]);

  // Dynamic calculations from existing data
  const totalCustomers = displaySubs.reduce((acc, s) => acc + (s.customers_served || 0), 0);
  const totalSubs = displaySubs.length;
  const highCriticalityCount = displaySubs.filter(s => (s.computed_criticality ?? s.criticality_score ?? 0) >= 40).length;
  const hospitalFeeds = displaySubs.filter(s => s.hospital_connected).length;
  const transitFeeds = displaySubs.filter(s => s.transit_connected).length;
  const waterFeeds = displaySubs.filter(s => s.water_plant_connected).length;

  const currentSub = selectedSub || displaySubs[0];
  const currentScore = currentSub?.computed_criticality ?? currentSub?.criticality_score ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* 1. Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Grid Criticality & Infrastructure Impact</span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Topological Consequence
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
              Quantifying downstream life-safety, public transit, and municipal infrastructure consequence to prioritize emergency equipment dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-xs">
              {totalCustomers.toLocaleString()} Citizens Protected
            </span>
            <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md border shadow-xs ${
              highCriticalityCount > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {highCriticalityCount} High-Consequence Nodes
            </span>
          </div>
        </div>
      </div>

      {/* 2. Criticality Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Monitored Nodes</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{totalSubs} <span className="text-xs font-sans text-slate-400 font-normal">stations</span></div>
          <div className="text-[11px] text-slate-500 truncate">345kV & 138kV Transmission Topology</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Connected Population</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{totalCustomers.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 truncate">Total downstream consumers served</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Hospital Feeds</span>
            <div className="p-1.5 rounded-md bg-red-50 text-red-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{hospitalFeeds} <span className="text-xs font-sans text-slate-400 font-normal">centers</span></div>
          <div className="text-[11px] text-red-700 font-semibold truncate">Priority 1 emergency healthcare</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase">Transit & Water</span>
            <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
              <Train className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900">{transitFeeds + waterFeeds} <span className="text-xs font-sans text-slate-400 font-normal">facilities</span></div>
          <div className="text-[11px] text-slate-500 truncate">{transitFeeds} Rail Lines • {waterFeeds} Water Treatment</div>
        </div>
      </div>

      {/* 3. Critical Infrastructure Priority Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-red-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-700 uppercase tracking-wider">
              Priority 1 Infrastructure
            </span>
            <div className="p-1.5 rounded-md bg-red-50 text-red-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900">Regional Trauma Hospitals</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Emergency surgery suites, neonatal ICU, and life-support wards fed by Substation METRO-09 and NORTH-01 (+35 pts criticality weight).
          </p>
        </div>

        <div className="p-5 rounded-xl border border-purple-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-700 uppercase tracking-wider">
              Priority 2 Infrastructure
            </span>
            <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
              <Train className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900">Electrified Rail Transit</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Metropolitan commuter subway and passenger rail line feeds carrying 85,000 riders/day (+25 pts criticality weight).
          </p>
        </div>

        <div className="p-5 rounded-xl border border-cyan-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-700 uppercase tracking-wider">
              Priority 3 Infrastructure
            </span>
            <div className="p-1.5 rounded-md bg-cyan-50 text-cyan-600">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900">Municipal Water Treatment</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Potable water filtration, pressurized distribution pumps, and emergency firefighting reservoir feeds (+20 pts criticality weight).
          </p>
        </div>
      </div>

      {/* 4. Main Substation Grid List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Substation Criticality Ranking List */}
        <div className="lg:col-span-2">
          <CriticalityPanel
            substations={substations}
            selectedSubstationId={currentSub?.substation_id}
            onSelectSubstation={setSelectedSub}
          />
        </div>

        {/* Right 1 Column: Why is this Substation Critical? + Scoring Engine */}
        <div className="space-y-4">

          {/* Substation Evidence Inspector */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Substation Inspection</span>
                <h3 className="text-sm font-bold text-slate-900">{currentSub?.name}</h3>
                <span className="text-xs font-mono text-blue-600 font-semibold">{currentSub?.substation_id}</span>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                currentScore >= 80
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : currentScore >= 40
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Score: {currentScore}/100
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Factor Evidence Breakdown</div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <HeartPulse className={`w-3.5 h-3.5 ${currentSub?.hospital_connected ? 'text-red-600' : 'text-slate-300'}`} />
                  <span className={currentSub?.hospital_connected ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                    Trauma Hospital Center
                  </span>
                </div>
                <span className={`font-mono font-bold ${currentSub?.hospital_connected ? 'text-red-700' : 'text-slate-400'}`}>
                  {currentSub?.hospital_connected ? '+35 pts' : '0 pts'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Train className={`w-3.5 h-3.5 ${currentSub?.transit_connected ? 'text-purple-600' : 'text-slate-300'}`} />
                  <span className={currentSub?.transit_connected ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                    Electrified Rail Transit
                  </span>
                </div>
                <span className={`font-mono font-bold ${currentSub?.transit_connected ? 'text-purple-700' : 'text-slate-400'}`}>
                  {currentSub?.transit_connected ? '+25 pts' : '0 pts'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Droplets className={`w-3.5 h-3.5 ${currentSub?.water_plant_connected ? 'text-cyan-600' : 'text-slate-300'}`} />
                  <span className={currentSub?.water_plant_connected ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                    Municipal Water Treatment
                  </span>
                </div>
                <span className={`font-mono font-bold ${currentSub?.water_plant_connected ? 'text-cyan-700' : 'text-slate-400'}`}>
                  {currentSub?.water_plant_connected ? '+20 pts' : '0 pts'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    Population Feeder
                  </span>
                </div>
                <span className="font-mono font-bold text-blue-700">
                  {(currentSub?.customers_served || 0) > 50000
                    ? '+20 pts (Tier 1)'
                    : (currentSub?.customers_served || 0) > 20000
                    ? '+10 pts (Tier 2)'
                    : '0 pts (Tier 3)'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
              Serves <strong className="text-slate-900">{(currentSub?.customers_served || 0).toLocaleString()} customers</strong> ({((currentSub?.customers_served || 0) / totalCustomers * 100).toFixed(1)}% of total monitored grid population).
            </div>
          </div>

          {/* Scoring Formulation Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-600" />
              <span>Criticality Scoring Model</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Substation criticality is deterministically calculated in <code className="text-blue-700 font-mono font-semibold">src/criticality_engine.py</code>:
            </p>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Hospital Connection</span>
                <span className="text-emerald-700 font-bold">+35 pts</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Transit / Rail Network</span>
                <span className="text-emerald-700 font-bold">+25 pts</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Water Plant Feed</span>
                <span className="text-emerald-700 font-bold">+20 pts</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Population &gt; 50,000</span>
                <span className="text-emerald-700 font-bold">+20 pts</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 font-normal">
              Total score is clamped between 0 and 100 and weighted at 20% in the final composite risk score.
            </div>
          </div>

        </div>
      </div>

      {/* 5. Downstream Population Distribution & Consequence Visualization */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Downstream Customer Impact & Consequence Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Comparative customer volume and infrastructure criticality across all regional nodes
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
            {totalCustomers.toLocaleString()} Total Citizens Served
          </span>
        </div>

        <div className="space-y-3">
          {displaySubs.map((sub) => {
            const score = sub.computed_criticality ?? sub.criticality_score ?? 0;
            const pct = totalCustomers > 0 ? ((sub.customers_served || 0) / totalCustomers) * 100 : 0;
            const isCrit = score >= 80;
            const isHigh = score >= 40;

            return (
              <div key={sub.substation_id} className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{sub.substation_id}</span>
                    <span className="text-slate-700 font-medium">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-600">{(sub.customers_served || 0).toLocaleString()} customers ({pct.toFixed(1)}%)</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded border ${
                      isCrit ? 'bg-red-50 text-red-700 border-red-200' :
                      isHigh ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      Crit: {score}/100
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCrit ? 'bg-red-600' : isHigh ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Relationship to Composite Operational Risk Box */}
      <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-blue-700 uppercase">
            Composite Operational Risk Architecture
          </span>
          <span className="text-xs font-mono font-semibold text-slate-600">
            src/risk_engine.py Formulation
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white font-mono text-xs font-bold text-slate-900 border border-blue-200 shadow-xs overflow-x-auto">
          COMPOSITE RISK = (0.60 × PHYSICAL HEALTH) + (0.20 × NORMALIZED WEATHER RISK) + (0.20 × GRID CRITICALITY)
        </div>
        <p className="text-xs text-slate-600">
          Grid Criticality provides the final 20% weighting, ensuring that an arcing or thermally stressed transformer feeding vital societal infrastructure (such as TX-401 feeding Trauma Hospital & Metro Rail) automatically ascends to top priority dispatch.
        </p>
      </div>

    </div>
  );
}
