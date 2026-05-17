import React, { useState, useEffect, useRef } from 'react';
import { productService } from '../services/index.js';
import { ProductGrid } from '../components/ProductGrid.jsx';
import { ProductFilterBar } from '../components/ProductFilterBar.jsx';
import { Pagination } from '../components/Pagination.jsx';

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const debounceTimer = useRef(null);
  const productsPerPage = 12;

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, debouncedSearch, page, sortBy]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: productsPerPage
      };

      if (selectedCategory) params.category = selectedCategory;
      if (debouncedSearch) params.search = debouncedSearch;
      if (sortBy) params.sort = sortBy;

      const response = await productService.getAll(params);
      
      // Handle both array response and object response with data property
      const productData = Array.isArray(response) ? response : response.data;
      setProducts(productData);
      
      // Handle pagination info
      if (response.pagination) {
        setTotalPages(response.pagination.pages || 1);
        setTotalProducts(response.pagination.total || productData.length);
      } else if (response.totalPages) {
        setTotalPages(response.totalPages);
        setTotalProducts(response.totalProducts || productData.length);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productService.getCategories();
      const categoryData = Array.isArray(response) ? response : response.data;
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSortBy('');
    setPage(1);
  };

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasActiveFilters = selectedCategory || debouncedSearch || sortBy;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">
            {totalProducts > 0 ? `Showing ${(page - 1) * productsPerPage + 1}-${Math.min(page * productsPerPage, totalProducts)} of ${totalProducts} products` : 'No products available'}
          </p>
        </div>

        {/* Filter Bar */}
        <ProductFilterBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          debouncedSearch={debouncedSearch}
        />

        {/* Product Grid */}
        <ProductGrid
          products={products}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Pagination */}
        {!loading && products.length > 0 && totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};
