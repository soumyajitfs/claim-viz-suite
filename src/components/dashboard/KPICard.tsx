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
  const variantStyles = {
    default: 'bg-kpi text-kpi-foreground',
    primary: 'bg-kpi text-kpi-foreground',
    high: 'bg-risk-high text-white',
    medium: 'bg-risk-medium text-white',
    low: 'bg-risk-low text-white',
  };

  return (
    <div className={cn(
      'rounded-xl p-5 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]',
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-75">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-3 bg-white/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
