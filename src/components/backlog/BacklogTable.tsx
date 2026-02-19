import { useMemo, useState } from 'react';
import { BacklogItem, getDiasFaixa } from '@/hooks/useBacklogData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BacklogTableProps {
    data: BacklogItem[];
}

type SortField = 'dias_em_aberto' | 'data_criacao' | 'numero_referencia';

function exportCSV(data: BacklogItem[]) {
    const headers = [
        'Número Referência', 'Fila', 'Nome Projeto', 'Código Projeto', 'Empresa',
        'Status', 'Status Cliente', 'Dias em Aberto', 'Data Criação',
        'Cidade', 'Estado', 'Conta Atribuída', 'Tipo Incidente', 'Situação Equipamento',
    ];
    const rows = data.map(d => [
        d.numero_referencia ?? '',
        d.fila ?? '',
        d.nome_projeto ?? '',
        d.codigo_projeto ?? '',
        d.empresa_nome ?? '',
        d.status ?? '',
        d.status_cliente ?? '',
        d.dias_em_aberto ?? '',
        d.data_criacao ? d.data_criacao.slice(0, 10) : '',
        d.cidade ?? '',
        d.estado ?? '',
        d.conta_atribuida ?? '',
        d.tipo_incidente ?? '',
        d.situacao_equipamento ?? '',
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backlog_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function getDiasBadge(dias: number | null) {
    if (dias === null) return <span className="text-muted-foreground">—</span>;
    const color =
        dias <= 5 ? 'bg-green-500/20 text-green-400' :
            dias <= 30 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400';
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
            {dias}d
        </span>
    );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function BacklogTable({ data }: BacklogTableProps) {
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('dias_em_aberto');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
        setPage(1);
    };

    const filtered = useMemo(() => {
        let result = [...data];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(d =>
                (d.numero_referencia ?? '').toLowerCase().includes(q) ||
                (d.fila ?? '').toLowerCase().includes(q) ||
                (d.nome_projeto ?? '').toLowerCase().includes(q) ||
                (d.empresa_nome ?? '').toLowerCase().includes(q) ||
                (d.codigo_projeto ?? '').toLowerCase().includes(q)
            );
        }
        result.sort((a, b) => {
            let va: any = a[sortField];
            let vb: any = b[sortField];
            if (va === null || va === undefined) va = sortDir === 'asc' ? Infinity : -Infinity;
            if (vb === null || vb === undefined) vb = sortDir === 'asc' ? Infinity : -Infinity;
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === 'asc' ? va - vb : vb - va;
        });
        return result;
    }, [data, search, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center gap-1 hover:text-primary transition-colors"
        >
            {label}
            <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
        </button>
    );

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por referência, fila, projeto, empresa..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 bg-secondary/50"
                    />
                </div>
                <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
                >
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} por página</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                </Button>
                <span className="text-xs text-muted-foreground ml-auto">
                    {filtered.length.toLocaleString('pt-BR')} registros
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full text-xs">
                    <thead className="bg-secondary/50">
                        <tr>
                            <th className="text-left p-3 text-muted-foreground font-medium">
                                <SortBtn field="numero_referencia" label="Nº Referência" />
                            </th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Fila</th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Projeto</th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Empresa</th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Status Cliente</th>
                            <th className="text-center p-3 text-muted-foreground font-medium">
                                <SortBtn field="dias_em_aberto" label="Dias" />
                            </th>
                            <th className="text-left p-3 text-muted-foreground font-medium">
                                <SortBtn field="data_criacao" label="Criação" />
                            </th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Cidade/UF</th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Conta</th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
                            <th className="text-left p-3 text-muted-foreground font-medium">Situação Equip.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="text-center p-8 text-muted-foreground">
                                    Nenhum registro encontrado
                                </td>
                            </tr>
                        ) : (
                            paginated.map((item, i) => (
                                <tr
                                    key={item.numero_referencia ?? i}
                                    className="border-t border-border/30 hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-3 font-mono text-primary">{item.numero_referencia ?? '—'}</td>
                                    <td className="p-3 text-foreground max-w-[120px] truncate" title={item.fila ?? ''}>{item.fila ?? '—'}</td>
                                    <td className="p-3 text-foreground max-w-[140px] truncate" title={item.nome_projeto ?? ''}>{item.nome_projeto ?? '—'}</td>
                                    <td className="p-3 text-foreground max-w-[120px] truncate" title={item.empresa_nome ?? ''}>{item.empresa_nome ?? '—'}</td>
                                    <td className="p-3 text-foreground">{item.status ?? '—'}</td>
                                    <td className="p-3 text-foreground">{item.status_cliente ?? '—'}</td>
                                    <td className="p-3 text-center">{getDiasBadge(item.dias_em_aberto)}</td>
                                    <td className="p-3 text-muted-foreground">
                                        {item.data_criacao
                                            ? format(parseISO(item.data_criacao.slice(0, 10)), 'dd/MM/yyyy', { locale: ptBR })
                                            : '—'}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {[item.cidade, item.estado].filter(Boolean).join('/') || '—'}
                                    </td>
                                    <td className="p-3 text-muted-foreground max-w-[100px] truncate" title={item.conta_atribuida ?? ''}>{item.conta_atribuida ?? '—'}</td>
                                    <td className="p-3 text-muted-foreground">{item.tipo_incidente ?? '—'}</td>
                                    <td className="p-3 text-muted-foreground">{item.situacao_equipamento ?? '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
                    <span className="text-sm text-muted-foreground px-3">
                        Página {page} de {totalPages}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</Button>
                </div>
            )}
        </div>
    );
}
