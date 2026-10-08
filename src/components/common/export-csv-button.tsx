import { useState } from 'react';
import { Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/context/ToastContext';
import { downloadCsv, toCsv, type CsvColumn } from '@/lib/csv';
import { cn } from '@/lib/utils';

interface Props<T> {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  className?: string;
  disabled?: boolean;
}

export function ExportCsvButton<T>({
  rows,
  columns,
  filename,
  label = 'Export CSV',
  size = 'sm',
  variant = 'secondary',
  className,
  disabled,
}: Props<T>) {
  const { toast } = useToast();
  const [done, setDone] = useState(false);

  const handleExport = () => {
    if (rows.length === 0) {
      toast('WARNING', 'Nothing to export');
      return;
    }
    try {
      const csv = toCsv(rows, columns);
      downloadCsv(filename, csv);
      setDone(true);
      toast('SUCCESS', 'CSV downloaded', rows.length + ' rows');
      setTimeout(() => setDone(false), 2000);
    } catch (e) {
      toast('ERROR', 'Export failed', e instanceof Error ? e.message : 'Unknown');
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleExport}
      disabled={disabled || rows.length === 0}
      className={cn(done && 'text-success', className)}
    >
      {done ? <Check size={13} /> : <Download size={13} />}
      <span>{done ? 'Downloaded' : label}</span>
    </Button>
  );
}