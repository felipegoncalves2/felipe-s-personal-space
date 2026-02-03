import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Shield,
    Save,
    Loader2,
    Info,
    ChevronRight,
    ShieldAlert
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PermissionMatrix } from './PermissionMatrix';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface RoleManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: any | null; // null for creation
    onSuccess: () => void;
}

export function RoleManagerModal({ isOpen, onClose, role, onSuccess }: RoleManagerModalProps) {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
        permissions: [] as string[]
    });

    useEffect(() => {
        if (isOpen) {
            fetchAllPermissions();
            if (role) {
                setFormData({
                    name: role.name,
                    description: role.description || '',
                    is_active: role.is_active,
                    permissions: [] // Will fetch separately
                });
                fetchRolePermissions(role.id);
            } else {
                setFormData({
                    name: '',
                    description: '',
                    is_active: true,
                    permissions: []
                });
            }
        }
    }, [isOpen, role]);

    const fetchAllPermissions = async () => {
        const { data, error } = await supabase.from('permissions').select('*').order('module');
        if (error) {
            toast.error('Erro ao carregar lista de permissões');
        } else {
            setAllPermissions(data || []);
        }
    };

    const fetchRolePermissions = async (roleId: number) => {
        const { data, error } = await supabase
            .from('role_permissions')
            .select('permission_key')
            .eq('role_id', roleId)
            .eq('enabled', true);

        if (error) {
            toast.error('Erro ao carregar permissões do perfil');
        } else {
            setFormData(prev => ({ ...prev, permissions: data?.map(p => p.permission_key) || [] }));
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Nome do perfil é obrigatório');
            return;
        }

        setIsSaving(true);
        try {
            let roleId = role?.id;

            // 1. Create or Update Role
            if (role) {
                const { error: roleError } = await supabase
                    .from('roles')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        is_active: formData.is_active
                    })
                    .eq('id', roleId);

                if (roleError) throw roleError;
            } else {
                const { data, error: roleError } = await supabase
                    .from('roles')
                    .insert({
                        name: formData.name,
                        description: formData.description,
                        is_active: formData.is_active
                    })
                    .select()
                    .single();

                if (roleError) throw roleError;
                roleId = data.id;
            }

            // 2. Sync Permissions
            // For simplicity in this implementation, we clear and re-insert 
            // (In production, a diffing approach or a dedicated edge function is better)
            const { error: clearError } = await supabase
                .from('role_permissions')
                .delete()
                .eq('role_id', roleId);

            if (clearError) throw clearError;

            if (formData.permissions.length > 0) {
                const { error: insertError } = await supabase
                    .from('role_permissions')
                    .insert(
                        formData.permissions.map(key => ({
                            role_id: roleId,
                            permission_key: key,
                            enabled: true
                        }))
                    );

                if (insertError) throw insertError;
            }

            // 3. Audit Log
            await supabase.from('role_audit_log').insert({
                role_id: roleId,
                changed_by: user?.id,
                action: role ? 'UPDATE' : 'CREATE',
                new_values: formData
            });

            toast.success(role ? 'Perfil atualizado com sucesso' : 'Perfil criado com sucesso');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving role:', err);
            toast.error('Erro ao salvar perfil: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 glass border-primary/20">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">
                                {role ? `Editar Perfil: ${role.name}` : 'Criar Novo Perfil'}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Configure as permissões granulares para este grupo de acesso.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Base Info */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="role-name">Nome do Perfil</Label>
                                <Input
                                    id="role-name"
                                    placeholder="Ex: Gestor Operacional"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="bg-secondary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role-desc">Descrição</Label>
                                <Textarea
                                    id="role-desc"
                                    placeholder="Descreva a finalidade deste perfil..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="bg-secondary/20 min-h-[100px]"
                                />
                            </div>
                        </div>

                        <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Status do Perfil</Label>
                                        <p className="text-xs text-muted-foreground">Perfis inativos bloqueiam o acesso dos usuários vinculados.</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                    />
                                </div>

                                <div className="flex gap-2 p-3 bg-background/50 rounded-lg border border-border/50">
                                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        As permissões abaixo definem o que os usuários deste perfil poderão visualizar e executar no sistema.
                                    </p>
                                </div>
                            </div>

                            {formData.name === 'ADM' && (
                                <div className="flex gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mt-4">
                                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-600 font-medium">
                                        Atenção: O perfil ADM possui permissões implícitas em todo o sistema.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Permission Matrix */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                            <ChevronRight className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-lg">Matriz de Permissões</h3>
                        </div>
                        <PermissionMatrix
                            permissions={allPermissions}
                            enabledKeys={formData.permissions}
                            onChange={(keys) => setFormData(prev => ({ ...prev, permissions: keys }))}
                        />
                    </section>
                </div>

                <DialogFooter className="p-6 bg-secondary/20 border-t border-border">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 min-w-[120px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Perfil
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
