import { ArrowUp, ArrowDown, Minus, Sun, Moon, Zap, Activity, CalendarDays } from 'lucide-react';

interface BacklogIntradiarioKPIsProps {
    currentBacklog: number | null;
    todayStart: number | null;
    todayVariation: number | null;
    yesterdayStart: number | null;
    yesterdayEnd: number | null;
    yesterdayVariation: number | null;
}

export function BacklogIntradiarioKPIs({
    currentBacklog,
    todayStart,
    todayVariation,
    yesterdayStart,
    yesterdayEnd,
    yesterdayVariation
}: BacklogIntradiarioKPIsProps) {
    
    // Configurações para variações
    const isTodayIncrease = todayVariation !== null && todayVariation > 0;
    const isTodayDecrease = todayVariation !== null && todayVariation < 0;
    const isTodayStable = todayVariation === 0;

    const isYestIncrease = yesterdayVariation !== null && yesterdayVariation > 0;
    const isYestDecrease = yesterdayVariation !== null && yesterdayVariation < 0;
    const isYestStable = yesterdayVariation === 0;

    const PercentualCard = ({ 
        title, 
        icon: Icon, 
        value, 
        variation, 
        isIncrease, 
        isDecrease, 
        isStable, 
        subtitle, 
        colorClass 
    }: any) => {
        const varColor = isStable ? 'text-muted-foreground' : isIncrease ? 'text-red-400' : 'text-green-400';
        const VarIcon = isStable ? Minus : isIncrease ? ArrowUp : ArrowDown;
        const bgClass = isIncrease ? 'bg-red-500/5' : isDecrease ? 'bg-green-500/5' : 'bg-secondary/30';

        const pct = (value !== null && variation !== null && (value - variation) > 0) 
            ? (variation / (value - variation)) * 100 
            : null;

        return (
            <div className={`glass rounded-xl p-5 border border-border/50 ${bgClass}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                        {title}
                    </div>
                </div>
                <div className={`text-3xl font-bold flex items-center gap-2 ${varColor}`}>
                    <VarIcon className="h-6 w-6" />
                    {variation !== null ? (variation > 0 ? `+${variation}` : variation) : '—'}
                    {pct !== null && (
                        <span className="text-sm ml-2 opacity-70">
                            ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* HOJE */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Performance de Hoje</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Início de Hoje */}
                    <div className="glass rounded-xl p-5 border border-border/50 bg-blue-500/5">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
                            <Sun className="h-4 w-4 text-orange-400" />
                            Backlog Início do Dia
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            {todayStart !== null ? todayStart.toLocaleString('pt-BR') : '—'}
                        </div>
                    </div>

                    {/* Backlog Atual */}
                    <div className="glass rounded-xl p-5 border border-border/50 bg-emerald-500/5 border-emerald-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                <Activity className="h-4 w-4 text-emerald-400" />
                                Backlog Atual
                            </div>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            {currentBacklog !== null ? currentBacklog.toLocaleString('pt-BR') : '—'}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Atualizado em tempo real</p>
                    </div>

                    {/* Variação Hoje */}
                    <PercentualCard 
                        title="Variação Hoje"
                        icon={Zap}
                        colorClass="text-yellow-400"
                        value={currentBacklog}
                        variation={todayVariation}
                        isIncrease={isTodayIncrease}
                        isDecrease={isTodayDecrease}
                        isStable={isTodayStable}
                        subtitle="Atual vs Início de Hoje"
                    />
                </div>
            </div>

            {/* ONTEM */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-8 bg-indigo-500 rounded-full"></div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dados de Ontem (Véspera)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Início de Ontem */}
                    <div className="glass rounded-xl p-5 border border-border/50 bg-secondary/30 opacity-80">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
                            <CalendarDays className="h-4 w-4 text-indigo-400" />
                            Backlog Início de Ontem
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            {yesterdayStart !== null ? yesterdayStart.toLocaleString('pt-BR') : '—'}
                        </div>
                    </div>

                    {/* Fim de Ontem */}
                    <div className="glass rounded-xl p-5 border border-border/50 bg-indigo-500/5 opacity-80">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
                            <Moon className="h-4 w-4 text-indigo-400" />
                            Backlog Fim de Ontem (18:00)
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            {yesterdayEnd !== null ? yesterdayEnd.toLocaleString('pt-BR') : '—'}
                        </div>
                    </div>

                    {/* Variação Ontem */}
                    <PercentualCard 
                        title="Variação de Ontem"
                        icon={Zap}
                        colorClass="text-yellow-400"
                        value={yesterdayEnd}
                        variation={yesterdayVariation}
                        isIncrease={isYestIncrease}
                        isDecrease={isYestDecrease}
                        isStable={isYestStable}
                        subtitle="Fim vs Início de Ontem"
                    />
                </div>
            </div>
        </div>
    );
}
