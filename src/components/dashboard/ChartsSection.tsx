import { useMemo } from 'react';
import { useClaims } from '@/contexts/ClaimsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const CHART_COLORS = [
  'hsl(192, 70%, 40%)',
  'hsl(38, 92%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(280, 65%, 60%)',
  'hsl(0, 72%, 51%)',
  'hsl(200, 70%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(320, 70%, 55%)',
];

const RISK_COLORS = {
  High: 'hsl(0, 72%, 51%)',
  Medium: 'hsl(38, 92%, 50%)',
  Low: 'hsl(142, 71%, 45%)',
};

export function ChartsSection() {
  const { claimsData, loading } = useClaims();

  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    claimsData.forEach(claim => {
      const city = claim.billProv_city || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [claimsData]);

  const providerTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    claimsData.forEach(claim => {
      const type = claim.billProv_dervCpfTyCd2 || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [claimsData]);

  const amountRangeData = useMemo(() => {
    const counts: Record<string, number> = {};
    claimsData.forEach(claim => {
      const range = claim.clmAmtRange;
      counts[range] = (counts[range] || 0) + 1;
    });
    
    const sortOrder = ['0-500', '500-1000', '1000-1500', '1500-2000', '2000-2500', '2500-3000', '3000-3500', '3500-4000', '5000-10000', '10000-20000', '20000-30000', '30000-50000', '50000-100000', '100000+'];
    
    return Object.entries(counts)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const aIdx = sortOrder.indexOf(a.range);
        const bIdx = sortOrder.indexOf(b.range);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
  }, [claimsData]);

  const riskData = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    claimsData.forEach(claim => {
      if (claim.priority in counts) {
        counts[claim.priority as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [claimsData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-72 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Provider City Pie Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Claims by Billing Provider City</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={cityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {cityData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Provider Type Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Claims by Provider Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={providerTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="value" fill="hsl(192, 70%, 40%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Amount Range Distribution */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Claim Amount Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={amountRangeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="count" fill="hsl(200, 70%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Distribution Pie Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {riskData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
