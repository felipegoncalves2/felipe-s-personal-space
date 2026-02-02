import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Filter, ArrowUpDown, Loader2, Play } from 'lucide-react';
import { SLADonutChart } from './SLADonutChart';
import { HistoryModal } from './HistoryModal';
import { useSLAData } from '@/hooks/useSLAData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePresentationSettings } from '@/hooks/usePresentationSettings';

type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'green' | 'yellow' | 'red';
type SLAType = 'fila' | 'projetos';

const ITEMS_PER_PAGE_OPTIONS = [3, 5, 10, 20, 30];

interface SLAGridProps {
  type: SLAType;
}

export function SLAGrid({ type }: SLAGridProps) {
  const navigate = useNavigate();
  const { data, isLoading, error, lastUpdated, refetch } = useSLAData(type);
  const { settings } = usePresentationSettings(type === 'fila' ? 'sla_fila' : 'sla_projetos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<{ nome: string } | null>(null);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter((item) =>
        item.nome.toLowerCase().includes(search)
      );
    }

    // Filter by status using dynamic thresholds
    if (statusFilter !== 'all') {
      const thresholdExcellent = settings.threshold_excellent ?? 98;
      const thresholdAttention = settings.threshold_attention ?? 80;
      result = result.filter((item) => {
        if (statusFilter === 'green') return item.percentual >= thresholdExcellent;
        if (statusFilter === 'yellow') return item.percentual >= thresholdAttention && item.percentual < thresholdExcellent;
        if (statusFilter === 'red') return item.percentual < thresholdAttention;
        return true;
      });
    }

    // Sort by percentage
    result.sort((a, b) => {
      if (sortOrder === 'asc') return a.percentual - b.percentual;
      return b.percentual - a.percentual;
    });

    return result;
  }, [data, searchTerm, sortOrder, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const statusCounts = useMemo(() => {
    const thresholdExcellent = settings.threshold_excellent ?? 98;
    const thresholdAttention = settings.threshold_attention ?? 80;
    return {
      green: data.filter((d) => d.percentual >= thresholdExcellent).length,
      yellow: data.filter((d) => d.percentual >= thresholdAttention && d.percentual < thresholdExcellent).length,
      red: data.filter((d) => d.percentual < thresholdAttention).length,
    };
  }, [data, settings.threshold_excellent, settings.threshold_attention]);

  const typeLabel = type === 'fila' ? 'Fila' : 'Projeto';
  const searchPlaceholder = type === 'fila' ? 'Buscar fila...' : 'Buscar projeto...';

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-4 text-center"
        >
          <div className="text-2xl font-bold text-chart-green">{statusCounts.green}</div>
          <div className="text-xs text-muted-foreground mt-1">Excelente (≥98%)</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-lg p-4 text-center"
        >
          <div className="text-2xl font-bold text-chart-yellow">{statusCounts.yellow}</div>
          <div className="text-xs text-muted-foreground mt-1">Atenção (80-97.9%)</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-lg p-4 text-center"
        >
          <div className="text-2xl font-bold text-chart-red">{statusCounts.red}</div>
          <div className="text-xs text-muted-foreground mt-1">Crítico (&lt;80%)</div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-secondary/50"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value: StatusFilter) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] bg-secondary/50">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="green">🟢 Excelente</SelectItem>
              <SelectItem value="yellow">🟡 Atenção</SelectItem>
              <SelectItem value="red">🔴 Crítico</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-secondary/50"
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {sortOrder === 'desc' ? 'Maior %' : 'Menor %'}
          </Button>

          {/* Items per page */}
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[120px] bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="bg-secondary/50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/apresentacao?tab=${type === 'fila' ? 'sla-fila' : 'sla-projetos'}`)}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="mr-2 h-4 w-4" />
            Modo Apresentação
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading && data.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>Nenhum {typeLabel.toLowerCase()} encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedData.map((item, index) => (
            <SLADonutChart
              key={item.id}
              nome={item.nome}
              percentage={item.percentual}
              dentro={item.dentro}
              fora={item.fora}
              total={item.total}
              createdAt={item.created_at}
              delay={index * 0.05}
              trend={item.trend}
              thresholdExcellent={settings.threshold_excellent ?? 98}
              thresholdAttention={settings.threshold_attention ?? 80}
              onClick={() => setSelectedItem({ nome: item.nome })}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <HistoryModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          type={type === 'fila' ? 'sla_fila' : 'sla_projetos'}
          identifier={selectedItem.nome}
          title={`Histórico de SLA - ${type === 'fila' ? 'Fila RN' : 'Projetos RN'}`}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="text-center text-xs text-muted-foreground">
        Mostrando {paginatedData.length} de {filteredAndSortedData.length} {type === 'fila' ? 'filas' : 'projetos'}
        {filteredAndSortedData.length !== data.length && ` (${data.length} total)`}
      </div>
    </div>
  );
}
