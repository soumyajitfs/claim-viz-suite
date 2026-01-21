import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClaims } from '@/contexts/ClaimsContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClaimData } from '@/types/claims';

const ITEMS_PER_PAGE = 10;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function RiskBadge({ risk }: { risk: string }) {
  const variants: Record<string, { className: string }> = {
    High: { className: 'bg-risk-high text-white hover:bg-risk-high/90' },
    Medium: { className: 'bg-risk-medium text-white hover:bg-risk-medium/90' },
    Low: { className: 'bg-risk-low text-white hover:bg-risk-low/90' },
  };

  return (
    <Badge className={cn('font-medium', variants[risk]?.className || '')}>
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...claimsData].sort((a, b) => {
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
      className="h-8 -ml-3 gap-1 font-semibold text-muted-foreground hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );

  return (
    <div className="p-4">
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="font-semibold text-foreground">Claims Inventory</h3>
          <p className="text-sm text-muted-foreground">Click on a claim to view line item details</p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="w-[120px]">
                  <SortableHeader field="clmId">Claim ID</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortableHeader field="priority">Risk</SortableHeader>
                </TableHead>
                <TableHead className="w-[80px]">
                  <SortableHeader field="score">Score</SortableHeader>
                </TableHead>
                <TableHead className="w-[130px]">
                  <SortableHeader field="rcvdTs">Received Date</SortableHeader>
                </TableHead>
                <TableHead className="w-[130px]">
                  <SortableHeader field="clmAmt_totChrgAmt">Claim Amount</SortableHeader>
                </TableHead>
                <TableHead className="w-[100px]">Form Type</TableHead>
                <TableHead className="w-[100px]">Input Method</TableHead>
                <TableHead className="w-[100px]">State</TableHead>
                <TableHead className="w-[180px]">Provider</TableHead>
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
                  <TableCell>{formatDate(claim.rcvdTs)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(claim.clmAmt_totChrgAmt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{claim.formTyCd || '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{claim.paperEdiCd || '-'}</TableCell>
                  <TableCell className="text-sm">{claim.billProv_stCd || '-'}</TableCell>
                  <TableCell className="text-sm truncate max-w-[180px]" title={claim.billProv_nm}>
                    {claim.billProv_nm || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
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
