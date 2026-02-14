import { StrokeInputs, RuleResults } from './types';

export function evaluateStrokeRules(inputs: StrokeInputs): RuleResults {
  const msToHours = (ms: number) => ms / 3600000;

  // 1. TIMING MATH
  const timeFromLKWHours = msToHours(inputs.now.getTime() - inputs.lkw.getTime());
  let timeFromRecognitionHours = timeFromLKWHours;
  let timeFromMidpointHours: number | undefined;
  let midpointOfSleep: Date | undefined;

  if (inputs.strokeType === 'wakeup') {
    const recTime = inputs.recognition || inputs.wake || inputs.now;
    timeFromRecognitionHours = msToHours(inputs.now.getTime() - recTime.getTime());
    if (inputs.bedtime && inputs.wake) {
      const sleepDurationMs = inputs.wake.getTime() - inputs.bedtime.getTime();
      midpointOfSleep = new Date(inputs.bedtime.getTime() + sleepDurationMs / 2);
      timeFromMidpointHours = msToHours(inputs.now.getTime() - midpointOfSleep.getTime());
    }
  }

  const projectedNeedleTimeAtReceiving = new Date(
    inputs.now.getTime() + (inputs.didoMin + inputs.transportMin + inputs.receivingDtnMin) * 60000
  );

  // --- 2. IV THROMBOLYSIS PATHWAYS ---
  let ivtStatus = 'NOT ELIGIBLE';
  let ivtRationale = 'Outside actionable windows.';
  let ivtCor = '';
  let latestActionableNeedleTimeMs = -1;

  if (inputs.strokeType === 'known' && timeFromLKWHours <= 4.5) {
    ivtStatus = 'ELIGIBLE';
    ivtRationale = 'Standard window. Avoid delaying treatment for additional multimodal imaging.';
    ivtCor = 'COR 1 (Recommended)';
    latestActionableNeedleTimeMs = inputs.lkw.getTime() + 4.5 * 3600000;
  } else if (inputs.strokeType === 'wakeup' && timeFromRecognitionHours <= 4.5) {
    const recTimeMs = (inputs.recognition || inputs.wake || inputs.now).getTime();
    if (inputs.mriMismatch === 'Yes') {
      ivtStatus = 'ELIGIBLE (MRI mismatch)';
      ivtRationale = 'DWI lesion < 1/3 MCA and no marked FLAIR change.';
      ivtCor = 'COR 2a (Can be beneficial)';
      latestActionableNeedleTimeMs = recTimeMs + 4.5 * 3600000;
    } else if (inputs.mriMismatch === 'Unknown') {
      ivtStatus = 'NEEDS IMAGING';
      ivtRationale = 'MRI mismatch evaluation required for unknown onset.';
      latestActionableNeedleTimeMs = recTimeMs + 4.5 * 3600000;
    }
  }

  if (ivtStatus === 'NOT ELIGIBLE' || ivtStatus === 'NEEDS IMAGING') {
    const isPerfusionWakeup = inputs.strokeType === 'wakeup' && timeFromMidpointHours !== undefined && timeFromMidpointHours <= 9;
    const isPerfusionKnown = inputs.strokeType === 'known' && timeFromLKWHours > 4.5 && timeFromLKWHours <= 9;
    if (isPerfusionWakeup || isPerfusionKnown) {
      if (inputs.perfusionPenumbra === 'Yes') {
        ivtStatus = 'ELIGIBLE (Perfusion-selected)';
        ivtRationale = 'Salvageable penumbra identified on automated perfusion.';
        ivtCor = 'COR 2a (May be reasonable)';
        latestActionableNeedleTimeMs = (inputs.strokeType === 'wakeup' ? midpointOfSleep!.getTime() : inputs.lkw.getTime()) + 9 * 3600000;
      } else if (inputs.perfusionPenumbra === 'Unknown') {
        ivtStatus = 'NEEDS IMAGING';
        ivtRationale = 'Automated CT Perfusion required for extended window.';
        latestActionableNeedleTimeMs = (inputs.strokeType === 'wakeup' ? midpointOfSleep!.getTime() : inputs.lkw.getTime()) + 9 * 3600000;
      }
    }
  }

  // --- 3. THROMBECTOMY (EVT) ELIGIBILITY ---
  let evtStatus = 'NOT ELIGIBLE';
  let evtRationale = 'Does not meet 2025 EVT pathway criteria.';
  let evtCor = 'COR 3';
  const isLVO = ['ICA', 'M1'].includes(inputs.occlusionLoc);
  const evtTimeClock = inputs.strokeType === 'wakeup' && timeFromMidpointHours ? timeFromMidpointHours : timeFromLKWHours;
  const nihss = inputs.nihss || 0;
  const mrs = inputs.prestrokeMrs || 0;
  const age = inputs.age || 0;
  const aspects = inputs.aspects ?? 10;

  if (inputs.occlusionLoc === 'Unknown/Not done') {
    evtStatus = 'NEEDS CTA/ASPECTS'; evtRationale = 'Vascular imaging required.'; evtCor = '';
  } else if (isLVO && evtTimeClock <= 6 && nihss >= 6 && mrs <= 1 && aspects >= 3) {
    evtStatus = 'ELIGIBLE'; evtRationale = 'ICA/M1 <=6h, NIHSS>=6, mRS 0-1, ASPECTS 3-10'; evtCor = 'COR 1';
  } else if (isLVO && evtTimeClock > 6 && evtTimeClock <= 24 && age < 80 && nihss >= 6 && mrs <= 1 && aspects >= 3 && aspects <= 5 && inputs.massEffect !== 'Yes') {
    evtStatus = 'ELIGIBLE'; evtRationale = 'Expanded: ICA/M1 6-24h, Age <80, ASPECTS 3-5, no mass effect'; evtCor = 'COR 1';
  } else if (isLVO && evtTimeClock <= 6 && age < 80 && nihss >= 6 && mrs <= 1 && aspects <= 2 && inputs.massEffect !== 'Yes') {
    evtStatus = 'ELIGIBLE'; evtRationale = 'Selected: ICA/M1 <=6h, Age <80, ASPECTS 0-2, no mass effect'; evtCor = 'COR 2a';
  } else if (isLVO && evtTimeClock <= 6 && nihss >= 6 && aspects >= 6 && mrs === 2) {
    evtStatus = 'ELIGIBLE'; evtRationale = 'Selected: ICA/M1 <=6h, mRS 2'; evtCor = 'COR 2a';
  } else if (inputs.occlusionLoc === 'Basilar' && evtTimeClock <= 24 && mrs <= 1 && nihss >= 10 && (inputs.pcAspects ?? 10) >= 6) {
    evtStatus = 'ELIGIBLE'; evtRationale = 'Basilar <=24h, PC-ASPECTS >=6'; evtCor = 'COR 1';
  } else if (['Proximal M2 (nondominant/codominant)', 'distal MCA', 'ACA', 'PCA'].includes(inputs.occlusionLoc)) {
    evtStatus = 'NOT ELIGIBLE'; evtRationale = 'Routine EVT not recommended for this location.'; evtCor = 'COR 3: No Benefit';
  } else if (inputs.occlusionLoc === 'Proximal M2 (dominant)') {
    evtStatus = 'CONSIDER-BENEFIT UNCERTAIN'; evtRationale = 'Dominant proximal M2 requires specialist discussion.'; evtCor = '';
  }

  // --- 4. TRANSFER LOGIC ---
  let transferStatus = 'BORDERLINE-CONSULT';
  let transferRationale = 'Review clinically with local protocols and specialist.';

  if (evtStatus === 'ELIGIBLE' || evtStatus === 'CONSIDER-BENEFIT UNCERTAIN') {
    transferStatus = 'TRANSFER NOW FOR EVT-CAPABLE CENTER';
    transferRationale = 'EVT eligibility overrides IVT transport limitations.';
  } else if (inputs.spokeMode && evtStatus === 'NEEDS CTA/ASPECTS') {
    if (!inputs.ctaAvailableNow && inputs.ctaEta <= 30) {
      transferStatus = 'CTA ASAP';
      transferRationale = 'CTA ASAP for LVO triage; transfer decisions depend on LVO.';
    } else if (!inputs.ctaAvailableNow && (inputs.disablingDeficit === 'Yes' || nihss >= 6)) {
      transferStatus = 'BORDERLINE-CONSULT';
      transferRationale = 'Consider transfer for vascular imaging/EVT evaluation given deficits/suspicion.';
    }
  } else if (ivtStatus === 'NEEDS IMAGING' && latestActionableNeedleTimeMs > 0) {
    if (projectedNeedleTimeAtReceiving.getTime() <= latestActionableNeedleTimeMs) {
      transferStatus = 'TRANSFER (IMAGING-SELECTED IVT MAY BE ACTIONABLE)';
      transferRationale = 'Projected arrival and needle time falls within extended advanced imaging window.';
    } else {
      transferStatus = 'DO NOT TRANSFER FOR IVT-ONLY';
      transferRationale = 'NOT ACTIONABLE GIVEN TIME BUDGET. Projected needle time exceeds actionable IVT window.';
    }
  }

  // --- 5. DOCUMENTATION STRINGS ---
  const flags = inputs.highRiskFlags.length > 0 ? `\nHigh-risk flags present: ${inputs.highRiskFlags.join(', ')} (specialist review recommended)` : '';
  const edSummary = `ED Decision Support Summary\nLKW: ${inputs.lkw.toLocaleTimeString()} | Time from LKW: ${timeFromLKWHours.toFixed(1)}h\nIVT: ${ivtStatus} - ${ivtRationale} ${ivtCor}\nEVT: ${evtStatus} - ${evtRationale} ${evtCor}\n*If neuro status worsens or LVO suspected, escalate/transfer per protocol.`;
  const transferSummary = `Transfer Rationale Summary\nRec: ${transferStatus}\nRationale: ${transferRationale}\nProjected Needle Time: ${projectedNeedleTimeAtReceiving.toLocaleTimeString()}${flags}`;

  return {
    times: { timeFromLKWHours, timeFromRecognitionHours, timeFromMidpointHours, midpointOfSleep, projectedNeedleTimeAtReceiving },
    ivt: { status: ivtStatus, rationale: ivtRationale, cor: ivtCor, mathStr: `LKW > ${timeFromLKWHours.toFixed(2)}h | Recog > ${timeFromRecognitionHours.toFixed(2)}h${timeFromMidpointHours ? ` | Midpoint > ${timeFromMidpointHours.toFixed(2)}h` : ''}` },
    evt: { status: evtStatus, rationale: evtRationale, cor: evtCor },
    transfer: { status: transferStatus, rationale: transferRationale },
    docs: { edSummary, transferSummary }
  };
}