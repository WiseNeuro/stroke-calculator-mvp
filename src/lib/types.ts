export interface StrokeInputs {
  strokeType: 'known' | 'wakeup';
  lkw: Date;
  bedtime?: Date;
  wake?: Date;
  recognition?: Date;
  now: Date;
  nihss?: number;
  disablingDeficit: 'Yes' | 'No';
  ncctAvailableNow: boolean;
  ctaAvailableNow: boolean;
  ctaEta: number;
  ctpAvailableNow: boolean;
  ctpEta: number;
  mriAvailableNow: boolean;
  mriEta: number;
  didoMin: number;
  transportMin: number;
  receivingDtnMin: number;
  occlusionLoc: string;
  aspects?: number;
  pcAspects?: number;
  age?: number;
  prestrokeMrs?: number;
  massEffect: 'Yes' | 'No' | 'Unknown';
  mriMismatch: 'Yes' | 'No' | 'Unknown';
  perfusionPenumbra: 'Yes' | 'No' | 'Unknown';
  highRiskFlags: string[];
  spokeMode: boolean;
}

export interface RuleResults {
  times: {
    timeFromLKWHours: number;
    timeFromRecognitionHours: number;
    timeFromMidpointHours?: number;
    midpointOfSleep?: Date;
    projectedNeedleTimeAtReceiving: Date;
  };
  ivt: { status: string; rationale: string; cor: string; mathStr: string };
  evt: { status: string; rationale: string; cor: string };
  transfer: { status: string; rationale: string };
  docs: { edSummary: string; transferSummary: string };
}