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
  return dateStr;
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
  const totalPaidAmt = lineItems.reduce((sum, item) => sum + item.paidAmt, 0);
  const totalCvrdAmt = lineItems.reduce((sum, item) => sum + item.cvrdAmt, 0);

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
                <span className="ml-4">
                  • {claimInfo.billProv_nm} • {claimInfo.billProv_stCd}
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
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

        <Card className="bg-kpi text-kpi-foreground shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Paid Amount</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalPaidAmt)}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-kpi text-kpi-foreground shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Covered Amount</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalCvrdAmt)}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
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
