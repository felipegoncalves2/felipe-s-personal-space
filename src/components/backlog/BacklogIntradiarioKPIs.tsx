import { ArrowUp, ArrowDown, Minus, Sun, Moon, Zap, Activity } from 'lucide-react';

interface BacklogIntradiarioKPIsProps {
    inicioDia: number | null;
    fimDia: number | null;
    backlogAtual: number | null;
    variacao: number | null;
    porcentagemReducao: number | null;
    isAfter18: boolean;
}

export function BacklogIntradiarioKPIs({
    inicioDia,
    fimDia,
    backlogAtual,
    variacao,
    porcentagemReducao,
    isAfter18
}: BacklogIntradiarioKPIsProps) {
    const isIncrease = variacao !== null && variacao > 0;
    const isDecrease = variacao !== null && variacao < 0;
    const isStable = variacao === 0;

    const variationColor = isStable ? 'text-muted-foreground' : isIncrease ? 'text-red-400' : 'text-green-400';
    const VariationIcon = isStable ? Minus : isIncrease ? ArrowUp : ArrowDown;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Início do Dia */}
            <div className="glass rounded-xl p-5 border border-border/50 bg-blue-500/5">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
                    <Sun className="h-4 w-4 text-orange-400" />
                    Backlog Início do Dia (08:00)
                </div>
                <div className="text-3xl font-bold text-foreground">
                    {inicioDia !== null ? inicioDia.toLocaleString('pt-BR') : '—'}
                </div>
            </div>

            {/* Backlog Atual */}
            <div className={`glass rounded-xl p-5 border border-border/50 ${isAfter18 ? 'bg-secondary/30 opacity-70' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        <Activity className={`h-4 w-4 ${isAfter18 ? 'text-muted-foreground' : 'text-emerald-400'}`} />
                        Backlog Atual
                    </div>
                    {!isAfter18 && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                    )}
                    {isAfter18 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                            Congelado
                        </span>
                    )}
                </div>
                <div className="text-3xl font-bold text-foreground">
                    {backlogAtual !== null ? backlogAtual.toLocaleString('pt-BR') : '—'}
                </div>
                {!isAfter18 && (
                    <p className="text-[10px] text-muted-foreground mt-1">Atualizado em tempo real</p>
                )}
            </div>

            {/* Fim do Dia */}
            <div className="glass rounded-xl p-5 border border-border/50 bg-indigo-500/5">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    Backlog Fim do Dia (18:00)
                </div>
                <div className="text-3xl font-bold text-foreground">
                    {fimDia !== null ? fimDia.toLocaleString('pt-BR') : '—'}
                </div>
            </div>

            {/* Variação do Dia */}
            <div className={`glass rounded-xl p-5 border border-border/50 ${isIncrease ? 'bg-red-500/5' : isDecrease ? 'bg-green-500/5' : 'bg-secondary/30'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        Variação Intradiária
                    </div>
                    {porcentagemReducao !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isIncrease ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {porcentagemReducao > 0 ? '+' : ''}{porcentagemReducao.toFixed(1)}%
                        </span>
                    )}
                </div>
                <div className={`text-3xl font-bold flex items-center gap-2 ${variationColor}`}>
                    <VariationIcon className="h-6 w-6" />
                    {variacao !== null ? (variacao > 0 ? `+${variacao}` : variacao) : '—'}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                    {isAfter18 ? 'Fim do Dia vs Início' : 'Atual vs Início do Dia'}
                </p>
            </div>
        </div>
    );
}
