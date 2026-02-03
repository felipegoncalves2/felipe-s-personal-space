import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Play, Pause, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrendDirection } from '@/components/common/TrendIndicator';

export function StorytellingView() {
    const navigate = useNavigate();
    const { data, isLoading } = useMonitoringData();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const slides = useMemo(() => {
        if (!data || data.length === 0) return [];

        // 1. Overview Slide
        const total = data.length;
        const green = data.filter(d => d.percentual >= 98).length;
        const yellow = data.filter(d => d.percentual >= 80 && d.percentual < 98).length;
        const red = data.filter(d => d.percentual < 80).length;
        const avg = data.reduce((acc, curr) => acc + curr.percentual, 0) / total;

        // 2. Critical Drops / Anomalies
        const critical = data
            .filter(d => d.percentual < 80 || d.anomaly)
            .sort((a, b) => a.percentual - b.percentual) // Ascending (worst first)
            .slice(0, 5);

        // 3. Top Improvements
        const improvements = data
            .filter(d => d.trend === 'up')
            .sort((a, b) => b.percentual - a.percentual) // Just highest % among improved, or ideally diff? 
            // We don't have exact diff in base data easily without comparison logic everywhere, 
            // but we have `comparison.diffPercent`.
            .sort((a, b) => (b.comparison?.diffPercent || 0) - (a.comparison?.diffPercent || 0))
            .slice(0, 5);

        // Natural Language Summary
        const summary = `
            Resumo Executivo: O monitoramento de hoje abrange ${total} empresas. 
            A saúde geral é ${avg >= 95 ? 'Excelente' : avg >= 85 ? 'Boa' : 'Crítica'}, com média de ${avg.toFixed(1)}%.
            Temos ${green} empresas operando dentro do ideal, enquanto ${red} requerem atenção imediata.
            ${critical.length > 0 ? `Destaque negativo para ${critical[0].empresa} com ${critical[0].percentual.toFixed(1)}%.` : ''}
            ${improvements.length > 0 && improvements[0].variation ? `Melhoria notável em ${improvements[0].empresa} (+${improvements[0].variation.toFixed(1)}%).` : ''}
        `;

        return [
            {
                id: 'overview',
                title: 'Visão Geral do Dia',
                content: (
                    <div className="grid grid-cols-3 gap-8 w-full max-w-4xl mx-auto mt-10">
                        <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <div>
                                <h3 className="text-4xl font-bold">{green}</h3>
                                <p className="text-muted-foreground uppercase tracking-wider text-sm mt-1">Excelente</p>
                            </div>
                        </div>
                        <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                            <AlertTriangle className="h-16 w-16 text-yellow-500" />
                            <div>
                                <h3 className="text-4xl font-bold">{yellow}</h3>
                                <p className="text-muted-foreground uppercase tracking-wider text-sm mt-1">Atenção</p>
                            </div>
                        </div>
                        <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                            <AlertTriangle className="h-16 w-16 text-red-500" />
                            <div>
                                <h3 className="text-4xl font-bold">{red}</h3>
                                <p className="text-muted-foreground uppercase tracking-wider text-sm mt-1">Crítico</p>
                            </div>
                        </div>
                        <div className="col-span-3 glass p-6 rounded-xl mt-4">
                            <p className="text-lg text-center font-light leading-relaxed italic">"{summary}"</p>
                        </div>
                    </div>
                )
            },
            {
                id: 'critical',
                title: 'Pontos de Atenção & Anomalias',
                content: (
                    <div className="w-full max-w-4xl mx-auto mt-10 space-y-4">
                        {critical.length === 0 ? (
                            <div className="text-center text-2xl text-muted-foreground">Nenhum ponto crítico detectado hoje. 🎉</div>
                        ) : (
                            critical.map((item, idx) => (
                                <div key={item.empresa} className="glass p-6 rounded-xl flex items-center justify-between border-l-4 border-red-500">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold text-muted-foreground/30">#{idx + 1}</span>
                                        <div>
                                            <h3 className="text-xl font-bold">{item.empresa}</h3>
                                            <div className="flex items-center gap-2 text-sm text-red-400">
                                                {item.anomaly && <span>⚠️ Anomalia Detectada</span>}
                                                {item.percentual < 80 && <span>📉 Abaixo do Limite</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-red-500">{item.percentual.toFixed(1)}%</div>
                                        <div className="text-sm text-muted-foreground font-medium">
                                            {item.variation !== undefined && item.variation !== 0 ? (
                                                <span className="flex items-center justify-end gap-1 text-red-400">
                                                    <TrendingDown className="h-4 w-4" />
                                                    {item.variation.toFixed(1)}%
                                                </span>
                                            ) : 'Estável'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )
            },
            {
                id: 'improvements',
                title: 'Melhores Desempenhos',
                content: (
                    <div className="w-full max-w-4xl mx-auto mt-10 space-y-4">
                        {improvements.length === 0 ? (
                            <div className="text-center text-2xl text-muted-foreground">Estabilidade mantida. Sem grandes variações positivas.</div>
                        ) : (
                            improvements.map((item, idx) => (
                                <div key={item.empresa} className="glass p-6 rounded-xl flex items-center justify-between border-l-4 border-green-500">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold text-muted-foreground/30">#{idx + 1}</span>
                                        <div>
                                            <h3 className="text-xl font-bold">{item.empresa}</h3>
                                            <div className="flex items-center gap-2 text-sm text-green-400">
                                                <span>🚀 Tendência de Alta</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-green-500">{item.percentual.toFixed(1)}%</div>
                                        <div className="text-sm text-muted-foreground font-medium">
                                            {item.variation !== undefined && item.variation > 0 ? (
                                                <span className="flex items-center justify-end gap-1 text-green-400">
                                                    <TrendingUp className="h-4 w-4" />
                                                    +{item.variation.toFixed(1)}%
                                                </span>
                                            ) : item.variation !== undefined && item.variation < 0 ? (
                                                <span className="flex items-center justify-end gap-1 text-red-400">
                                                    <TrendingDown className="h-4 w-4" />
                                                    {item.variation.toFixed(1)}%
                                                </span>
                                            ) : 'Estável'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )
            }
        ];
    }, [data]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && slides.length > 0) {
            interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 6000); // 6 seconds per slide
        }
        return () => clearInterval(interval);
    }, [isPlaying, slides.length]);

    if (isLoading) return <div className="flex h-screen items-center justify-center text-white">Carregando dados...</div>;
    if (!slides.length) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        Monitoramento Executivo
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full flex flex-col items-center"
                    >
                        <h2 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                            {slides[currentSlide].title}
                        </h2>
                        {slides[currentSlide].content}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer / Progress */}
            <div className="p-8 flex justify-center gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-12 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/50'
                            }`}
                    />
                ))}
            </div>

            {/* Navigation Overlay */}
            <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-16 w-16" onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}>
                    <ChevronLeft className="h-10 w-10 text-white/50" />
                </Button>
            </div>
            <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-16 w-16" onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}>
                    <ChevronRight className="h-10 w-10 text-white/50" />
                </Button>
            </div>
        </div>
    );
}
