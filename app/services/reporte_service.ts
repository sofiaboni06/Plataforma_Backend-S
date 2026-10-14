import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import type { AccessScope } from '#services/access_control'
import Elemento from '#models/elemento'

type ReporteFormato = 'excel' | 'pdf'

/**
 * Campos disponibles para generar reportes dinámicos
 */
export type CampoReporte =
  | 'codigo'
  | 'nombre'
  | 'cantidad'
  | 'cantidadMinima'
  | 'estado'
  | 'valorUnitario'
  | 'porcentajeAumento'
  | 'valorConAumento'
  | 'unidad'
  | 'clasificacion'
  | 'caracter'
  | 'bodega'
  | 'subBodega'
  | 'stand'
  | 'item'
  | 'categoria'
  | 'subcategoria'
  | 'codigoEstandar'
  | 'usoPresupuestal'
  | 'descripcion'
  | 'marca'
  | 'color'
  | 'gramaje'

/**
 * Definición de cada campo con su etiqueta y extractor de datos
 */
const CAMPOS_DEFINICION: Record<
  CampoReporte,
  { etiqueta: string; ancho: number; extraer: (e: Elemento) => string | number }
> = {
  codigo: { etiqueta: 'Código', ancho: 15, extraer: (e) => e.codigo || '' },
  nombre: { etiqueta: 'Nombre', ancho: 30, extraer: (e) => e.nombre },
  cantidad: { etiqueta: 'Cantidad', ancho: 12, extraer: (e) => e.cantidad },
  cantidadMinima: { etiqueta: 'Cantidad Mínima', ancho: 15, extraer: (e) => e.cantidadMinima || 0 },
  estado: { etiqueta: 'Estado', ancho: 10, extraer: (e) => (e.estado ? 'Activo' : 'Inactivo') },
  valorUnitario: {
    etiqueta: 'Valor Unitario',
    ancho: 15,
    extraer: (e) => e.valorUnitarioPromedio || 0,
  },
  porcentajeAumento: { etiqueta: '% Aumento', ancho: 12, extraer: (e) => e.porcentajeAumento || 0 },
  valorConAumento: {
    etiqueta: 'Valor con Aumento',
    ancho: 18,
    extraer: (e) => e.valorConAumento() || 0,
  },
  unidad: { etiqueta: 'Unidad', ancho: 15, extraer: (e) => e.unidadMedida?.nombre || '' },
  clasificacion: {
    etiqueta: 'Clasificación',
    ancho: 20,
    extraer: (e) => e.clasificacion?.nombre || '',
  },
  caracter: { etiqueta: 'Tipo', ancho: 12, extraer: (e) => e.caracterEfectivo() || '' },
  bodega: {
    etiqueta: 'Bodega',
    ancho: 20,
    extraer: (e) => e.stand?.subBodega?.bodega?.nombre || '',
  },
  subBodega: {
    etiqueta: 'Sub-bodega',
    ancho: 20,
    extraer: (e) => e.stand?.subBodega?.nombre || '',
  },
  stand: { etiqueta: 'Stand', ancho: 20, extraer: (e) => e.stand?.nombre || '' },
  item: { etiqueta: 'Ítem', ancho: 25, extraer: (e) => e.item?.nombre || '' },
  categoria: {
    etiqueta: 'Categoría',
    ancho: 20,
    extraer: (e) => e.item?.subcategoria?.categoria?.nombre || '',
  },
  subcategoria: {
    etiqueta: 'Subcategoría',
    ancho: 20,
    extraer: (e) => e.item?.subcategoria?.nombre || '',
  },
  codigoEstandar: {
    etiqueta: 'Código UNSPSC',
    ancho: 15,
    extraer: (e) => e.codigoEstandar?.codigo || '',
  },
  usoPresupuestal: {
    etiqueta: 'Uso Presupuestal',
    ancho: 20,
    extraer: (e) => e.usoPresupuestal?.nombre || '',
  },
  descripcion: { etiqueta: 'Descripción', ancho: 30, extraer: (e) => e.descripcionTecnica || '' },
  marca: { etiqueta: 'Marca', ancho: 15, extraer: (e) => e.marca || '' },
  color: { etiqueta: 'Color', ancho: 12, extraer: (e) => e.color || '' },
  gramaje: { etiqueta: 'Gramaje', ancho: 12, extraer: (e) => e.gramaje || 0 },
}

/**
 * Campos por defecto cuando no se especifican
 */
const CAMPOS_POR_DEFECTO: CampoReporte[] = [
  'codigo',
  'nombre',
  'cantidad',
  'cantidadMinima',
  'estado',
  'valorUnitario',
  'porcentajeAumento',
  'valorConAumento',
  'unidad',
  'caracter',
  'bodega',
  'subBodega',
  'stand',
]

