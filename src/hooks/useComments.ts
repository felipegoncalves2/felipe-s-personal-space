import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Comment {
    id: string;
    tipo_monitoramento: string;
    identificador_item: string;
    timestamp_coleta: string;
    texto_comentario: string;
    is_incident?: boolean; // New field for "Mark Incident"
    created_at: string;
}

interface UseCommentsProps {
    type: string;
    identifier: string;
}

export function useComments({ type, identifier }: UseCommentsProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: comments, isLoading } = useQuery({
        queryKey: ['comments', type, identifier],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('monitoring_comments')
                .select('*')
                .eq('tipo_monitoramento', type)
                .eq('identificador_item', identifier)
                .order('timestamp_coleta', { ascending: true });

            if (error) {
                // Fail silently if table doesn't exist to avoid breaking the UI
                console.warn('Comments fetch failed:', error);
                return [];
            }
            return data as Comment[];
        },
        enabled: !!type && !!identifier,
    });

    const addComment = useMutation({
        mutationFn: async (newComment: Omit<Comment, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('monitoring_comments')
                .insert([newComment])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', type, identifier] });
            toast({
                title: "Comentário adicionado",
                description: "Seu comentário foi salvo com sucesso.",
            });
        },
        onError: (error) => {
            console.error('Add comment error:', error);
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar o comentário. Verifique se a tabela 'monitoring_comments' existe.",
                variant: "destructive",
            });
        },
    });

    return { comments, isLoading, addComment };
}
