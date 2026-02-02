import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { TrendIndicator, TrendDirection } from '@/components/common/TrendIndicator';

interface AdaptiveDonutChartProps {
  percentage: number;
  empresa: string;
  totalBase: number;
  semMonitoramento: number;
  dataGravacao: string;
  scale: number; // 0-1 scale factor based on viewport and density
  trend?: TrendDirection;
  thresholdExcellent?: number;
  thresholdAttention?: number;
}

export function AdaptiveDonutChart({
  percentage,
  empresa,
  totalBase,
  semMonitoramento,
  dataGravacao,
  scale,
  trend = 'stable',
  thresholdExcellent = 98,
  thresholdAttention = 80,
}: AdaptiveDonutChartProps) {
  // Calculate sizes based on scale
  const donutSize = Math.max(60, Math.round(200 * scale));
  const strokeWidth = Math.max(6, Math.round(16 * scale));
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Font sizes based on scale - Title increased ~50%, percentage reverted to original
  const titleSize = Math.max(14, Math.round(24 * scale)); // Increased for readability
  const percentageSize = Math.max(16, Math.round(32 * scale)); // Reverted to original size
  const statusSize = Math.max(11, Math.round(16 * scale));
  const statsSize = Math.max(10, Math.round(14 * scale));
  const dateSize = Math.max(9, Math.round(12 * scale));

  // Padding based on scale
  const padding = Math.max(8, Math.round(24 * scale));

  const { color, bgColor, statusLabel } = useMemo(() => {
    if (percentage >= thresholdExcellent) {
      return {
        color: 'hsl(var(--chart-green))',
        bgColor: 'hsl(var(--chart-green) / 0.15)',
        statusLabel: 'Excelente',
      };
    } else if (percentage >= thresholdAttention) {
      return {
        color: 'hsl(var(--chart-yellow))',
        bgColor: 'hsl(var(--chart-yellow) / 0.15)',
        statusLabel: 'Atenção',
      };
    } else {
      return {
        color: 'hsl(var(--chart-red))',
        bgColor: 'hsl(var(--chart-red) / 0.15)',
        statusLabel: 'Crítico',
      };
    }
  }, [percentage, thresholdExcellent, thresholdAttention]);

  const formattedDate = useMemo(() => {
    const date = new Date(dataGravacao);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [dataGravacao]);

  // Show condensed layout for very small scales
  const isCompact = scale < 0.5;
  const showStats = scale >= 0.35;
  const showDate = scale >= 0.4;

  // Trend icon size
  const trendSize = Math.max(10, Math.round(18 * scale));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass rounded-xl h-full w-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{ padding: `${padding}px` }}
    >
      {/* Trend Indicator */}
      <div className="absolute" style={{ top: padding * 0.5, right: padding * 0.5 }}>
        <TrendIndicator trend={trend} size={trendSize} />
      </div>

      {/* Company Name */}
      <h3
        className="text-center font-semibold text-foreground line-clamp-2 mb-2"
        style={{
          fontSize: `${titleSize}px`,
          lineHeight: 1.2,
          maxHeight: `${titleSize * 2.4}px`,
          paddingRight: `${trendSize + 4}px`,
        }}
      >
        {empresa}
      </h3>

      {/* Donut Chart */}
      <div
        className="relative flex-shrink-0"
        style={{ width: donutSize, height: donutSize }}
      >
        <svg width={donutSize} height={donutSize} className="-rotate-90 transform">
          {/* Background circle */}
          <circle
            cx={donutSize / 2}
            cy={donutSize / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={donutSize / 2}
            cy={donutSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold"
            style={{ fontSize: `${percentageSize}px`, color }}
          >
            {percentage.toFixed(1)}%
          </span>
          {!isCompact && (
            <span
              className="font-medium text-muted-foreground"
              style={{ fontSize: `${statusSize}px` }}
            >
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* Stats - only show if there's room */}
      {showStats && (
        <div className="mt-2 w-full space-y-0.5 text-center">
          <p style={{ fontSize: `${statsSize}px` }} className="text-muted-foreground">
            Base: <span className="font-medium text-foreground">{totalBase.toLocaleString('pt-BR')}</span>
          </p>
          <p style={{ fontSize: `${statsSize}px` }} className="text-muted-foreground">
            S/Mon: <span className="font-medium text-foreground">{semMonitoramento.toLocaleString('pt-BR')}</span>
          </p>
        </div>
      )}

      {/* Date - only show if there's room */}
      {showDate && (
        <div className="mt-2 pt-2 border-t border-border w-full text-center">
          <p style={{ fontSize: `${dateSize}px` }} className="text-muted-foreground">
            {formattedDate}
          </p>
        </div>
      )}
    </motion.div>
  );
}
