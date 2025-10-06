import { Search, Filter, X } from 'lucide-react'
import { useState } from 'react'

interface FilterOptions {
  status: string
  search: string
}

interface SearchFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  resultCount: number
}

export function SearchFilter({ onFilterChange, resultCount }: SearchFilterProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFilterChange({ search: value, status })
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onFilterChange({ search, status: value })
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    onFilterChange({ search: '', status: '' })
  }

  const hasActiveFilters = search || status

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name or reason..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm appearance-none bg-white cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Result Count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-600">
          {resultCount} {resultCount === 1 ? 'request' : 'requests'} found
        </p>
        {hasActiveFilters && (
          <div className="flex gap-2">
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium">
                Search: {search}
                <button onClick={() => handleSearchChange('')} className="hover:text-brand-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium">
                Status: {status}
                <button onClick={() => handleStatusChange('')} className="hover:text-brand-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
