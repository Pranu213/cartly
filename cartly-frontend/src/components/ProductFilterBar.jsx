import React from 'react';

export const ProductFilterBar = ({
  searchInput,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
  debouncedSearch,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, description..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {searchInput && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {searchInput !== debouncedSearch && (
            <p className="text-xs text-gray-500 mt-1">Searching...</p>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">No Sorting</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display and Clear Button */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {selectedCategory}
                <button
                  onClick={() => onCategoryChange('')}
                  className="hover:text-blue-900 transition"
                  title="Remove category filter"
                >
                  ✕
                </button>
              </span>
            )}
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Search: {debouncedSearch}
                <button
                  onClick={() => onSearchChange('')}
                  className="hover:text-blue-900 transition"
                  title="Remove search filter"
                >
                  ✕
                </button>
              </span>
            )}
            {sortBy && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {sortBy.replace(/_/g, ': ')}
                <button
                  onClick={() => onSortChange('')}
                  className="hover:text-blue-900 transition"
                  title="Remove sort filter"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              onClick={onClearFilters}
              className="ml-auto text-sm text-gray-600 hover:text-gray-900 underline transition"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
