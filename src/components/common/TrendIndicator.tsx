import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'stable';

interface TrendIndicatorProps {
  trend: TrendDirection;
  size?: number;
}

export function TrendIndicator({ trend, size = 14 }: TrendIndicatorProps) {
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
