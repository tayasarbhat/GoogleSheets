import React, { useState, useMemo } from 'react';
import { SheetRow } from '../types';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: SheetRow[];
  onStatusChange: (rowIndex: number, newStatus: 'Open' | 'Reserved') => void;
}

export function DataTable({ data, onStatusChange }: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof SheetRow | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: keyof SheetRow) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = (index: number, newStatus: 'Open' | 'Reserved') => {
    if (newStatus === 'Reserved') {
      const confirmed = window.confirm(`Are you sure you want to change the status to Reserved?`);
      if (!confirmed) return;
    }
    onStatusChange(index, newStatus);
  };

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const searchTerms = search.toLowerCase().trim().split(/\s+/);
    
    return data.filter((row) => {
      // Check each search term independently
      return searchTerms.every(term => {
        // Check for category:number format
        if (term.includes(':')) {
          const [categorySearch, numberSearch] = term.split(':').map(s => s.trim());
          if (!categorySearch || !numberSearch) return false;
          
          const categoryMatch = row.category.toLowerCase().includes(categorySearch);
          const numberMatch = String(row.msisdn).includes(numberSearch);
          return categoryMatch && numberMatch;
        }

        // Check for number endings
        if (/^\d+$/.test(term)) {
          const msisdnStr = String(row.msisdn);
          if (msisdnStr.endsWith(term)) return true;
        }

        // Check category matches
        if (row.category.toLowerCase().includes(term)) return true;

        // Check MSISDN matches
        if (String(row.msisdn).includes(term)) return true;

        // Check other fields
        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(term)
        );
      });
    });
  }, [data, search]);

  const displayData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = String(a[sortField]);
      const bValue = String(b[sortField]);
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [filteredData, sortField, sortDirection]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(displayData.length / pageSize);
  const paginatedData = pageSize === -1 
    ? displayData 
    : displayData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-grow max-w-md space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
            <input
              type="text"
              placeholder="Search by number, category, or category:number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-20 py-2 bg-white/10 border border-white/20 rounded-lg 
                focus:ring-2 focus:ring-white/30 focus:border-transparent text-white 
                placeholder-white/60"
            />
            {search && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 text-xs">
                {filteredData.length} results
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-white">Show:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-white/30"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="-1">All</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg glass">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-white/10">
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th
                  key={key}
                  className="px-6 py-3 cursor-pointer hover:bg-white/5 text-white"
                  onClick={() => handleSort(key as keyof SheetRow)}
                >
                  <div className="flex items-center gap-2">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                    {sortField === key && (
                      <ArrowUpDown size={14} className={`text-white/60 transform ${
                        sortDirection === 'desc' ? 'rotate-180' : ''
                      }`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                {Object.entries(row).map(([key, value]) => {
                  // For the msisdn column, replace the starting "971" with "0"
                  let cellValue = value;
                  if (key === 'msisdn') {
                    const msisdnStr = String(value);
                    cellValue = msisdnStr.startsWith('971')
                      ? '0' + msisdnStr.slice(3)
                      : msisdnStr;
                  }
                  return (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-white">
                      {key === 'statusByCallCenter' ? (
                        <select
                          value={value}
                          onChange={(e) => handleStatusChange(index, e.target.value as 'Open' | 'Reserved')}
                          className="bg-white/10 border border-white/20 rounded-md px-2 py-1 focus:ring-2 focus:ring-white/30 text-white"
                        >
                          <option value="Open">Open</option>
                          <option value="Reserved">Reserved</option>
                        </select>
                      ) : (
                        cellValue
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageSize !== -1 && (
        <div className="flex items-center justify-between text-white">
          <div>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, displayData.length)} of {displayData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span>{currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
