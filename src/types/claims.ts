export interface ClaimData {
  clmId: string;
  aaInd: string;
  priority: string;
  score: number;
  acctNum: string;
  billTyCd: string;
  clmBeginDt: string;
  clmEndDt: string;
  clmTyCd: string;
  formTyCd: string;
  paperEdiCd: string;
  rcvdTs: string;
  billProv_city: string;
  billProv_dervCpfTyCd2: string;
  billProv_stCd: string;
  billProv_nm: string;
  clmAmt_totChrgAmt: number;
  clmAmtRange: string;
  patDemo_patAge: number;
  patDemo_patGndr: string;
}

export interface LineData {
  clmId: string;
  chrgAmt: number;
  lineNum: number;
  seqNum: number;
  coinsAmt: number;
  allowAmt: number;
  copayAmt: number;
  beginDt: string;
  endDt: string;
  revCd: string;
  procCd: string;
  diagCd: string;
  catCd: string;
  qty: number;
}

export interface FilterState {
  aaInd: string[];
  clmTyCd: string[];
  formTyCd: string[];
  searchClaimId: string;
}

export type RiskLevel = 'High' | 'Medium' | 'Low';

export function getRiskLevel(score: number): RiskLevel {
  if (score > 0.7) return 'High';
  if (score >= 0.3) return 'Medium';
  return 'Low';
}

export function getAmountRange(amount: number): string {
  const rangeStart = Math.floor(amount / 500) * 500;
  const rangeEnd = rangeStart + 500;
  
  if (amount >= 100000) return '100000+';
  if (amount >= 50000) return '50000-100000';
  if (amount >= 30000) return '30000-50000';
  if (amount >= 20000) return '20000-30000';
  if (amount >= 10000) return '10000-20000';
  if (amount >= 5000) return '5000-10000';
  
  return `${rangeStart}-${rangeEnd}`;
}
