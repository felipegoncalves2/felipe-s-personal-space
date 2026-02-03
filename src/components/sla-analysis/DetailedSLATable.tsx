import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DetailedSLATableProps {
    data: any[];
}

export function DetailedSLATable({ data }: DetailedSLATableProps) {
    const exportToCSV = () => {
        const headers = [
            'Referência',
            'Projeto',
            'Fila',
            'SLA Perdido',
            'Motivo',
            'Categoria',
            'Divisão',
            'Tipo Incidente',
            'Criação'
        ];

        const rows = data.map(d => [
            d.numero_referencia || '---',
            d.nome_projeto || '---',
            d.fila || '---',
            d.sla_perdido || '---',
            d.motivo_perda_sla || '---',
            d.categoria_perda_sla || '---',
            d.divisao_perda_sla || '---',
            d.tipo_incidente || '---',
            d.data_criacao ? format(new Date(d.data_criacao), 'dd/MM/yyyy HH:mm') : '---'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `SLA_Detalhamento_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="glass rounded-xl overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Detalhamento Operacional</h3>
                    <p className="text-xs text-muted-foreground">Visão registro a registro extraída do sistema</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2 glass hover:bg-white/10 transition-all">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                </Button>
            </div>

            <div className="max-h-[600px] overflow-auto custom-scrollbar">
                <Table>
                    <TableHeader className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="w-[140px] text-[11px] uppercase tracking-wider">Referência</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider">Fila / Projeto</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider">Perda de SLA</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider">Motivo / Categoria</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider">Tipo / Divisão</TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider">Criado em (Sis)</TableHead>
                            <TableHead className="text-right text-[11px] uppercase tracking-wider">Abertura</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-sm font-medium">Nenhum registro encontrado</p>
                                        <p className="text-xs opacity-50">Não há dados operacionais para os filtros selecionados.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, i) => (
                                <TableRow key={i} className="hover:bg-white/5 border-white/5 transition-colors">
                                    <TableCell className="font-mono text-[10px] text-muted-foreground py-4">
                                        {row.numero_referencia || '---'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                                                {row.nome_projeto || '---'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                {row.fila || '---'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.sla_perdido === 'Sim'
                                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            }`}>
                                            {row.sla_perdido === 'Sim' ? 'SLA PERDIDO' : 'DENTRO'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-medium text-foreground truncate max-w-[180px]">
                                                {row.motivo_perda_sla || '---'}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground truncate max-w-[180px]">
                                                {row.categoria_perda_sla || '---'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-medium text-foreground">
                                                {row.tipo_incidente || '---'}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground">
                                                {row.divisao_perda_sla || '---'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[9px] text-muted-foreground">
                                        {row.created_at ? format(new Date(row.created_at), 'dd/MM HH:mm') : '---'}
                                    </TableCell>
                                    <TableCell className="text-right py-4">
                                        <div className="text-[10px] font-medium text-foreground">
                                            {row.data_criacao ? format(new Date(row.data_criacao), 'dd/MM HH:mm') : '---'}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
