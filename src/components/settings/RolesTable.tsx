import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    RefreshCw,
    Loader2,
    CheckCircle,
    XCircle,
    ShieldPlus,
    Edit2,
    Power,
    Users
} from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RoleManagerModal } from './RoleManagerModal';

export function RolesTable() {
    const { roles, isLoading, error, fetchRoles, toggleRoleStatus } = useRoles();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchRoles} variant="outline">
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
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                        {roles.length} perfis configurados
                    </span>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                            setEditingRole(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <ShieldPlus className="mr-2 h-4 w-4" />
                        Novo Perfil
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchRoles}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            <div className="glass rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : roles.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        Nenhum perfil encontrado
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Perfil</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-center">Usuários</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role, index) => (
                                <motion.tr
                                    key={role.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{role.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">ID: {role.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground">
                                        {role.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="gap-1 font-mono">
                                            <Users className="h-3 w-3" />
                                            {role.user_count}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {role.is_active ? (
                                            <Badge className="bg-chart-green/20 text-chart-green border-chart-green/30 hover:bg-chart-green/30">
                                                Ativo
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                                                Inativo
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setEditingRole(role);
                                                    setIsFormOpen(true);
                                                }}
                                                className="h-8 w-8 hover:text-primary transition-colors"
                                                title="Editar Permissões"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleRoleStatus(role.id, role.is_active)}
                                                className={`h-8 w-8 transition-colors ${role.is_active ? 'hover:text-chart-red' : 'hover:text-chart-green'}`}
                                                title={role.is_active ? 'Desativar Perfil' : 'Ativar Perfil'}
                                            >
                                                <Power className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <RoleManagerModal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingRole(null);
                }}
                role={editingRole}
                onSuccess={() => {
                    fetchRoles();
                }}
            />
        </motion.div>
    );
}
