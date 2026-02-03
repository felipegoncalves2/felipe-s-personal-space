import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { detectAnomaly, calculateComparison } from '../src/lib/statistics';
import { calculateTrend } from '../src/components/common/TrendIndicator';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
    console.log('--- Starting Alerts Backfill ---');

    // 1. MPS BACKFILL
    console.log('Processing MPS Alerts...');
    const { data: mpsData, error: mpsError } = await supabase
        .from('monitoramento_parque')
        .select('*')
        .order('data_gravacao', { ascending: false });

    if (mpsError) {
        console.error('Error fetching MPS data:', mpsError);
    } else {
        const recordsByEmpresa = new Map<string, any[]>();
        mpsData.forEach(r => {
            if (!recordsByEmpresa.has(r.empresa)) recordsByEmpresa.set(r.empresa, []);
            recordsByEmpresa.get(r.empresa)!.push(r);
        });

        for (const [empresa, records] of recordsByEmpresa.entries()) {
            const current = records[0];
            const previous = records[1];

            const b = parseInt(current.total_base) || 0;
            const s = parseInt(current.total_sem_monitoramento) || 0;
            const currentVal = b > 0 ? ((b - s) / b) * 100 : 0;

            // Trend
            if (previous) {
                const pb = parseInt(previous.total_base) || 0;
                const ps = parseInt(previous.total_sem_monitoramento) || 0;
                const prevVal = pb > 0 ? ((pb - ps) / pb) * 100 : 0;
                const trend = calculateTrend(currentVal, prevVal);
                if (trend === 'down') {
                    await insertAlert('mps', empresa, 'tendencia', 'warning', currentVal, { trend });
                }
            }

            // Limit
            if (currentVal < 80) {
                await insertAlert('mps', empresa, 'limite', 'critical', currentVal, { reason: 'Abaixo de 80%' });
            }

            // Anomaly (simplified check for backfill)
            const historyPoints = records.slice(1, 8).map(r => {
                const hb = parseInt(r.total_base) || 0;
                const hs = parseInt(r.total_sem_monitoramento) || 0;
                return { value: hb > 0 ? ((hb - hs) / hb) * 100 : 0 };
            });
            if (historyPoints.length >= 7 && detectAnomaly(historyPoints as any, currentVal)) {
                await insertAlert('mps', empresa, 'anomalia', 'critical', currentVal, { anomaly: true });
            }
        }
    }

    // 2. SLA BACKFILL
    for (const table of ['sla_fila_rn', 'sla_projetos_rn']) {
        console.log(`Processing ${table}...`);
        const monitorType = table.includes('fila') ? 'sla_fila' : 'sla_projeto';
        const nameField = table.includes('fila') ? 'nome_fila' : 'nome_projeto';

        const { data: slaData, error: slaError } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });

        if (slaError) {
            console.error(`Error fetching ${table}:`, slaError);
            continue;
        }

        const recordsByName = new Map<string, any[]>();
        slaData.forEach(r => {
            const name = r[nameField];
            if (!recordsByName.has(name)) recordsByName.set(name, []);
            recordsByName.get(name)!.push(r);
        });

        for (const [name, records] of recordsByName.entries()) {
            const current = records[0];
            const previous = records[1];

            const total = (current.dentro || 0) + (current.fora || 0);
            const val = total > 0 ? (current.dentro / total) * 100 : 0;

            if (previous) {
                const pTotal = (previous.dentro || 0) + (previous.fora || 0);
                const pVal = pTotal > 0 ? (previous.dentro / pTotal) * 100 : 0;
                const trend = calculateTrend(val, pVal);
                if (trend === 'down') {
                    await insertAlert(monitorType, name, 'tendencia', 'warning', val, { trend });
                }
            }

            if (val < 80) {
                await insertAlert(monitorType, name, 'limite', 'critical', val, { reason: 'Abaixo de 80%' });
            }
        }
    }

    console.log('--- Backfill Completed ---');
}

async function insertAlert(tipo: string, item: string, type: string, severity: string, val: number, ctx: any) {
    // Check existence
    const { data: existing } = await supabase
        .from('monitoring_alerts')
        .select('id')
        .eq('tipo_monitoramento', tipo)
        .eq('identificador_item', item)
        .eq('alert_type', type)
        .eq('tratado', false)
        .maybeSingle();

    if (existing) return;

    console.log(`Creating Alert: [${tipo}] ${item} - ${type} (${val.toFixed(2)}%)`);
    await supabase.from('monitoring_alerts').insert({
        tipo_monitoramento: tipo,
        identificador_item: item,
        alert_type: type,
        severity: severity,
        percentual_atual: Number(val.toFixed(2)),
        contexto: ctx
    });
}

backfill();
