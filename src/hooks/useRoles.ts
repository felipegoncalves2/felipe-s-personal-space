import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Role {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    user_count: number;
}

export function useRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Direct SQL via query for now as we don't have the edge function yet
            // This will be replaced by edge function call for better security/abstraction if needed
            const { data, error: supError } = await supabase
                .from('roles')
                .select(`
          id,
          name,
          description,
          is_active,
          users:users(count)
        `)
                .order('id', { ascending: true });

            if (supError) throw supError;

            const formattedRoles = data.map((role: any) => ({
                ...role,
                user_count: role.users[0]?.count || 0
            }));

            setRoles(formattedRoles);
        } catch (err: any) {
            console.error('Error fetching roles:', err);
            setError(err.message || 'Erro ao carregar perfis');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const toggleRoleStatus = async (roleId: number, currentStatus: boolean) => {
        try {
            const { error: supError } = await supabase
                .from('roles')
                .update({ is_active: !currentStatus })
                .eq('id', roleId);

            if (supError) throw supError;

            toast.success(currentStatus ? 'Perfil desativado com sucesso' : 'Perfil ativado com sucesso');
            fetchRoles();
        } catch (err: any) {
            console.error('Error toggling role status:', err);
            toast.error('Erro ao alterar status do perfil');
        }
    };

    return {
        roles,
        isLoading,
        error,
        fetchRoles,
        toggleRoleStatus
    };
}
