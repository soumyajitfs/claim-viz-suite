import { FileText } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="bg-header text-header-foreground py-4 px-6 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Claim Inventory Management</h1>
          <p className="text-sm text-white/70">Enterprise Claims Analytics Dashboard</p>
        </div>
      </div>
    </header>
  );
}
