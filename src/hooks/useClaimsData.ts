import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ClaimData, LineData, FilterState, getRiskLevel, getAmountRange } from '@/types/claims';

export function useClaimsData() {
  const [claimsData, setClaimsData] = useState<ClaimData[]>([]);
  const [lineData, setLineData] = useState<LineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    aaInd: [],
    clmTyCd: [],
    formTyCd: [],
    searchClaimId: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data/claims-data.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Parse Claim Data (Sheet 1)
        const claimSheet = workbook.Sheets[workbook.SheetNames[0]];
        const claimRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(claimSheet);
        
        const claims: ClaimData[] = claimRaw.map((row) => {
          const score = parseFloat(String(row['Score'] || row['score'] || 0));
          const amount = parseFloat(String(row['clmAmt_totChrgAmt'] || 0));
          
          return {
            clmId: String(row['clmId'] || ''),
            aaInd: String(row['aaInd'] || 'N'),
            priority: String(row['Priority'] || row['priority'] || getRiskLevel(score)),
            score: score,
            acctNum: String(row['acctNum'] || ''),
            billTyCd: String(row['billTyCd'] || ''),
            clmBeginDt: String(row['clmBeginDt'] || ''),
            clmEndDt: String(row['clmEndDt'] || ''),
            clmTyCd: String(row['clmTyCd'] || ''),
            formTyCd: String(row['formTyCd'] || ''),
            paperEdiCd: String(row['paperEdiCd'] || ''),
            rcvdTs: String(row['rcvdTs'] || ''),
            billProv_city: String(row['billProv_city(pie chart)'] || row['billProv_city'] || ''),
            billProv_dervCpfTyCd2: String(row['billProv_dervCpfTyCd2'] || ''),
            billProv_stCd: String(row['billProv_stCd'] || ''),
            billProv_nm: String(row['billProv_nm'] || ''),
            clmAmt_totChrgAmt: amount,
            clmAmtRange: getAmountRange(amount),
            patDemo_patAge: parseInt(String(row['patDemo_patAge'] || 0)),
            patDemo_patGndr: String(row['patDemo_patGndr'] || ''),
          };
        });

        setClaimsData(claims);

        // Parse Line Data (Sheet 2)
        const lineSheet = workbook.Sheets[workbook.SheetNames[1]];
        const lineRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(lineSheet);
        
        const lines: LineData[] = lineRaw.map((row) => ({
          clmId: String(row['clmId'] || ''),
          chrgAmt: parseFloat(String(row['chrgAmt'] || 0)),
          clmLnNum: parseInt(String(row['clmLnNum'] || 0)),
          ediLnNum: parseInt(String(row['ediLnNum'] || 0)),
          coinsAmt: parseFloat(String(row['coinsAmt'] || 0)),
          cvrdAmt: parseFloat(String(row['cvrdAmt'] || 0)),
          dedAmt: parseFloat(String(row['dedAmt'] || 0)),
          lnBeginDt: String(row['lnBeginDt'] || ''),
          lnEndDt: String(row['lnEndDt'] || ''),
          ndc: String(row['ndc'] || ''),
          paidAmt: parseFloat(String(row['paidAmt'] || 0)),
          posCd: String(row['posCd'] || ''),
          preAuthInd: String(row['preAuthInd'] || ''),
          revnuCd: String(row['revnuCd'] || ''),
          rmTyp: String(row['rmTyp'] || ''),
          serviceId: String(row['serviceId'] || ''),
          procCd: String(row['procCd'] || ''),
          diagCd: String(row['diagCd'] || ''),
          rncCd: String(row['rncCd'] || ''),
          drugUnits: String(row['drugUnits'] || ''),
          drugUom: String(row['drugUom'] || ''),
          count: parseInt(String(row['count'] || 0)),
          uom: String(row['uom'] || ''),
        }));

        setLineData(lines);
        setLoading(false);
      } catch (err) {
        setError('Failed to load claims data');
        setLoading(false);
        console.error(err);
      }
    }

    loadData();
  }, []);

  const filterOptions = useMemo(() => {
    return {
      aaInd: [...new Set(claimsData.map(c => c.aaInd))].filter(Boolean).sort(),
      clmTyCd: [...new Set(claimsData.map(c => c.clmTyCd))].filter(Boolean).sort(),
      formTyCd: [...new Set(claimsData.map(c => c.formTyCd))].filter(Boolean).sort(),
    };
  }, [claimsData]);

  const filteredClaims = useMemo(() => {
    return claimsData.filter(claim => {
      if (filters.aaInd.length > 0 && !filters.aaInd.includes(claim.aaInd)) return false;
      if (filters.clmTyCd.length > 0 && !filters.clmTyCd.includes(claim.clmTyCd)) return false;
      if (filters.formTyCd.length > 0 && !filters.formTyCd.includes(claim.formTyCd)) return false;
      if (filters.searchClaimId && !claim.clmId.toLowerCase().includes(filters.searchClaimId.toLowerCase())) return false;
      return true;
    });
  }, [claimsData, filters]);

  const kpiMetrics = useMemo(() => {
    const claims = filteredClaims;
    const totalAmount = claims.reduce((sum, c) => sum + c.clmAmt_totChrgAmt, 0);
    const highRisk = claims.filter(c => c.priority === 'High').length;
    const mediumRisk = claims.filter(c => c.priority === 'Medium').length;
    const lowRisk = claims.filter(c => c.priority === 'Low').length;

    return {
      totalClaims: claims.length,
      totalAmount,
      highRisk,
      mediumRisk,
      lowRisk,
    };
  }, [filteredClaims]);

  const getLineItemsForClaim = (claimId: string) => {
    return lineData.filter(line => line.clmId === claimId);
  };

  return {
    claimsData: filteredClaims,
    lineData,
    loading,
    error,
    filters,
    setFilters,
    filterOptions,
    kpiMetrics,
    getLineItemsForClaim,
  };
}
