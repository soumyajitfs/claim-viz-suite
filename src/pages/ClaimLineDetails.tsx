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

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'null') return '-';
  const date = new Date(dateStr);
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
                      <TableHead>Claim Line #</TableHead>
                      <TableHead>EDI Line #</TableHead>
                      <TableHead>Begin Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Procedure Code</TableHead>
                      <TableHead>Diagnosis Code</TableHead>
                      <TableHead>Revenue Code</TableHead>
                      <TableHead>Service ID</TableHead>
                      <TableHead>RNC Code</TableHead>
                      <TableHead>NDC</TableHead>
                      <TableHead>POS Code</TableHead>
                      <TableHead>Pre Auth</TableHead>
                      <TableHead>RM Type</TableHead>
                      <TableHead>Drug Units</TableHead>
                      <TableHead>Drug UOM</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead className="text-right">Charged Amt</TableHead>
                      <TableHead className="text-right">Covered Amt</TableHead>
                      <TableHead className="text-right">Paid Amt</TableHead>
                      <TableHead className="text-right">Coinsurance</TableHead>
                      <TableHead className="text-right">Deductible</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={`${item.clmId}-${item.clmLnNum}-${index}`} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant="outline">{item.clmLnNum}</Badge>
                        </TableCell>
                        <TableCell>{item.ediLnNum}</TableCell>
                        <TableCell>{formatDate(item.lnBeginDt)}</TableCell>
                        <TableCell>{formatDate(item.lnEndDt)}</TableCell>
                        <TableCell className="font-mono text-sm">{displayValue(item.procCd)}</TableCell>
                        <TableCell className="font-mono text-sm">{displayValue(item.diagCd)}</TableCell>
                        <TableCell className="font-mono text-sm">{displayValue(item.revnuCd)}</TableCell>
                        <TableCell className="font-mono text-sm">{displayValue(item.serviceId)}</TableCell>
                        <TableCell className="font-mono text-sm">{displayValue(item.rncCd)}</TableCell>
                        <TableCell className="font-mono text-sm">{displayValue(item.ndc)}</TableCell>
                        <TableCell>{displayValue(item.posCd)}</TableCell>
                        <TableCell>{displayValue(item.preAuthInd)}</TableCell>
                        <TableCell>{displayValue(item.rmTyp)}</TableCell>
                        <TableCell>{displayValue(item.drugUnits)}</TableCell>
                        <TableCell>{displayValue(item.drugUom)}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{displayValue(item.uom)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.chrgAmt)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.cvrdAmt)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.paidAmt)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.coinsAmt)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.dedAmt)}</TableCell>
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
