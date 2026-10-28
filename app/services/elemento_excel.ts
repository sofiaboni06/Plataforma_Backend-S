import ExcelJS from 'exceljs'

export type CatalogoElementoExcel = {
  items: string[]
  stands: string[]
  unidades: string[]
  clasificaciones: string[]
  codigosUnspsc: string[]
  usos: string[]
}

export type FilaElementoExcel = {
  fila: number
  nombre: string
  codigo: string
  item: string
  stand: string
  cantidad: number | null
  cantidadMinima: number | null
  unidad: string
  clasificacion: string
  caracter: string
  estado: string
  codigoUnspsc: string
  uso: string
  marca: string
  color: string
  gramaje: number | null
  descripcion: string
  valorUnitario: number | null
  porcentajeAumento: number | null
}

const HEADERS = [
  'Nombre',
  'Código interno',
  'Ítem',
  'Stand',
  'Cantidad',
  'Cantidad mínima',
  'Unidad de medida',
  'Clasificación',
  'Carácter',
  'Estado',
  'Código UNSPSC',
  'Uso presupuestal',
  'Marca',
  'Color',
  'Gramaje',
  'Descripción',
  'Valor unitario',
  'Porcentaje de aumento',
] as const

const SELECTS: Array<{ col: number; sheet: string; key: keyof CatalogoElementoExcel | 'caracteres' | 'estados'; required: boolean }> = [
  { col: 3, sheet: 'Items', key: 'items', required: true },
  { col: 4, sheet: 'Stands', key: 'stands', required: true },
  { col: 7, sheet: 'Unidades', key: 'unidades', required: true },
  { col: 8, sheet: 'Clasificaciones', key: 'clasificaciones', required: true },
  { col: 9, sheet: 'Caracteres', key: 'caracteres', required: true },
  { col: 10, sheet: 'Estados', key: 'estados', required: true },
  { col: 11, sheet: 'Unspsc', key: 'codigosUnspsc', required: false },
  { col: 12, sheet: 'Usos', key: 'usos', required: false },
]

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') {
    const record = value as { text?: unknown; result?: unknown; richText?: Array<{ text?: string }> }
    if (Array.isArray(record.richText)) return record.richText.map((part) => part.text ?? '').join('').trim()
    if (record.result !== undefined) return cellText(record.result)
    if (record.text !== undefined) return cellText(record.text)
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

