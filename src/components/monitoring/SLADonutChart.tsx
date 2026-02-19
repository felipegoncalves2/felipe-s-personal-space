import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { TrendIndicator, TrendDirection } from '@/components/common/TrendIndicator';

interface SLADonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  nome: string;
  dentro: number;
  fora: number;
  total: number;
  createdAt: string;
  delay?: number;
  trend?: TrendDirection;
  variation?: number;
  onClick?: () => void;
  onDoubleClick?: () => void;
  thresholdExcellent?: number;
  thresholdAttention?: number;
}

export function SLADonutChart({
  percentage,
  size = 140,
  strokeWidth = 12,
  nome,
  dentro,
  fora,
  total,
  createdAt,
  delay = 0,
  trend = 'stable',
  variation,
  onClick,
  onDoubleClick,
  thresholdExcellent = 93,
  thresholdAttention = 80,
}: SLADonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`glass rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-primary/5 relative ${onClick || onDoubleClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
    >
      {/* Header section with name and trend */}
      <div className="w-full flex items-start justify-between gap-3 mb-4">
        <h3
          className="text-sm font-semibold text-foreground truncate cursor-help"
          title={nome}
        >
          {nome}
        </h3>
        <div className="flex-shrink-0 pt-0.5">
          <TrendIndicator trend={trend} variation={variation} size={16} />
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Donut Chart */}

        {/* Donut Chart */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="-rotate-90 transform"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={bgColor}
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ delay: delay + 0.2, duration: 1.5, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5 }}
              className="text-2xl font-bold"
              style={{ color }}
            >
              {percentage.toFixed(2)}%
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.6 }}
              className="text-[10px] font-medium text-muted-foreground"
            >
              {statusLabel}
            </motion.span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 w-full space-y-1 text-center">
          <p className="text-xs text-muted-foreground">
            Dentro do SLA: <span className="font-medium text-foreground">{dentro.toLocaleString('pt-BR')}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Fora do SLA: <span className="font-medium text-foreground">{fora.toLocaleString('pt-BR')}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Total: <span className="font-medium text-foreground">{total.toLocaleString('pt-BR')}</span>
          </p>
        </div>

        {/* Date */}
        <div className="mt-3 pt-3 border-t border-border w-full text-center">
          <p className="text-[10px] text-muted-foreground">
            Última atualização: <span className="font-medium">{formattedDate}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
