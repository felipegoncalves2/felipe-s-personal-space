import { AlertTriangle, TrendingDown, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export type AlertType = 'limit' | 'anomaly' | 'trend';

interface AlertBadgeProps {
    type: AlertType;
    message: string;
}

export function AlertBadge({ type, message }: AlertBadgeProps) {
    const getAlertConfig = () => {
        switch (type) {
            case 'limit':
                return {
                    icon: AlertTriangle,
                    color: 'text-red-500',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/20',
                    label: 'Limite Crítico',
                };
            case 'anomaly':
                return {
                    icon: AlertTriangle, // Or a different icon for anomaly like Zap?
                    color: 'text-orange-500',
                    bgColor: 'bg-orange-500/10',
                    borderColor: 'border-orange-500/20',
                    label: 'Anomalia Detectada',
                };
            case 'trend':
                return {
                    icon: TrendingDown,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/20',
                    label: 'Tendência Negativa',
                };
            default:
                return {
                    icon: Info,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-500/10',
                    borderColor: 'border-gray-500/20',
                    label: 'Info',
                };
        }
    };

    const config = getAlertConfig();
    const Icon = config.icon;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${config.bgColor} ${config.borderColor} cursor-help transition-colors hover:bg-opacity-20`}
                    >
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        <span className={`text-[10px] font-medium ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-xs">
                    <p>{message}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
