import { useState, useCallback } from 'react';
import { UserListItem, Pagination } from '@/types';

const SUPABASE_URL = 'https://qromvrzqktrfexbnaoem.supabase.co';
const SESSION_KEY = 'techub_session';

export function useUsers() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page = 1, perPage = 10, search = '') => {
    try {
      setIsLoading(true);
      setError(null);

      const storedSession = localStorage.getItem(SESSION_KEY);
      let sessionToken = '';
      
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          sessionToken = parsed.session_token;
        } catch {}
      }

      if (!sessionToken) {
        setError('Sessão não encontrada');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(search ? { search } : {}),
      });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-users?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.error || 'Erro ao carregar usuários');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { users, pagination, isLoading, error, fetchUsers };
}
