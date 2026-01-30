import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface AdaptiveSLADonutChartProps {
  nome: string;
  percentage: number;
  dentro: number;
  fora: number;
  total: number;
  createdAt: string;
  scale: number;
}

export function AdaptiveSLADonutChart({
  nome,
  percentage,
  dentro,
  fora,
  total,
  createdAt,
  scale,
}: AdaptiveSLADonutChartProps) {
  // Base sizes that will be scaled
  const baseSize = 140;
  const baseStrokeWidth = 12;
  const baseFontSize = 24;
  const baseSmallFontSize = 10;
  const basePadding = 20;

  // Apply scale
  const size = Math.round(baseSize * scale);
  const strokeWidth = Math.max(4, Math.round(baseStrokeWidth * scale));
  const fontSize = Math.max(12, Math.round(baseFontSize * scale));
  const smallFontSize = Math.max(8, Math.round(baseSmallFontSize * scale));
  const padding = Math.max(8, Math.round(basePadding * scale));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const { color, bgColor, statusLabel } = useMemo(() => {
    if (percentage >= 98) {
      return {
        color: 'hsl(var(--chart-green))',
        bgColor: 'hsl(var(--chart-green) / 0.15)',
        statusLabel: 'Excelente',
      };
    } else if (percentage >= 80) {
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
  }, [percentage]);

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass rounded-xl h-full w-full flex flex-col items-center justify-center"
      style={{ padding }}
    >
      {/* Name */}
      <h3 
        className="text-center font-semibold text-foreground line-clamp-2 mb-2"
        style={{ fontSize: Math.max(11, fontSize * 0.5) }}
      >
        {nome}
      </h3>

      {/* Donut Chart */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
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
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold"
            style={{ fontSize, color }}
          >
            {percentage.toFixed(2)}%
          </span>
          <span
            className="font-medium text-muted-foreground"
            style={{ fontSize: smallFontSize }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-2 w-full space-y-0.5 text-center">
        <p className="text-muted-foreground" style={{ fontSize: smallFontSize }}>
          Dentro: <span className="font-medium text-foreground">{dentro.toLocaleString('pt-BR')}</span>
        </p>
        <p className="text-muted-foreground" style={{ fontSize: smallFontSize }}>
          Fora: <span className="font-medium text-foreground">{fora.toLocaleString('pt-BR')}</span>
        </p>
        <p className="text-muted-foreground" style={{ fontSize: smallFontSize }}>
          Total: <span className="font-medium text-foreground">{total.toLocaleString('pt-BR')}</span>
        </p>
      </div>

      {/* Date */}
      <div className="mt-2 pt-2 border-t border-border w-full text-center">
        <p className="text-muted-foreground" style={{ fontSize: Math.max(7, smallFontSize * 0.9) }}>
          Atualização: <span className="font-medium">{formattedDate}</span>
        </p>
      </div>
    </motion.div>
  );
}
