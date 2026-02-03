import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Maximize, Minimize, Presentation, Grid3X3 } from 'lucide-react';
import { AdaptiveDonutChart } from '@/components/presentation/AdaptiveDonutChart';
import { AdaptiveSLADonutChart } from '@/components/presentation/AdaptiveSLADonutChart';
import { StorytellingView } from '@/components/monitoring/StorytellingView';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { useSLAData } from '@/hooks/useSLAData';
import { usePresentationSettings } from '@/hooks/usePresentationSettings';
import { useAdaptiveLayout, useViewportSize } from '@/hooks/useAdaptiveLayout';
import { MonitoringData, SLAData, MonitoringTabType, tabToMonitoringType } from '@/types';
import logoTechub from '@/assets/logo_techub.jpg';

// Header and footer heights for layout calculation
const HEADER_HEIGHT = 60;
const KPI_BAR_HEIGHT = 140; // Increased to accommodate text-8xl
const CONTROLS_HEIGHT = 60;
const FOOTER_HEIGHT = 40;
const CONTENT_PADDING = 24;

// ... (existing imports and types)

type PresentationItem = MonitoringData | SLAData;

function isSLAData(item: PresentationItem): item is SLAData {
  return 'nome' in item && 'dentro' in item && 'fora' in item;
}

