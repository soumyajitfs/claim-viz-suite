import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClaims } from '@/contexts/ClaimsContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClaimData } from '@/types/claims';

const ITEMS_PER_PAGE = 5;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  
  // Try parsing as ISO string first
  let date = new Date(dateStr);
  
  // If that fails, check if it's an Excel serial number (numeric string)
  if (isNaN(date.getTime())) {
    const numValue = parseFloat(dateStr);
    if (!isNaN(numValue) && numValue > 0 && numValue < 100000) {
      // Excel serial number: days since January 1, 1900
      // Excel incorrectly treats 1900 as a leap year, so we subtract 1
      const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
      date = new Date(excelEpoch.getTime() + (numValue - 1) * 86400000);
    }
  }
  
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPercentage(value: string): string {
  if (!value || value.trim() === '' || value === 'null' || value === 'undefined') return '-';
  
  // Remove any existing % sign and trim whitespace
  const cleanedValue = value.trim().replace(/%/g, '');
  const numValue = parseFloat(cleanedValue);
  
  // If not a valid number, return the original value
  if (isNaN(numValue)) return value;
  
  // If value is between 0 and 1 (e.g., 0.15), treat as decimal and convert to percentage
  // If value is >= 1 (e.g., 15), treat as already a percentage
  let percentageValue: number;
  if (numValue > 0 && numValue <= 1) {
    percentageValue = numValue * 100;
  } else {
    percentageValue = numValue;
  }
  
  // Format with 2 decimal places and add % sign
  return `${percentageValue.toFixed(2)}%`;
}

function RiskBadge({ risk }: { risk: string }) {
  // Use different colors for High, Medium, Low in table column only
  const variants: Record<string, { className: string }> = {
    High: { className: 'bg-risk-high text-white hover:bg-risk-high/90' },
    Medium: { className: 'bg-risk-medium text-white hover:bg-risk-medium/90' },
    Low: { className: 'bg-risk-low text-white hover:bg-risk-low/90' },
  };

  return (
    <Badge className={cn('font-medium', variants[risk]?.className || 'bg-risk-medium text-white')}>
      {risk}
    </Badge>
  );
}

type SortField = keyof ClaimData;
type SortDirection = 'asc' | 'desc';

