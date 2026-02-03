import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'stable';

interface TrendIndicatorProps {
  trend: TrendDirection;
  variation?: number;
  size?: number;
}

export function TrendIndicator({ trend, variation, size = 14 }: TrendIndicatorProps) {
  const showVariation = variation !== undefined && variation !== 0;
  const formattedVariation = variation !== undefined ? `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%` : '';

  const renderArrow = () => {
    if (trend === 'up') {
      return (
        <TrendingUp
          className="text-chart-green"
          size={size}
          strokeWidth={2.5}
        />
      );
    }

    if (trend === 'down') {
      return (
        <TrendingDown
          className="text-chart-red"
          size={size}
          strokeWidth={2.5}
        />
      );
    }

    return (
      <Minus
        className="text-blue-500"
        size={size}
        strokeWidth={2.5}
      />
    );
  };

  return (
    <div className="flex items-center gap-1.5 min-w-fit">
      {renderArrow()}
      {showVariation && (
        <span className={`text-[10px] font-medium whitespace-nowrap ${trend === 'up' ? 'text-chart-green' :
          trend === 'down' ? 'text-chart-red' :
            'text-blue-500'
          }`}>
          {formattedVariation}
        </span>
      )}
      {!showVariation && trend === 'stable' && (
        <span className="text-[10px] font-medium text-blue-500/70 whitespace-nowrap">
          0.0%
        </span>
      )}
    </div>
  );
}

export function calculateTrend(currentPercentage: number, previousPercentage: number | null): TrendDirection {
  if (previousPercentage === null) {
    return 'stable';
  }

  const variation = currentPercentage - previousPercentage;

  if (variation > 0) {
    return 'up';
  }

  if (variation < 0) {
    return 'down';
  }

  return 'stable';
}
