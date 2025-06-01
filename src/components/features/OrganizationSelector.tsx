import React, { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

type Organization = {
  id: string;
  name: string;
  clinic_id: string;
};

type OrganizationSelectorProps = {
  onSelect: (_org: Organization) => void;
  onCreateNew: (_name: string) => void;
  defaultName?: string;
};

export default function OrganizationSelector({ 
  onSelect, 
  onCreateNew,
  defaultName = ''
}: OrganizationSelectorProps) {
  const [query, setQuery] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState(defaultName);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setOrganizations([]);
        setHasSearched(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/organizations/search?query=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to search organizations');
        }
        
        const { data } = await response.json();
        setOrganizations(data || []);
        setHasSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search organizations');
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;
  
  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  // Automatically update the new org name when typing in search
  useEffect(() => {
    if (query) {
      setNewOrgName(query);
    }
  }, [query]);
  
  const handleSearchFocus = () => {
    setShowResults(true);
  };
  
  const handleSearchBlur = () => {
    // Delay hiding results to allow clicks to register
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };
  
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrgName.trim()) {
      onCreateNew(newOrgName.trim());
      setIsCreating(false);
    }
  };

  const handleCreateFromSearch = () => {
    if (query.trim()) {
      onCreateNew(query.trim());
    }
  };
  
  return (
    <div className="space-y-4">
      {!isCreating ? (
        <>
          <div className="relative">
            <label htmlFor="organizationSearch" className="block text-sm font-medium text-gray-700 mb-1">
              Find Your Organization
            </label>
            <input
              id="organizationSearch"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by organization name..."
            />
            
            {/* Search results dropdown */}
            {showResults && (query.length > 1 || organizations.length > 0) && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                {loading ? (
                  <div className="p-2 text-center text-gray-500">Loading organizations...</div>
                ) : error ? (
                  <div className="p-2 text-center text-red-500">{error}</div>
                ) : organizations.length > 0 ? (
                  <ul>
                    {organizations.map((org) => (
                      <li 
                        key={org.id}
                        onClick={() => onSelect(org)}
                        className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-gray-500">Clinic ID: {org.clinic_id}</div>
                      </li>
                    ))}
                  </ul>
                ) : query.length > 1 && hasSearched ? (
                  <div className="p-3 text-center">
                    <p className="text-gray-600 mb-2">
                      No organization found with that name
                    </p>
                    <button
                      onClick={handleCreateFromSearch}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 w-full"
                    >
                      Create &ldquo;{query}&rdquo; as new organization
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="text-center mt-2">
            <span className="text-sm text-gray-500">or</span>
          </div>
          
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full p-2 bg-white border border-gray-300 text-indigo-600 rounded-md hover:bg-gray-50"
          >
            Create New Organization
          </button>
        </>
      ) : (
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label htmlFor="newOrganizationName" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              id="newOrganizationName"
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your organization name"
              autoFocus
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex-1 p-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newOrgName.trim()}
              className="flex-1 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Organization
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 