import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPISummary } from '@/components/dashboard/KPISummary';
import { FilterPanel } from '@/components/dashboard/FilterPanel';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { ClaimsTable } from '@/components/dashboard/ClaimsTable';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <KPISummary />
      <FilterPanel />
      <ChartsSection />
      <ClaimsTable />
    </div>
  );
};

export default Index;
