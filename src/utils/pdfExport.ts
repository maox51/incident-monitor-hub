
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
  
  // Generar páginas detalladas para todas las incidencias
  let isFirstPage = true;
  let yPosition = 0;
  
  for (let index = 0; index < incidencias.length; index++) {
    const inc = incidencias[index];
    
    if (isFirstPage) {
      addHeader();
      addFooter();
      yPosition = headerHeight + 15;
      isFirstPage = false;
    } else {
      yPosition = addNewPage();
    }
    
    // Encabezado de incidencia
    doc.setFillColor(...colors.primary);
    doc.rect(margin, yPosition - 5, usableWidth, 12, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.text(`INCIDENCIA #${index + 1}`, margin + 3, yPosition + 3);
    yPosition += 15;
    
    // Título de la incidencia
    doc.setFontSize(13);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    const tituloLines = doc.splitTextToSize(inc.titulo.toUpperCase(), usableWidth);
    tituloLines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 8;
    
    // Información principal en formato más compacto
    const detallesInfo = [
      ['Área', inc.areas?.nombre || 'No especificada'],
      ['Clasificación', inc.clasificaciones?.nombre || 'No clasificada'],
      ['Prioridad', inc.prioridad.toUpperCase()],
      ['Reportado por', inc.reportado_por],
      ['Fecha de incidencia', format(new Date(inc.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es })]
    ];
    
    autoTable(doc, {
      body: detallesInfo,
      startY: yPosition,
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold', fillColor: colors.light, textColor: colors.primary },
        1: { cellWidth: usableWidth - 45 }
      },
      margin: { left: margin, right: margin },
      theme: 'striped',
      didDrawPage: function () {
        addFooter();
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 12;
    
    // Descripción
    yPosition = checkSpace(yPosition, 25);
    yPosition = addSection('DESCRIPCIÓN', yPosition);
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    const descripcionLines = doc.splitTextToSize(inc.descripcion, usableWidth - 10);
    
    descripcionLines.forEach((line: string) => {
      yPosition = checkSpace(yPosition, 6);
      doc.text(line, margin + 5, yPosition);
      yPosition += 4.5;
    });
    
    // Observaciones si existen
    if (inc.observaciones) {
      yPosition += 8;
      yPosition = checkSpace(yPosition, 25);
      yPosition = addSection('OBSERVACIONES', yPosition);
      
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      const observacionesLines = doc.splitTextToSize(inc.observaciones, usableWidth - 10);
      
      observacionesLines.forEach((line: string) => {
        yPosition = checkSpace(yPosition, 6);
        doc.text(line, margin + 5, yPosition);
        yPosition += 4.5;
      });
    }
    
    // Evidencia fotográfica si existe
    if (inc.imagenes_incidencias && inc.imagenes_incidencias.length > 0) {
      yPosition += 8;
      yPosition = checkSpace(yPosition, 25);
      yPosition = addSection('EVIDENCIA FOTOGRÁFICA', yPosition);
      
      for (const imagen of inc.imagenes_incidencias) {
        try {
          // Nombre del archivo
          doc.setFontSize(8);
          doc.setTextColor(...colors.secondary);
          doc.setFont('helvetica', 'italic');
          doc.text(`Archivo: ${imagen.nombre_archivo}`, margin + 5, yPosition);
          yPosition += 6;
          
          // Descargar y convertir la imagen a base64
          const response = await fetch(imagen.url_imagen);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          // Dimensiones de la imagen
          const maxWidth = 140;
          const maxHeight = 100;
          
          // Verificar espacio suficiente
          yPosition = checkSpace(yPosition, maxHeight + 20);
          
          // Marco para la imagen
          doc.setDrawColor(...colors.secondary);
          doc.setLineWidth(0.5);
          doc.rect(margin + 5, yPosition, maxWidth, maxHeight);
          
          // Agregar la imagen centrada en el marco
          doc.addImage(base64, 'JPEG', margin + 6, yPosition + 1, maxWidth - 2, maxHeight - 2);
          yPosition += maxHeight + 10;
          
        } catch (error) {
          // Si falla la descarga, mostrar mensaje de error
          console.error('Error al cargar imagen:', error);
          doc.setFontSize(8);
          doc.setTextColor(...colors.danger);
          doc.text('⚠ No se pudo cargar la imagen', margin + 5, yPosition);
          yPosition += 8;
          doc.setFontSize(7);
          doc.setTextColor(...colors.secondary);
          const urlLines = doc.splitTextToSize(`URL: ${imagen.url_imagen}`, usableWidth - 10);
          urlLines.forEach((line: string) => {
            doc.text(line, margin + 5, yPosition);
            yPosition += 4;
          });
          yPosition += 8;
        }
      }
    }
  }
  
  // Descargar archivo
  const fechaReporte = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const nombreArchivo = `Reporte_Incidencias_${fechaReporte}.pdf`;
  doc.save(nombreArchivo);
};
