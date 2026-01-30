import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Maximize, Minimize } from 'lucide-react';
import { DonutChart } from '@/components/monitoring/DonutChart';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { usePresentationSettings } from '@/hooks/usePresentationSettings';
import { MonitoringData } from '@/types';
import logoTechub from '@/assets/logo_techub.jpg';

export default function PresentationPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useMonitoringData();
  const { settings } = usePresentationSettings();
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter data based on settings
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    return data.filter((item) => {
      // Filter by percentage range
      if (settings.min_percentage !== null && item.percentual < settings.min_percentage) {
        return false;
      }
      if (settings.max_percentage !== null && item.percentual > settings.max_percentage) {
        return false;
      }

      // Filter by status
      const isGreen = item.percentual >= 98;
      const isYellow = item.percentual >= 80 && item.percentual < 98;
      const isRed = item.percentual < 80;

      if (settings.ignore_green && isGreen) return false;
      if (settings.ignore_yellow && isYellow) return false;
      if (settings.ignore_red && isRed) return false;

      return true;
    });
  }, [data, settings]);

  // Paginate data
  const pages = useMemo(() => {
    const result: MonitoringData[][] = [];
    const perPage = settings.companies_per_page;
    
    for (let i = 0; i < filteredData.length; i += perPage) {
      result.push(filteredData.slice(i, i + perPage));
    }
    
    return result.length > 0 ? result : [[]];
  }, [filteredData, settings.companies_per_page]);

  const currentPage = pages[currentPageIndex] || [];

  // Auto-advance carousel
  useEffect(() => {
    if (pages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPageIndex((prev) => (prev + 1) % pages.length);
    }, settings.interval_seconds * 1000);

    return () => clearInterval(interval);
  }, [pages.length, settings.interval_seconds]);

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

  // Get grid columns based on companies per page
  const getGridCols = () => {
    const count = settings.companies_per_page;
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    if (count <= 10) return 'grid-cols-5 lg:grid-cols-5';
    if (count <= 20) return 'grid-cols-4 lg:grid-cols-5';
    return 'grid-cols-5 lg:grid-cols-6';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background flex flex-col cursor-none"
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Header with logo and page indicator */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <img
            src={logoTechub}
            alt="TecHub Logo"
            className="h-10 w-auto rounded-lg"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">Monitoramento</h1>
            <p className="text-sm text-muted-foreground">
              {filteredData.length} empresas monitoradas
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
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === currentPageIndex
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

      {/* Main content with carousel */}
      <div className="flex-1 px-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={`grid ${getGridCols()} gap-4 h-full`}
          >
            {currentPage.map((item) => (
              <motion.div
                key={item.empresa}
                className="flex items-center justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <DonutChart
                  empresa={item.empresa}
                  size={settings.companies_per_page <= 5 ? 180 : settings.companies_per_page <= 10 ? 140 : 120}
                  percentage={item.percentual}
                  totalBase={item.total_base}
                  semMonitoramento={item.total_sem_monitoramento}
                  dataGravacao={item.data_gravacao}
                  delay={0}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredData.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-muted-foreground">
              Nenhuma empresa para exibir com os filtros atuais
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
            className="fixed top-4 right-4 flex items-center gap-2"
          >
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
              Sair da Apresentação
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer with branding */}
      <div className="px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>TECHUB Monitor · 2026</span>
        <span>
          Página {currentPageIndex + 1} de {pages.length}
        </span>
      </div>
    </div>
  );
}