export default class ReporteService {
  /**
   * Obtiene elementos filtrados por bodegas del scope
   */
  async elementosPorBodegas(scope: AccessScope, bodegaIds?: number[]): Promise<Elemento[]> {
    const query = Elemento.query()
      .preload('stand', (standQuery) => {
        standQuery.preload('subBodega', (subQuery) => {
          subQuery.preload('bodega')
        })
      })
      .preload('unidadMedida')
      .preload('clasificacion')
      .preload('codigoEstandar')
      .preload('usoPresupuestal')
      .preload('item', (itemQuery) => {
        itemQuery.preload('subcategoria', (subQuery) => {
          subQuery.preload('categoria')
        })
      })
      .where('estado', true)

    // Determinar qué bodegas usar: las específicas o las del scope
    const bodegasAFiltrar =
      bodegaIds && bodegaIds.length > 0
        ? bodegaIds
        : !scope.isAdmin && scope.bodegaIds && scope.bodegaIds.length > 0
          ? scope.bodegaIds
          : null

    // Filtrar por bodegas si hay alguna usando whereRaw

    // Filtrar por bodegas si hay alguna
    if (bodegasAFiltrar && bodegasAFiltrar.length > 0) {
      const placeholders = bodegasAFiltrar.map(() => '?').join(', ')

      query.whereRaw(
        `exists (
          select 1
          from stand s
          join sub_bodega sb
            on sb.id_sub_bodega = s.id_sub_bodega
          where s.id_stand = elemento.id_stand
            and sb.id_bodega in (${placeholders})
        )`,
        bodegasAFiltrar
      )
    }

    return await query
  }

