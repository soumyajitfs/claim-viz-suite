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
    priority: [],
    auditFlag: [],
    searchClaimId: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data/Masked Sample Data - claim & line.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: false, cellText: false });

        // Helper function to convert Excel serial number or date to ISO string
        const convertExcelDate = (value: unknown): string => {
          if (!value) return '';
          // If it's already a Date object (from cellDates: true)
          if (value instanceof Date) {
            return value.toISOString();
          }
          // If it's a number (Excel serial number)
          if (typeof value === 'number') {
            // Excel serial number: days since January 1, 1900
            // Excel incorrectly treats 1900 as a leap year, so we subtract 1
            const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
            const date = new Date(excelEpoch.getTime() + (value - 1) * 86400000);
            return date.toISOString();
          }
          // If it's a string, try to parse it
          if (typeof value === 'string') {
            // Check if it's a numeric string (Excel serial number)
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0 && numValue < 100000) {
              // Likely an Excel serial number
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + (numValue - 1) * 86400000);
              return date.toISOString();
            }
            // Try parsing as regular date string
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
          return String(value);
        };

        // Parse Claim Data (Sheet 1)
        const claimSheet = workbook.Sheets[workbook.SheetNames[0]];
        const claimRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(claimSheet);
        
        // Debug: Log available column names to help identify the exact column names
        if (claimRaw.length > 0) {
          const allKeys = Object.keys(claimRaw[0]);
          console.log('Available columns in Excel:', allKeys);
          // Find columns that might be Audit Flag or Appeal ID
          const auditFlagKeys = allKeys.filter(k => k.toLowerCase().includes('audit') || k.toLowerCase().includes('flag'));
          const appealIdKeys = allKeys.filter(k => k.toLowerCase().includes('appeal') && k.toLowerCase().includes('id'));
          const appealReasonKeys = allKeys.filter(k => k.toLowerCase().includes('appeal') && k.toLowerCase().includes('reason'));
          console.log('Potential Audit Flag columns:', auditFlagKeys);
          console.log('Potential Appeal ID columns:', appealIdKeys);
          console.log('Potential Appeal Reason columns:', appealReasonKeys);
          // Log first row to see actual values
          if (claimRaw[0]) {
            console.log('First row Audit Flag value:', claimRaw[0][auditFlagKeys[0]]);
            console.log('First row Appeal ID value:', claimRaw[0][appealIdKeys[0]]);
            console.log('First row Appeal Reason value:', claimRaw[0][appealReasonKeys[0]]);
          }
        }
        
        // Find actual column names from Excel
        let actualAuditFlagColumn: string | null = null;
        let actualAppealIdColumn: string | null = null;
        let actualAppealReasonColumn: string | null = null;
        
        if (claimRaw.length > 0) {
          const allKeys = Object.keys(claimRaw[0]);
          // Find Audit Flag column
          actualAuditFlagColumn = allKeys.find(k => 
            k.toLowerCase().includes('audit') && k.toLowerCase().includes('flag')
          ) || allKeys.find(k => k.toLowerCase() === 'audit flag') || null;
          
          // Find Appeal ID column
          actualAppealIdColumn = allKeys.find(k => 
            k.toLowerCase().includes('appeal') && k.toLowerCase().includes('id')
          ) || allKeys.find(k => k.toLowerCase() === 'appeal id') || null;
          
          // Find Appeal Reason column
          actualAppealReasonColumn = allKeys.find(k => 
            k.toLowerCase().includes('appeal') && k.toLowerCase().includes('reason')
          ) || allKeys.find(k => k.toLowerCase() === 'appeal reason') || null;
          
          console.log('Detected Audit Flag column:', actualAuditFlagColumn);
          console.log('Detected Appeal ID column:', actualAppealIdColumn);
          console.log('Detected Appeal Reason column:', actualAppealReasonColumn);
        }

        // Helper function to find column value with multiple name variations
        const getColumnValue = (row: Record<string, unknown>, possibleNames: string[], actualColumn: string | null = null): string => {
          // First try the detected actual column name
          if (actualColumn && row[actualColumn] !== null && row[actualColumn] !== undefined) {
            const value = String(row[actualColumn]).trim();
            if (value !== '' && value !== 'null' && value !== 'undefined') {
              return value;
            }
          }
          
          // Then try exact matches
          for (const name of possibleNames) {
            if (row.hasOwnProperty(name) && row[name] !== null && row[name] !== undefined) {
              const value = String(row[name]).trim();
              if (value !== '' && value !== 'null' && value !== 'undefined') {
                return value;
              }
            }
          }
          
          // Then try case-insensitive matches
          const rowKeys = Object.keys(row);
          for (const possibleName of possibleNames) {
            const foundKey = rowKeys.find(key => 
              key.toLowerCase().trim() === possibleName.toLowerCase().trim() ||
              key.replace(/\s+/g, ' ').toLowerCase() === possibleName.replace(/\s+/g, ' ').toLowerCase()
            );
            if (foundKey && row[foundKey] !== null && row[foundKey] !== undefined) {
              const value = String(row[foundKey]).trim();
              if (value !== '' && value !== 'null' && value !== 'undefined') {
                return value;
              }
            }
          }
          return '';
        };

        const claims: ClaimData[] = claimRaw.map((row) => {
          const score = parseFloat(String(row['Score'] || row['score'] || 0));
          const amount = parseFloat(String(row['clmAmt_totChrgAmt'] || 0));
          const allowAmount = parseFloat(String(row['clmAmt_totAllowAmt'] || 0));
          
          return {
            clmId: String(row['clmId'] || ''),
            aaInd: String(row['aaInd'] || 'N'),
            priority: String(row['Priority'] || row['priority'] || getRiskLevel(score)),
            score: score,
            acctNum: String(row['acctNum'] || ''),
            billTyCd: String(row['billTyCd'] || ''),
            clmBeginDt: convertExcelDate(row['clmBeginDt']),
            clmEndDt: convertExcelDate(row['clmEndDt']),
            clmTyCd: String(row['clmTyCd'] || ''),
            formTyCd: String(row['formTyCd'] || ''),
            paperEdiCd: String(row['paperEdiCd'] || ''),
            rcvdTs: convertExcelDate(row['rcvdTs']),
            billProv_city: String(row['billProv_city(pie chart)'] || row['billProv_city'] || ''),
            billProv_dervCpfTyCd2: String(row['billProv_dervCpfTyCd2'] || ''),
            billProv_stCd: String(row['billProv_stCd'] || ''),
            billProv_nm: String(row['billProv_nm'] || ''),
            clmAmt_totChrgAmt: amount,
            clmAmt_totAllowAmt: allowAmount,
            clmAmtRange: getAmountRange(amount),
            patDemo_patAge: parseInt(String(row['patDemo_patAge'] || 0)),
            patDemo_patGndr: String(row['patDemo_patGndr'] || ''),
            benopt: String(row['benopt'] || ''),
            billProv_dervParInd: String(row['billProv_dervParInd'] || ''),
            billProv_ntCd: String(row['billProv_ntCd'] || ''),
            auditFlag: getColumnValue(row, ['Audit Flag', 'auditFlag', 'AuditFlag', 'audit flag', 'AUDIT FLAG', 'Audit_Flag'], actualAuditFlagColumn),
            appealReason: getColumnValue(row, ['Appeal Reason', 'appealReason', 'AppealReason', 'appeal reason', 'APPEAL REASON', 'Appeal_Reason'], actualAppealReasonColumn),
            appealId: getColumnValue(row, ['Appeal ID', 'appealId', 'AppealId', 'appeal id', 'APPEAL ID', 'AppealID', 'Appeal_ID'], actualAppealIdColumn),
          };
        });

        setClaimsData(claims);
        console.log(`Loaded ${claims.length} claims from Excel file`);

        // Parse Line Data (Sheet 2)
        const lineSheet = workbook.Sheets[workbook.SheetNames[1]];
        const lineRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(lineSheet);
        
        // Helper function for line data dates
        const convertExcelDateForLine = (value: unknown): string => {
          if (!value) return '';
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + (value - 1) * 86400000);
            return date.toISOString();
          }
          if (typeof value === 'string') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0 && numValue < 100000) {
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + (numValue - 1) * 86400000);
              return date.toISOString();
            }
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
          return String(value);
        };

        const lines: LineData[] = lineRaw.map((row) => ({
          clmId: String(row['clmId'] || ''),
          chrgAmt: parseFloat(String(row['chrgAmt'] || 0)),
          clmLnNum: parseInt(String(row['clmLnNum'] || 0)),
          ediLnNum: parseInt(String(row['ediLnNum'] || 0)),
          coinsAmt: parseFloat(String(row['coinsAmt'] || 0)),
          cvrdAmt: parseFloat(String(row['cvrdAmt'] || 0)),
          dedAmt: parseFloat(String(row['dedAmt'] || 0)),
          lnBeginDt: convertExcelDateForLine(row['lnBeginDt']),
          lnEndDt: convertExcelDateForLine(row['lnEndDt']),
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

        // Validate line data for issues
        const lineDataIssues: string[] = [];
        
        // Group lines by claim ID
        const linesByClaim = new Map<string, LineData[]>();
        lines.forEach(line => {
          if (!linesByClaim.has(line.clmId)) {
            linesByClaim.set(line.clmId, []);
          }
          linesByClaim.get(line.clmId)!.push(line);
        });

        // Check for duplicate line numbers within same claim
        linesByClaim.forEach((claimLines, claimId) => {
          const lineNumbers = new Set<number>();
          const duplicateLineNums: number[] = [];
          
          claimLines.forEach(line => {
            if (lineNumbers.has(line.clmLnNum)) {
              duplicateLineNums.push(line.clmLnNum);
            } else {
              lineNumbers.add(line.clmLnNum);
            }
          });
          
          if (duplicateLineNums.length > 0) {
            lineDataIssues.push(`Claim ${claimId}: Duplicate line numbers found: ${duplicateLineNums.join(', ')}`);
          }
        });

        // Check for missing line data for claims
        const claimIds = new Set(claims.map(c => c.clmId));
        const claimsWithLines = new Set(lines.map(l => l.clmId));
        const missingLineData: string[] = [];
        
        claimIds.forEach(claimId => {
          if (!claimsWithLines.has(claimId)) {
            missingLineData.push(claimId);
          }
        });
        
        if (missingLineData.length > 0) {
          lineDataIssues.push(`Claims missing line data: ${missingLineData.join(', ')}`);
        }

        // Check if line amounts sum to claim amounts
        claims.forEach(claim => {
          const claimLines = linesByClaim.get(claim.clmId) || [];
          if (claimLines.length > 0) {
            const totalLineChrgAmt = claimLines.reduce((sum, line) => sum + line.chrgAmt, 0);
            const claimChrgAmt = claim.clmAmt_totChrgAmt;
            const difference = Math.abs(totalLineChrgAmt - claimChrgAmt);
            
            // Allow small floating point differences (0.01)
            if (difference > 0.01) {
              lineDataIssues.push(`Claim ${claim.clmId}: Line total (${totalLineChrgAmt.toFixed(2)}) does not match claim amount (${claimChrgAmt.toFixed(2)}), difference: ${difference.toFixed(2)}`);
            }
          }
        });

        // Log line item counts per claim
        const lineCounts = Array.from(linesByClaim.entries()).map(([claimId, claimLines]) => ({
          claimId,
          lineCount: claimLines.length
        }));
        console.log('Line item counts per claim:', lineCounts);

        if (lineDataIssues.length > 0) {
          console.warn('Line Data Validation Issues Found:');
          lineDataIssues.forEach(issue => console.warn(`  - ${issue}`));
        } else {
          console.log('✓ Line data validation passed: No issues found');
        }

        setLineData(lines);
        console.log(`Loaded ${lines.length} line items from Excel file`);
        console.log(`Total claims: ${claims.length}, Claims with line data: ${linesByClaim.size}`);
        setLoading(false);
      } catch (err) {
        setError('Failed to load claims data');
        setLoading(false);
        console.error('Error loading Excel data:', err);
        console.error('Please check that the Excel file exists at: /data/Masked Sample Data - claim & line.xlsx');
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
      if (filters.priority.length > 0 && !filters.priority.includes(claim.priority)) return false;
      if (filters.auditFlag.length > 0) {
        const claimAuditFlag = claim.auditFlag?.trim().toUpperCase() || '';
        if (!filters.auditFlag.some(flag => claimAuditFlag === flag.trim().toUpperCase())) return false;
      }
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
