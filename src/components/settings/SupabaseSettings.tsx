import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://qromvrzqktrfexbnaoem.supabase.co';
const PROJECT_ID = 'qromvrzqktrfexbnaoem';

export function SupabaseSettings() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyb212cnpxa3RyZmV4Ym5hb2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDU1NTQsImV4cCI6MjA4NTI4MTU1NH0.ipfWhsP7QJSCGBpbILyQyfj2KmRvrvpnB90ISPO7gug',
        },
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast.success('Conexão com Supabase estabelecida com sucesso!');
      } else {
        setConnectionStatus('error');
        toast.error('Falha na conexão com Supabase');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Erro ao testar conexão');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Conexão Supabase</h3>
          <p className="text-sm text-muted-foreground">Informações da conexão com o banco de dados</p>
        </div>
      </div>

      <div className="glass rounded-lg p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground">Project ID</label>
            <p className="font-mono text-sm bg-secondary/50 rounded-md px-3 py-2 mt-1">
              {PROJECT_ID}
            </p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Host</label>
            <p className="font-mono text-sm bg-secondary/50 rounded-md px-3 py-2 mt-1 truncate">
              {SUPABASE_URL}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {connectionStatus === 'idle' && (
              <span className="text-muted-foreground text-sm">Não testado</span>
            )}
            {connectionStatus === 'testing' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Testando...</span>
              </div>
            )}
            {connectionStatus === 'success' && (
              <div className="flex items-center gap-2 text-chart-green">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Conectado</span>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-chart-red">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Erro na conexão</span>
              </div>
            )}
          </div>

          <Button
            onClick={testConnection}
            disabled={connectionStatus === 'testing'}
            variant="outline"
          >
            {connectionStatus === 'testing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              'Testar conexão'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
