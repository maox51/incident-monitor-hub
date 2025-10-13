import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { MovimientoBilletero } from "@/hooks/useBilleteros";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MovimientosBilleterosListProps {
  movimientos: MovimientoBilletero[];
}

const tipoMovimientoLabels: Record<string, string> = {
  asignacion: 'Asignación',
  cambio_estado: 'Cambio de Estado',
  transferencia: 'Transferencia',
  baja: 'Baja',
};

const tipoMovimientoColors: Record<string, string> = {
  asignacion: 'bg-green-100 text-green-800',
  cambio_estado: 'bg-blue-100 text-blue-800',
  transferencia: 'bg-yellow-100 text-yellow-800',
  baja: 'bg-red-100 text-red-800',
};

export const MovimientosBilleterosList = ({ movimientos }: MovimientosBilleterosListProps) => {
  const exportarExcel = () => {
    const datosExcel = movimientos.map(mov => ({
      'Fecha': format(new Date(mov.fecha_movimiento), 'dd/MM/yyyy', { locale: es }),
      'Código Billetero': mov.billeteros?.codigo || '',
      'Serial Billetero': mov.billeteros?.serial || '',
      'Tipo Billetero': mov.billeteros?.tipo || '',
      'Tipo Movimiento': tipoMovimientoLabels[mov.tipo_movimiento] || mov.tipo_movimiento,
      'Sala Origen': mov.sala_origen?.nombre || '-',
      'Sala Destino': mov.sala_destino?.nombre || '-',
      'Número Máquina Anterior': mov.numero_maquina_anterior || '-',
      'Número Máquina Nuevo': mov.numero_maquina_nuevo || '-',
      'Estado Anterior': mov.estado_anterior || '-',
      'Estado Nuevo': mov.estado_nuevo || '-',
      'Motivo': mov.motivo,
      'Observaciones': mov.observaciones || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

    // Ajustar ancho de columnas
    const maxWidth = 50;
    const colWidths = Object.keys(datosExcel[0] || {}).map(key => ({
      wch: Math.min(
        maxWidth,
        Math.max(
          key.length,
          ...datosExcel.map(row => String(row[key as keyof typeof row]).length)
        )
      )
    }));
    worksheet['!cols'] = colWidths;

    const fecha = format(new Date(), 'dd-MM-yyyy');
    XLSX.writeFile(workbook, `movimientos-billeteros-${fecha}.xlsx`);
  };

  if (movimientos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay movimientos registrados
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={exportarExcel} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar a Excel
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tipo Movimiento</TableHead>
              <TableHead>Sala Origen</TableHead>
              <TableHead>Sala Destino</TableHead>
              <TableHead>Núm. Máquina</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((movimiento) => (
              <TableRow key={movimiento.id}>
                <TableCell>
                  {format(new Date(movimiento.fecha_movimiento), 'dd/MM/yyyy', { locale: es })}
                </TableCell>
                <TableCell className="font-medium">
                  {movimiento.billeteros?.codigo}
                </TableCell>
                <TableCell>{movimiento.billeteros?.serial}</TableCell>
                <TableCell>
                  <Badge variant="outline">{movimiento.billeteros?.tipo}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={tipoMovimientoColors[movimiento.tipo_movimiento]}>
                    {tipoMovimientoLabels[movimiento.tipo_movimiento]}
                  </Badge>
                </TableCell>
                <TableCell>{movimiento.sala_origen?.nombre || '-'}</TableCell>
                <TableCell>{movimiento.sala_destino?.nombre || '-'}</TableCell>
                <TableCell>
                  {movimiento.numero_maquina_nuevo || movimiento.numero_maquina_anterior || '-'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {movimiento.motivo}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
