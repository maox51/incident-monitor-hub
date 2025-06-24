
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
  const margin = 20;
  const usableWidth = pageWidth - (margin * 2);
  
  // Configuración de colores corporativos (como tuplas de 3 elementos)
  const colors = {
    primary: [20, 53, 147] as [number, number, number],
    secondary: [107, 114, 128] as [number, number, number],
    accent: [59, 130, 246] as [number, number, number],
    success: [16, 185, 129] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    light: [248, 250, 252] as [number, number, number]
  };
  
  // Función para agregar encabezado corporativo
  const addHeader = () => {
    // Fondo del encabezado
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Logo placeholder o título principal
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA DE MONITOREO CORPORATIVO', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte Detallado de Incidencias Operacionales', pageWidth / 2, 30, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(2);
    doc.line(margin, 40, pageWidth - margin, 40);
  };
  
  // Función para agregar pie de página profesional
  const addFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 20;
    
    // Línea superior del pie
    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    // Información del pie
    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont('helvetica', 'normal');
    
    // Fecha y hora de generación
    const fechaGeneracion = format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es });
    doc.text(`Generado: ${fechaGeneracion}`, margin, footerY);
    
    // Número de página
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
    
    // Marca corporativa
    doc.text('Sistema de Gestión de Incidencias v2.0', pageWidth - margin, footerY, { align: 'right' });
  };
  
  // Función para crear sección con título
  const addSection = (title: string, yPosition: number) => {
    doc.setFillColor(...colors.light);
    doc.rect(margin, yPosition - 2, usableWidth, 8, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 2, yPosition + 3);
    
    return yPosition + 15;
  };
  
  // Agregar primera página con encabezado
  addHeader();
  
  let yPosition = 55;
  
  // Sección de información del reporte
  yPosition = addSection('INFORMACIÓN DEL REPORTE', yPosition);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const infoReporte = [
    [`Total de incidencias incluidas:`, `${incidencias.length} registros`],
    [`Fecha de generación:`, format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })],
    [`Período del reporte:`, filtros.fechaInicio && filtros.fechaFin ? 
      `${format(new Date(filtros.fechaInicio), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(filtros.fechaFin), 'dd/MM/yyyy', { locale: es })}` : 
      'Todos los períodos'],
    [`Estado del sistema:`, 'Operativo']
  ];
  
  infoReporte.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 70, yPosition);
    yPosition += 6;
  });
  
  yPosition += 10;
  
  // Sección de filtros aplicados
  yPosition = addSection('FILTROS APLICADOS', yPosition);
  
  const filtrosAplicados = [];
  if (filtros.fechaInicio) filtrosAplicados.push(`Desde: ${format(new Date(filtros.fechaInicio), 'dd/MM/yyyy', { locale: es })}`);
  if (filtros.fechaFin) filtrosAplicados.push(`Hasta: ${format(new Date(filtros.fechaFin), 'dd/MM/yyyy', { locale: es })}`);
  if (filtros.area) filtrosAplicados.push(`Área: ${filtros.area}`);
  if (filtros.clasificacion) filtrosAplicados.push(`Clasificación: ${filtros.clasificacion}`);
  if (filtros.prioridad) filtrosAplicados.push(`Prioridad: ${filtros.prioridad}`);
  
  if (filtrosAplicados.length === 0) {
    doc.text('No se aplicaron filtros específicos - Mostrando todas las incidencias', margin + 5, yPosition);
    yPosition += 8;
  } else {
    filtrosAplicados.forEach(filtro => {
      doc.text(`• ${filtro}`, margin + 5, yPosition);
      yPosition += 6;
    });
  }
  
  yPosition += 10;
  
  // Estadísticas del reporte
  yPosition = addSection('ANÁLISIS ESTADÍSTICO', yPosition);
  
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
    }, {}),
    conImagenes: incidencias.filter(inc => inc.imagenes_incidencias && inc.imagenes_incidencias.length > 0).length
  };
  
  // Mostrar estadísticas de prioridad con colores
  doc.setFont('helvetica', 'bold');
  doc.text('Distribución por Prioridad:', margin + 5, yPosition);
  yPosition += 8;
  
  Object.entries(stats.porPrioridad).forEach(([prioridad, cantidad]) => {
    const color = prioridad === 'critica' ? colors.danger : 
                 prioridad === 'alta' ? colors.warning : 
                 prioridad === 'media' ? colors.accent : colors.success;
    
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(`• ${prioridad.toUpperCase()}:`, margin + 10, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cantidad} incidencias`, margin + 50, yPosition);
    yPosition += 6;
  });
  
  yPosition += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Incidencias con evidencia fotográfica: ${stats.conImagenes}`, margin + 5, yPosition);
  yPosition += 15;
  
  // Tabla resumen con ancho fijo para evitar desajustes
  yPosition = addSection('RESUMEN EJECUTIVO', yPosition);
  
  const tableData = incidencias.map(inc => [
    inc.id.slice(0, 8) + '...',
    inc.titulo.length > 30 ? inc.titulo.substring(0, 27) + '...' : inc.titulo,
    inc.areas?.nombre || 'N/A',
    inc.prioridad.toUpperCase(),
    format(new Date(inc.fecha_incidencia), 'dd/MM/yy', { locale: es }),
    (inc.imagenes_incidencias?.length || 0).toString()
  ]);
  
  autoTable(doc, {
    head: [['ID', 'Título', 'Área', 'Prioridad', 'Fecha', 'Imgs']],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255] as [number, number, number],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: colors.light,
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    didDrawPage: function (data) {
      const pageCount = doc.getNumberOfPages();
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      addFooter(currentPage, pageCount);
    },
  });
  
  // Páginas detalladas para cada incidencia
  if (incidencias.length <= 15) {
    incidencias.forEach((inc, index) => {
      doc.addPage();
      addHeader();
      
      let detailY = 55;
      
      // Título de la incidencia
      doc.setFontSize(16);
      doc.setTextColor(...colors.primary);
      doc.setFont('helvetica', 'bold');
      const tituloLines = doc.splitTextToSize(`INCIDENCIA ${index + 1}: ${inc.titulo.toUpperCase()}`, usableWidth);
      tituloLines.forEach((line: string) => {
        doc.text(line, margin, detailY);
        detailY += 8;
      });
      detailY += 10;
      
      // Información principal en tabla estructurada
      const detallesInfo = [
        ['ID del Registro', inc.id],
        ['Área Afectada', inc.areas?.nombre || 'No especificada'],
        ['Clasificación', inc.clasificaciones?.nombre || 'No clasificada'],
        ['Nivel de Prioridad', inc.prioridad.toUpperCase()],
        ['Reportado por', inc.reportado_por],
        ['Fecha de Incidencia', format(new Date(inc.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es })],
        ['Fecha de Registro', format(new Date(inc.created_at), 'dd/MM/yyyy HH:mm', { locale: es })],
        ['Evidencias Adjuntas', `${inc.imagenes_incidencias?.length || 0} archivos`]
      ];
      
      autoTable(doc, {
        body: detallesInfo,
        startY: detailY,
        styles: {
          fontSize: 10,
          cellPadding: 4
        },
        columnStyles: {
          0: { 
            cellWidth: 50, 
            fontStyle: 'bold',
            fillColor: colors.light
          },
          1: { cellWidth: usableWidth - 50 }
        },
        margin: { left: margin, right: margin },
        theme: 'grid'
      });
      
      detailY = (doc as any).lastAutoTable.finalY + 15;
      
      // Descripción detallada
      detailY = addSection('DESCRIPCIÓN DETALLADA', detailY);
      
      const descripcionLines = doc.splitTextToSize(inc.descripcion, usableWidth - 10);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      descripcionLines.forEach((line: string) => {
        if (detailY > pageHeight - 40) {
          doc.addPage();
          addHeader();
          detailY = 55;
        }
        doc.text(line, margin + 5, detailY);
        detailY += 6;
      });
      
      // Observaciones si existen
      if (inc.observaciones) {
        detailY += 10;
        detailY = addSection('OBSERVACIONES ADICIONALES', detailY);
        
        const observacionesLines = doc.splitTextToSize(inc.observaciones, usableWidth - 10);
        observacionesLines.forEach((line: string) => {
          if (detailY > pageHeight - 40) {
            doc.addPage();
            addHeader();
            detailY = 55;
          }
          doc.text(line, margin + 5, detailY);
          detailY += 6;
        });
      }
      
      // Lista de evidencias
      if (inc.imagenes_incidencias && inc.imagenes_incidencias.length > 0) {
        detailY += 10;
        detailY = addSection('EVIDENCIAS FOTOGRÁFICAS', detailY);
        
        inc.imagenes_incidencias.forEach((img, imgIndex) => {
          if (detailY > pageHeight - 40) {
            doc.addPage();
            addHeader();
            detailY = 55;
          }
          doc.text(`${imgIndex + 1}. ${img.nombre_archivo}`, margin + 5, detailY);
          detailY += 6;
        });
      }
    });
  }
  
  // Página final con conclusiones y recomendaciones
  doc.addPage();
  addHeader();
  
  let conclusionY = 55;
  conclusionY = addSection('CONCLUSIONES Y RECOMENDACIONES', conclusionY);
  
  const conclusiones = [
    `Se registraron un total de ${stats.total} incidencias en el período analizado.`,
    `Las incidencias de prioridad crítica representan ${((stats.porPrioridad.critica || 0) / stats.total * 100).toFixed(1)}% del total.`,
    `El ${(stats.conImagenes / stats.total * 100).toFixed(1)}% de las incidencias cuenta con evidencia fotográfica.`,
    `Se recomienda implementar medidas preventivas en las áreas con mayor incidencia.`,
    `Es crucial mantener la documentación fotográfica para mejorar la resolución de incidentes.`
  ];
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  conclusiones.forEach(conclusion => {
    const lines = doc.splitTextToSize(conclusion, usableWidth - 10);
    lines.forEach((line: string) => {
      doc.text(`• ${line}`, margin + 5, conclusionY);
      conclusionY += 6;
    });
    conclusionY += 3;
  });
  
  // Calcular total de páginas y agregar pies de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Los pies de página se agregan automáticamente en didDrawPage
  }
  
  // Descargar el archivo con nombre descriptivo
  const fechaReporte = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const nombreArchivo = `Reporte_Incidencias_Corporativo_${fechaReporte}.pdf`;
  doc.save(nombreArchivo);
};
