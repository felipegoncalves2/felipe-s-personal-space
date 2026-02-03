import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Role {
    id: number;
    name: string;
    description: string;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);

    // Form state
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('');
    const [roleId, setRoleId] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load roles on mount
    useState(() => {
        const loadRoles = async () => {
            try {
                const { data, error } = await supabase
                    .from('roles')
                    .select('*')
                    .order('name');

                if (error) throw error;
                setRoles(data || []);
            } catch (error) {
                console.error('Error loading roles:', error);
                toast({
                    title: 'Erro ao carregar roles',
                    description: 'Não foi possível carregar a lista de roles.',
                    variant: 'destructive',
                });
            } finally {
                setLoadingRoles(false);
            }
        };

        if (isOpen) {
            loadRoles();
        }
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Nome completo é obrigatório';
        }

        if (!username.trim()) {
            newErrors.username = 'Username é obrigatório';
        } else if (username.length < 3) {
            newErrors.username = 'Username deve ter no mínimo 3 caracteres';
        }

        if (!email.trim()) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email inválido';
        }

        if (!password) {
            newErrors.password = 'Senha é obrigatória';
        } else if (password.length < 8) {
            newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
        }

        if (!roleId) {
            newErrors.roleId = 'Role é obrigatória';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Call Supabase Edge Function to create user
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    full_name: fullName.trim(),
                    username: username.trim().toLowerCase(),
                    email: email.trim().toLowerCase(),
                    password: password,
                    department: department.trim() || null,
                    role_id: roleId,
                    is_active: isActive,
                },
            });

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || 'Erro ao criar usuário');
            }

            toast({
                title: 'Usuário criado com sucesso!',
                description: `O usuário ${username} foi criado.`,
            });

            // Reset form
            setFullName('');
            setUsername('');
            setEmail('');
            setPassword('');
            setDepartment('');
            setRoleId('');
            setIsActive(true);
            setErrors({});

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating user:', error);

            let errorMessage = 'Não foi possível criar o usuário.';

            if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
                if (error.message.includes('username')) {
                    errorMessage = 'Este username já está em uso.';
                } else if (error.message.includes('email')) {
                    errorMessage = 'Este email já está em uso.';
                } else {
                    errorMessage = 'Username ou email já está em uso.';
                }
            }

            toast({
                title: 'Erro ao criar usuário',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setFullName('');
            setUsername('');
            setEmail('');
            setPassword('');
            setDepartment('');
            setRoleId('');
            setIsActive(true);
            setErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Novo Usuário
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os dados para criar um novo usuário no sistema.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName">
                            Nome Completo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="João da Silva"
                            disabled={isLoading}
                            className={errors.fullName ? 'border-destructive' : ''}
                        />
                        {errors.fullName && (
                            <p className="text-xs text-destructive">{errors.fullName}</p>
                        )}
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username">
                            Username <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="joao.silva"
                            disabled={isLoading}
                            className={errors.username ? 'border-destructive' : ''}
                        />
                        {errors.username && (
                            <p className="text-xs text-destructive">{errors.username}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="joao.silva@empresa.com"
                            disabled={isLoading}
                            className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            Senha <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            disabled={isLoading}
                            className={errors.password ? 'border-destructive' : ''}
                        />
                        {errors.password && (
                            <p className="text-xs text-destructive">{errors.password}</p>
                        )}
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                        <Label htmlFor="department">Departamento</Label>
                        <Input
                            id="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="TI, RH, Financeiro..."
                            disabled={isLoading}
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">
                            Role <span className="text-destructive">*</span>
                        </Label>
                        <Select value={roleId} onValueChange={setRoleId} disabled={isLoading || loadingRoles}>
                            <SelectTrigger className={errors.roleId ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Selecione uma role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                        {role.name} {role.description && `- ${role.description}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.roleId && (
                            <p className="text-xs text-destructive">{errors.roleId}</p>
                        )}
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isActive"
                            checked={isActive}
                            onCheckedChange={(checked) => setIsActive(checked as boolean)}
                            disabled={isLoading}
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">
                            Usuário ativo
                        </Label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Criar Usuário
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
