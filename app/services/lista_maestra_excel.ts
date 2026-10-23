import type { CaracterListaMaestra } from '#models/lista_maestra_material'
import ExcelJS from 'exceljs'

export type FilaListaMaestraExcel = {
  fila: number
  codigoUnspsc: string
  producto: string
  descripcionTecnica: string | null
  unidadMedida: string | null
  cantidadBase: number
  caracter: CaracterListaMaestra | null
  observaciones: string | null
}

export type LecturaListaMaestraExcel = {
  codigoPrograma: string | null
  nombrePrograma: string | null
  filas: FilaListaMaestraExcel[]
  errores: string[]
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'x' : ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') {
    const record = value as {
      text?: unknown
      result?: unknown
      richText?: Array<{ text?: string }>
      hyperlink?: string
    }
    if (Array.isArray(record.richText)) {
      return record.richText.map((part) => part.text ?? '').join('').trim()
    }
    if (record.text !== undefined) return cellText(record.text)
    if (record.result !== undefined) return cellText(record.result)
  }
  return String(value).trim()
}

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function asQuantity(value: string) {
  const parsed = Number(value.replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function marked(value: string) {
  const token = normalizeHeader(value)
  return token === 'x' || token === '1' || token === 'si' || token === 'true'
}

function caracterDe(consumo: string, devolutivo: string, software: string): CaracterListaMaestra | null {
  if (marked(software)) return 'software'
  if (marked(devolutivo)) return 'devolutivo'
  if (marked(consumo)) return 'consumo'
  return null
}

type ColumnMap = {
  unspsc?: number
  producto?: number
  descripcion?: number
  unidad?: number
  cantidad?: number
  observaciones?: number
  consumo?: number
  devolutivo?: number
  software?: number
}

function mapFromHeaders(headers: Map<number, string>): ColumnMap {
  const map: ColumnMap = {}
  for (const [index, raw] of headers) {
    const header = normalizeHeader(raw)
    if (header.includes('codigo unspsc') || header === 'unspsc' || header === 'codigo') {
      map.unspsc = index
    } else if (header === 'producto' || header === 'nombre' || header === 'elemento') {
      map.producto = index
    } else if (header.includes('descripcion')) {
      map.descripcion = index
    } else if (header.includes('unidad')) {
      map.unidad = index
    } else if (header.includes('cantidad')) {
      map.cantidad = index
    } else if (header.includes('observacion')) {
      map.observaciones = index
    } else if (header === 'consumo') {
      map.consumo = index
    } else if (header === 'devolutivo') {
      map.devolutivo = index
    } else if (header === 'software') {
      map.software = index
    }
  }
  return map
}

function isOfficialHeader(headers: Map<number, string>) {
  const joined = [...headers.values()].map(normalizeHeader).join(' | ')
  return joined.includes('codigo unspsc') && joined.includes('producto')
}

function isSimpleHeader(headers: Map<number, string>) {
  const joined = [...headers.values()].map(normalizeHeader).join(' | ')
  return (
    (joined.includes('codigo') || joined.includes('unspsc')) &&
    (joined.includes('cantidad') || joined.includes('nombre') || joined.includes('producto'))
  )
}

function rowHeaders(row: ExcelJS.Row) {
  const headers = new Map<number, string>()
  row.eachCell({ includeEmpty: false }, (cell, index) => {
    const text = cellText(cell.value)
    if (text) headers.set(index, text)
  })
  return headers
}

function lookMeta(sheet: ExcelJS.Worksheet) {
  let codigoPrograma: string | null = null
  let nombrePrograma: string | null = null

  const max = Math.min(sheet.rowCount, 20)
  for (let rowNumber = 1; rowNumber <= max; rowNumber++) {
    const values: string[] = []
    sheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
      const text = cellText(cell.value)
      if (text) values.push(text)
    })
    for (let index = 0; index < values.length; index++) {
      const header = normalizeHeader(values[index])
      const next = values[index + 1]?.trim() ?? ''
      if (header.includes('codigo de programa') && next) codigoPrograma = next
      if (header.includes('denominacion programa') && next) nombrePrograma = next
    }
  }

  return { codigoPrograma, nombrePrograma }
}

