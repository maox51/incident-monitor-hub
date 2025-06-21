
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface IncidenciaData {
  id: string;
  titulo: string;
  descripcion: string;
  observaciones: string | null;
  area_id: string;
  clasificacion_id: string;
  prioridad: string;
  reportado_por: string;
  fecha_incidencia: string;
  created_at: string;
  updated_at: string;
  areas?: {
    nombre: string;
    descripcion: string | null;
  };
  clasificaciones?: {
    nombre: string;
    color: string | null;
  };
  imagenes_incidencias?: Array<{
    id: string;
    url_imagen: string;
    nombre_archivo: string;
  }>;
}

export const exportToPDF = (incidencias: IncidenciaData[], filtros: any) => {
  const doc = new jsPDF();
  
  // Título del reporte
  doc.setFontSize(16);
  doc.text('Reporte de Incidencias - Sistema de Monitoreo Casino', 20, 20);
  
  // Fecha de generación
  doc.setFontSize(10);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 20, 30);
  
  // Información de filtros aplicados
  let yPosition = 40;
  doc.text('Filtros aplicados:', 20, yPosition);
  yPosition += 10;
  
  if (filtros.fechaInicio) {
    doc.text(`Fecha inicio: ${format(new Date(filtros.fechaInicio), 'dd/MM/yyyy', { locale: es })}`, 25, yPosition);
    yPosition += 7;
  }
  
  if (filtros.fechaFin) {
    doc.text(`Fecha fin: ${format(new Date(filtros.fechaFin), 'dd/MM/yyyy', { locale: es })}`, 25, yPosition);
    yPosition += 7;
  }
  
  yPosition += 10;
  
  // Preparar datos para la tabla
  const tableData = incidencias.map(inc => [
    inc.titulo,
    inc.areas?.nombre || 'N/A',
    inc.clasificaciones?.nombre || 'N/A',
    inc.prioridad,
    inc.reportado_por,
    format(new Date(inc.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es }),
    inc.descripcion.length > 50 ? inc.descripcion.substring(0, 50) + '...' : inc.descripcion
  ]);
  
  // Crear la tabla
  autoTable(doc, {
    head: [['Título', 'Área', 'Tipo', 'Prioridad', 'Reportado por', 'Fecha', 'Descripción']],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Título
      1: { cellWidth: 20 }, // Área
      2: { cellWidth: 25 }, // Tipo
      3: { cellWidth: 15 }, // Prioridad
      4: { cellWidth: 25 }, // Reportado por
      5: { cellWidth: 25 }, // Fecha
      6: { cellWidth: 35 }, // Descripción
    },
  });
  
  // Pie de página con total de incidencias
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
  doc.setFontSize(10);
  doc.text(`Total de incidencias: ${incidencias.length}`, 20, finalY + 20);
  
  // Descargar el archivo
  doc.save(`reporte_incidencias_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
};
