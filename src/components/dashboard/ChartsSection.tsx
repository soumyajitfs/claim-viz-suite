import { useMemo } from 'react';
import { useClaims } from '@/contexts/ClaimsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const PRIMARY_BLUE = 'hsl(192, 70%, 40%)';

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

  const providerSpecialityData = useMemo(() => {
    const counts: Record<string, number> = {};
    claimsData.forEach(claim => {
      const speciality = claim.billProv_dervCpfTyCd2 || 'Unknown';
      counts[speciality] = (counts[speciality] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 px-4 pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-56 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 px-4 pb-2">
      {/* Provider City Chart - Blue shades only */}
      <Card className="shadow-sm">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm font-semibold">Claims by Provider City</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cityData} margin={{ top: 5, right: 5, bottom: 50, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} label={{ value: 'Provider City', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '10px' } }} />
              <YAxis tick={{ fontSize: 9 }} label={{ value: 'Number of Claims', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px' } }} />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="value" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Provider Speciality Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm font-semibold">Claims by Provider Speciality</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={providerSpecialityData} layout="vertical" margin={{ top: 5, right: 5, bottom: 50, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} label={{ value: 'Number of Claims', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '10px' } }} />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 9 }} label={{ value: 'Provider Speciality', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px' } }} />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="value" fill={PRIMARY_BLUE} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Amount Range Distribution */}
      <Card className="shadow-sm">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm font-semibold">Claim Amount Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={amountRangeData} margin={{ top: 5, right: 5, bottom: 50, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={60} label={{ value: 'Claim Amount Range ($)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '10px' } }} />
              <YAxis tick={{ fontSize: 9 }} label={{ value: 'Number of Claims', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px' } }} />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="count" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Distribution - Bar Chart instead of donut */}
      <Card className="shadow-sm">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm font-semibold">Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskData} margin={{ top: 5, right: 5, bottom: 50, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} label={{ value: 'Risk Level', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '10px' } }} />
              <YAxis tick={{ fontSize: 9 }} label={{ value: 'Number of Claims', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '10px' } }} />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="value" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