function readMappedRow(
  row: ExcelJS.Row,
  rowNumber: number,
  columns: ColumnMap,
  errores: string[]
): FilaListaMaestraExcel | null {
  const codigo = columns.unspsc ? cellText(row.getCell(columns.unspsc).value) : ''
  const producto = columns.producto ? cellText(row.getCell(columns.producto).value) : ''
  if (!codigo && !producto) return null
  if (!codigo || !producto) {
    errores.push(`Fila ${rowNumber}: el código UNSPSC y el producto son obligatorios`)
    return null
  }

  const cantidadRaw = columns.cantidad ? cellText(row.getCell(columns.cantidad).value) : '1'
  const cantidad = asQuantity(cantidadRaw)
  if (!cantidad) {
    errores.push(`Fila ${rowNumber}: la cantidad base debe ser mayor que 0`)
    return null
  }

  return {
    fila: rowNumber,
    codigoUnspsc: codigo.replace(/\s+/g, ''),
    producto: producto.slice(0, 200),
    descripcionTecnica: columns.descripcion
      ? cellText(row.getCell(columns.descripcion).value) || null
      : null,
    unidadMedida: columns.unidad ? cellText(row.getCell(columns.unidad).value) || null : null,
    cantidadBase: cantidad,
    caracter: caracterDe(
      columns.consumo ? cellText(row.getCell(columns.consumo).value) : '',
      columns.devolutivo ? cellText(row.getCell(columns.devolutivo).value) : '',
      columns.software ? cellText(row.getCell(columns.software).value) : ''
    ),
    observaciones: columns.observaciones
      ? cellText(row.getCell(columns.observaciones).value) || null
      : null,
  }
}

export async function leerListaMaestraExcel(filePath: string): Promise<LecturaListaMaestraExcel> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const sheet =
    workbook.worksheets.find((item) => normalizeHeader(item.name).includes('material')) ??
    workbook.worksheets[0]

  if (!sheet) {
    throw new Error('El archivo no contiene hojas')
  }

  const errores: string[] = []
  const { codigoPrograma, nombrePrograma } = lookMeta(sheet)
  let columns: ColumnMap | null = null
  let headerRow = 0

  const scanUntil = Math.min(sheet.rowCount, 40)
  for (let rowNumber = 1; rowNumber <= scanUntil; rowNumber++) {
    const headers = rowHeaders(sheet.getRow(rowNumber))
    if (isOfficialHeader(headers) || isSimpleHeader(headers)) {
      columns = mapFromHeaders(headers)
      headerRow = rowNumber
      break
    }
  }

  if (!columns || !columns.unspsc || !columns.producto) {
    return {
      codigoPrograma,
      nombrePrograma,
      filas: [],
      errores: [
        'No se encontró la fila de encabezados. Use el anexo SENA (CÓDIGO UNSPSC, PRODUCTO, CANTIDAD) o la plantilla simple.',
      ],
    }
  }

  const filas: FilaListaMaestraExcel[] = []
  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const parsed = readMappedRow(sheet.getRow(rowNumber), rowNumber, columns, errores)
    if (parsed) filas.push(parsed)
  }

  return { codigoPrograma, nombrePrograma, filas, errores }
}

const SENA = {
  green: 'FF00A651',
  dark: 'FF005C3B',
  text: 'FF073B2A',
  soft: 'FFE9F7EF',
  hairline: 'FFD7ECE1',
  white: 'FFFFFFFF',
  orange: 'FFF7931E',
  canvas: 'FFEAF5F1',
}

function fill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: SENA.hairline } }
  return { top: edge, left: edge, bottom: edge, right: edge }
}

