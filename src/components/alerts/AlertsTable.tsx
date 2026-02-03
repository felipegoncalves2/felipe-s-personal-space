import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { MonitoringAlert, AlertSeverity, AlertType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, CheckCircle2, FileText, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AlertsTableProps {
    alerts: MonitoringAlert[];
    onTreat: (alert: MonitoringAlert) => void;
    showHistory: boolean;
}

export function AlertsTable({ alerts, onTreat, showHistory }: AlertsTableProps) {
    const { hasPermission } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const filteredAlerts = useMemo(() => {
        return alerts
            .filter(a => a.tratado === showHistory)
            .filter(a => {
                if (searchTerm && !a.identificador_item.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
                if (typeFilter !== 'all' && a.alert_type !== typeFilter) return false;
                return true;
            });
    }, [alerts, showHistory, searchTerm, severityFilter, typeFilter]);

    const handleExport = () => {
        const headers = ['ID', 'Tipo Monitoramento', 'Item', 'Tipo Alerta', 'Severidade', 'Percentual', 'Detectado Em', 'Tratado', 'Comentário'];
        const rows = filteredAlerts.map(a => [
            a.id,
            a.tipo_monitoramento,
            a.identificador_item,
            a.alert_type,
            a.severity,
            a.percentual_atual + '%',
            a.detected_at,
            a.tratado ? 'SIM' : 'NÃO',
            a.comentario_tratamento || ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `alertas_${showHistory ? 'historico' : 'ativos'}_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-2 flex-1">
                    <div className="relative max-w-xs flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-secondary/50"
                        />
                    </div>

                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="w-[150px] bg-secondary/50">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Severidade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="critical">Crítico</SelectItem>
                            <SelectItem value="warning">Aviso</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[150px] bg-secondary/50">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            <SelectItem value="limite">Limite</SelectItem>
                            <SelectItem value="anomalia">Anomalia</SelectItem>
                            <SelectItem value="tendencia">Tendência</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {hasPermission('alerts.export') && (
                    <Button variant="outline" size="sm" onClick={handleExport} className="bg-secondary/50">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                )}
            </div>

            <div className="rounded-md border border-border/50 bg-secondary/20">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead>Monitoramento</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Severidade</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Detecção</TableHead>
                            {!showHistory && <TableHead>Tempo</TableHead>}
                            {showHistory && <TableHead>Tratado em</TableHead>}
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAlerts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    Nenhum alerta encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAlerts.map((alert) => (
                                <TableRow key={alert.id} className="last:border-0 border-border/30 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium uppercase text-[10px]">{alert.tipo_monitoramento}</TableCell>
                                    <TableCell className="font-semibold">{alert.identificador_item}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] font-bold">
                                            {alert.alert_type.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                    alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                                }`} />
                                            <span className="text-xs capitalize">{alert.severity}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-bold ${alert.severity === 'critical' ? 'text-chart-red' :
                                                alert.severity === 'warning' ? 'text-chart-yellow' : 'text-foreground'
                                            }`}>
                                            {alert.percentual_atual}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {format(new Date(alert.detected_at), 'dd/MM HH:mm')}
                                    </TableCell>
                                    {!showHistory && (
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(alert.detected_at), { addSuffix: true, locale: ptBR })}
                                        </TableCell>
                                    )}
                                    {showHistory && (
                                        <TableCell className="text-xs text-muted-foreground">
                                            {alert.tratado_em ? format(new Date(alert.tratado_em), 'dd/MM HH:mm') : '-'}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right">
                                        {!showHistory ? (
                                            hasPermission('alerts.manage') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onTreat(alert)}
                                                    className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            )
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground"
                                                title={alert.comentario_tratamento}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        )}
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
