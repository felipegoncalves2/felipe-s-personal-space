import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MPSReport } from '@/components/reports/MPSReport';
import { SLAReport } from '@/components/reports/SLAReport';

export function ReportsPage() {
    const [activeTab, setActiveTab] = useState('mps');

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
                <p className="text-muted-foreground">
                    Análise histórica e analítica de monitoramento e SLA
                </p>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="glass">
                    <TabsTrigger value="mps">Monitoramento MPS</TabsTrigger>
                    <TabsTrigger value="sla-fila">SLA Fila RN</TabsTrigger>
                    <TabsTrigger value="sla-projetos">SLA Projetos RN</TabsTrigger>
                </TabsList>

                <TabsContent value="mps" className="m-0 focus-visible:outline-none">
                    <MPSReport />
                </TabsContent>

                <TabsContent value="sla-fila" className="m-0 focus-visible:outline-none">
                    <SLAReport type="fila" />
                </TabsContent>

                <TabsContent value="sla-projetos" className="m-0 focus-visible:outline-none">
                    <SLAReport type="projetos" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
