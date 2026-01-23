import { useParams, useNavigate } from 'react-router-dom';
import { useClaims } from '@/contexts/ClaimsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, DollarSign, Hash } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function displayDate(dateStr: string): string {
  if (!dateStr || dateStr === 'null') return '-';
  
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

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '' || value === 'null') return '-';
  return String(value);
}

export default function ClaimLineDetails() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { getLineItemsForClaim, claimsData, loading } = useClaims();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const lineItems = getLineItemsForClaim(claimId || '');
  const claimInfo = claimsData.find(c => c.clmId === claimId);

  const totalChrgAmt = lineItems.reduce((sum, item) => sum + item.chrgAmt, 0);

  // Calculate distinct counts for Diagnosis Codes
  const distinctDiagCodes = new Set(
    lineItems
      .map(item => item.diagCd?.trim())
      .filter(code => code && code !== '' && code !== '-' && code !== 'null')
  );
  
  // Calculate total count (not distinct) for Procedure Codes
  const procCodeCount = lineItems.filter(
    item => item.procCd?.trim() && item.procCd.trim() !== '' && item.procCd.trim() !== '-' && item.procCd.trim() !== 'null'
  ).length;
  
  // Calculate total count (not distinct) for Revenue Codes
  const revCodeCount = lineItems.filter(
    item => item.revnuCd?.trim() && item.revnuCd.trim() !== '' && item.revnuCd.trim() !== '-' && item.revnuCd.trim() !== 'null'
  ).length;

  // Determine which metrics to show based on data availability
  const hasDistinctDiagCodes = distinctDiagCodes.size > 0;
  
  // Priority: Try distinct counts first, fallback to procedure + revenue if diagnosis not possible
  const showDiagCodeMetric = hasDistinctDiagCodes;
  const showProcCodeMetric = true; // Always show procedure code
  const showRevCodeMetric = true; // Always show revenue code count

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-header text-header-foreground py-4 px-6 shadow-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Claim Line Item Details</h1>
            <p className="text-sm text-white/70">
              Claim ID: <span className="font-semibold text-white">{claimId}</span>
              {claimInfo && (
                <>
                  <span className="ml-4">
                    • {claimInfo.billProv_nm} • {claimInfo.billProv_stCd}
                  </span>
                  {claimInfo.formTyCd && (
                    <span className="ml-4">
                      • Form Type: <span className="font-semibold text-white">{claimInfo.formTyCd}</span>
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 ${showDiagCodeMetric ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 p-4`}>
        <Card className="bg-kpi text-kpi-foreground shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Line Items</p>
                <p className="text-3xl font-bold mt-1">{lineItems.length}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <Hash className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-kpi text-kpi-foreground shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Charged Amount</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalChrgAmt)}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {showDiagCodeMetric && (
          <Card className="bg-kpi text-kpi-foreground shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Diagnosis Codes</p>
                  <p className="text-3xl font-bold mt-1">{distinctDiagCodes.size}</p>
                  <p className="text-xs mt-1 opacity-75">Distinct</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showProcCodeMetric && (
          <Card className="bg-kpi text-kpi-foreground shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Procedure Codes</p>
                  <p className="text-3xl font-bold mt-1">{procCodeCount}</p>
                  <p className="text-xs mt-1 opacity-75">Count</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showRevCodeMetric && (
          <Card className="bg-kpi text-kpi-foreground shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Revenue Codes</p>
                  <p className="text-3xl font-bold mt-1">{revCodeCount}</p>
                  <p className="text-xs mt-1 opacity-75">Count</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Line Items Table */}
      <div className="p-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Line Item Services</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lineItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No line items found for this claim.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>chrgAmt</TableHead>
                      <TableHead>clmLnNum</TableHead>
                      <TableHead>ediLnNum</TableHead>
                      <TableHead>coinsAmt</TableHead>
                      <TableHead>cvrdAmt</TableHead>
                      <TableHead>dedAmt</TableHead>
                      <TableHead>lnBeginDt</TableHead>
                      <TableHead>lnEndDt</TableHead>
                      <TableHead>ndc</TableHead>
                      <TableHead>paidAmt</TableHead>
                      <TableHead>posCd</TableHead>
                      <TableHead>preAuthInd</TableHead>
                      <TableHead>revnuCd</TableHead>
                      <TableHead>rmTyp</TableHead>
                      <TableHead>serviceId</TableHead>
                      <TableHead>procCd</TableHead>
                      <TableHead>diagCd</TableHead>
                      <TableHead>rncCd</TableHead>
                      <TableHead>drugUnits</TableHead>
                      <TableHead>drugUom</TableHead>
                      <TableHead>count</TableHead>
                      <TableHead>uom</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={`${item.clmId}-${item.clmLnNum}-${index}`} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.chrgAmt}</TableCell>
                        <TableCell>{item.clmLnNum}</TableCell>
                        <TableCell>{item.ediLnNum}</TableCell>
                        <TableCell>{item.coinsAmt}</TableCell>
                        <TableCell>{item.cvrdAmt}</TableCell>
                        <TableCell>{item.dedAmt}</TableCell>
                        <TableCell>{displayDate(item.lnBeginDt)}</TableCell>
                        <TableCell>{displayDate(item.lnEndDt)}</TableCell>
                        <TableCell>{displayValue(item.ndc)}</TableCell>
                        <TableCell>{item.paidAmt}</TableCell>
                        <TableCell>{displayValue(item.posCd)}</TableCell>
                        <TableCell>{displayValue(item.preAuthInd)}</TableCell>
                        <TableCell>{displayValue(item.revnuCd)}</TableCell>
                        <TableCell>{displayValue(item.rmTyp)}</TableCell>
                        <TableCell>{displayValue(item.serviceId)}</TableCell>
                        <TableCell>{displayValue(item.procCd)}</TableCell>
                        <TableCell>{displayValue(item.diagCd)}</TableCell>
                        <TableCell>{displayValue(item.rncCd)}</TableCell>
                        <TableCell>{displayValue(item.drugUnits)}</TableCell>
                        <TableCell>{displayValue(item.drugUom)}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{displayValue(item.uom)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