export async function plantillaListaMaestra(meta: {
  codigo?: string | null
  nombre?: string | null
} = {}) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Plataforma SENA'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Materiales', {
    views: [{ state: 'frozen', ySplit: 8, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, paperSize: 9 },
  })

  sheet.columns = [
    { key: 'item', width: 8 },
    { key: 'unspsc', width: 18 },
    { key: 'producto', width: 38 },
    { key: 'descripcion', width: 44 },
    { key: 'unidad', width: 18 },
    { key: 'cantidad', width: 24 },
    { key: 'observaciones', width: 28 },
    { key: 'consumo', width: 14 },
    { key: 'devolutivo', width: 14 },
    { key: 'software', width: 14 },
  ]

  sheet.mergeCells('A1:J1')
  const title = sheet.getCell('A1')
  title.value = 'Lista maestra de materiales de formación'
  title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: SENA.white } }
  title.fill = fill(SENA.green)
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  sheet.getRow(1).height = 36

  sheet.mergeCells('A2:J2')
  const subtitle = sheet.getCell('A2')
  subtitle.value =
    'Complete una fila por material. Marque con una X el carácter (consumo, devolutivo o software). La cantidad es para formar 30 aprendices.'
  subtitle.font = { name: 'Calibri', size: 11, color: { argb: SENA.text } }
  subtitle.fill = fill(SENA.soft)
  subtitle.alignment = { vertical: 'middle', wrapText: true, indent: 1 }
  sheet.getRow(2).height = 32

  sheet.getRow(3).height = 10

  sheet.getCell('A4').value = 'CÓDIGO DE PROGRAMA DE FORMACIÓN'
  sheet.getCell('C4').value = meta.codigo ?? ''
  sheet.getCell('E4').value = 'DENOMINACIÓN PROGRAMA DE FORMACIÓN'
  sheet.getCell('G4').value = meta.nombre ?? ''
  for (const address of ['A4', 'C4', 'E4', 'G4'] as const) {
    const cell = sheet.getCell(address)
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: address === 'A4' || address === 'E4',
      color: { argb: SENA.dark },
    }
    cell.fill = fill(SENA.canvas)
    cell.border = thinBorder()
    cell.alignment = { vertical: 'middle', wrapText: true, indent: 1 }
  }
  sheet.mergeCells('A4:B4')
  sheet.mergeCells('C4:D4')
  sheet.mergeCells('E4:F4')
  sheet.mergeCells('G4:J4')
  sheet.getRow(4).height = 28
  sheet.getRow(5).height = 8
  sheet.getRow(6).height = 8

  const headers = [
    'ITEM',
    'CÓDIGO UNSPSC',
    'PRODUCTO',
    'DESCRIPCIÓN TÉCNICA MÍNIMA REQUERIDA DEL BIEN',
    'UNIDAD DE MEDIDA',
    'CANTIDAD REQUERIDA PARA FORMAR 30 APRENDICES',
    'OBSERVACIONES',
    'Consumo',
    'Devolutivo',
    'Software',
  ]
  const headerRow = sheet.getRow(8)
  headerRow.height = 36
  headers.forEach((label, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = label
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: SENA.white } }
    cell.fill = fill(SENA.dark)
    cell.border = thinBorder()
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })

  for (let index = 0; index < 18; index++) {
    const rowNumber = 9 + index
    const row = sheet.getRow(rowNumber)
    row.height = 24
    row.getCell(1).value = index + 1
    for (let col = 1; col <= 10; col++) {
      const cell = row.getCell(col)
      cell.border = thinBorder()
      cell.font = { name: 'Calibri', size: 11, color: { argb: SENA.text } }
      cell.alignment = { vertical: 'middle', wrapText: true, indent: col <= 4 ? 1 : 0 }
      cell.fill = fill(index % 2 === 0 ? SENA.white : SENA.soft)
    }
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
    for (const col of [8, 9, 10]) {
      row.getCell(col).alignment = { vertical: 'middle', horizontal: 'center' }
    }
  }

  const guide = workbook.addWorksheet('Cómo llenarla')
  guide.columns = [{ width: 92 }]
  guide.mergeCells('A1:A1')
  guide.getCell('A1').value = 'Cómo llenar la plantilla'
  guide.getCell('A1').font = { name: 'Calibri', size: 16, bold: true, color: { argb: SENA.white } }
  guide.getCell('A1').fill = fill(SENA.green)
  guide.getCell('A1').alignment = { vertical: 'middle', indent: 1 }
  guide.getRow(1).height = 32

  const steps = [
    'En Materiales, no borre la fila 8 de encabezados: el sistema la usa para leer el archivo.',
    'Escriba el código y el nombre del programa en la fila 4 si no vinieron diligenciados.',
    'Una fila = un material. Código UNSPSC y producto son obligatorios.',
    'La cantidad es la requerida para formar 30 aprendices.',
    'Marque con una X una sola columna de carácter: Consumo, Devolutivo o Software.',
    'Deje en blanco las filas que no use. No combine celdas en la zona de datos.',
    'Guarde el archivo en .xlsx y súbalo con el botón Subir Excel. También puede agregar o editar materiales uno a uno en la plataforma.',
  ]
  steps.forEach((step, index) => {
    const row = guide.getRow(index + 3)
    row.height = 28
    row.getCell(1).value = `${index + 1}. ${step}`
    row.getCell(1).font = { name: 'Calibri', size: 12, color: { argb: SENA.text } }
    row.getCell(1).alignment = { vertical: 'middle', wrapText: true, indent: 1 }
    row.getCell(1).fill = fill(index % 2 === 0 ? SENA.soft : SENA.white)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
