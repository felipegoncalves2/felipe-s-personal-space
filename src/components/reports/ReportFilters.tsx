import { Search, Calendar as CalendarIcon, FileSpreadsheet, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    startDate: Date;
    onStartDateChange: (date: Date) => void;
    endDate: Date;
    onEndDateChange: (date: Date) => void;
    onExportCSV: () => void;
    onExportExcel: () => void;
    isLoading?: boolean;
}

export function ReportFilters({
    searchTerm,
    onSearchChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
    onExportCSV,
    onExportExcel,
    isLoading
}: ReportFiltersProps) {
    return (
        <div className="flex flex-wrap gap-4 items-end bg-secondary/20 p-4 rounded-lg border border-border/50">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
                <Label className="mb-2 block">Buscar</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 bg-background"
                    />
                </div>
            </div>

            {/* Start Date */}
            <div>
                <Label className="mb-2 block">Data Início</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-start text-left font-normal bg-background">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'dd/MM/yyyy') : <span>Selecione</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => date && onStartDateChange(date)}
                            locale={ptBR}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* End Date */}
            <div>
                <Label className="mb-2 block">Data Fim</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-start text-left font-normal bg-background">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'dd/MM/yyyy') : <span>Selecione</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => date && onEndDateChange(date)}
                            locale={ptBR}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportCSV}
                    disabled={isLoading}
                    className="bg-background"
                >
                    <FileText className="mr-2 h-4 w-4" />
                    CSV
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportExcel}
                    disabled={isLoading}
                    className="bg-background"
                >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                </Button>
            </div>
        </div>
    );
}
