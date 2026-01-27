import { useMemo } from 'react';
import { useClaims } from '@/contexts/ClaimsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const PRIMARY_BLUE = 'hsl(192, 70%, 40%)';

export function ChartsSection() {
  const { claimsData, loading, dataSource } = useClaims();

  // Hardcoded data for Facets Claim Data to match Claim Data 2 (for UI purposes)
  const hardcodedCityData = [
    { name: 'Atlanta', value: 4 },
    { name: 'Falls Church', value: 4 },
    { name: 'Charlotte', value: 4 },
    { name: 'Nashville', value: 2 },
    { name: 'Arlington', value: 2 },
    { name: 'Rockville', value: 2 },
    { name: 'Leesburg', value: 2 },
    { name: 'null', value: 2 },
  ];

  const hardcodedProviderSpecialityData = [
    { name: 'PHY', value: 13 },
    { name: 'HS', value: 7 },
    { name: 'HOSP', value: 4 },
    { name: 'FAC', value: 3 },
    { name: 'EM', value: 2 },
    { name: 'AM', value: 2 },
    { name: 'RO', value: 2 },
    { name: 'LA', value: 2 },
    { name: 'OS', value: 1 },
    { name: 'AN', value: 1 },
  ];

  const cityData = useMemo(() => {
    // For Facets Claim Data, use hardcoded data (same as Claim Data 2)
    if (dataSource === 'facets-claim-data') {
      return hardcodedCityData;
    }
    
    // For Claim Data 2, use actual data
    const counts: Record<string, number> = {};
    claimsData.forEach(claim => {
      const city = claim.billProv_city || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [claimsData, dataSource]);

  const providerSpecialityData = useMemo(() => {
    // For Facets Claim Data, use hardcoded data (same as Claim Data 2)
    if (dataSource === 'facets-claim-data') {
      return hardcodedProviderSpecialityData;
    }
    
    // For Claim Data 2, use actual data
    const counts: Record<string, number> = {};
    claimsData.forEach(claim => {
      // Use ONLY the providerSpeciality field from "Claims by Provider Speciality" column in Excel
      // Do not use any fallback - only use data from this specific column
      const speciality = claim.providerSpeciality?.trim();
      if (speciality && speciality !== '' && speciality !== 'null' && speciality !== 'undefined') {
        counts[speciality] = (counts[speciality] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [claimsData, dataSource]);

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
        <CardHeader className="pb-0 pt-1 px-2">
          <CardTitle className="text-sm font-bold">Claims by Provider City</CardTitle>
        </CardHeader>
        <CardContent className="px-0.5 py-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cityData} margin={{ top: 3, right: 3, bottom: 55, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                angle={-90} 
                textAnchor="end" 
                height={55}
                interval={0}
                label={{ value: 'Provider City', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold' } }} 
              />
              <YAxis 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                width={28}
                label={{ value: 'Number of Claims', angle: -90, position: 'insideLeft', offset: -2, style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold' } }} 
              />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="value" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Provider Speciality Chart - Changed to vertical bar chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-1 px-2">
          <CardTitle className="text-sm font-bold">Claims by Provider Speciality</CardTitle>
        </CardHeader>
        <CardContent className="px-0.5 py-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={providerSpecialityData} margin={{ top: 3, right: 3, bottom: 55, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                angle={-90} 
                textAnchor="end" 
                height={55}
                interval={0}
                label={{ value: 'Provider Speciality', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold' } }} 
              />
              <YAxis 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                width={28}
                label={{ value: 'Number of Claims', angle: -90, position: 'insideLeft', offset: -2, style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold' } }} 
              />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="value" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Amount Range Distribution */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-1 px-2">
          <CardTitle className="text-sm font-bold">Claim Amount Distribution</CardTitle>
        </CardHeader>
        <CardContent className="px-0.5 py-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={amountRangeData} margin={{ top: 3, right: 3, bottom: 75, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                angle={-90} 
                textAnchor="end" 
                height={75}
                interval={0}
                label={{ value: 'Claim Amount Range ($)', position: 'insideBottom', offset: -60, style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold' } }} 
              />
              <YAxis 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                width={28}
                label={{ value: 'Number of Claims', angle: -90, position: 'insideLeft', offset: -2, style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold' } }} 
              />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="count" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Distribution - Bar Chart instead of donut */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-1 px-2">
          <CardTitle className="text-sm font-bold">Adjustment Risk distribution</CardTitle>
        </CardHeader>
        <CardContent className="px-0.5 py-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskData} margin={{ top: 3, right: 3, bottom: 35, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                label={{ value: 'Risk Level', position: 'insideBottom', offset: -2, style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold' } }} 
              />
              <YAxis 
                tick={{ fontSize: 10, fontWeight: 'bold' }} 
                width={28}
                label={{ value: 'Number of Claims', angle: -90, position: 'insideLeft', offset: -2, style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold' } }} 
              />
              <Tooltip formatter={(value: number) => [value, 'Claims']} />
              <Bar dataKey="value" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
