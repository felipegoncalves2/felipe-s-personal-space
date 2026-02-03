import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { TrendIndicator, TrendDirection } from '@/components/common/TrendIndicator';
import { AlertBadge } from './AlertBadge';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  empresa: string;
  totalBase: number;
  semMonitoramento: number;
  dataGravacao: string;
  delay?: number;
  trend?: TrendDirection;
  variation?: number;
  anomaly?: boolean;
  comparison?: {
    diffPercent: number;
    label: string;
  };
  onClick?: () => void;
  thresholdExcellent?: number;
  thresholdAttention?: number;
}

export function DonutChart({
  percentage,
  size = 140,
  strokeWidth = 12,
  empresa,
  totalBase,
  semMonitoramento,
  dataGravacao,
  delay = 0,
  trend = 'stable',
  variation,
  anomaly,
  comparison,
  onClick,
  thresholdExcellent = 98,
  thresholdAttention = 80,
}: DonutChartProps) {
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
    const date = new Date(dataGravacao);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [dataGravacao]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`glass rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-primary/5 relative flex flex-col items-center ${onClick ? 'cursor-pointer hover:bg-white/5' : ''
        } ${anomaly ? 'ring-2 ring-orange-500/50' : ''}`}
    >
      {/* Alerts & Trend */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
        <TrendIndicator trend={trend} variation={variation} size={16} />
      </div>

      <div className="flex flex-col items-center w-full">
        {/* Company Name */}
        <h3 className="mb-4 text-center text-sm font-semibold text-foreground line-clamp-2 h-10 pr-5 w-full">
          {empresa}
        </h3>

        {/* Anomaly Badge */}
        {anomaly && (
          <div className="mb-2">
            <AlertBadge type="anomaly" message="Comportamento anormal detectado (fora do padrão histórico)" />
          </div>
        )}

        {/* Limit Alert Badge (Low Percentage) */}
        {!anomaly && percentage < 80 && (
          <div className="mb-2">
            <AlertBadge type="limit" message="Desempenho Crítico: Abaixo de 80%" />
          </div>
        )}

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
              {percentage.toFixed(1)}%
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

        {/* Comparison Stats */}
        {comparison && comparison.label !== 'N/A' && (
          <div className={`mt-2 flex items-center gap-1 text-[10px] font-medium ${comparison.diffPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {comparison.diffPercent >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {comparison.label}
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 w-full space-y-1 text-center">
          <p className="text-xs text-muted-foreground">
            Base total: <span className="font-medium text-foreground">{totalBase.toLocaleString('pt-BR')}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Sem monitoramento: <span className="font-medium text-foreground">{semMonitoramento.toLocaleString('pt-BR')}</span>
          </p>
        </div>

        {/* Date */}
        <div className="mt-3 pt-3 border-t border-border w-full text-center">
          <p className="text-[10px] text-muted-foreground">
            Última aferição: <span className="font-medium">{formattedDate}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
