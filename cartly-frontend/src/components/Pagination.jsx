import React from 'react';

export const Pagination = ({
  page,
  totalPages,
  onPreviousPage,
  onNextPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  // Calculate which page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (page <= 3) {
      for (let i = 1; i <= maxPagesToShow; i++) {
        pages.push(i);
      }
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = page - 2; i <= page + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t">
      <button
        onClick={onPreviousPage}
        disabled={page === 1}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        title="Go to previous page"
      >
        ← Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {/* First page button if not visible */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              onClick={() => {
                onPageChange(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-10 h-10 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="text-gray-500 px-2">...</span>
            )}
          </>
        )}

        {/* Page number buttons */}
        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => {
              onPageChange(pageNum);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`w-10 h-10 rounded-lg font-medium transition ${
              page === pageNum
                ? 'bg-blue-500 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title={`Go to page ${pageNum}`}
          >
            {pageNum}
          </button>
        ))}

        {/* Last page button if not visible */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="text-gray-500 px-2">...</span>
            )}
            <button
              onClick={() => {
                onPageChange(totalPages);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-10 h-10 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        onClick={onNextPage}
        disabled={page === totalPages}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        title="Go to next page"
      >
        Next →
      </button>

      <span className="text-gray-600 text-sm whitespace-nowrap">
        Page {page} of {totalPages}
      </span>
    </div>
  );
};
