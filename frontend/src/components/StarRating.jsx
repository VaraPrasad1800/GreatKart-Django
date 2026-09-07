import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, count = null, size = 'sm', showValue = false }) {
  const numericRating = Number(rating) || 0;
  const starSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  const iconSize = starSizes[size] || starSizes.sm;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = numericRating >= star;
          const half = !filled && numericRating >= star - 0.5;

          return (
            <span key={star} className="relative inline-block">
              <Star
                className={`${iconSize} ${
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : half
                    ? 'fill-amber-200 text-amber-400'
                    : 'text-slate-200 fill-slate-100'
                }`}
              />
            </span>
          );
        })}
      </div>

      {showValue && numericRating > 0 && (
        <span className="text-xs font-semibold text-slate-700">
          {numericRating.toFixed(1)}
        </span>
      )}

      {count !== null && (
        <span className="text-xs text-slate-400 font-normal">
          ({count})
        </span>
      )}
    </div>
  );
}
