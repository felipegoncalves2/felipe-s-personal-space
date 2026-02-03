import { Info, AlertCircle, TrendingDown, HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function AlertLegend() {
    const legends = [
        {
            icon: AlertCircle,
            color: 'text-red-500',
            label: 'Alerta de Limite',
            description: 'O indicador ultrapassou um limite fixo pré-definido (verde, amarelo ou vermelho).'
        },
        {
            icon: TrendingDown,
            color: 'text-orange-500',
            label: 'Alerta de Tendência',
            description: 'O indicador apresenta queda ou alta contínua ao longo de vários períodos consecutivos.'
        },
        {
            icon: Info,
            color: 'text-blue-500',
            label: 'Alerta de Anomalia',
            description: 'O valor atual ficou fora do comportamento histórico esperado, mesmo sem atingir limites críticos.'
        }
    ];

    return (
        <TooltipProvider>
            <div className="flex flex-wrap items-center gap-6 p-4 glass rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">
                    <HelpCircle className="h-4 w-4" />
                    <span>Legenda de Alertas:</span>
                </div>

                {legends.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help group">
                                    <item.icon className={`h-4 w-4 ${item.color} transition-transform group-hover:scale-110`} />
                                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors uppercase tracking-wider">
                                        {item.label}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs p-3 glass border-white/10 shadow-2xl">
                                <p className="text-xs leading-relaxed text-slate-200">{item.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                ))}
            </div>
        </TooltipProvider>
    );
}
