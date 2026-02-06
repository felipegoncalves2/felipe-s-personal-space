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
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReportFilters } from './ReportFilters';
import { useReportData, MPSReportData } from '@/hooks/useReportData';
import * as XLSX from 'xlsx';

export function MPSReport() {
    const { fetchMPSReport, loading, error } = useReportData();
    const [rawData, setRawData] = useState<MPSReportData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(subDays(new Date(), 30));
    const [endDate, setEndDate] = useState(new Date());

    // Load data
    const loadData = async () => {
        const data = await fetchMPSReport(startOfDay(startDate), endOfDay(endDate));
        setRawData(data);
    };

    useEffect(() => {
        loadData();
    }, [startDate, endDate]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return rawData;
        const search = searchTerm.toLowerCase();
        return rawData.filter(item =>
            item.empresa.toLowerCase().includes(search)
        );
    }, [rawData, searchTerm]);

    // Chart data: Weighted average percentage by date
    const chartData = useMemo(() => {
        const dataByDate = new Map<string, { date: string, totalBase: number, totalMonitorado: number }>();

        filteredData.forEach(item => {
            const dateKey = format(new Date(item.data_gravacao), 'dd/MM');
            const existing = dataByDate.get(dateKey) || { date: dateKey, totalBase: 0, totalMonitorado: 0 };
            const monitorado = item.total_base - item.total_sem_monitoramento;
            existing.totalBase += item.total_base;
            existing.totalMonitorado += monitorado;
            dataByDate.set(dateKey, existing);
        });

        return Array.from(dataByDate.values()).map(d => ({
            date: d.date,
            percentual: d.totalBase > 0 ? parseFloat(((d.totalMonitorado / d.totalBase) * 100).toFixed(2)) : 0
        }));
    }, [filteredData]);

    // Rankings
    const rankings = useMemo(() => {
        // Get latest reading for each company
        const latestByCompany = new Map<string, MPSReportData>();
        rawData.forEach(item => {
            const existing = latestByCompany.get(item.empresa);
            if (!existing || new Date(item.data_gravacao) > new Date(existing.data_gravacao)) {
                latestByCompany.set(item.empresa, item);
            }
        });

        const list = Array.from(latestByCompany.values());

        return {
            best: [...list].sort((a, b) => b.percentual - a.percentual).slice(0, 5),
            worst: [...list].sort((a, b) => a.percentual - b.percentual).slice(0, 5),
        };
    }, [rawData]);

    const exportCSV = () => {
        const headers = 'Empresa,Total Base,Sem Monitoramento,Percentual,Data\n';
        const rows = filteredData.map(item =>
            `${item.empresa},${item.total_base},${item.total_sem_monitoramento},${item.percentual}%,${format(new Date(item.data_gravacao), 'dd/MM/yyyy HH:mm')}`
        ).join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_mps_${format(new Date(), 'yyyyMMdd')}.csv`;
        link.click();
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData.map(item => ({
            'Empresa': item.empresa,
            'Total Base': item.total_base,
            'Sem Monitoramento': item.total_sem_monitoramento,
            'Percentual %': item.percentual,
            'Data': format(new Date(item.data_gravacao), 'dd/MM/yyyy HH:mm')
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'MPS Report');
        XLSX.writeFile(wb, `relatorio_mps_${format(new Date(), 'yyyyMMdd')}.xlsx`);
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
                            Evolução do Percentual Monitorado
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
                                        name="Média Monitoramento"
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
                                🏆 Melhores Empresas (Última Leitura)
                            </h3>
                            <div className="space-y-4">
                                {rankings.best.map((item, idx) => (
                                    <div key={item.empresa} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}.</span>
                                            <span className="text-sm font-medium">{item.empresa}</span>
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
                                ⚠️ Menores Percentuais (Última Leitura)
                            </h3>
                            <div className="space-y-4">
                                {rankings.worst.map((item, idx) => (
                                    <div key={item.empresa} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}.</span>
                                            <span className="text-sm font-medium">{item.empresa}</span>
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
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Base Total</TableHead>
                                    <TableHead>Sem Monitoramento</TableHead>
                                    <TableHead>Percentual</TableHead>
                                    <TableHead>Data Leitura</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.slice(0, 50).map((item, idx) => (
                                    <TableRow key={`${item.empresa}-${idx}`}>
                                        <TableCell className="font-medium">{item.empresa}</TableCell>
                                        <TableCell>{item.total_base}</TableCell>
                                        <TableCell>{item.total_sem_monitoramento}</TableCell>
                                        <TableCell>
                                            <span className={`font-bold ${item.percentual >= 98 ? 'text-chart-green' :
                                                item.percentual >= 80 ? 'text-chart-yellow' : 'text-chart-red'
                                                }`}>
                                                {item.percentual}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(item.data_gravacao), 'dd/MM/yyyy HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredData.length > 50 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
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
