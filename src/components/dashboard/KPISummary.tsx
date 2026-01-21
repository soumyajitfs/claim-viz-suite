import { useClaims } from '@/contexts/ClaimsContext';
import { KPICard } from './KPICard';
import { FileStack, DollarSign, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

export function KPISummary() {
  const { kpiMetrics, loading } = useClaims();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-card border-b">
      <KPICard
        title="# Claims Inventory"
        value={kpiMetrics.totalClaims.toLocaleString()}
        icon={<FileStack className="h-6 w-6" />}
        variant="primary"
      />
      <KPICard
        title="Claim Amount"
        value={formatCurrency(kpiMetrics.totalAmount)}
        icon={<DollarSign className="h-6 w-6" />}
        variant="primary"
        subtitle="Total Charged"
      />
      <KPICard
        title="High Risk"
        value={kpiMetrics.highRisk}
        icon={<AlertTriangle className="h-6 w-6" />}
        variant="high"
      />
      <KPICard
        title="Medium Risk"
        value={kpiMetrics.mediumRisk}
        icon={<AlertCircle className="h-6 w-6" />}
        variant="medium"
      />
      <KPICard
        title="Low Risk"
        value={kpiMetrics.lowRisk}
        icon={<CheckCircle className="h-6 w-6" />}
        variant="low"
      />
    </div>
  );
}
