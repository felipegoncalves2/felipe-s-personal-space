import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Download, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DetailedSLATableProps {
    data: any[];
}

type SortField = 'data_criacao' | 'sla_solucao' | 'status' | 'quantidade_pausas';
type SortOrder = 'asc' | 'desc';

export function DetailedSLATable({ data }: DetailedSLATableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUF, setFilterUF] = useState('all');
    const [filterFila, setFilterFila] = useState('all');
    const [filterProjeto, setFilterProjeto] = useState('all');
    const [filterSLAPerdido, setFilterSLAPerdido] = useState('all');
    const [filterCategoria, setFilterCategoria] = useState('all');

    const [sortField, setSortField] = useState<SortField>('data_criacao');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const ufs = useMemo(() => Array.from(new Set(data.map(d => d.uf).filter(Boolean))), [data]);
    const filas = useMemo(() => Array.from(new Set(data.map(d => d.fila).filter(Boolean))), [data]);
    const projetos = useMemo(() => Array.from(new Set(data.map(d => d.nome_projeto).filter(Boolean))), [data]);
    const categorias = useMemo(() => Array.from(new Set(data.map(d => d.categoria_perda_sla).filter(Boolean))), [data]);

    const filteredAndSortedData = useMemo(() => {
        let result = [...data];

        // Search
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(d =>
                (d.numero_referencia?.toLowerCase().includes(search)) ||
                (d.observacao?.toLowerCase().includes(search))
            );
        }

        // Filters
        if (filterUF !== 'all') result = result.filter(d => d.uf === filterUF);
        if (filterFila !== 'all') result = result.filter(d => d.fila === filterFila);
        if (filterProjeto !== 'all') result = result.filter(d => d.nome_projeto === filterProjeto);
        if (filterSLAPerdido !== 'all') result = result.filter(d => d.sla_perdido === filterSLAPerdido);
        if (filterCategoria !== 'all') result = result.filter(d => d.categoria_perda_sla === filterCategoria);

        // Sort
        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (sortField === 'data_criacao') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [data, searchTerm, filterUF, filterFila, filterProjeto, filterSLAPerdido, filterCategoria, sortField, sortOrder]);

    const exportToCSV = () => {
        const headers = [
            'Referência',
            'UF',
            'Projeto',
            'Fila',
            'SLA Perdido',
            'Motivo',
            'Categoria',
            'Criação',
            'Observação'
        ];

        const rows = filteredAndSortedData.map(d => [
            d.numero_referencia || '---',
            d.uf || '---',
            d.nome_projeto || '---',
            d.fila || '---',
            d.sla_perdido || '---',
            d.motivo_perda_sla || '---',
            d.categoria_perda_sla || '---',
            d.data_criacao ? format(new Date(d.data_criacao), 'dd/MM/yyyy HH:mm') : '---',
            (d.observacao || '---').replace(/,/g, ';')
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

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters Area */}
            <div className="glass rounded-xl p-4 space-y-4 border border-white/5">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por referência ou observação..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-secondary/30 border-white/5"
                        />
                    </div>

                    <Select value={filterUF} onValueChange={setFilterUF}>
                        <SelectTrigger className="w-[100px] bg-secondary/30 border-white/5">
                            <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas UFs</SelectItem>
                            {ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterSLAPerdido} onValueChange={setFilterSLAPerdido}>
                        <SelectTrigger className="w-[140px] bg-secondary/30 border-white/5">
                            <SelectValue placeholder="Status SLA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Status SLA</SelectItem>
                            <SelectItem value="Sim">Sim (Perdido)</SelectItem>
                            <SelectItem value="Não">Não (Dentro)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterFila} onValueChange={setFilterFila}>
                        <SelectTrigger className="w-[160px] bg-secondary/30 border-white/5">
                            <SelectValue placeholder="Fila" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Filas</SelectItem>
                            {filas.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterProjeto} onValueChange={setFilterProjeto}>
                        <SelectTrigger className="w-[160px] bg-secondary/30 border-white/5">
                            <SelectValue placeholder="Projeto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Projetos</SelectItem>
                            {projetos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2 glass hover:bg-white/10 transition-all ml-auto">
                        <Download className="h-4 w-4" />
                        Exportar
                    </Button>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase flex items-center mr-2">Ordenar por:</span>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort('data_criacao')} className={`text-[10px] h-7 px-2 ${sortField === 'data_criacao' ? 'bg-primary/20 text-primary' : ''}`}>
                        Data {sortField === 'data_criacao' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort('sla_solucao')} className={`text-[10px] h-7 px-2 ${sortField === 'sla_solucao' ? 'bg-primary/20 text-primary' : ''}`}>
                        SLA Solução {sortField === 'sla_solucao' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort('status')} className={`text-[10px] h-7 px-2 ${sortField === 'status' ? 'bg-primary/20 text-primary' : ''}`}>
                        Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort('quantidade_pausas')} className={`text-[10px] h-7 px-2 ${sortField === 'quantidade_pausas' ? 'bg-primary/20 text-primary' : ''}`}>
                        Pausas {sortField === 'quantidade_pausas' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                </div>
            </div>

            <div className="glass rounded-xl overflow-hidden border border-white/5">
                <div className="max-h-[600px] overflow-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="w-[120px] text-[10px] uppercase tracking-wider">Ref / UF</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider">Projeto / Fila</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider">Status SLA</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider">Observação</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-wider">Motivo / Cat.</TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-wider">Abertura / Pausas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-sm font-medium">Nenhum registro encontrado</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAndSortedData.map((row, i) => (
                                    <TableRow key={i} className="hover:bg-white/5 border-white/5 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-[10px] text-foreground">
                                                    {row.numero_referencia || '---'}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground font-bold">
                                                    UF: {row.uf || '---'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-foreground truncate max-w-[150px]">
                                                    {row.nome_projeto || '---'}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground truncate max-w-[150px]">
                                                    {row.fila || '---'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${row.sla_perdido === 'Sim'
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                }`}>
                                                {row.sla_perdido === 'Sim' ? 'PERDIDO' : 'DENTRO'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <p className="text-[10px] text-muted-foreground truncate hover:text-foreground transition-colors cursor-help">
                                                            {row.observacao || 'Sem observação'}
                                                        </p>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-[300px] bg-slate-900 border-white/10 text-xs p-3">
                                                        <p className="leading-relaxed">{row.observacao || 'Nenhuma observação registrada para este chamado.'}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-medium text-foreground truncate max-w-[150px]">
                                                    {row.motivo_perda_sla || '---'}
                                                </span>
                                                <span className="text-[8px] text-muted-foreground truncate max-w-[150px]">
                                                    {row.categoria_perda_sla || '---'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-[10px] font-medium text-foreground">
                                                {row.data_criacao ? format(new Date(row.data_criacao), 'dd/MM HH:mm') : '---'}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground">
                                                Pausas: {row.quantidade_pausas ?? 0}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
