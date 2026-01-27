import { useClaims } from '@/contexts/ClaimsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';

export function FilterPanel() {
  const { filters, setFilters, filterOptions } = useClaims();

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    if (key === 'searchClaimId') {
      setFilters(prev => ({ ...prev, [key]: value }));
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value === 'all' ? [] : [value],
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      aaInd: [],
      clmTyCd: [],
      formTyCd: [],
      priority: [],
      auditFlag: [],
      claimStatus: [],
      searchClaimId: '',
    });
  };

  const activeFilterCount = 
    filters.aaInd.length + 
    filters.clmTyCd.length + 
    filters.formTyCd.length + 
    filters.priority.length +
    filters.auditFlag.length +
    filters.claimStatus.length +
    (filters.searchClaimId ? 1 : 0);

  return (
    <div className="bg-card border-b px-4 py-2">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
        <Select
          value={filters.aaInd[0] || 'all'}
          onValueChange={(value) => handleFilterChange('aaInd', value)}
        >
          <SelectTrigger className="w-[220px] h-9 text-sm shrink-0">
            <SelectValue placeholder="Auto Adjudication Indicator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Auto Adjudication Indicator</SelectItem>
            {filterOptions.aaInd.map(option => {
              // Map N/Y to readable labels, or use the value as-is if it's already descriptive
              let displayLabel = option;
              if (option === 'N' || option.toLowerCase() === 'n') {
                displayLabel = 'Manual adjudication';
              } else if (option === 'Y' || option.toLowerCase() === 'y') {
                displayLabel = 'Auto Adjudicated';
              } else if (option.toLowerCase().includes('manual')) {
                displayLabel = 'Manual adjudication';
              } else if (option.toLowerCase().includes('auto')) {
                displayLabel = 'Auto Adjudicated';
              }
              return (
                <SelectItem key={option} value={option}>{displayLabel}</SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select
          value={filters.clmTyCd[0] || 'all'}
          onValueChange={(value) => handleFilterChange('clmTyCd', value)}
        >
          <SelectTrigger className="w-[180px] h-9 text-sm shrink-0">
            <SelectValue placeholder="Provider Network code" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Provider Network code</SelectItem>
            {filterOptions.clmTyCd.map(option => {
              // Map codes to descriptive names, or use the value as-is if it's already descriptive
              let displayLabel = option;
              const upperOption = option.toUpperCase().trim();
              const lowerOption = option.toLowerCase().trim();
              
              // If it's already a descriptive name, use it as-is
              if (lowerOption.includes('in network') || lowerOption.includes('out of network') || 
                  lowerOption.includes('innetwork') || lowerOption.includes('outofnetwork')) {
                displayLabel = option; // Already descriptive, use as-is
              } else {
                // Map codes to descriptive names
                if (upperOption === 'I' || upperOption === 'IN' || lowerOption === 'in') {
                  displayLabel = 'In Network';
                } else if (upperOption === 'O' || upperOption === 'OUT' || lowerOption === 'out') {
                  displayLabel = 'Out of Network';
                } else if (upperOption === 'N' || lowerOption === 'network') {
                  // Could be either, but typically 'N' means 'In Network'
                  displayLabel = 'In Network';
                }
              }
              return (
                <SelectItem key={option} value={option}>{displayLabel}</SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select
          value={filters.formTyCd[0] || 'all'}
          onValueChange={(value) => handleFilterChange('formTyCd', value)}
        >
          <SelectTrigger className="w-[180px] h-9 text-sm shrink-0">
            <SelectValue placeholder="Claim Form Type Code" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Claim Form Type Code</SelectItem>
            {filterOptions.formTyCd.map(option => {
              // Map codes to descriptive names, or use the value as-is if it's already descriptive
              let displayLabel = option;
              const upperOption = option.toUpperCase().trim();
              const lowerOption = option.toLowerCase().trim();
              
              // If it's already a descriptive name, use it as-is
              if (lowerOption.includes('professional') || lowerOption.includes('institutional') || 
                  lowerOption.includes('inpatient') || lowerOption.includes('outpatient')) {
                displayLabel = option; // Already descriptive, use as-is
              } else {
                // Map codes to descriptive names
                if (upperOption === 'H') {
                  displayLabel = 'Professional';
                } else if (upperOption === 'U') {
                  displayLabel = 'Institutional';
                } else if (upperOption === 'I') {
                  displayLabel = 'Inpatient';
                } else if (upperOption === 'O') {
                  displayLabel = 'Outpatient';
                }
              }
              return (
                <SelectItem key={option} value={option}>{displayLabel}</SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority[0] || 'all'}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className="w-[180px] h-9 text-sm shrink-0">
            <SelectValue placeholder="Model classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Model classification</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.auditFlag[0] || 'all'}
          onValueChange={(value) => handleFilterChange('auditFlag', value)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm shrink-0">
            <SelectValue placeholder="Audit flag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Audit flag</SelectItem>
            <SelectItem value="Y">Y</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.claimStatus[0] || 'all'}
          onValueChange={(value) => handleFilterChange('claimStatus', value)}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm shrink-0">
            <SelectValue placeholder="Claim Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Claim Status</SelectItem>
            {filterOptions.claimStatus.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-[250px] shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Claim ID..."
            value={filters.searchClaimId}
            onChange={(e) => handleFilterChange('searchClaimId', e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 shrink-0">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
