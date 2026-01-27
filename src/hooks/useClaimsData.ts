import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ClaimData, LineData, FilterState, getRiskLevel, getAmountRange } from '@/types/claims';

export function useClaimsData(excelFileName: string = 'Claim Data 2.xlsx') {
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
    claimStatus: [],
    searchClaimId: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/data/${excelFileName}`);
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
          console.log('=== ALL AVAILABLE COLUMNS IN EXCEL ===');
          console.log('Available columns in Excel:', allKeys);
          // Find columns that might be Audit Flag or Appeal ID
          const auditFlagKeys = allKeys.filter(k => k.toLowerCase().includes('audit') || k.toLowerCase().includes('flag'));
          const appealIdKeys = allKeys.filter(k => k.toLowerCase().includes('appeal') && k.toLowerCase().includes('id'));
          const appealReasonKeys = allKeys.filter(k => k.toLowerCase().includes('appeal') && k.toLowerCase().includes('reason'));
          console.log('Potential Audit Flag columns:', auditFlagKeys);
          console.log('Potential Appeal ID columns:', appealIdKeys);
          console.log('Potential Appeal Reason columns:', appealReasonKeys);
          // Log first 10 rows to see actual values for Audit Flag
          if (claimRaw.length > 0) {
            console.log('=== AUDIT FLAG VALUES FROM FIRST 10 ROWS ===');
            claimRaw.slice(0, 10).forEach((row, idx) => {
              auditFlagKeys.forEach(key => {
                console.log(`Row ${idx + 1}, Column "${key}":`, row[key], 'Type:', typeof row[key]);
              });
            });
            console.log('First row Audit Flag value:', claimRaw[0][auditFlagKeys[0]]);
            console.log('First row Appeal ID value:', claimRaw[0][appealIdKeys[0]]);
            console.log('First row Appeal Reason value:', claimRaw[0][appealReasonKeys[0]]);
          }
        }
        
        // Find actual column names from Excel
        let actualAuditFlagColumn: string | null = null;
        let actualAuditOrProcessingActionColumn: string | null = null;
        let actualProviderSpecialityColumn: string | null = null;
        let actualAppealIdColumn: string | null = null;
        let actualAppealReasonColumn: string | null = null;
        let actualBenefitPlanUpdateDateColumn: string | null = null;
        let actualBillingProviderContractUpdateDateColumn: string | null = null;
        let actualClaimStatusColumn: string | null = null;
        let actualClaimPaidDateColumn: string | null = null;
        let actualHistoricalAdjRateByVersionColumn: string | null = null;
        
        if (claimRaw.length > 0) {
          const allKeys = Object.keys(claimRaw[0]);
          // Find Audit Flag column - try multiple variations
          actualAuditFlagColumn = allKeys.find(k => 
            k.toLowerCase().trim() === 'audit flag'
          ) || allKeys.find(k => 
            k.toLowerCase().replace(/\s+/g, ' ').trim() === 'audit flag'
          ) || allKeys.find(k => 
            k.toLowerCase().includes('audit') && k.toLowerCase().includes('flag')
          ) || allKeys.find(k => 
            k.toLowerCase() === 'auditflag'
          ) || null;
          
          // Log sample values for debugging
          if (actualAuditFlagColumn && claimRaw[0]) {
            console.log('Audit Flag column found:', actualAuditFlagColumn);
            console.log('Sample Audit Flag values:', claimRaw.slice(0, 5).map(r => r[actualAuditFlagColumn!]));
          } else {
            console.warn('Audit Flag column NOT found. Available columns:', allKeys);
          }
          
          // Find Appeal ID column
          actualAppealIdColumn = allKeys.find(k => 
            k.toLowerCase().includes('appeal') && k.toLowerCase().includes('id')
          ) || allKeys.find(k => k.toLowerCase() === 'appeal id') || null;
          
          // Find Appeal Reason column
          actualAppealReasonColumn = allKeys.find(k => 
            k.toLowerCase().includes('appeal') && k.toLowerCase().includes('reason')
          ) || allKeys.find(k => k.toLowerCase() === 'appeal reason') || null;
          
          // Find Benefit plan update date column
          actualBenefitPlanUpdateDateColumn = allKeys.find(k => 
            k.toLowerCase().includes('benefit') && k.toLowerCase().includes('plan') && k.toLowerCase().includes('update') && k.toLowerCase().includes('date')
          ) || allKeys.find(k => k.toLowerCase().includes('benefit plan update date')) || null;
          
          // Find Billing Provider contract update date column
          actualBillingProviderContractUpdateDateColumn = allKeys.find(k => 
            k.toLowerCase().includes('billing') && k.toLowerCase().includes('provider') && k.toLowerCase().includes('contract') && k.toLowerCase().includes('update') && k.toLowerCase().includes('date')
          ) || allKeys.find(k => k.toLowerCase().includes('billing provider contract update date')) || null;
          
          // Find Claim Status column
          actualClaimStatusColumn = allKeys.find(k => 
            k.toLowerCase().includes('claim') && k.toLowerCase().includes('status')
          ) || allKeys.find(k => k.toLowerCase() === 'claim status') || null;
          
          // Find Claim Paid date column
          actualClaimPaidDateColumn = allKeys.find(k => 
            k.toLowerCase().includes('claim') && k.toLowerCase().includes('paid') && k.toLowerCase().includes('date')
          ) || allKeys.find(k => k.toLowerCase().includes('claim paid date')) || null;
          
          // Find historical_adj_rate_by_version column
          actualHistoricalAdjRateByVersionColumn = allKeys.find(k => 
            k.toLowerCase().includes('historical') && k.toLowerCase().includes('adj') && k.toLowerCase().includes('rate') && k.toLowerCase().includes('version')
          ) || allKeys.find(k => k.toLowerCase() === 'historical_adj_rate_by_version' || k.toLowerCase().includes('historical_adj_rate')) || null;
          
          // Find Audit or Processing Action column
          actualAuditOrProcessingActionColumn = allKeys.find(k => 
            k.toLowerCase().includes('audit') && k.toLowerCase().includes('processing') && k.toLowerCase().includes('action')
          ) || allKeys.find(k => 
            k.toLowerCase().includes('audit') && k.toLowerCase().includes('or') && k.toLowerCase().includes('processing')
          ) || allKeys.find(k => 
            k.toLowerCase() === 'audit or processing action' || k.toLowerCase().includes('audit or processing')
          ) || null;
          
          // Find Provider Speciality column (for Claims by Provider Speciality chart)
          // Try exact match first, then partial matches
          actualProviderSpecialityColumn = allKeys.find(k => 
            k.toLowerCase().trim() === 'claims by provider speciality'
          ) || allKeys.find(k => 
            k.toLowerCase().trim() === 'provider speciality'
          ) || allKeys.find(k => 
            k.toLowerCase().includes('claims') && k.toLowerCase().includes('provider') && k.toLowerCase().includes('speciality')
          ) || allKeys.find(k => 
            k.toLowerCase().includes('provider') && k.toLowerCase().includes('speciality')
          ) || null;
          
          console.log('Detected Audit Flag column:', actualAuditFlagColumn);
          console.log('Detected Audit or Processing Action column:', actualAuditOrProcessingActionColumn);
          console.log('Detected Provider Speciality column:', actualProviderSpecialityColumn);
          console.log('Detected Appeal ID column:', actualAppealIdColumn);
          console.log('Detected Appeal Reason column:', actualAppealReasonColumn);
          console.log('Detected Benefit plan update date column:', actualBenefitPlanUpdateDateColumn);
          console.log('Detected Billing Provider contract update date column:', actualBillingProviderContractUpdateDateColumn);
          console.log('Detected Claim Status column:', actualClaimStatusColumn);
          console.log('Detected Claim Paid date column:', actualClaimPaidDateColumn);
          console.log('Detected historical_adj_rate_by_version column:', actualHistoricalAdjRateByVersionColumn);
        }

        // Helper function to find column value with multiple name variations
        const getColumnValue = (row: Record<string, unknown>, possibleNames: string[], actualColumn: string | null = null): string => {
          // First try the detected actual column name - this is the most reliable
          if (actualColumn) {
            const rawValue = row[actualColumn];
            if (rawValue !== null && rawValue !== undefined) {
              const value = String(rawValue).trim();
              // Allow single character values like "Y" and don't filter them out
              if (value !== '' && value !== 'null' && value !== 'undefined') {
                return value;
              }
              // Even if it's empty string, return it for Audit Flag (to distinguish between empty and missing)
              if (actualColumn.toLowerCase().includes('audit') && actualColumn.toLowerCase().includes('flag')) {
                return value; // Return empty string for blank Audit Flag cells
              }
            }
          }
          
          // Then try exact matches
          for (const name of possibleNames) {
            if (row.hasOwnProperty(name)) {
              const rawValue = row[name];
              if (rawValue !== null && rawValue !== undefined) {
                const value = String(rawValue).trim();
                // Allow single character values like "Y" and don't filter them out
                if (value !== '' && value !== 'null' && value !== 'undefined') {
                  return value;
                }
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
            if (foundKey) {
              const rawValue = row[foundKey];
              if (rawValue !== null && rawValue !== undefined) {
                const value = String(rawValue).trim();
                // Allow single character values like "Y" and don't filter them out
                if (value !== '' && value !== 'null' && value !== 'undefined') {
                  return value;
                }
              }
            }
          }
          return '';
        };

        const claims: ClaimData[] = claimRaw.map((row) => {
          const score = parseFloat(String(row['Score'] || row['score'] || 0));
          const amount = parseFloat(String(row['clmAmt_totChrgAmt'] || 0));
          const allowAmount = parseFloat(String(row['clmAmt_totAllowAmt'] || 0));
          
          // Try to find claim ID with variations (clmId, Claim ID, Claim Number, Claim Identifier, etc.)
          // Works for both Claim Data 2 and Facets Claim Data - same implementation
          let claimIdValue = row['clmId'] || row['Claim ID'] || row['ClaimID'] || row['claimId'] || row['CLAIM_ID'] || 
                            row['Claim Number'] || row['ClaimNumber'] || row['Claim_Number'] || row['claim_number'] || 
                            row['Claim Identifier'] || row['ClaimIdentifier'] || row['claim_identifier'] || row['CLAIM_IDENTIFIER'] ||
                            row['Source'] || row['source'] || row['SOURCE'] || '';
          
          // If still empty, try case-insensitive search for claim identifier columns
          if (!claimIdValue) {
            const rowKeys = Object.keys(row);
            const claimIdKey = rowKeys.find(key => {
              const keyLower = key.toLowerCase();
              return (keyLower.includes('claim') && (keyLower.includes('id') || keyLower.includes('number') || keyLower.includes('num') || keyLower.includes('identifier'))) ||
                     keyLower === 'source';
            });
            if (claimIdKey) {
              claimIdValue = row[claimIdKey];
            }
          }
          
          return {
            clmId: String(claimIdValue || '').trim(),
            aaInd: String(
              row['Auto Adjudication Indicator'] || 
              row['autoAdjudicationIndicator'] || 
              row['aaInd'] || 
              'N'
            ),
            priority: String(row['Priority'] || row['priority'] || getRiskLevel(score)),
            score: score,
            acctNum: String(row['acctNum'] || ''),
            billTyCd: String(row['billTyCd'] || ''),
            clmBeginDt: convertExcelDate(row['clmBeginDt']),
            clmEndDt: convertExcelDate(row['clmEndDt']),
            clmTyCd: String(
              row['Provider Network Code'] || 
              row['providerNetworkCode'] || 
              row['clmTyCd'] || 
              ''
            ),
            formTyCd: String(
              row['Claim Form Type Code'] || 
              row['claimFormTypeCode'] || 
              row['formTyCd'] || 
              ''
            ),
            paperEdiCd: String(
              row['Paper or EDI Submission Code'] || 
              row['paperEdiCd'] || 
              row['Paper or EDI'] ||
              ''
            ),
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
            benopt: String(
              row['Benefit Option'] || 
              row['benefitOption'] || 
              row['benopt'] || 
              ''
            ),
            billProv_dervParInd: String(row['billProv_dervParInd'] || ''),
            billProv_ntCd: String(row['billProv_ntCd'] || ''),
            auditFlag: (() => {
              // Special handling for Audit Flag - try ALL possible column name variations directly
              const rowKeys = Object.keys(row);
              
              // Try the detected column first
              if (actualAuditFlagColumn) {
                const rawValue = row[actualAuditFlagColumn];
                if (rawValue !== null && rawValue !== undefined) {
                  const value = String(rawValue).trim();
                  if (value !== '' && value !== 'null' && value !== 'undefined') {
                    return value;
                  }
                }
              }
              
              // Try all possible column name variations directly from row
              const possibleNames = [
                'Audit Flag', 'auditFlag', 'AuditFlag', 'audit flag', 'AUDIT FLAG', 
                'Audit_Flag', 'AuditFlag', 'Audit Flag ', ' Audit Flag', 'Audit  Flag'
              ];
              
              for (const name of possibleNames) {
                if (row.hasOwnProperty(name)) {
                  const rawValue = row[name];
                  if (rawValue !== null && rawValue !== undefined) {
                    const value = String(rawValue).trim();
                    if (value !== '' && value !== 'null' && value !== 'undefined') {
                      return value;
                    }
                  }
                }
              }
              
              // Try case-insensitive match on all row keys
              for (const key of rowKeys) {
                const lowerKey = key.toLowerCase().trim();
                if ((lowerKey.includes('audit') && lowerKey.includes('flag')) || lowerKey === 'audit flag') {
                  const rawValue = row[key];
                  if (rawValue !== null && rawValue !== undefined) {
                    const value = String(rawValue).trim();
                    // Return ANY value including "Y", empty string, etc.
                    return value;
                  }
                }
              }
              
              // If nothing found, return empty string
              return '';
            })(),
            auditOrProcessingAction: getColumnValue(row, ['Audit or Processing Action', 'auditOrProcessingAction', 'AuditOrProcessingAction', 'audit or processing action', 'AUDIT OR PROCESSING ACTION', 'Audit_Or_Processing_Action'], actualAuditOrProcessingActionColumn),
            providerSpeciality: (() => {
              // Use ONLY "Claims by Provider Speciality" column - no fallbacks
              // Prioritize the detected column first
              if (actualProviderSpecialityColumn && row[actualProviderSpecialityColumn] !== null && row[actualProviderSpecialityColumn] !== undefined) {
                const value = String(row[actualProviderSpecialityColumn]).trim();
                if (value && value !== '' && value !== 'null' && value !== 'undefined') {
                  return value;
                }
              }
              // Try other column name variations for "Claims by Provider Speciality"
              const value = getColumnValue(row, ['Claims by Provider Speciality', 'Provider Speciality', 'providerSpeciality', 'ProviderSpeciality', 'provider speciality', 'PROVIDER SPECIALITY', 'Claims_by_Provider_Speciality'], actualProviderSpecialityColumn);
              if (value && value.trim() !== '') {
                return value;
              }
              // Return empty string if column not found - do NOT use fallback
              return '';
            })(),
            appealReason: getColumnValue(row, ['Appeal Reason', 'appealReason', 'AppealReason', 'appeal reason', 'APPEAL REASON', 'Appeal_Reason'], actualAppealReasonColumn),
            appealId: getColumnValue(row, ['Appeal ID', 'appealId', 'AppealId', 'appeal id', 'APPEAL ID', 'AppealID', 'Appeal_ID'], actualAppealIdColumn),
            benefitPlanUpdateDate: convertExcelDate(getColumnValue(row, ['Benefit plan update date', 'benefitPlanUpdateDate', 'BenefitPlanUpdateDate', 'benefit plan update date', 'BENEFIT PLAN UPDATE DATE', 'Benefit_Plan_Update_Date'], actualBenefitPlanUpdateDateColumn)),
            billingProviderContractUpdateDate: convertExcelDate(getColumnValue(row, ['Billing Provider contract update date', 'billingProviderContractUpdateDate', 'BillingProviderContractUpdateDate', 'billing provider contract update date', 'BILLING PROVIDER CONTRACT UPDATE DATE', 'Billing_Provider_Contract_Update_Date'], actualBillingProviderContractUpdateDateColumn)),
            claimStatus: getColumnValue(row, ['Claim Status', 'claimStatus', 'ClaimStatus', 'claim status', 'CLAIM STATUS', 'Claim_Status'], actualClaimStatusColumn),
            claimPaidDate: convertExcelDate(getColumnValue(row, ['Claim Paid date', 'claimPaidDate', 'ClaimPaidDate', 'claim paid date', 'CLAIM PAID DATE', 'Claim_Paid_Date'], actualClaimPaidDateColumn)),
            historicalAdjRateByVersion: getColumnValue(row, ['historical_adj_rate_by_version', 'historicalAdjRateByVersion', 'HistoricalAdjRateByVersion', 'historical adj rate by version', 'HISTORICAL_ADJ_RATE_BY_VERSION'], actualHistoricalAdjRateByVersionColumn),
          };
        });

        setClaimsData(claims);
        console.log(`Loaded ${claims.length} claims from Excel file`);

        // Parse Line Data (Sheet 2) - handle cases where Sheet 2 might not exist
        let lineRaw: Record<string, unknown>[] = [];
        if (workbook.SheetNames.length > 1) {
          const lineSheet = workbook.Sheets[workbook.SheetNames[1]];
          if (lineSheet) {
            lineRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(lineSheet);
            console.log(`Found ${lineRaw.length} line items in Sheet 2`);
            
            // Log available columns in line data sheet for debugging
            if (lineRaw.length > 0) {
              const lineColumns = Object.keys(lineRaw[0]);
              console.log('=== LINE DATA COLUMNS IN EXCEL ===');
              console.log('Available columns in Sheet 2:', lineColumns);
              console.log('Sample row data:', lineRaw[0]);
            }
          }
        } else {
          console.warn('No Sheet 2 found in Excel file, line data will be empty');
        }
        
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

        // Helper function to get column value with multiple name variations
        const getLineColumnValue = (row: Record<string, unknown>, possibleNames: string[]): string | number => {
          const rowKeys = Object.keys(row);
          
          // First try exact matches
          for (const name of possibleNames) {
            if (row.hasOwnProperty(name)) {
              const rawValue = row[name];
              if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
                return rawValue;
              }
            }
          }
          
          // Try case-insensitive match
          for (const possibleName of possibleNames) {
            const foundKey = rowKeys.find(key => {
              const keyLower = key.toLowerCase().trim();
              const nameLower = possibleName.toLowerCase().trim();
              return keyLower === nameLower || 
                     keyLower.replace(/\s+/g, ' ') === nameLower.replace(/\s+/g, ' ') ||
                     keyLower.replace(/[_\s]/g, '') === nameLower.replace(/[_\s]/g, '');
            });
            if (foundKey) {
              const rawValue = row[foundKey];
              if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
                return rawValue;
              }
            }
          }
          
          // Try partial matches (contains)
          for (const possibleName of possibleNames) {
            const nameParts = possibleName.toLowerCase().split(/[\s_]+/).filter(p => p.length > 2);
            if (nameParts.length > 0) {
              const foundKey = rowKeys.find(key => {
                const keyLower = key.toLowerCase();
                return nameParts.every(part => keyLower.includes(part));
              });
              if (foundKey) {
                const rawValue = row[foundKey];
                if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
                  return rawValue;
                }
              }
            }
          }
          
          return '';
        };

        const lines: LineData[] = lineRaw.map((row, index) => {
          // Try to find clmId with variations (clmId, Claim ID, Claim Number, Claim Identifier, etc.)
          // This is critical for matching line items to claims
          // Works for both Claim Data 2 and Facets Claim Data - same implementation
          // Includes "Claim Identifier" column which is used in Facets Claim Data Excel
          const clmIdValue = getLineColumnValue(row, [
            'clmId', 'Claim ID', 'ClaimID', 'claimId', 'CLAIM_ID', 
            'Claim Number', 'ClaimNumber', 'Claim_Number', 'claim_number',
            'Claim Identifier', 'ClaimIdentifier', 'claim_identifier', 'CLAIM_IDENTIFIER',
            'CLM_ID', 'Clm ID', 'ClmID', 'Claim_Number', 'claim_number',
            'Source', 'source', 'SOURCE' // Some Excel files use "Source" column
          ]);
          
          let clmId = String(clmIdValue || '').trim();
          
          // If still empty, try to find any column that might contain claim identifier
          if (!clmId) {
            const rowKeys = Object.keys(row);
            // Look for columns that might be claim identifiers
            const possibleClaimIdKeys = rowKeys.filter(key => {
              const keyLower = key.toLowerCase();
              return keyLower.includes('claim') && (keyLower.includes('id') || keyLower.includes('number') || keyLower.includes('num'));
            });
            if (possibleClaimIdKeys.length > 0) {
              clmId = String(row[possibleClaimIdKeys[0]] || '').trim();
            }
          }
          
          // Log if claim ID is missing for debugging
          if (!clmId && index < 5) {
            console.warn(`Line item at index ${index} has no claim ID. Row keys:`, Object.keys(row));
            console.warn(`Sample row values:`, row);
          }
          
          return {
            clmId: clmId,
            chrgAmt: parseFloat(String(getLineColumnValue(row, ['chrgAmt', 'Chrg Amt', 'Charge Amount', 'chrgAmt', 'CHRG_AMT']) || 0)),
            clmLnNum: parseInt(String(getLineColumnValue(row, ['clmLnNum', 'Clm Ln Num', 'Claim Line Number', 'clmLnNum', 'CLM_LN_NUM']) || 0)),
            ediLnNum: parseInt(String(getLineColumnValue(row, ['ediLnNum', 'Edi Ln Num', 'EDI Line Number', 'ediLnNum', 'EDI_LN_NUM']) || 0)),
            coinsAmt: parseFloat(String(getLineColumnValue(row, ['coinsAmt', 'Coins Amt', 'Coinsurance Amount', 'coinsAmt', 'COINS_AMT']) || 0)),
            cvrdAmt: parseFloat(String(getLineColumnValue(row, ['cvrdAmt', 'Cvrd Amt', 'Covered Amount', 'cvrdAmt', 'CVRD_AMT']) || 0)),
            dedAmt: parseFloat(String(getLineColumnValue(row, ['dedAmt', 'Ded Amt', 'Deductible Amount', 'dedAmt', 'DED_AMT']) || 0)),
            lnBeginDt: convertExcelDateForLine(getLineColumnValue(row, ['lnBeginDt', 'Ln Begin Dt', 'Line Begin Date', 'lnBeginDt', 'LN_BEGIN_DT'])),
            lnEndDt: convertExcelDateForLine(getLineColumnValue(row, ['lnEndDt', 'Ln End Dt', 'Line End Date', 'lnEndDt', 'LN_END_DT'])),
            ndc: String(getLineColumnValue(row, ['ndc', 'NDC', 'Ndc', 'National Drug Code']) || ''),
            paidAmt: parseFloat(String(getLineColumnValue(row, ['paidAmt', 'Paid Amt', 'Paid Amount', 'paidAmt', 'PAID_AMT']) || 0)),
            posCd: String(getLineColumnValue(row, ['posCd', 'Pos Cd', 'Place of Service Code', 'posCd', 'POS_CD']) || ''),
            preAuthInd: String(getLineColumnValue(row, ['preAuthInd', 'Pre Auth Ind', 'Pre Authorization Indicator', 'preAuthInd', 'PRE_AUTH_IND']) || ''),
            revnuCd: String(getLineColumnValue(row, ['revnuCd', 'Revnu Cd', 'Revenue Code', 'revnuCd', 'REVNU_CD']) || ''),
            rmTyp: String(getLineColumnValue(row, ['rmTyp', 'Rm Typ', 'Room Type', 'rmTyp', 'RM_TYP']) || ''),
            serviceId: String(getLineColumnValue(row, ['serviceId', 'Service Id', 'Service ID', 'serviceId', 'SERVICE_ID']) || ''),
            procCd: String(getLineColumnValue(row, ['procCd', 'Proc Cd', 'Procedure Code', 'procCd', 'PROC_CD']) || ''),
            diagCd: String(getLineColumnValue(row, ['diagCd', 'Diag Cd', 'Diagnosis Code', 'diagCd', 'DIAG_CD']) || ''),
            rncCd: String(getLineColumnValue(row, ['rncCd', 'Rnc Cd', 'Reason Not Covered Code', 'rncCd', 'RNC_CD']) || ''),
            drugUnits: String(getLineColumnValue(row, ['drugUnits', 'Drug Units', 'drugUnits', 'DRUG_UNITS']) || ''),
            drugUom: String(getLineColumnValue(row, ['drugUom', 'Drug UOM', 'Drug Unit of Measure', 'drugUom', 'DRUG_UOM']) || ''),
            count: parseInt(String(getLineColumnValue(row, ['count', 'Count', 'COUNT']) || 0)),
            uom: String(getLineColumnValue(row, ['uom', 'UOM', 'Unit of Measure', 'uom', 'UOM']) || ''),
          };
        });

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
        
        // Log sample claim IDs from both sheets for debugging
        if (claims.length > 0 && lines.length > 0) {
          const sampleClaimIds = [...new Set(claims.slice(0, 5).map(c => c.clmId))];
          const sampleLineClaimIds = [...new Set(lines.slice(0, 10).map(l => l.clmId).filter(id => id))];
          console.log('Sample Claim IDs from Sheet 1:', sampleClaimIds);
          console.log('Sample Claim IDs from Sheet 2:', sampleLineClaimIds);
          console.log('Matching claim IDs:', sampleClaimIds.filter(id => sampleLineClaimIds.includes(id)));
        }
        
        setLoading(false);
      } catch (err) {
        setError(`Failed to load claims data from ${excelFileName}`);
        setLoading(false);
        console.error('Error loading Excel data:', err);
        console.error(`Please check that the Excel file exists at: /data/${excelFileName}`);
      }
    }

    loadData();
  }, [excelFileName]);

  const filterOptions = useMemo(() => {
    // For Facets Claim Data, use hardcoded filterOptions (same as Claim Data 2) for UI purposes
    if (excelFileName === 'Facets_Claim Data.xlsx') {
      return {
        aaInd: ['N', 'Y'], // Manual adjudication, Auto Adjudicated
        clmTyCd: ['In Network', 'Out of Network'], // Provider Network code options
        formTyCd: ['H', 'U', 'I', 'O'], // Professional, Institutional, Inpatient, Outpatient
        claimStatus: ['Auto Adjudicated queue', 'Manual Adjudication queue', 'Paid'], // Claim Status options
      };
    }
    
    // For Claim Data 2, use actual data from Excel
    // Normalize aaInd values to avoid duplicates (N/n -> N, Y/y -> Y, Manual -> N, Auto -> Y)
    const normalizedAaInd = claimsData.map(c => {
      const value = c.aaInd?.trim() || '';
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'n' || lowerValue.includes('manual')) {
        return 'N';
      } else if (lowerValue === 'y' || lowerValue.includes('auto')) {
        return 'Y';
      }
      return value;
    });
    
    return {
      aaInd: [...new Set(normalizedAaInd)].filter(Boolean).sort(),
      clmTyCd: [...new Set(claimsData.map(c => c.clmTyCd))].filter(Boolean).sort(),
      formTyCd: [...new Set(claimsData.map(c => c.formTyCd))].filter(Boolean).sort(),
      claimStatus: [...new Set(claimsData.map(c => c.claimStatus))].filter(Boolean).sort(),
    };
  }, [claimsData, excelFileName]);

  const filteredClaims = useMemo(() => {
    return claimsData.filter(claim => {
      if (filters.aaInd.length > 0) {
        // Normalize the claim's aaInd value for comparison
        const claimAaInd = claim.aaInd?.trim() || '';
        const lowerValue = claimAaInd.toLowerCase();
        let normalizedClaimAaInd = claimAaInd;
        if (lowerValue === 'n' || lowerValue.includes('manual')) {
          normalizedClaimAaInd = 'N';
        } else if (lowerValue === 'y' || lowerValue.includes('auto')) {
          normalizedClaimAaInd = 'Y';
        }
        if (!filters.aaInd.includes(normalizedClaimAaInd)) return false;
      }
      if (filters.clmTyCd.length > 0 && !filters.clmTyCd.includes(claim.clmTyCd)) return false;
      if (filters.formTyCd.length > 0 && !filters.formTyCd.includes(claim.formTyCd)) return false;
      if (filters.priority.length > 0 && !filters.priority.includes(claim.priority)) return false;
      if (filters.auditFlag.length > 0) {
        const claimAuditFlag = claim.auditFlag?.trim().toUpperCase() || '';
        if (!filters.auditFlag.some(flag => claimAuditFlag === flag.trim().toUpperCase())) return false;
      }
      if (filters.claimStatus.length > 0) {
        const claimStatus = claim.claimStatus?.trim() || '';
        if (!filters.claimStatus.some(status => claimStatus === status.trim())) return false;
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
    // Normalize claim IDs for matching (trim and case-insensitive if needed)
    const normalizedClaimId = claimId.trim();
    return lineData.filter(line => {
      const normalizedLineClaimId = line.clmId.trim();
      // Try exact match first
      if (normalizedLineClaimId === normalizedClaimId) {
        return true;
      }
      // Try case-insensitive match
      if (normalizedLineClaimId.toLowerCase() === normalizedClaimId.toLowerCase()) {
        return true;
      }
      return false;
    });
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
