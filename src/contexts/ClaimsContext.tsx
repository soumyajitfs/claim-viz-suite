import React, { createContext, useContext, ReactNode } from 'react';
import { useClaimsData } from '@/hooks/useClaimsData';
import { ClaimData, LineData, FilterState } from '@/types/claims';

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
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const claimsData = useClaimsData();

  return (
    <ClaimsContext.Provider value={claimsData}>
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
