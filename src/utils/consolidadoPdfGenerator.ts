
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConsolidadoParaPDF {
  fecha_reporte: string;
  total_incidencias: number;
  incidencias_criticas: number;
  incidencias_altas: number;
  incidencias_medias: number;
  incidencias_bajas: number;
  areas_afectadas: number;
  salas_afectadas: number;
  incidencias_detalle: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    prioridad: string;
    area: string;
    sala: string;
    reportado_por: string;
    fecha_incidencia: string;
    imagenes: Array<{
      id: string;
      url: string;
      nombre: string;
      tipo: string;
      es_video: boolean;
    }>;
  }>;
  estadisticas_multimedia?: {
    resumen_multimedia: {
      total_imagenes: number;
      total_videos: number;
      incidencias_con_evidencia: number;
    };
  };
}

export const generarConsolidadoPDF = async (consolidado: ConsolidadoParaPDF): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Colores corporativos
  const colors = {
    primary: [20, 53, 147] as [number, number, number],
    secondary: [107, 114, 128] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    light: [248, 250, 252] as [number, number, number]
  };

  let yPosition = margin;
  
  // Encabezado
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setFontSize(18);
  doc.setTextColor(...colors.white);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSOLIDADO DIARIO DE INCIDENCIAS', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(consolidado.fecha_reporte), 'dd \'de\' MMMM \'de\' yyyy', { locale: es }), pageWidth / 2, 40, { align: 'center' });

  yPosition = 70;

  // Nota importante sobre el estado de las incidencias
  doc.setFontSize(10);
  doc.setTextColor(150, 50, 50);
  doc.setFont('helvetica', 'italic');
  doc.text('* Solo incluye incidencias aprobadas', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Resumen estadístico
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN EJECUTIVO', margin, yPosition);
  yPosition += 15;

  const resumenData = [
    ['Total de Incidencias', consolidado.total_incidencias.toString()],
    ['Incidencias Críticas', consolidado.incidencias_criticas.toString()],
    ['Incidencias Altas', consolidado.incidencias_altas.toString()],
    ['Incidencias Medias', consolidado.incidencias_medias.toString()],
    ['Incidencias Bajas', consolidado.incidencias_bajas.toString()],
    ['Áreas Afectadas', consolidado.areas_afectadas.toString()],
    ['Salas Afectadas', consolidado.salas_afectadas.toString()]
  ];

  if (consolidado.estadisticas_multimedia) {
    const multimedia = consolidado.estadisticas_multimedia.resumen_multimedia;
    resumenData.push(
      ['Total Imágenes', multimedia.total_imagenes.toString()],
      ['Total Videos', multimedia.total_videos.toString()],
      ['Incidencias con Evidencia', multimedia.incidencias_con_evidencia.toString()]
    );
  }

  autoTable(doc, {
    body: resumenData,
    startY: yPosition,
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: colors.light },
      1: { halign: 'center' }
    },
    margin: { left: margin, right: margin },
    theme: 'grid'
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Detalle de incidencias
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE INCIDENCIAS APROBADAS', margin, yPosition);
  yPosition += 15;

  for (const incidencia of consolidado.incidencias_detalle) {
    // Verificar espacio en la página
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    // Información de la incidencia
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${incidencia.titulo}`, margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prioridad: ${incidencia.prioridad.toUpperCase()} | Área: ${incidencia.area} | Sala: ${incidencia.sala}`, margin, yPosition);
    yPosition += 6;
    
    doc.text(`Reportado por: ${incidencia.reportado_por} | Fecha: ${format(new Date(incidencia.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es })}`, margin, yPosition);
    yPosition += 8;

    // Descripción
    const descripcionLines = doc.splitTextToSize(incidencia.descripcion, pageWidth - 2 * margin);
    descripcionLines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;

    // Multimedia
    if (incidencia.imagenes && incidencia.imagenes.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Evidencia Multimedia (${incidencia.imagenes.length} archivos):`, margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      
      for (const archivo of incidencia.imagenes) {
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = margin;
        }
        
        if (archivo.es_video) {
          // Para videos, mostrar información con ícono
          doc.text(`🎥 Video: ${archivo.nombre}`, margin + 5, yPosition);
          yPosition += 6;
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`Ver en: ${archivo.url}`, margin + 5, yPosition);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          yPosition += 10;
        } else {
          // Para imágenes, intentar incrustarlas en el PDF
          try {
            doc.text(`📷 ${archivo.nombre}`, margin + 5, yPosition);
            yPosition += 6;
            
            // Descargar y convertir la imagen a base64
            const response = await fetch(archivo.url);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            // Calcular dimensiones para la imagen (max 150px de ancho)
            const maxWidth = 150;
            const maxHeight = 100;
            const imgWidth = maxWidth;
            const imgHeight = maxHeight;
            
            // Verificar si hay espacio suficiente
            if (yPosition + imgHeight + 10 > pageHeight - 20) {
              doc.addPage();
              yPosition = margin;
            }
            
            // Agregar la imagen al PDF
            doc.addImage(base64, 'JPEG', margin + 5, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 5;
            
            // Agregar URL de referencia debajo de la imagen
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            const urlText = doc.splitTextToSize(`URL: ${archivo.url}`, maxWidth);
            doc.text(urlText, margin + 5, yPosition);
            yPosition += urlText.length * 3;
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
          } catch (error) {
            // Si falla la descarga, mostrar solo la información
            console.error('Error al cargar imagen:', error);
            doc.setFontSize(8);
            doc.setTextColor(150, 50, 50);
            doc.text('(No se pudo cargar la imagen)', margin + 5, yPosition);
            yPosition += 5;
            doc.setTextColor(100, 100, 100);
            doc.text(`URL: ${archivo.url}`, margin + 5, yPosition);
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
          }
          yPosition += 8;
        }
      }
    }

    yPosition += 10;
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
  }

  // Pie de página en todas las páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado automáticamente el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, margin, pageHeight - 10);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  return doc.output('blob');
};
