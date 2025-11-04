
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

export const exportToPDF = async (incidencias: IncidenciaData[], filtros: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const usableWidth = pageWidth - (margin * 2);
  const footerHeight = 25;
  const headerHeight = 50;
  const usableHeight = pageHeight - headerHeight - footerHeight;
  
  // Colores corporativos
  const colors = {
    primary: [20, 53, 147] as [number, number, number],
    secondary: [107, 114, 128] as [number, number, number],
    accent: [59, 130, 246] as [number, number, number],
    success: [16, 185, 129] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    light: [248, 250, 252] as [number, number, number],
    white: [255, 255, 255] as [number, number, number]
  };
  
  let currentPage = 1;
  
  // Función para agregar encabezado corporativo
  const addHeader = () => {
    // Fondo del encabezado
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA DE MONITOREO CORPORATIVO', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte ejecutivo de incidencias', pageWidth / 2, 32, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.line(margin, headerHeight - 5, pageWidth - margin, headerHeight - 5);
  };
  
  // Función para agregar pie de página
  const addFooter = () => {
    const footerY = pageHeight - 15;
    
    // Línea superior
    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
    
    // Información del pie
    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont('helvetica', 'normal');
    
    const fechaGeneracion = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
    doc.text(`Generado: ${fechaGeneracion}`, margin, footerY);
    doc.text(`Página ${currentPage}`, pageWidth / 2, footerY, { align: 'center' });
    doc.text('Sistema de monitoreo', pageWidth - margin, footerY, { align: 'right' });
  };
  
  // Función para crear nueva página
  const addNewPage = () => {
    doc.addPage();
    currentPage++;
    addHeader();
    addFooter();
    return headerHeight + 10; // Retorna la posición Y inicial
  };
  
  // Función para verificar espacio disponible
  const checkSpace = (currentY: number, neededSpace: number) => {
    if (currentY + neededSpace > pageHeight - footerHeight) {
      return addNewPage();
    }
    return currentY;
  };
  
  // Función para agregar sección con título
  const addSection = (title: string, yPosition: number) => {
    yPosition = checkSpace(yPosition, 15);
    
    doc.setFillColor(...colors.light);
    doc.rect(margin, yPosition - 2, usableWidth, 10, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yPosition + 5);
    
    return yPosition + 15;
  };
  
  // Primera página con información del reporte
  addHeader();
  addFooter();
  let yPosition = headerHeight + 15;
  
  // Información del reporte
  yPosition = addSection('INFORMACIÓN DEL REPORTE', yPosition);
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const infoData = [
    ['Total de incidencias:', incidencias.length.toString()],
    ['Fecha de generación:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
    ['Período analizado:', filtros.fechaInicio && filtros.fechaFin ? 
      `${format(new Date(filtros.fechaInicio), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(filtros.fechaFin), 'dd/MM/yyyy', { locale: es })}` : 
      'Todos los períodos']
  ];
  
  // Crear tabla para información del reporte
  autoTable(doc, {
    body: infoData,
    startY: yPosition,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', fillColor: colors.light },
      1: { cellWidth: usableWidth - 60 }
    },
    margin: { left: margin, right: margin },
    theme: 'plain'
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // Estadísticas
  yPosition = checkSpace(yPosition, 60);
  yPosition = addSection('ANÁLISIS ESTADÍSTICO', yPosition);
  
  const stats = {
    total: incidencias.length,
    porPrioridad: incidencias.reduce((acc: any, inc) => {
      acc[inc.prioridad] = (acc[inc.prioridad] || 0) + 1;
      return acc;
    }, {}),
    conImagenes: incidencias.filter(inc => inc.imagenes_incidencias && inc.imagenes_incidencias.length > 0).length
  };
  
  const statsData = [
    ['Prioridad Crítica', (stats.porPrioridad.critica || 0).toString()],
    ['Prioridad Alta', (stats.porPrioridad.alta || 0).toString()],
    ['Prioridad Media', (stats.porPrioridad.media || 0).toString()],
    ['Prioridad Baja', (stats.porPrioridad.baja || 0).toString()],
    ['Con Evidencia Fotográfica', stats.conImagenes.toString()]
  ];
  
  autoTable(doc, {
    body: statsData,
    startY: yPosition,
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80, fillColor: colors.light },
      1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    theme: 'grid'
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // Tabla resumen de incidencias
  yPosition = checkSpace(yPosition, 80);
  yPosition = addSection('RESUMEN DETALLADO DE INCIDENCIAS', yPosition);
  
  const tableData = incidencias.map(inc => [
    //inc.id.slice(0, 8),
    inc.titulo.length > 25 ? inc.titulo.substring(0, 22) + '...' : inc.titulo,
    inc.areas?.nombre || 'N/A',
    inc.prioridad.toUpperCase(),
    format(new Date(inc.fecha_incidencia), 'dd/MM', { locale: es }),
    (inc.imagenes_incidencias?.length || 0).toString()
  ]);
  
  autoTable(doc, {
    head: [['Título', 'Área', 'Prioridad', 'Fecha', 'Imgs']],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.white,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: colors.light,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    didDrawPage: function () {
      addFooter();
    }
  });
  
  // Páginas detalladas para incidencias importantes (solo las más críticas)
  const incidenciasCriticas = incidencias.filter(inc => 
    inc.prioridad === 'critica' || inc.prioridad === 'alta'
  ).slice(0, 10); // Máximo 10 incidencias detalladas
  
  for (let index = 0; index < incidenciasCriticas.length; index++) {
    const inc = incidenciasCriticas[index];
    yPosition = addNewPage();
    
    // Título de la incidencia
    doc.setFontSize(14);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(`INCIDENCIA DETALLADA ${index + 1}`, margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const tituloLines = doc.splitTextToSize(inc.titulo.toUpperCase(), usableWidth);
    tituloLines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
    
    // Información principal
    const detallesInfo = [
      //['ID', inc.id],
      ['Área', inc.areas?.nombre || 'No especificada'],
      ['Clasificación', inc.clasificaciones?.nombre || 'No clasificada'],
      ['Prioridad', inc.prioridad.toUpperCase()],
      ['Reportado por', inc.reportado_por],
      ['Fecha', format(new Date(inc.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es })],
      ['Evidencias', `${inc.imagenes_incidencias?.length || 0} archivos`]
    ];
    
    autoTable(doc, {
      body: detallesInfo,
      startY: yPosition,
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold', fillColor: colors.light },
        1: { cellWidth: usableWidth - 40 }
      },
      margin: { left: margin, right: margin },
      theme: 'grid',
      didDrawPage: function () {
        addFooter();
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Descripción
    yPosition = checkSpace(yPosition, 30);
    yPosition = addSection('DESCRIPCIÓN', yPosition);
    
    const descripcionLines = doc.splitTextToSize(inc.descripcion, usableWidth - 10);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    descripcionLines.forEach((line: string) => {
      yPosition = checkSpace(yPosition, 6);
      doc.text(line, margin + 5, yPosition);
      yPosition += 5;
    });
    
    // Observaciones si existen
    if (inc.observaciones) {
      yPosition += 10;
      yPosition = checkSpace(yPosition, 30);
      yPosition = addSection('OBSERVACIONES', yPosition);
      
      const observacionesLines = doc.splitTextToSize(inc.observaciones, usableWidth - 10);
      observacionesLines.forEach((line: string) => {
        yPosition = checkSpace(yPosition, 6);
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
    }
    
    // Evidencia fotográfica si existe
    if (inc.imagenes_incidencias && inc.imagenes_incidencias.length > 0) {
      yPosition += 10;
      yPosition = checkSpace(yPosition, 30);
      yPosition = addSection('EVIDENCIA FOTOGRÁFICA', yPosition);
      
      for (const imagen of inc.imagenes_incidencias) {
        try {
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.text(`📷 ${imagen.nombre_archivo}`, margin + 5, yPosition);
          yPosition += 6;
          
          // Descargar y convertir la imagen a base64
          const response = await fetch(imagen.url_imagen);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          // Calcular dimensiones para la imagen (max 160px de ancho)
          const maxWidth = 160;
          const maxHeight = 110;
          const imgWidth = maxWidth;
          const imgHeight = maxHeight;
          
          // Verificar si hay espacio suficiente
          yPosition = checkSpace(yPosition, imgHeight + 15);
          
          // Agregar la imagen al PDF
          doc.addImage(base64, 'JPEG', margin + 5, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 5;
          
          // Agregar URL de referencia debajo de la imagen
          doc.setFontSize(7);
          doc.setTextColor(120, 120, 120);
          const urlText = doc.splitTextToSize(`URL: ${imagen.url_imagen}`, maxWidth);
          doc.text(urlText, margin + 5, yPosition);
          yPosition += urlText.length * 3 + 8;
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          
        } catch (error) {
          // Si falla la descarga, mostrar solo la información
          console.error('Error al cargar imagen:', error);
          doc.setFontSize(8);
          doc.setTextColor(150, 50, 50);
          doc.text('(No se pudo cargar la imagen)', margin + 5, yPosition);
          yPosition += 5;
          doc.setTextColor(100, 100, 100);
          doc.text(`URL: ${imagen.url_imagen}`, margin + 5, yPosition);
          yPosition += 10;
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
        }
      }
    }
  }
  
  // Página de conclusiones
  yPosition = addNewPage();
  yPosition = addSection('CONCLUSIONES Y RECOMENDACIONES', yPosition);
  
  const conclusiones = [
    `Se registraron ${stats.total} incidencias en el período analizado.`,
    `${stats.porPrioridad.critica || 0} incidencias de prioridad crítica requieren atención inmediata.`,
    `El ${(stats.conImagenes / stats.total * 100).toFixed(1)}% cuenta con evidencia fotográfica.`,
    'Se recomienda implementar medidas preventivas en áreas críticas.',
    'Mantener documentación fotográfica para mejor resolución de incidentes.'
  ];
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  conclusiones.forEach(conclusion => {
    yPosition = checkSpace(yPosition, 8);
    const lines = doc.splitTextToSize(`• ${conclusion}`, usableWidth - 10);
    lines.forEach((line: string) => {
      doc.text(line, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 3;
  });
  
  // Descargar archivo
  const fechaReporte = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const nombreArchivo = `Reporte_Incidencias_${fechaReporte}.pdf`;
  doc.save(nombreArchivo);
};
