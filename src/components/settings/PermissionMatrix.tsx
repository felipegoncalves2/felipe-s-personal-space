import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronRight, Shield, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Permission {
    key: string;
    name: string;
    module: string;
    description: string;
}

interface PermissionMatrixProps {
    permissions: Permission[];
    enabledKeys: string[];
    onChange: (keys: string[]) => void;
    readOnly?: boolean;
}

export function PermissionMatrix({ permissions, enabledKeys, onChange, readOnly }: PermissionMatrixProps) {
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    // Group permissions by module
    const modules = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const moduleNames = Object.keys(modules).sort();

    useEffect(() => {
        // Expand all modules by default
        setExpandedModules(moduleNames);
    }, [permissions]);

    const toggleModule = (module: string) => {
        setExpandedModules(prev =>
            prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
        );
    };

    const handlePermissionToggle = (key: string, checked: boolean) => {
        if (readOnly) return;
        if (checked) {
            onChange([...enabledKeys, key]);
        } else {
            onChange(enabledKeys.filter(k => k !== key));
        }
    };

    const handleModuleToggle = (module: string, checked: boolean) => {
        if (readOnly) return;
        const modulePermKeys = modules[module].map(p => p.key);
        if (checked) {
            const newKeys = Array.from(new Set([...enabledKeys, ...modulePermKeys]));
            onChange(newKeys);
        } else {
            const newKeys = enabledKeys.filter(k => !modulePermKeys.includes(k));
            onChange(newKeys);
        }
    };

    const isModuleFullySelected = (module: string) => {
        return modules[module].every(p => enabledKeys.includes(p.key));
    };

    const isModulePartiallySelected = (module: string) => {
        const hasSome = modules[module].some(p => enabledKeys.includes(p.key));
        const isFull = isModuleFullySelected(module);
        return hasSome && !isFull;
    };

    return (
        <div className="space-y-4">
            {moduleNames.map((module) => (
                <div key={module} className="border border-border/50 rounded-lg overflow-hidden bg-secondary/10">
                    <div
                        className="flex items-center justify-between p-3 bg-secondary/30 cursor-pointer hover:bg-secondary/40 transition-colors"
                        onClick={() => toggleModule(module)}
                    >
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                id={`module-${module}`}
                                checked={isModuleFullySelected(module) ? true : (isModulePartiallySelected(module) ? "indeterminate" : false)}
                                onCheckedChange={(checked) => handleModuleToggle(module, checked as boolean)}
                                disabled={readOnly}
                            />
                            <div className="flex items-center gap-2" onClick={() => toggleModule(module)}>
                                {expandedModules.includes(module) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="font-semibold text-sm uppercase tracking-wider">{module}</span>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-background/50">
                            {modules[module].filter(p => enabledKeys.includes(p.key)).length} / {modules[module].length}
                        </Badge>
                    </div>

                    <AnimatePresence>
                        {expandedModules.includes(module) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {modules[module].map((perm) => (
                                        <div
                                            key={perm.key}
                                            className={`flex items-start gap-3 p-3 rounded-md border border-transparent transition-all ${enabledKeys.includes(perm.key)
                                                    ? 'bg-primary/5 border-primary/20'
                                                    : 'hover:bg-secondary/20'
                                                }`}
                                        >
                                            <Checkbox
                                                id={perm.key}
                                                checked={enabledKeys.includes(perm.key)}
                                                onCheckedChange={(checked) => handlePermissionToggle(perm.key, checked as boolean)}
                                                className="mt-1"
                                                disabled={readOnly}
                                            />
                                            <div className="space-y-1">
                                                <label
                                                    htmlFor={perm.key}
                                                    className="text-sm font-medium leading-none cursor-pointer select-none block"
                                                >
                                                    {perm.name}
                                                </label>
                                                <p className="text-xs text-muted-foreground leading-tight">
                                                    {perm.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}
