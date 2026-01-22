import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'high' | 'medium' | 'low';
  subtitle?: string;
}

export function KPICard({ title, value, icon, variant = 'default', subtitle }: KPICardProps) {
  // All cards use blue background with white text
  const variantStyles = {
    default: 'bg-kpi text-kpi-foreground',
    primary: 'bg-kpi text-kpi-foreground',
    high: 'bg-kpi text-kpi-foreground',
    medium: 'bg-kpi text-kpi-foreground',
    low: 'bg-kpi text-kpi-foreground',
  };

  return (
    <div className={cn(
      'rounded-lg p-4 shadow-sm transition-all hover:shadow-md',
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium opacity-90 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-75">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2 bg-white/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
