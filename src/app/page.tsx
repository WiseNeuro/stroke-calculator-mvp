"use client";
import React, { useState } from 'react';
import { evaluateStrokeRules } from '../lib/rulesEngine';
import type { StrokeInputs, RuleResults } from '../lib/types';

export default function StrokeEligibleApp() {
  const [step, setStep] = useState(1);
  const [showLogic, setShowLogic] = useState(false);
  const [inputs, setInputs] = useState<Partial<StrokeInputs>>({
    now: new Date(), strokeType: 'known', disablingDeficit: 'Yes',
    ncctAvailableNow: true, ctaAvailableNow: true, ctaEta: 0,
    ctpAvailableNow: false, ctpEta: 0, mriAvailableNow: false, mriEta: 0,
    didoMin: 120, transportMin: 20, receivingDtnMin: 45, spokeMode: true,
    occlusionLoc: 'Unknown/Not done', massEffect: 'Unknown',
    mriMismatch: 'Unknown', perfusionPenumbra: 'Unknown', highRiskFlags: []
  });
  const [results, setResults] = useState<RuleResults | null>(null);

  const calculate = () => {
    setResults(evaluateStrokeRules({ ...inputs, now: new Date() } as StrokeInputs));
    setStep(4);
  };

  const badgeColor = (status: string) => {
    if (status.includes('ELIGIBLE') && !status.includes('NOT')) return 'bg-green-100 text-green-900 border-green-500';
    if (status.includes('NOT') || status.includes('DO NOT')) return 'bg-red-100 text-red-900 border-red-500';
    return 'bg-amber-100 text-amber-900 border-amber-500';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 text-sm font-bold text-red-800 rounded shadow-sm">
          ! Decision support only. Final decisions require clinician judgment, specialist consultation, and local policy. NO PHI.
        </div>

        <div className="bg-white rounded-xl shadow border p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold">Stroke Eligible?</h1>
            <button className="text-sm bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded font-semibold" onClick={() => alert('Instruction Modal: Open Telestroke App or Dial 555-0199')}>Call Specialist</button>
          </div>

          {step < 4 && (
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(s => <div key={s} className={`h-2 flex-1 rounded ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`} />)}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-semibold">Step 1: Time + Presentation</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium">Stroke Type
                  <select className="w-full p-2 border rounded mt-1 bg-slate-50" onChange={(e) => setInputs({ ...inputs, strokeType: e.target.value as any })}>
                    <option value="known">Known Onset / LKW</option>
                    <option value="wakeup">Unknown / Wake-up</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">Last Known Well (LKW)
                  <input type="datetime-local" className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, lkw: new Date(e.target.value) })} />
                </label>
              </div>

              {inputs.strokeType === 'wakeup' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded border">
                  <label className="block text-sm font-medium">Bedtime <input type="datetime-local" className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, bedtime: new Date(e.target.value) })} /></label>
                  <label className="block text-sm font-medium">Wake / Recognition <input type="datetime-local" className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, wake: new Date(e.target.value), recognition: new Date(e.target.value) })} /></label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium">NIHSS (Optional)<input type="number" className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, nihss: Number(e.target.value) })} /></label>
                <label className="block text-sm font-medium">Disabling Deficit?
                  <select className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, disablingDeficit: e.target.value as any })}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </label>
              </div>

              <button onClick={() => setStep(2)} disabled={!inputs.lkw} className="w-full bg-slate-900 text-white p-3 rounded font-bold mt-4 disabled:opacity-50">Next: Imaging</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Step 2: Imaging Capability (Local)</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" defaultChecked onChange={e => setInputs({ ...inputs, ncctAvailableNow: e.target.checked })} className="w-5 h-5" /> NCCT Available Now</label>
                <label className="flex items-center gap-2"><input type="checkbox" defaultChecked onChange={e => setInputs({ ...inputs, ctaAvailableNow: e.target.checked })} className="w-5 h-5" /> CTA Available Now</label>
                <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setInputs({ ...inputs, ctpAvailableNow: e.target.checked })} className="w-5 h-5" /> CT Perfusion Available</label>
                <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setInputs({ ...inputs, mriAvailableNow: e.target.checked })} className="w-5 h-5" /> MRI DWI Available</label>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => setStep(1)} className="w-1/3 bg-slate-200 p-3 rounded font-bold">Back</button>
                <button onClick={() => setStep(3)} className="w-2/3 bg-slate-900 text-white p-3 rounded font-bold">Next: Transfer & EVT</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Step 3: Transfer Time Budget + EVT Data</h2>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded border">
                <label className="block text-xs font-medium">DIDO (min)<input type="number" defaultValue={120} className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, didoMin: Number(e.target.value) })} /></label>
                <label className="block text-xs font-medium">Transport (min)<input type="number" defaultValue={20} className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, transportMin: Number(e.target.value) })} /></label>
                <label className="block text-xs font-medium">Receiving DTN (min)<input type="number" defaultValue={45} className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, receivingDtnMin: Number(e.target.value) })} /></label>
              </div>

              <label className="block text-sm font-medium">Occlusion Location
                <select className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, occlusionLoc: e.target.value })}>
                  <option>Unknown/Not done</option><option>ICA</option><option>M1</option><option>Basilar</option><option>Proximal M2 (dominant)</option><option>distal MCA</option>
                </select>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <label className="block text-sm font-medium">ASPECTS (0-10)<input type="number" className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, aspects: Number(e.target.value) })} /></label>
                <label className="block text-sm font-medium">Age<input type="number" className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, age: Number(e.target.value) })} /></label>
                <label className="block text-sm font-medium">Prestroke mRS<input type="number" className="w-full p-2 border rounded mt-1" onChange={(e) => setInputs({ ...inputs, prestrokeMrs: Number(e.target.value) })} /></label>
              </div>

              <div className="border-t pt-4">
                <p className="font-bold text-sm text-red-800 mb-2">High Risk Flags (specialist review prompt)</p>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={(e) => setInputs({ ...inputs, highRiskFlags: e.target.checked ? ['Anticoagulant'] : [] })} /> Anticoagulant Use</label>
              </div>

              <div className="flex gap-2 pt-4">
                <button onClick={() => setStep(2)} className="w-1/3 bg-slate-200 p-3 rounded font-bold">Back</button>
                <button onClick={calculate} className="w-2/3 bg-blue-600 text-white p-3 rounded font-bold">Calculate Results</button>
              </div>
            </div>
          )}

          {step === 4 && results && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${badgeColor(results.ivt.status)}`}>
                <h3 className="font-bold text-lg">1) IV THROMBOLYSIS: {results.ivt.status}</h3>
                <p className="text-sm mt-1">{results.ivt.rationale} <span className="font-semibold text-slate-700">({results.ivt.cor})</span></p>
                {results.ivt.status.includes('ELIGIBLE') && <p className="text-xs font-bold mt-2 text-blue-900 border-t pt-2 border-blue-200">Tenecteplase 0.25 mg/kg (max 25mg) OR Alteplase 0.9 mg/kg. Avoid TNK 0.4 mg/kg.</p>}
              </div>

              <div className={`p-4 rounded-lg border-2 ${badgeColor(results.evt.status)}`}>
                <h3 className="font-bold text-lg">2) THROMBECTOMY: {results.evt.status}</h3>
                <p className="text-sm mt-1">{results.evt.rationale} <span className="font-semibold text-slate-700">({results.evt.cor})</span></p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${badgeColor(results.transfer.status)}`}>
                <h3 className="font-bold text-lg">3) TRANSFER: {results.transfer.status}</h3>
                <p className="text-sm mt-1">{results.transfer.rationale}</p>
              </div>

              <div className="bg-slate-100 p-2 text-xs text-center rounded flex justify-between font-mono">
                <span>LKW: {inputs.lkw?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>Projected Needle: {results.times.projectedNeedleTimeAtReceiving.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button onClick={() => { navigator.clipboard.writeText(results.docs.edSummary + '\n\n' + results.docs.transferSummary); alert("Copied to clipboard!"); }} className="bg-slate-900 text-white p-3 rounded font-bold text-sm">Copy Documentation</button>
                <button onClick={() => setStep(1)} className="border-2 border-slate-300 p-3 rounded font-bold text-sm">Recalculate</button>
                <button onClick={() => setShowLogic(!showLogic)} className="col-span-2 text-xs text-slate-500 underline mt-2">View Logic Math</button>
              </div>

              {showLogic && (
                <pre className="text-xs bg-slate-800 text-green-400 p-3 rounded overflow-auto mt-2">
                  {results.ivt.mathStr}
                </pre>
              )}
              <p className="text-xs text-center text-slate-400 mt-4">Guideline: AHA/ASA 2025 (Published 2026)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}