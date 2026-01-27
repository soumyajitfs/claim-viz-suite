import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useClaimsData } from '@/hooks/useClaimsData';
import { ClaimData, LineData, FilterState } from '@/types/claims';

type DataSource = 'claim-data-2' | 'facets-claim-data';

interface ClaimsContextType {
  claimsData: ClaimData[];
  lineData: LineData[];
  loading: boolean;
  error: string | null;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filterOptions: {
    aaInd: string[];
    clmTyCd: string[];
    formTyCd: string[];
    claimStatus: string[];
  };
  kpiMetrics: {
    totalClaims: number;
    totalAmount: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  getLineItemsForClaim: (claimId: string) => LineData[];
  dataSource: DataSource;
  toggleDataSource: () => void;
  dataSourceLabel: string;
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

const getExcelFileName = (source: DataSource): string => {
  switch (source) {
    case 'facets-claim-data':
      return 'Facets_Claim Data.xlsx';
    case 'claim-data-2':
    default:
      return 'Claim Data 2.xlsx';
  }
};

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const [dataSource, setDataSource] = useState<DataSource>('claim-data-2');
  const excelFileName = getExcelFileName(dataSource);
  const claimsData = useClaimsData(excelFileName);

  const toggleDataSource = () => {
    setDataSource(prev => prev === 'claim-data-2' ? 'facets-claim-data' : 'claim-data-2');
  };

  const dataSourceLabel = dataSource === 'claim-data-2' ? 'Nasco Claim data' : 'Facets Claim Data';

  return (
    <ClaimsContext.Provider value={{
      ...claimsData,
      dataSource,
      toggleDataSource,
      dataSourceLabel,
    }}>
      {children}
    </ClaimsContext.Provider>
  );
}

export function useClaims(): ClaimsContextType {
  const context = useContext(ClaimsContext);
  if (context === undefined) {
    throw new Error('useClaims must be used within a ClaimsProvider');
  }
  return context;
}
