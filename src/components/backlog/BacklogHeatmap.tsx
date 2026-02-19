import { useMemo } from 'react';
import { BacklogItem, FAIXAS_DIAS } from '@/hooks/useBacklogData';

interface BacklogHeatmapProps {
    data: BacklogItem[];
}

function getFaixa(dias: number | null): string {
    if (dias === null) return 'Sem info';
    if (dias <= 3) return 'Até 3 dias';
    if (dias <= 5) return '4 a 5 dias';
    if (dias <= 10) return '6 a 10 dias';
    if (dias <= 30) return '11 a 30 dias';
    if (dias <= 50) return '31 a 50 dias';
    return 'Acima de 50 dias';
}

function getHeatColor(value: number, max: number): string {
    if (max === 0 || value === 0) return 'rgba(255,255,255,0.03)';
    const ratio = value / max;
    if (ratio < 0.2) return 'rgba(34,197,94,0.25)';
    if (ratio < 0.4) return 'rgba(234,179,8,0.35)';
    if (ratio < 0.6) return 'rgba(249,115,22,0.45)';
    if (ratio < 0.8) return 'rgba(239,68,68,0.55)';
    return 'rgba(239,68,68,0.85)';
}

const FAIXA_LABELS = FAIXAS_DIAS.map(f => f.label);

export function BacklogHeatmap({ data }: BacklogHeatmapProps) {
    const { filas, matrix, maxVal } = useMemo(() => {
        const map: Record<string, Record<string, number>> = {};
        data.forEach(item => {
            const fila = item.fila || 'Sem Fila';
            const faixa = getFaixa(item.dias_em_aberto);
            if (!map[fila]) map[fila] = {};
            map[fila][faixa] = (map[fila][faixa] || 0) + 1;
        });

        const filas = Object.keys(map)
            .sort((a, b) => {
                const totalA = Object.values(map[a]).reduce((s, v) => s + v, 0);
                const totalB = Object.values(map[b]).reduce((s, v) => s + v, 0);
                return totalB - totalA;
            })
            .slice(0, 20);

        let maxVal = 0;
        filas.forEach(fila => {
            FAIXA_LABELS.forEach(faixa => {
                const v = map[fila]?.[faixa] || 0;
                if (v > maxVal) maxVal = v;
            });
        });

        return { filas, matrix: map, maxVal };
    }, [data]);

    if (filas.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Sem dados para exibir
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        <th className="text-left text-muted-foreground font-medium p-2 min-w-[160px]">Fila</th>
                        {FAIXA_LABELS.map(label => (
                            <th key={label} className="text-center text-muted-foreground font-medium p-2 min-w-[80px]">
                                {label}
                            </th>
                        ))}
                        <th className="text-center text-muted-foreground font-medium p-2 min-w-[60px]">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.map(fila => {
                        const row = matrix[fila] || {};
                        const total = FAIXA_LABELS.reduce((s, f) => s + (row[f] || 0), 0);
                        return (
                            <tr key={fila} className="border-t border-border/30 hover:bg-white/5 transition-colors">
                                <td className="p-2 text-foreground font-medium truncate max-w-[160px]" title={fila}>
                                    {fila}
                                </td>
                                {FAIXA_LABELS.map(faixa => {
                                    const val = row[faixa] || 0;
                                    return (
                                        <td
                                            key={faixa}
                                            className="p-2 text-center font-semibold rounded"
                                            style={{ background: getHeatColor(val, maxVal) }}
                                            title={`${fila} / ${faixa}: ${val}`}
                                        >
                                            {val > 0 ? val : <span className="text-muted-foreground/40">—</span>}
                                        </td>
                                    );
                                })}
                                <td className="p-2 text-center font-bold text-primary">{total}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
