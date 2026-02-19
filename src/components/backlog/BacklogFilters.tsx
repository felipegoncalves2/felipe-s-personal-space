import { useState } from 'react';
import { BacklogFilters, DEFAULT_FILTERS, FAIXAS_DIAS } from '@/hooks/useBacklogData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';

interface BacklogFiltersProps {
    filters: BacklogFilters;
    setFilters: (f: BacklogFilters) => void;
    options: {
        codigoProjeto: string[];
        empresaNome: string[];
        fila: string[];
        estado: string[];
        contaAtribuida: string[];
        status: string[];
        statusCliente: string[];
        tipoIncidente: string[];
    };
}

function MultiSelect({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: string[];
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const toggle = (opt: string) => {
        if (value.includes(opt)) {
            onChange(value.filter(v => v !== opt));
        } else {
            onChange([...value, opt]);
        }
    };

    return (
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {options.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sem opções</span>
                )}
                {options.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer hover:text-foreground text-xs text-muted-foreground">
                        <input
                            type="checkbox"
                            checked={value.includes(opt)}
                            onChange={() => toggle(opt)}
                            className="accent-primary"
                        />
                        <span className="truncate" title={opt}>{opt}</span>
                    </label>
                ))}
            </div>
            {value.length > 0 && (
                <button onClick={() => onChange([])} className="text-xs text-primary hover:underline">
                    Limpar ({value.length})
                </button>
            )}
        </div>
    );
}

export function BacklogFiltersPanel({ filters, setFilters, options }: BacklogFiltersProps) {
    const [open, setOpen] = useState(false);

    const activeCount = [
        filters.dateFrom, filters.dateTo,
        ...filters.codigoProjeto, ...filters.empresaNome, ...filters.fila,
        ...filters.estado, ...filters.contaAtribuida, filters.faixaDias,
        ...filters.status, ...filters.statusCliente, ...filters.tipoIncidente,
    ].filter(Boolean).length;

    const clearAll = () => setFilters({ ...DEFAULT_FILTERS });

    return (
        <div className="glass rounded-xl border border-border/50">
            {/* Header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros Globais
                    {activeCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {activeCount} ativo{activeCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {open && (
                <div className="border-t border-border/50 p-4 space-y-6">
                    {/* Date range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Data Criação — De</Label>
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="bg-secondary/50 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Data Criação — Até</Label>
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                                className="bg-secondary/50 text-sm"
                            />
                        </div>
                    </div>

                    {/* Faixa de dias */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Faixa de Dias em Aberto</Label>
                        <div className="flex flex-wrap gap-2">
                            {FAIXAS_DIAS.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilters({ ...filters, faixaDias: filters.faixaDias === f.key ? '' : f.key })}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filters.faixaDias === f.key
                                            ? 'border-primary bg-primary/20 text-primary'
                                            : 'border-border text-muted-foreground hover:border-primary/50'
                                        }`}
                                    style={{ borderColor: filters.faixaDias === f.key ? f.color : undefined }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Multi-select filters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <MultiSelect
                            label="Fila"
                            options={options.fila}
                            value={filters.fila}
                            onChange={v => setFilters({ ...filters, fila: v })}
                        />
                        <MultiSelect
                            label="Projeto (Código)"
                            options={options.codigoProjeto}
                            value={filters.codigoProjeto}
                            onChange={v => setFilters({ ...filters, codigoProjeto: v })}
                        />
                        <MultiSelect
                            label="Empresa"
                            options={options.empresaNome}
                            value={filters.empresaNome}
                            onChange={v => setFilters({ ...filters, empresaNome: v })}
                        />
                        <MultiSelect
                            label="Estado"
                            options={options.estado}
                            value={filters.estado}
                            onChange={v => setFilters({ ...filters, estado: v })}
                        />
                        <MultiSelect
                            label="Status"
                            options={options.status}
                            value={filters.status}
                            onChange={v => setFilters({ ...filters, status: v })}
                        />
                        <MultiSelect
                            label="Status Cliente"
                            options={options.statusCliente}
                            value={filters.statusCliente}
                            onChange={v => setFilters({ ...filters, statusCliente: v })}
                        />
                        <MultiSelect
                            label="Tipo Incidente"
                            options={options.tipoIncidente}
                            value={filters.tipoIncidente}
                            onChange={v => setFilters({ ...filters, tipoIncidente: v })}
                        />
                        <MultiSelect
                            label="Conta Atribuída"
                            options={options.contaAtribuida}
                            value={filters.contaAtribuida}
                            onChange={v => setFilters({ ...filters, contaAtribuida: v })}
                        />
                    </div>

                    {/* Actions */}
                    {activeCount > 0 && (
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10">
                                <X className="h-4 w-4" />
                                Limpar todos os filtros
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
