import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useHistoryData, HistoryType } from "@/hooks/useHistoryData";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: HistoryType;
    identifier: string;
    title: string;
}

export function HistoryModal({ isOpen, onClose, type, identifier, title }: HistoryModalProps) {
    const { data, isLoading } = useHistoryData({ type, identifier, isOpen });

    const getChartColor = (percent: number) => {
        if (percent >= 98) return "hsl(var(--chart-green))";
        if (percent >= 80) return "hsl(var(--chart-yellow))";
        return "hsl(var(--chart-red))";
    };

    // Safe color for the main line if data varies, we usually pick a neutral or dynamic one.
    // Requirement: "Visual corporativo... Compatível com modo escuro... Cores devem respeitar a paleta"
    // Let's use the primary color or a gradient?
    // User requested: "Visual corporativo... Gráfico de linha moderno... curvas suaves... pontos discretos"

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] glass border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        {identifier}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                            | {title}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-6 h-[400px] w-full flex items-center justify-center bg-black/20 rounded-lg p-4">
                    {isLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : !data || data.length === 0 ? (
                        <div className="text-center text-muted-foreground p-6">
                            <p>Este item ainda não possui dados históricos para exibição.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}%`}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--popover))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "8px",
                                        color: "hsl(var(--popover-foreground))",
                                    }}
                                    itemStyle={{ color: "hsl(var(--foreground))" }}
                                    formatter={(value: number) => [`${value}%`, "Percentual"]}
                                    labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="percentual"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorPercent)"
                                    dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="text-center text-xs text-muted-foreground mt-2">
                    Exibindo histórico dos últimos 15 dias
                </div>
            </DialogContent>
        </Dialog>
    );
}
