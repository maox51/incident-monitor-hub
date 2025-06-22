
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
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Función para agregar encabezado
  const addHeader = () => {
    // Logo o título principal
    doc.setFontSize(18);
    doc.setTextColor(20, 53, 147); // Azul corporativo
    doc.text('SISTEMA DE MONITOREO - CASINO', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(14);
    doc.setTextColor(107, 114, 128); // Gris
    doc.text('Reporte Detallado de Incidencias', pageWidth / 2, 30, { align: 'center' });
    
    // Línea separadora
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, 35, pageWidth - 20, 35);
  };
  
  // Función para agregar pie de página
  const addFooter = (pageNumber: number, totalPages: number) => {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    
    // Información del pie izquierdo
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 20, pageHeight - 15);
    
    // Número de página centrado
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Información del pie derecho
    doc.text('Sistema de Monitoreo Casino', pageWidth - 20, pageHeight - 15, { align: 'right' });
    
    // Línea separadora superior
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
  };
  
  // Agregar encabezado inicial
  addHeader();
  
  let yPosition = 45;
  
  // Información de filtros aplicados
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Filtros Aplicados:', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  
  if (filtros.fechaInicio) {
    doc.text(`• Fecha inicio: ${format(new Date(filtros.fechaInicio), 'dd/MM/yyyy', { locale: es })}`, 25, yPosition);
    yPosition += 6;
  }
  
  if (filtros.fechaFin) {
    doc.text(`• Fecha fin: ${format(new Date(filtros.fechaFin), 'dd/MM/yyyy', { locale: es })}`, 25, yPosition);
    yPosition += 6;
  }
  
  if (filtros.area) {
    doc.text(`• Área: ${filtros.area}`, 25, yPosition);
    yPosition += 6;
  }
  
  if (filtros.clasificacion) {
    doc.text(`• Clasificación: ${filtros.clasificacion}`, 25, yPosition);
    yPosition += 6;
  }
  
  if (filtros.prioridad) {
    doc.text(`• Prioridad: ${filtros.prioridad}`, 25, yPosition);
    yPosition += 6;
  }
  
  yPosition += 10;
  
  // Resumen estadístico
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Resumen Estadístico:', 20, yPosition);
  yPosition += 8;
  
  // Calcular estadísticas
  const stats = {
    total: incidencias.length,
    porPrioridad: incidencias.reduce((acc: any, inc) => {
      acc[inc.prioridad] = (acc[inc.prioridad] || 0) + 1;
      return acc;
    }, {}),
    porArea: incidencias.reduce((acc: any, inc) => {
      const area = inc.areas?.nombre || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {})
  };
  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`• Total de incidencias: ${stats.total}`, 25, yPosition);
  yPosition += 6;
  
  Object.entries(stats.porPrioridad).forEach(([prioridad, cantidad]) => {
    doc.text(`• Prioridad ${prioridad}: ${cantidad}`, 25, yPosition);
    yPosition += 6;
  });
  
  yPosition += 10;
  
  // Tabla detallada de incidencias
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Detalle de Incidencias:', 20, yPosition);
  yPosition += 10;
  
  // Preparar datos para la tabla con más detalles
  const tableData = incidencias.map(inc => [
    inc.titulo,
    inc.areas?.nombre || 'N/A',
    inc.clasificaciones?.nombre || 'N/A',
    inc.prioridad,
    inc.reportado_por,
    format(new Date(inc.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es }),
    inc.descripcion.length > 40 ? inc.descripcion.substring(0, 40) + '...' : inc.descripcion,
    inc.observaciones ? (inc.observaciones.length > 30 ? inc.observaciones.substring(0, 30) + '...' : inc.observaciones) : 'N/A',
    inc.imagenes_incidencias?.length || 0
  ]);
  
  // Crear la tabla con más columnas
  autoTable(doc, {
    head: [['Título', 'Área', 'Tipo', 'Prioridad', 'Reportado por', 'Fecha', 'Descripción', 'Observaciones', 'Imágenes']],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
    headStyles: {
      fillColor: [20, 53, 147],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Título
      1: { cellWidth: 18 }, // Área
      2: { cellWidth: 20 }, // Tipo
      3: { cellWidth: 15 }, // Prioridad
      4: { cellWidth: 20 }, // Reportado por
      5: { cellWidth: 22 }, // Fecha
      6: { cellWidth: 25 }, // Descripción
      7: { cellWidth: 20 }, // Observaciones
      8: { cellWidth: 12 }, // Imágenes
    },
    margin: { top: 10, bottom: 30 },
    didDrawPage: function (data) {
      // Agregar pie de página en cada página
      const pageCount = doc.getNumberOfPages();
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      addFooter(currentPage, pageCount);
    },
  });
  
  // Sección de incidencias detalladas (una por página si hay espacio)
  if (incidencias.length <= 5) {
    incidencias.forEach((inc, index) => {
      if (index > 0) {
        doc.addPage();
        addHeader();
      }
      
      let detailY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 20 : 120;
      
      if (detailY > pageHeight - 80) {
        doc.addPage();
        addHeader();
        detailY = 50;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(20, 53, 147);
      doc.text(`Incidencia ${index + 1}: ${inc.titulo}`, 20, detailY);
      detailY += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Detalles de la incidencia
      const detalles = [
        [`ID:`, inc.id],
        [`Área:`, inc.areas?.nombre || 'N/A'],
        [`Clasificación:`, inc.clasificaciones?.nombre || 'N/A'],
        [`Prioridad:`, inc.prioridad],
        [`Reportado por:`, inc.reportado_por],
        [`Fecha incidencia:`, format(new Date(inc.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es })],
        [`Fecha registro:`, format(new Date(inc.created_at), 'dd/MM/yyyy HH:mm', { locale: es })],
      ];
      
      detalles.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, detailY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 60, detailY);
        detailY += 7;
      });
      
      detailY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción:', 20, detailY);
      detailY += 7;
      doc.setFont('helvetica', 'normal');
      
      // Dividir descripción en líneas
      const descripcionLines = doc.splitTextToSize(inc.descripcion, pageWidth - 40);
      descripcionLines.forEach((line: string) => {
        doc.text(line, 20, detailY);
        detailY += 6;
      });
      
      if (inc.observaciones) {
        detailY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', 20, detailY);
        detailY += 7;
        doc.setFont('helvetica', 'normal');
        
        const observacionesLines = doc.splitTextToSize(inc.observaciones, pageWidth - 40);
        observacionesLines.forEach((line: string) => {
          doc.text(line, 20, detailY);
          detailY += 6;
        });
      }
      
      if (inc.imagenes_incidencias && inc.imagenes_incidencias.length > 0) {
        detailY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`Imágenes adjuntas: ${inc.imagenes_incidencias.length}`, 20, detailY);
        detailY += 7;
        doc.setFont('helvetica', 'normal');
        
        inc.imagenes_incidencias.forEach((img, imgIndex) => {
          doc.text(`${imgIndex + 1}. ${img.nombre_archivo}`, 25, detailY);
          detailY += 6;
        });
      }
    });
  }
  
  // Calcular total de páginas y agregar pie de página final
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // El pie de página ya se agrega en didDrawPage
  }
  
  // Descargar el archivo
  const fileName = `reporte_incidencias_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
  doc.save(fileName);
};
