import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/index.js';
import { ProductCard } from './ProductCard.jsx';

export const RelatedProducts = ({ productId, category }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRelatedProducts();
  }, [productId, category]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      // Fetch products in the same category, excluding the current product
      const response = await productService.getAll({
        category,
        limit: 8,
      });

      const products = Array.isArray(response) ? response : response.data || [];
      // Filter out the current product and limit to 4 related products
      const related = products
        .filter((p) => p._id !== productId)
        .slice(0, 4);

      setRelatedProducts(related);
    } catch (error) {
      console.error('Failed to load related products:', error);
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-12 border-t">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Related Products</h2>
        <p className="text-gray-600">Check out these similar items</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <div
            key={product._id}
            onClick={() => navigate(`/product/${product._id}`)}
            className="cursor-pointer"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};