  /**
   * Genera reporte en Excel con diseño mejorado y campos dinámicos
   */
  async generarExcel(elementos: Elemento[], campos: CampoReporte[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Materiales')

    // Definir columnas dinámicamente según campos seleccionados
    const columnas = campos.map((campo) => ({
      header: CAMPOS_DEFINICION[campo].etiqueta,
      key: campo,
      width: CAMPOS_DEFINICION[campo].ancho,
    }))
    worksheet.columns = columnas

    // Styling header mejorado
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E7D32' }, // Verde institucional
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // Bordes del header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1B5E20' } },
        left: { style: 'thin', color: { argb: 'FF1B5E20' } },
        bottom: { style: 'thin', color: { argb: 'FF1B5E20' } },
        right: { style: 'thin', color: { argb: 'FF1B5E20' } },
      }
    })

    // Agregar datos con estilo
    if (elementos.length === 0) {
      const emptyRow = worksheet.addRow([campos.map(() => '')])
      emptyRow.getCell(2).value = 'No hay elementos para mostrar'
      emptyRow.eachCell((cell) => {
        cell.alignment = { horizontal: 'center' }
        cell.font = { italic: true, color: { argb: 'FF999999' } }
      })
    } else {
      for (let i = 0; i < elementos.length; i++) {
        const elemento = elementos[i]
        const rowData: Record<string, string | number> = {}

        campos.forEach((campo) => {
          rowData[campo] = CAMPOS_DEFINICION[campo].extraer(elemento)
        })

        const row = worksheet.addRow(rowData)

        // Alternancia de colores en filas
        const isEven = i % 2 === 0
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF5F5F5' : 'FFFFFFFF' },
        }

        // Bordes en todas las celdas
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          }
        })

        // Color según estado si está incluido
        if (campos.includes('estado')) {
          const estadoCell = row.getCell('estado')
          if (!elemento.estado) {
            estadoCell.font = { color: { argb: 'FF999999' }, italic: true }
          } else {
            estadoCell.font = { color: { argb: 'FF2E7D32' }, bold: true }
          }
        }

        // Formato numérico para columnas de valores
        if (campos.includes('valorUnitario')) {
          row.getCell('valorUnitario').numFmt = '$#,##0.00'
        }
        if (campos.includes('porcentajeAumento')) {
          row.getCell('porcentajeAumento').numFmt = '0.00%'
        }
        if (campos.includes('valorConAumento')) {
          row.getCell('valorConAumento').numFmt = '$#,##0.00'
        }
      }
    }

    // Congelar el header
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

    // Auto-filter en el header (calculado según número de columnas)
    const ultimaColumna = String.fromCharCode(64 + campos.length)
    worksheet.autoFilter = {
      from: 'A1',
      to: `${ultimaColumna}1`,
    }

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  /**
   * Genera reporte en PDF con diseño mejorado y campos dinámicos
   */
  async generarPDF(elementos: Elemento[], campos: CampoReporte[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Colores
      const primaryColor = '#2E7D32' // Verde institucional
      const headerBgColor = '#E8F5E9'
      const rowEvenColor = '#FAFAFA'
      const rowOddColor = '#FFFFFF'
      const borderColor = '#E0E0E0'

      // Título con color
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('Reporte de Materiales', { align: 'center' })
      doc.moveDown(0.5)

      // Fecha
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' })
      doc.moveDown(0.5)

      // Total de elementos
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text(`Total de elementos: ${elementos.length}`, { align: 'center' })
      doc.moveDown(1)

      // Calcular anchos de columnas dinámicamente
      const colWidths = campos.map((campo) => CAMPOS_DEFINICION[campo].ancho * 5)
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0)
      const maxWidth = 770
      const scaleFactor = maxWidth / totalWidth
      const adjustedWidths = colWidths.map((w) => w * scaleFactor)

      // Tabla con diseño mejorado
      const tableTop = doc.y
      const rowHeight = 22

      // Header con fondo de color
      const headers = campos.map((campo) => CAMPOS_DEFINICION[campo].etiqueta)

      // Dibujar fondo del header
      doc.rect(40, tableTop, maxWidth, rowHeight).fill(headerBgColor)

      // Texto del header
      let x = 40
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1B5E20')
      headers.forEach((header, i) => {
        doc.text(header, x + 5, tableTop + 7, { width: adjustedWidths[i] - 10 })
        x += adjustedWidths[i]
      })

      // Línea bajo el header
      doc
        .moveTo(40, tableTop + rowHeight)
        .lineTo(40 + maxWidth, tableTop + rowHeight)
        .lineWidth(1)
        .strokeColor(borderColor)
        .stroke()

      // Datos con alternancia de colores
      doc.fontSize(7).font('Helvetica')
      let y = tableTop + rowHeight

      for (let i = 0; i < elementos.length; i++) {
        const elemento = elementos[i]

        // Nueva página si es necesario
        if (y > 520) {
          doc.addPage()
          y = 40

          // Re-dibujar header en nueva página
          doc.rect(40, y, maxWidth, rowHeight).fill(headerBgColor)
          x = 40
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#1B5E20')
          headers.forEach((header, headerIndex) => {
            doc.text(header, x + 5, y + 7, { width: adjustedWidths[headerIndex] - 10 })
            x += adjustedWidths[headerIndex]
          })
          doc
            .moveTo(40, y + rowHeight)
            .lineTo(40 + maxWidth, y + rowHeight)
            .lineWidth(1)
            .strokeColor(borderColor)
            .stroke()
          y += rowHeight
          doc.fontSize(7).font('Helvetica')
        }

        // Fondo de fila alternado
        const bgColor = i % 2 === 0 ? rowEvenColor : rowOddColor
        doc.rect(40, y, maxWidth, rowHeight).fill(bgColor)

        // Borde inferior de cada fila
        doc
          .moveTo(40, y + rowHeight)
          .lineTo(40 + maxWidth, y + rowHeight)
          .lineWidth(0.5)
          .strokeColor(borderColor)
          .stroke()

        // Texto de la fila
        x = 40
        const row = campos.map((campo) => {
          const valor = CAMPOS_DEFINICION[campo].extraer(elemento)
          return typeof valor === 'string' ? valor.substring(0, 25) : String(valor)
        })

        // Color según estado
        const textColor = elemento.estado ? '#333333' : '#999999'
        doc.fillColor(textColor)

        row.forEach((cell, cellIndex) => {
          doc.text(cell, x + 5, y + 7, { width: adjustedWidths[cellIndex] - 10 })
          x += adjustedWidths[cellIndex]
        })

        y += rowHeight
      }

      // Borde final de la tabla
      doc
        .moveTo(40, y)
        .lineTo(40 + maxWidth, y)
        .lineWidth(1)
        .strokeColor(borderColor)
        .stroke()

      // Footer
      if (y < 520) {
        doc.moveDown(2)
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#999999')
          .text('Reporte generado automáticamente por el Sistema de Gestión de Inventario', {
            align: 'center',
          })
      }

      doc.end()
    })
  }

  /**
   * Genera reporte en el formato especificado
   */
  async generar(
    scope: AccessScope,
    formato: ReporteFormato,
    bodegaIds?: number[],
    campos?: CampoReporte[]
  ): Promise<Buffer> {
    const elementos = await this.elementosPorBodegas(scope, bodegaIds)
    const camposSeleccionados = campos && campos.length > 0 ? campos : CAMPOS_POR_DEFECTO

    if (formato === 'excel') {
      return await this.generarExcel(elementos, camposSeleccionados)
    }

    return await this.generarPDF(elementos, camposSeleccionados)
  }
}