export default function PresentationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as MonitoringTabType | null;
  const viewParam = searchParams.get('view');

  const activeTab: MonitoringTabType = tabParam || 'mps';
  const showStoryMode = viewParam === 'story';

  // Get the monitoring type key for settings
  const monitoringType = tabToMonitoringType(activeTab);

  const { data: mpsData, isLoading: mpsLoading } = useMonitoringData();
  const { data: slaFilaData, isLoading: slaFilaLoading } = useSLAData('fila');
  const { data: slaProjetosData, isLoading: slaProjetosLoading } = useSLAData('projetos');

  // Use settings specific to the current monitoring type
  const { settings } = usePresentationSettings(monitoringType);
  const viewport = useViewportSize();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current data based on active tab
  const { rawData, isLoading, title, itemLabel } = useMemo(() => {
    switch (activeTab) {
      case 'sla-fila':
        return {
          rawData: slaFilaData as PresentationItem[],
          isLoading: slaFilaLoading,
          title: 'SLA Fila RN',
          itemLabel: 'filas',
        };
      case 'sla-projetos':
        return {
          rawData: slaProjetosData as PresentationItem[],
          isLoading: slaProjetosLoading,
          title: 'SLA Projetos RN',
          itemLabel: 'projetos',
        };
      default:
        return {
          rawData: mpsData as PresentationItem[],
          isLoading: mpsLoading,
          title: 'Monitoramento MPS',
          itemLabel: 'empresas',
        };
    }
  }, [activeTab, mpsData, slaFilaData, slaProjetosData, mpsLoading, slaFilaLoading, slaProjetosLoading]);

  // Filter data based on settings
  const filteredData = useMemo(() => {
    if (!rawData.length) return [];

    return rawData.filter((item) => {
      const percentual = isSLAData(item) ? item.percentual : (item as MonitoringData).percentual;

      // Filter by percentage range
      if (settings.min_percentage !== null && percentual < settings.min_percentage) {
        return false;
      }
      if (settings.max_percentage !== null && percentual > settings.max_percentage) {
        return false;
      }

      // Filter by status
      const thresholdExcellent = settings.threshold_excellent ?? 98;
      const thresholdAttention = settings.threshold_attention ?? 80;
      const isGreen = percentual >= thresholdExcellent;
      const isYellow = percentual >= thresholdAttention && percentual < thresholdExcellent;
      const isRed = percentual < thresholdAttention;

      if (settings.ignore_green && isGreen) return false;
      if (settings.ignore_yellow && isYellow) return false;
      if (settings.ignore_red && isRed) return false;

      return true;
    });
  }, [rawData, settings]);

  // Calculate Average KPI (Improved with weighted average)
  const averageKPI = useMemo(() => {
    if (!filteredData.length) return null;

    // Calculate totals based on item type
    if (activeTab === 'mps') {
      const { totalBase, totalSemMonitoramento } = filteredData.reduce((acc, item) => {
        const mps = item as MonitoringData;
        return {
          totalBase: acc.totalBase + (mps.total_base || 0),
          totalSemMonitoramento: acc.totalSemMonitoramento + (mps.total_sem_monitoramento || 0)
        };
      }, { totalBase: 0, totalSemMonitoramento: 0 });

      return totalBase > 0 ? ((totalBase - totalSemMonitoramento) / totalBase) * 100 : 0;
    } else {
      // SLA Fila or SLA Projetos
      const { totalDentro, totalTotal } = filteredData.reduce((acc, item) => {
        const sla = item as SLAData;
        return {
          totalDentro: acc.totalDentro + (sla.dentro || 0),
          totalTotal: acc.totalTotal + (sla.total || 0)
        };
      }, { totalDentro: 0, totalTotal: 0 });

      return totalTotal > 0 ? (totalDentro / totalTotal) * 100 : 0;
    }
  }, [filteredData, activeTab]);

  const showKPIBar = averageKPI !== null;

  // Paginate data
  const pages = useMemo(() => {
    const result: PresentationItem[][] = [];
    const perPage = settings.companies_per_page;

    for (let i = 0; i < filteredData.length; i += perPage) {
      result.push(filteredData.slice(i, i + perPage));
    }

    return result.length > 0 ? result : [[]];
  }, [filteredData, settings.companies_per_page]);

  const currentPage = pages[currentPageIndex] || [];

  // Calculate available space for the grid - Adjusted for KPI Bar
  const contentHeight = viewport.height - HEADER_HEIGHT - (showKPIBar ? KPI_BAR_HEIGHT : 0) - FOOTER_HEIGHT - CONTENT_PADDING * 2;
  const contentWidth = viewport.width - CONTENT_PADDING * 2;

  // Use adaptive layout hook
  const layout = useAdaptiveLayout({
    itemCount: currentPage.length || settings.companies_per_page,
    containerWidth: contentWidth,
    containerHeight: contentHeight,
    minCardWidth: 120,
    maxCardWidth: 400,
    aspectRatio: 1.25,
  });

  // Reset page index when tab changes
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [activeTab]);

  // Auto-advance carousel
  useEffect(() => {
    if (pages.length <= 1 || showStoryMode) return; // Disable grid rotation in story mode

    const interval = setInterval(() => {
      setCurrentPageIndex((prev) => (prev + 1) % pages.length);
    }, settings.interval_seconds * 1000);

    return () => clearInterval(interval);
  }, [pages.length, settings.interval_seconds, showStoryMode]);

  // Fullscreen management
  const enterFullscreen = useCallback(async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Exit fullscreen error:', err);
    }
  }, []);

  // Auto-enter fullscreen on mount
  useEffect(() => {
    enterFullscreen();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enterFullscreen]);

  // Show/hide controls on mouse movement
  const handleMouseMove = useCallback(() => {
    setShowControls(true);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Handle exit
  const handleExit = useCallback(async () => {
    await exitFullscreen();
    navigate('/');
  }, [exitFullscreen, navigate]);

  const toggleViewMode = () => {
    const newView = showStoryMode ? 'grid' : 'story';
    setSearchParams({ tab: activeTab, view: newView });
  };

  if (showStoryMode) {
    return (
      <div ref={containerRef} className="min-h-screen bg-background" onMouseMove={handleMouseMove} onTouchStart={handleMouseMove}>
        <StorytellingView />
        {/* Overlay Controls for Story Mode */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed top-4 right-4 flex items-center gap-2 z-[60]"
            >
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-2 px-4 py-2 bg-secondary/90 backdrop-blur-sm rounded-lg text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <Grid3X3 className="h-4 w-4" />
                Modo Grade
              </button>
              <button
                onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())}
                className="flex items-center gap-2 px-4 py-2 bg-secondary/90 backdrop-blur-sm rounded-lg text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                {isFullscreen ? 'Sair Fullscreen' : 'Fullscreen'}
              </button>
              <button
                onClick={handleExit}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/90 backdrop-blur-sm rounded-lg text-destructive-foreground hover:bg-destructive transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // RENDER SECTION
  return (
    <div
      ref={containerRef}
      className="min-h-screen h-screen bg-background flex flex-col cursor-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Header (existing) */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0 relative z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ height: HEADER_HEIGHT }}
      >
        {/* ... Header content ... */}
        <div className="flex items-center gap-4">
          <img
            src={logoTechub}
            alt="TecHub Logo"
            className="h-10 w-auto rounded-lg"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredData.length} {itemLabel} monitoradas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Page indicator */}
          {pages.length > 1 && (
            <div className="flex items-center gap-2">
              {pages.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-500 ${index === currentPageIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30'
                    }`}
                />
              ))}
            </div>
          )}

          {/* Time display */}
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>

      {/* KPI Execution Bar (Improvement 2) */}
      {showKPIBar && (
        <div
          className="w-full flex items-center justify-center bg-secondary/30 border-b border-border/50 backdrop-blur-sm z-10"
          style={{ height: KPI_BAR_HEIGHT }}
        >
<<<<<<< Updated upstream
          <div className="flex items-center justify-center px-12 py-4 rounded-full bg-background/50 border border-border/30 shadow-lg">
=======
          <div className="flex items-center gap-8 px-12 py-4 rounded-full bg-background/50 border border-border/30 shadow-lg">
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            <span className={`text-8xl font-extrabold ${averageKPI >= (settings.threshold_excellent ?? 98) ? 'text-chart-green' :
              averageKPI >= (settings.threshold_attention ?? 80) ? 'text-chart-yellow' : 'text-chart-red'
              }`}>
              {averageKPI.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Main content with adaptive grid */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        style={{ padding: CONTENT_PADDING }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${currentPageIndex}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="grid place-items-center"
            style={{
              gridTemplateColumns: `repeat(${layout.columns}, ${layout.cardWidth}px)`,
              gridTemplateRows: `repeat(${layout.rows}, ${layout.cardHeight}px)`,
              gap: `${layout.gap}px`,
            }}
          >
            {currentPage.map((item, index) => {
              if (isSLAData(item)) {
                return (
                  <motion.div
                    key={item.id}
                    className="w-full h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.03,
                      ease: 'easeOut'
                    }}
                  >
                    <AdaptiveSLADonutChart
                      nome={item.nome}
                      percentage={item.percentual}
                      dentro={item.dentro}
                      fora={item.fora}
                      total={item.total}
                      createdAt={item.created_at}
                      scale={layout.scale}
                      trend={item.trend}
                      thresholdExcellent={settings.threshold_excellent ?? 98}
                      thresholdAttention={settings.threshold_attention ?? 80}
                    />
                  </motion.div>
                );
              }

              const mpsItem = item as MonitoringData;
              return (
                <motion.div
                  key={mpsItem.empresa}
                  className="w-full h-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.03,
                    ease: 'easeOut'
                  }}
                >
                  <AdaptiveDonutChart
                    empresa={mpsItem.empresa}
                    percentage={mpsItem.percentual}
                    totalBase={mpsItem.total_base}
                    semMonitoramento={mpsItem.total_sem_monitoramento}
                    dataGravacao={mpsItem.data_gravacao}
                    scale={layout.scale}
                    trend={mpsItem.trend}
                    thresholdExcellent={settings.threshold_excellent ?? 98}
                    thresholdAttention={settings.threshold_attention ?? 80}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredData.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-muted-foreground">
              Nenhum item para exibir com os filtros atuais
            </p>
          </div>
        )}
      </div>

      {/* Control overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 flex items-center gap-2 z-50"
          >
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-2 px-4 py-2 bg-primary/90 backdrop-blur-sm rounded-lg text-primary-foreground hover:bg-primary transition-colors cursor-pointer shadow-lg"
            >
              <Presentation className="h-4 w-4" />
              Modo Story
            </button>
            <button
              onClick={() => (isFullscreen ? exitFullscreen() : enterFullscreen())}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/90 backdrop-blur-sm rounded-lg text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
              {isFullscreen ? 'Sair Fullscreen' : 'Fullscreen'}
            </button>

            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/90 backdrop-blur-sm rounded-lg text-destructive-foreground hover:bg-destructive transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer with branding */}
      <div
        className="px-6 flex items-center justify-between text-xs text-muted-foreground flex-shrink-0"
        style={{ height: FOOTER_HEIGHT }}
      >
        <span>TECHUB Monitor · 2026</span>
        <span>
          Página {currentPageIndex + 1} de {pages.length}
        </span>
      </div>
    </div>
  );
}