export function ClaimsTable() {
  const { claimsData, loading } = useClaims();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [riskFilter, setRiskFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRiskFilter = () => {
    // Cycle through: all -> High -> Medium -> Low -> all
    if (riskFilter === 'all') {
      setRiskFilter('High');
    } else if (riskFilter === 'High') {
      setRiskFilter('Medium');
    } else if (riskFilter === 'Medium') {
      setRiskFilter('Low');
    } else {
      setRiskFilter('all');
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Filter by risk level first, then sort
  const filteredByRisk = riskFilter === 'all' 
    ? claimsData 
    : claimsData.filter(claim => claim.priority === riskFilter);

  const sortedData = [...filteredByRisk].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal || '').toLowerCase();
    const bStr = String(bVal || '').toLowerCase();
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleRowClick = (claimId: string) => {
    navigate(`/claim/${claimId}`);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 -ml-3 gap-1 font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="h-3 w-3 flex-shrink-0" />
    </Button>
  );

  return (
    <div className="px-4 pb-4">
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Claims Inventory</h3>
          <p className="text-xs text-muted-foreground">Click on a claim to view line item details</p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="w-[120px] whitespace-nowrap">
                  <SortableHeader field="clmId">Claim ID</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3 gap-1 font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap"
                    onClick={handleRiskFilter}
                  >
                    Model classification {riskFilter !== 'all' && `(${riskFilter})`}
                    <ArrowUpDown className="h-3 w-3 flex-shrink-0" />
                  </Button>
                </TableHead>
                <TableHead className="w-[80px] whitespace-nowrap">
                  <SortableHeader field="score">Score</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Audit Flag</TableHead>
                <TableHead className="w-[130px] whitespace-nowrap">
                  <SortableHeader field="rcvdTs">Received Date</SortableHeader>
                </TableHead>
                <TableHead className="w-[130px] whitespace-nowrap">
                  <SortableHeader field="clmAmt_totChrgAmt">Claim Amount</SortableHeader>
                </TableHead>
                <TableHead className="w-[130px] whitespace-nowrap">
                  <SortableHeader field="clmAmt_totAllowAmt">Allow Amount</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Form Type</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">
                  <SortableHeader field="paperEdiCd">paperEdiCd</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">
                  <SortableHeader field="billTyCd">billTyCd</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">
                  <SortableHeader field="billProv_stCd">billProv_stCd</SortableHeader>
                </TableHead>
                <TableHead className="w-[120px] whitespace-nowrap">Provider City</TableHead>
                <TableHead className="w-[150px] whitespace-nowrap">
                  <SortableHeader field="billProv_dervCpfTyCd2">Provider Speciality</SortableHeader>
                </TableHead>
                <TableHead className="w-[80px] whitespace-nowrap">
                  <SortableHeader field="patDemo_patAge">Age</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">
                  <SortableHeader field="patDemo_patGndr">Gender</SortableHeader>
                </TableHead>
                <TableHead className="w-[180px] whitespace-nowrap">Provider</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Benopt</TableHead>
                <TableHead className="w-[120px] whitespace-nowrap">Provider Par Ind</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Provider Nt Cd</TableHead>
                <TableHead className="w-[150px] whitespace-nowrap">Appeal Reason</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">Appeal ID</TableHead>
                <TableHead className="w-[150px]">
                  <SortableHeader field="benefitPlanUpdateDate">
                    <span className="whitespace-nowrap">Benefit plan update date</span>
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[150px]">
                  <SortableHeader field="billingProviderContractUpdateDate">
                    <span className="whitespace-nowrap">Billing Provider contract update date</span>
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[120px] whitespace-nowrap">
                  <SortableHeader field="claimStatus">Claim Status</SortableHeader>
                </TableHead>
                <TableHead className="w-[130px] whitespace-nowrap">
                  <SortableHeader field="claimPaidDate">Claim Paid date</SortableHeader>
                </TableHead>
                <TableHead className="w-[150px]">
                  <SortableHeader field="historicalAdjRateByVersion">
                    <span className="whitespace-nowrap">Historical Adj Rate</span>
                  </SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((claim) => (
                <TableRow
                  key={claim.clmId}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleRowClick(claim.clmId)}
                >
                  <TableCell className="font-medium text-primary">
                    <div className="flex items-center gap-1">
                      {claim.clmId}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk={claim.priority} />
                  </TableCell>
                  <TableCell className="font-mono">{claim.score.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">
                    {claim.auditFlag && claim.auditFlag.trim() !== '' && claim.auditFlag.trim().toUpperCase() === 'Y' ? (
                      <Badge className="bg-[hsl(192,65%,30%)] text-white hover:bg-[hsl(192,65%,30%)] font-medium">
                        {claim.auditFlag.trim().toUpperCase()}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{formatDate(claim.rcvdTs)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(claim.clmAmt_totChrgAmt)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(claim.clmAmt_totAllowAmt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{claim.formTyCd || '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{claim.paperEdiCd || '-'}</TableCell>
                  <TableCell className="text-sm">{claim.billTyCd || '-'}</TableCell>
                  <TableCell className="text-sm">{claim.billProv_stCd || '-'}</TableCell>
                  <TableCell className="text-sm">{claim.billProv_city || '-'}</TableCell>
                  <TableCell className="text-sm">{claim.billProv_dervCpfTyCd2 || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {claim.patDemo_patAge && claim.patDemo_patAge > 0 ? claim.patDemo_patAge : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {claim.patDemo_patGndr ? claim.patDemo_patGndr.toUpperCase().substring(0, 1) : '-'}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[180px]" title={claim.billProv_nm}>
                    {claim.billProv_nm || '-'}
                  </TableCell>
                  <TableCell className="text-sm">{claim.benopt || '-'}</TableCell>
                  <TableCell className="text-sm">{claim.billProv_dervParInd || '-'}</TableCell>
                  <TableCell className="text-sm">{claim.billProv_ntCd || '-'}</TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]" title={claim.appealReason}>
                    {claim.appealReason && claim.appealReason.trim() !== '' ? claim.appealReason : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {claim.appealId && claim.appealId.trim() !== '' ? claim.appealId.trim() : '-'}
                  </TableCell>
                  <TableCell>{formatDate(claim.benefitPlanUpdateDate)}</TableCell>
                  <TableCell>{formatDate(claim.billingProviderContractUpdateDate)}</TableCell>
                  <TableCell className="text-sm">
                    {claim.claimStatus && claim.claimStatus.trim() !== '' ? (
                      <Badge variant="outline">{claim.claimStatus.trim()}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{formatDate(claim.claimPaidDate)}</TableCell>
                  <TableCell className="text-sm">
                    {formatPercentage(claim.historicalAdjRateByVersion)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length)} of {sortedData.length} claims
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
