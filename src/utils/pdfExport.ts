
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IncidenciaData {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  reportado_por: string;
  fecha_incidencia: string;
  observaciones?: string | null;
  areas?: { nombre: string } | null;
  clasificaciones?: { nombre: string } | null;
  imagenes_incidencias?: any[];
}

export const exportToPDF = (incidencias: IncidenciaData[], filtros: any) => {
  const doc = new jsPDF();
  
  // Configurar fuente para soporte de caracteres especiales
  doc.setFont('helvetica');
  
  // Título del documento
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Reporte de Incidencias', 14, 22);
  
  // Información del reporte
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const fechaReporte = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
  doc.text(`Generado el: ${fechaReporte}`, 14, 30);
  doc.text(`Total de incidencias: ${incidencias.length}`, 14, 36);
  
  // Información de filtros aplicados
  let yPosition = 42;
  if (filtros.fechaInicio || filtros.fechaFin || 
      (filtros.area_id && filtros.area_id !== 'all') ||
      (filtros.clasificacion_id && filtros.clasificacion_id !== 'all') ||
      (filtros.estado && filtros.estado !== 'all') ||
      (filtros.prioridad && filtros.prioridad !== 'all')) {
    
    doc.setTextColor(60, 60, 60);
    doc.text('Filtros aplicados:', 14, yPosition);
    yPosition += 6;
    
    if (filtros.fechaInicio) {
      doc.text(`• Fecha inicio: ${filtros.fechaInicio}`, 16, yPosition);
      yPosition += 4;
    }
    if (filtros.fechaFin) {
      doc.text(`• Fecha fin: ${filtros.fechaFin}`, 16, yPosition);
      yPosition += 4;
    }
    if (filtros.area_id && filtros.area_id !== 'all') {
      doc.text(`• Área específica filtrada`, 16, yPosition);
      yPosition += 4;
    }
    if (filtros.clasificacion_id && filtros.clasificacion_id !== 'all') {
      doc.text(`• Clasificación específica filtrada`, 16, yPosition);
      yPosition += 4;
    }
    if (filtros.estado && filtros.estado !== 'all') {
      doc.text(`• Estado: ${filtros.estado}`, 16, yPosition);
      yPosition += 4;
    }
    if (filtros.prioridad && filtros.prioridad !== 'all') {
      doc.text(`• Prioridad: ${filtros.prioridad}`, 16, yPosition);
      yPosition += 4;
    }
    yPosition += 6;
  }
  
  // Preparar datos para la tabla
  const tableData = incidencias.map((inc, index) => [
    (index + 1).toString(),
    inc.titulo.length > 25 ? inc.titulo.substring(0, 25) + '...' : inc.titulo,
    inc.areas?.nombre || 'N/A',
    inc.clasificaciones?.nombre || 'N/A',
    inc.estado.replace('_', ' '),
    inc.prioridad,
    inc.reportado_por.length > 15 ? inc.reportado_por.substring(0, 15) + '...' : inc.reportado_por,
    format(new Date(inc.fecha_incidencia), 'dd/MM/yy', { locale: es }),
  ]);
  
  // Crear tabla principal
  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Título', 'Área', 'Clasificación', 'Estado', 'Prioridad', 'Reportado por', 'Fecha']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue color
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
    columnStyles: {
      0: { cellWidth: 10 }, // #
      1: { cellWidth: 35 }, // Título
      2: { cellWidth: 25 }, // Área
      3: { cellWidth: 25 }, // Clasificación
      4: { cellWidth: 20 }, // Estado
      5: { cellWidth: 20 }, // Prioridad
      6: { cellWidth: 25 }, // Reportado por
      7: { cellWidth: 20 }, // Fecha
    },
    margin: { left: 14, right: 14 },
  });
  
  // Si hay pocas incidencias, agregar detalles adicionales
  if (incidencias.length <= 10) {
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Detalles de Incidencias', 14, currentY);
    currentY += 10;
    
    incidencias.forEach((inc, index) => {
      // Verificar si necesitamos una nueva página
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`${index + 1}. ${inc.titulo}`, 14, currentY);
      currentY += 6;
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      // Descripción (máximo 2 líneas)
      const descripcionLines = doc.splitTextToSize(inc.descripcion, 180);
      const maxLines = Math.min(descripcionLines.length, 2);
      for (let i = 0; i < maxLines; i++) {
        doc.text(`   ${descripcionLines[i]}`, 16, currentY);
        currentY += 4;
      }
      if (descripcionLines.length > 2) {
        doc.text('   ...', 16, currentY);
        currentY += 4;
      }
      
      // Observaciones si existen
      if (inc.observaciones) {
        doc.text(`   Observaciones: ${inc.observaciones.substring(0, 100)}${inc.observaciones.length > 100 ? '...' : ''}`, 16, currentY);
        currentY += 4;
      }
      
      // Imágenes adjuntas
      if (inc.imagenes_incidencias && inc.imagenes_incidencias.length > 0) {
        doc.text(`   Imágenes adjuntas: ${inc.imagenes_incidencias.length}`, 16, currentY);
        currentY += 4;
      }
      
      currentY += 6; // Espacio entre incidencias
    });
  }
  
  // Pie de página en cada página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Sistema de Monitoreo de Incidencias`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Descargar el PDF
  const fileName = `reporte_incidencias_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
  doc.save(fileName);
};
