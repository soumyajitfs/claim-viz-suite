import { useClaims } from '@/contexts/ClaimsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, X, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
      searchClaimId: '',
    });
  };

  const activeFilterCount = 
    filters.aaInd.length + 
    filters.clmTyCd.length + 
    filters.formTyCd.length + 
    filters.priority.length +
    filters.auditFlag.length +
    (filters.searchClaimId ? 1 : 0);

  return (
    <div className="bg-card border-b px-4 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-2 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        
        <Select
          value={filters.aaInd[0] || 'all'}
          onValueChange={(value) => handleFilterChange('aaInd', value)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="AA Indicator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All AA Ind</SelectItem>
            {filterOptions.aaInd.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.clmTyCd[0] || 'all'}
          onValueChange={(value) => handleFilterChange('clmTyCd', value)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Claim Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {filterOptions.clmTyCd.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.formTyCd[0] || 'all'}
          onValueChange={(value) => handleFilterChange('formTyCd', value)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Form Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Forms</SelectItem>
            {filterOptions.formTyCd.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority[0] || 'all'}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.auditFlag[0] || 'all'}
          onValueChange={(value) => handleFilterChange('auditFlag', value)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Audit Flag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Y">Y</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Claim ID..."
            value={filters.searchClaimId}
            onChange={(e) => handleFilterChange('searchClaimId', e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
