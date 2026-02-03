import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { TrendIndicator, TrendDirection } from '@/components/common/TrendIndicator';

interface AdaptiveSLADonutChartProps {
  nome: string;
  percentage: number;
  dentro: number;
  fora: number;
  total: number;
  createdAt: string;
  scale: number;
  trend?: TrendDirection;
  variation?: number;
  thresholdExcellent?: number;
  thresholdAttention?: number;
}

export function AdaptiveSLADonutChart({
  nome,
  percentage,
  dentro,
  fora,
  total,
  createdAt,
  scale,
  trend = 'stable',
  variation,
  thresholdExcellent = 98,
  thresholdAttention = 80,
}: AdaptiveSLADonutChartProps) {
  // Calculate sizes based on scale - MATCHING AdaptiveDonutChart exactly
  const donutSize = Math.max(60, Math.round(200 * scale));
  const strokeWidth = Math.max(6, Math.round(16 * scale));
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Font sizes based on scale - MATCHING AdaptiveDonutChart exactly
  const titleSize = Math.max(14, Math.round(24 * scale)); // Title (nome)
  const percentageSize = Math.max(16, Math.round(32 * scale)); // Percentage
  const statusSize = Math.max(11, Math.round(16 * scale));
  const statsSize = Math.max(10, Math.round(14 * scale));
  const dateSize = Math.max(9, Math.round(12 * scale));

  // Padding based on scale - MATCHING AdaptiveDonutChart
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
    const date = new Date(createdAt);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [createdAt]);

  // Trend icon size
  const trendSize = Math.max(10, Math.round(14 * scale));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass rounded-xl h-full w-full flex flex-col items-center justify-center relative"
      style={{ padding }}
    >
      {/* Header section with name and trend */}
      <div className="w-full flex items-start justify-between gap-3 mb-2 px-0.5">
        <h3
          className="font-semibold text-foreground truncate cursor-help"
          title={nome}
          style={{ fontSize: titleSize }}
        >
          {nome}
        </h3>
        <div className="flex-shrink-0 pt-1">
          <TrendIndicator trend={trend} variation={variation} size={trendSize} />
        </div>
      </div>


      {/* Donut Chart */}
      <div className="relative flex-shrink-0" style={{ width: donutSize, height: donutSize }}>
        <svg
          width={donutSize}
          height={donutSize}
          className="-rotate-90 transform"
        >
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
            style={{ fontSize: percentageSize, color }}
          >
            {percentage.toFixed(2)}%
          </span>
          <span
            className="font-medium text-muted-foreground"
            style={{ fontSize: statusSize }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-2 w-full space-y-0.5 text-center">
        <p className="text-muted-foreground" style={{ fontSize: statsSize }}>
          Dentro: <span className="font-medium text-foreground">{dentro.toLocaleString('pt-BR')}</span>
        </p>
        <p className="text-muted-foreground" style={{ fontSize: statsSize }}>
          Fora: <span className="font-medium text-foreground">{fora.toLocaleString('pt-BR')}</span>
        </p>
        <p className="text-muted-foreground" style={{ fontSize: statsSize }}>
          Total: <span className="font-medium text-foreground">{total.toLocaleString('pt-BR')}</span>
        </p>
      </div>

      {/* Date */}
      <div className="mt-2 pt-2 border-t border-border w-full text-center">
        <p className="text-muted-foreground" style={{ fontSize: dateSize }}>
          Atualização: <span className="font-medium">{formattedDate}</span>
        </p>
      </div>
    </motion.div>
  );
}