function asNumber(value: string) {
  if (!value) return null
  let raw = value.replace(/[^\d,.-]/g, '')
  if (raw.includes(',')) raw = raw.replace(/\./g, '').replace(',', '.')
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function uniqueLabels(labels: string[]) {
  const seen = new Set<string>()
  const rows: string[] = []
  for (const label of labels) {
    const clean = label.replace(/[\r\n]/g, ' ').trim()
    const key = clean.toLowerCase()
    if (!clean || seen.has(key)) continue
    seen.add(key)
    rows.push(clean)
  }
  return rows
}

function listaDe(workbook: ExcelJS.Workbook, name: string, labels: string[]) {
  const rows = uniqueLabels(labels)
  if (!rows.length) return null
  const sheet = workbook.addWorksheet(name, { state: 'hidden' })
  rows.forEach((label, index) => {
    sheet.getCell(index + 1, 1).value = label
  })
  return `'${name}'!$A$1:$A$${rows.length}`
}

export async function plantillaElementos(catalogo: CatalogoElementoExcel) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Elementos')
  sheet.columns = HEADERS.map((header) => ({
    header,
    width: Math.min(42, Math.max(16, header.length + 4)),
  }))
  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF39A900' } }
  header.alignment = { vertical: 'middle', wrapText: true }
  header.height = 32

  const listas = new Map<string, string>()
  const fijas: Record<'caracteres' | 'estados', string[]> = {
    caracteres: ['Consumo', 'Devolutivo'],
    estados: ['Activo', 'Inactivo'],
  }
  for (const select of SELECTS) {
    const labels = select.key === 'caracteres' || select.key === 'estados' ? fijas[select.key] : catalogo[select.key]
    const ref = listaDe(workbook, select.sheet, labels)
    if (ref) listas.set(select.sheet, ref)
  }

  for (let rowNumber = 2; rowNumber <= 300; rowNumber++) {
    for (const select of SELECTS) {
      const ref = listas.get(select.sheet)
      if (!ref) continue
      sheet.getCell(rowNumber, select.col).dataValidation = {
        type: 'list',
        allowBlank: !select.required,
        formulae: [ref],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: HEADERS[select.col - 1],
        error: 'Elija un valor de la lista.',
        showInputMessage: true,
        promptTitle: HEADERS[select.col - 1],
        prompt: 'Despliegue la lista y elija una opción.',
      }
    }
  }

  const guide = workbook.addWorksheet('Cómo llenarla')
  guide.getColumn(1).width = 110
  const steps = [
    'Una fila es un elemento. No borre la fila 1: el sistema la usa para leer el archivo.',
    'Las columnas con lista son: Ítem, Stand, Unidad de medida, Clasificación, Carácter, Estado, Código UNSPSC y Uso presupuestal.',
    'Ítem, Stand, Unidad de medida, Clasificación, Carácter y Estado son obligatorios. Código UNSPSC y Uso presupuestal se pueden dejar en blanco.',
    'Nombre y Código interno los escribe usted. El código interno no se puede repetir.',
    'Cantidad es el stock inicial y debe ser 10 o más. Cantidad mínima es solo la alerta.',
    'Deje vacías las filas que no use y guarde el archivo en .xlsx.',
  ]
  steps.forEach((step, index) => {
    guide.getCell(index + 1, 1).value = `${index + 1}. ${step}`
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export async function leerElementosExcel(filePath: string): Promise<{ filas: FilaElementoExcel[]; errores: string[] }> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const sheet = workbook.getWorksheet('Elementos') ?? workbook.worksheets.find((item) => item.state === 'visible')
  if (!sheet) return { filas: [], errores: ['El archivo no tiene una hoja de elementos.'] }

  let headerRow = 1
  const headers = new Map<string, number>()
  sheet.eachRow((row, rowNumber) => {
    if (headers.size) return
    row.eachCell((cell, col) => {
      const key = normalizeHeader(cellText(cell.value))
      if (key) headers.set(key, col)
    })
    if (headers.has('nombre') && headers.has('codigo interno')) headerRow = rowNumber
    else headers.clear()
  })

  if (!headers.has('nombre')) {
    return { filas: [], errores: ['No se encontró la fila de encabezados. Use la plantilla de elementos.'] }
  }

  const col = (name: string) => headers.get(normalizeHeader(name)) ?? 0
  const filas: FilaElementoExcel[] = []
  const errores: string[] = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow) return
    const read = (name: string) => (col(name) ? cellText(row.getCell(col(name)).value) : '')
    const nombre = read('Nombre')
    const codigo = read('Código interno')
    if (!nombre && !codigo) return
    if (!nombre || !codigo) {
      errores.push(`Fila ${rowNumber}: nombre y código interno son obligatorios.`)
      return
    }
    filas.push({
      fila: rowNumber,
      nombre,
      codigo,
      item: read('Ítem'),
      stand: read('Stand'),
      cantidad: asNumber(read('Cantidad')),
      cantidadMinima: asNumber(read('Cantidad mínima')),
      unidad: read('Unidad de medida'),
      clasificacion: read('Clasificación'),
      caracter: read('Carácter'),
      estado: read('Estado'),
      codigoUnspsc: read('Código UNSPSC'),
      uso: read('Uso presupuestal'),
      marca: read('Marca'),
      color: read('Color'),
      gramaje: asNumber(read('Gramaje')),
      descripcion: read('Descripción'),
      valorUnitario: asNumber(read('Valor unitario')),
      porcentajeAumento: asNumber(read('Porcentaje de aumento')),
    })
  })

  return { filas, errores }
}
