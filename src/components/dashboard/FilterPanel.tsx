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
          <SelectTrigger className="w-[140px] h-9 text-sm shrink-0">
            <SelectValue placeholder="Adjudication" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Adjudication</SelectItem>
            {filterOptions.aaInd.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
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
            {filterOptions.clmTyCd.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.formTyCd[0] || 'all'}
          onValueChange={(value) => handleFilterChange('formTyCd', value)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm shrink-0">
            <SelectValue placeholder="Form Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Form Type</SelectItem>
            {filterOptions.formTyCd.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
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
