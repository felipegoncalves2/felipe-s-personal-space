import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function AccessDenied() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="bg-destructive/10 p-4 rounded-full">
                <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Acesso Negado</h2>
                <p className="text-muted-foreground max-w-[500px]">
                    Você não tem permissão para acessar esta área.
                    Entre em contato com o administrador se acredita que isso é um erro.
                </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
                Voltar para o Início
            </Button>
        </div>
    );
}
