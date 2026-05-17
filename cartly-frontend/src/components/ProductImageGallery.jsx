import React, { useState } from 'react';

export const ProductImageGallery = ({ image, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  const resolvedPrimary = image?.url || image;
  const images = [resolvedPrimary, resolvedPrimary].filter(Boolean);
  const currentImage = images[selectedImage] || resolvedPrimary;

  return (
    <div className="w-full max-w-md">
      {/* Main Image Display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 aspect-square flex items-center justify-center">
        {currentImage ? (
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="mx-auto h-16 w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No Image Available</p>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Images */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(idx)}
            className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
              selectedImage === idx ? 'border-blue-500' : 'border-gray-300'
            }`}
          >
            {img ? (
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover hover:opacity-75 transition-opacity"
              />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </button>
        ))}
        {/* Placeholder for more images */}
        {[2, 3].map((idx) => (
          <div
            key={idx}
            className="aspect-square rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 flex items-center justify-center"
          >
            <span className="text-xs text-gray-400">Coming soon</span>
          </div>
        ))}
      </div>

      {/* Image Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <button className="flex items-center justify-center gap-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
          Zoom
        </button>
        <button className="flex items-center justify-center gap-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
};
