import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Billetero } from "@/hooks/useBilleteros";
import { MovimientosBilleterosForm } from "./MovimientosBilleterosForm";

interface BilleterosListProps {
  billeteros: Billetero[];
}

const estadoColors: Record<string, string> = {
  en_stock: 'bg-green-100 text-green-800',
  reparacion: 'bg-yellow-100 text-yellow-800',
  en_programacion: 'bg-blue-100 text-blue-800',
  descarte: 'bg-red-100 text-red-800',
};

const estadoLabels: Record<string, string> = {
  en_stock: 'En Stock',
  reparacion: 'En Reparación',
  en_programacion: 'En Programación',
  descarte: 'Descarte',
};

const tipoLabels: Record<string, string> = {
  MJ: 'Multijuegos',
  PK: 'Poker',
};

export const BilleterosList = ({ billeteros }: BilleterosListProps) => {
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [billeteroSeleccionado, setBilleteroSeleccionado] = useState<Billetero | null>(null);

  const handleRegistrarMovimiento = (billetero: Billetero) => {
    setBilleteroSeleccionado(billetero);
    setMovimientoDialogOpen(true);
  };

  if (billeteros.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay billeteros registrados
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Sala Asignada</TableHead>
              <TableHead>Número Máquina</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billeteros.map((billetero) => (
              <TableRow key={billetero.id}>
                <TableCell className="font-medium">{billetero.codigo}</TableCell>
                <TableCell>
                  <Badge variant="outline">{tipoLabels[billetero.tipo]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={estadoColors[billetero.estado]}>
                    {estadoLabels[billetero.estado]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {billetero.salas?.nombre || '-'}
                </TableCell>
                <TableCell>
                  {billetero.numero_maquina || '-'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {billetero.descripcion || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRegistrarMovimiento(billetero)}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Movimiento
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {billeteroSeleccionado && (
        <MovimientosBilleterosForm
          open={movimientoDialogOpen}
          onOpenChange={setMovimientoDialogOpen}
          billetero={billeteroSeleccionado}
        />
      )}
    </>
  );
};
