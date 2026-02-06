import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, BarChart, Bar, Cell
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ReportFilters } from './ReportFilters';
import { useReportData, SLAReportData } from '@/hooks/useReportData';
import * as XLSX from 'xlsx';

interface SLAReportProps {
    type: 'fila' | 'projetos';
}

export function SLAReport({ type }: SLAReportProps) {
    const { fetchSLAReport, loading, error } = useReportData();
    const [rawData, setRawData] = useState<SLAReportData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(subDays(new Date(), 30));
    const [endDate, setEndDate] = useState(new Date());

    const title = type === 'fila' ? 'SLA Fila RN' : 'SLA Projetos RN';
    const label = type === 'fila' ? 'Fila' : 'Projeto';

    // Load data
    const loadData = async () => {
        const data = await fetchSLAReport(type, startOfDay(startDate), endOfDay(endDate));
        setRawData(data);
    };

    useEffect(() => {
        loadData();
    }, [startDate, endDate, type]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return rawData;
        const search = searchTerm.toLowerCase();
        return rawData.filter(item =>
            item.nome.toLowerCase().includes(search)
        );
    }, [rawData, searchTerm]);

    // Chart data: Average percentage by date
    const chartData = useMemo(() => {
        if (type === 'projetos') {
            // Weighted average for Projetos
            const dataByDate = new Map<string, { date: string, totalDentro: number, totalTotal: number }>();
            filteredData.forEach(item => {
                const dateKey = format(new Date(item.created_at), 'dd/MM');
                const existing = dataByDate.get(dateKey) || { date: dateKey, totalDentro: 0, totalTotal: 0 };
                existing.totalDentro += (item.dentro || 0);
                existing.totalTotal += (item.total || 0);
                dataByDate.set(dateKey, existing);
            });
            return Array.from(dataByDate.values()).map(d => ({
                date: d.date,
                percentual: d.totalTotal > 0 ? parseFloat(((d.totalDentro / d.totalTotal) * 100).toFixed(2)) : 0
            }));
        } else {
            // Simple average for Fila
            const dataByDate = new Map<string, { date: string, total: number, count: number }>();
            filteredData.forEach(item => {
                const dateKey = format(new Date(item.created_at), 'dd/MM');
                const existing = dataByDate.get(dateKey) || { date: dateKey, total: 0, count: 0 };
                existing.total += item.percentual;
                existing.count += 1;
                dataByDate.set(dateKey, existing);
            });
            return Array.from(dataByDate.values()).map(d => ({
                date: d.date,
                percentual: parseFloat((d.total / d.count).toFixed(2))
            }));
        }
    }, [filteredData, type]);

    // Rankings
    const rankings = useMemo(() => {
        // Get latest reading for each item
        const latestByName = new Map<string, SLAReportData>();
        rawData.forEach(item => {
            const existing = latestByName.get(item.nome);
            if (!existing || new Date(item.created_at) > new Date(existing.created_at)) {
                latestByName.set(item.nome, item);
            }
        });

        const list = Array.from(latestByName.values());

        return {
            best: [...list].sort((a, b) => b.percentual - a.percentual).slice(0, 5),
            worst: [...list].sort((a, b) => a.percentual - b.percentual).slice(0, 5),
        };
    }, [rawData]);

    const exportCSV = () => {
        const headers = `${label},Dentro SLA,Fora SLA,Total,Percentual,Data\n`;
        const rows = filteredData.map(item =>
            `${item.nome},${item.dentro},${item.fora},${item.total},${item.percentual}%,${format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}`
        ).join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_sla_${type}_${format(new Date(), 'yyyyMMdd')}.csv`;
        link.click();
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData.map(item => ({
            [label]: item.nome,
            'Dentro SLA': item.dentro,
            'Fora SLA': item.fora,
            'Total': item.total,
            'Percentual %': item.percentual,
            'Data': format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `SLA ${type} Report`);
        XLSX.writeFile(wb, `relatorio_sla_${type}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <ReportFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onExportCSV={exportCSV}
                onExportExcel={exportExcel}
                isLoading={loading}
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Carregando dados do relatório...</p>
                </div>
            ) : (
                <>
                    {/* Main Chart */}
                    <div className="glass rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Evolução do SLA
                        </h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `${v}%`}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(23, 23, 23, 0.95)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                        formatter={(v) => [`${v}%`, 'Média']}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="percentual"
                                        name="Média SLA"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={3}
                                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Rankings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top 5 */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-sm font-semibold mb-4 text-chart-green flex items-center gap-2">
                                🏆 Melhores {type === 'fila' ? 'Filas' : 'Projetos'} (Última Leitura)
                            </h3>
                            <div className="space-y-4">
                                {rankings.best.map((item, idx) => (
                                    <div key={item.nome} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}.</span>
                                            <span className="text-sm font-medium">{item.nome}</span>
                                        </div>
                                        <Badge variant="outline" className="bg-chart-green/10 text-chart-green border-chart-green/20">
                                            {item.percentual}%
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom 5 */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-sm font-semibold mb-4 text-chart-red flex items-center gap-2">
                                ⚠️ Críticos (Última Leitura)
                            </h3>
                            <div className="space-y-4">
                                {rankings.worst.map((item, idx) => (
                                    <div key={item.nome} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}.</span>
                                            <span className="text-sm font-medium">{item.nome}</span>
                                        </div>
                                        <Badge variant="outline" className="bg-chart-red/10 text-chart-red border-chart-red/20">
                                            {item.percentual}%
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">Tabela Analítica</h3>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{label}</TableHead>
                                    <TableHead>Dentro SLA</TableHead>
                                    <TableHead>Fora SLA</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Percentual</TableHead>
                                    <TableHead>Data Leitura</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.slice(0, 50).map((item, idx) => (
                                    <TableRow key={`${item.nome}-${idx}`}>
                                        <TableCell className="font-medium">{item.nome}</TableCell>
                                        <TableCell>{item.dentro}</TableCell>
                                        <TableCell>{item.fora}</TableCell>
                                        <TableCell>{item.total}</TableCell>
                                        <TableCell>
                                            <span className={`font-bold ${item.percentual >= 98 ? 'text-chart-green' :
                                                item.percentual >= 80 ? 'text-chart-yellow' : 'text-chart-red'
                                                }`}>
                                                {item.percentual}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredData.length > 50 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                                            Mostrando apenas os primeiros 50 registros. Use a busca ou filtros para refinar.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    );
}
