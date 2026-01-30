import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function UsersTable() {
  const { users, pagination, isLoading, error, fetchUsers } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    fetchUsers(1, perPage, '');
  }, [fetchUsers, perPage]);

  const handleSearch = () => {
    fetchUsers(1, perPage, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, perPage, searchTerm);
  };

  const handleRefresh = () => {
    fetchUsers(pagination.page, perPage, searchTerm);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            Buscar
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={perPage.toString()}
            onValueChange={(value) => setPerPage(parseInt(value))}
          >
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border hover:bg-secondary/30"
                >
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.department || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'ADM' ? 'default' : 'secondary'}
                      className={user.role === 'ADM' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <div className="flex items-center gap-1 text-chart-green">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Ativo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-chart-red">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Inativo</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.created_at)}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            Mostrando {users.length} de {pagination.total} usuários
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground px-2">
              Página {pagination.page} de {pagination.total_pages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages || isLoading}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
