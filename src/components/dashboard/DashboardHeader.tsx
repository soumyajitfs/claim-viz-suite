import { FileText } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="bg-header text-header-foreground py-3 px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-white/10 rounded-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Claim Inventory Management-Propensity for Adjustments</h1>
          <p className="text-xs text-white/70">Enterprise Claims Analytics Dashboard</p>
        </div>
      </div>
    </header>
  );
}
