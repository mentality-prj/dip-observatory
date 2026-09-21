import type {
  ResourceAllocationCommunityInput,
  ResourceAllocationInput,
  ResourceAllocationPriority,
  ResourceAllocationTeamInput,
  ResourceAllocationTravelEdgeInput,
} from './contracts'

type Row = Record<string, string>
type SheetRows = { sheet: string; rows: Row[] }

const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function clean(value: unknown): string {
  return String(value ?? '').trim()
}

function number(value: unknown, fallback = 0): number {
  const parsed = Number(clean(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolean(value: unknown, fallback = true): boolean {
  const normalized = clean(value).toLowerCase()
  if (!normalized) return fallback
  if (['false', '0', 'no', 'n', 'ні', 'nie'].includes(normalized)) return false
  if (['true', '1', 'yes', 'y', 'так'].includes(normalized)) return true
  return fallback
}

function list(value: unknown): string[] {
  return clean(value)
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function priority(value: unknown): ResourceAllocationPriority {
  const normalized = clean(value).toLowerCase()
  if (normalized === 'critical' || normalized === 'high' || normalized === 'normal') return normalized
  return 'normal'
}

function parseCsv(text: string): Row[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (!quoted && (char === ',' || char === ';')) {
      row.push(cell)
      cell = ''
      continue
    }
    if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      cell = ''
      continue
    }
    cell += char
  }
  row.push(cell)
  if (row.some((value) => value.trim())) rows.push(row)
  if (rows.length < 2) return []
  const headers = rows[0].map((value) => value.trim().toLowerCase())
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, clean(values[index])]))
  )
}

function rowsFromGenericXml(doc: Document): SheetRows[] {
  const directRows = [...doc.querySelectorAll('row, Row')]
  if (directRows.length === 0) return []

  const rows = directRows
    .map((node) => {
      const element = node as Element
      const cells = [...element.children]
      if (cells.some((child) => child.tagName.toLowerCase() === 'cell')) return null
      return Object.fromEntries(
        cells.map((child) => [child.tagName.toLowerCase(), clean(child.textContent)])
      )
    })
    .filter((row): row is Row => row !== null)

  return rows.length ? [{ sheet: 'data', rows }] : []
}

function spreadsheetXmlSheets(doc: Document): SheetRows[] {
  const worksheets = [...doc.getElementsByTagNameNS('*', 'Worksheet')]
  return worksheets.map((worksheet, index) => {
    const name =
      worksheet.getAttributeNS(
        'urn:schemas-microsoft-com:office:spreadsheet',
        'Name'
      ) ??
      worksheet.getAttribute('ss:Name') ??
      `Sheet${index + 1}`
    const tableRows = [...worksheet.getElementsByTagNameNS('*', 'Row')]
    const matrix = tableRows.map((row) =>
      [...row.getElementsByTagNameNS('*', 'Cell')].map((cell) => {
        const data = cell.getElementsByTagNameNS('*', 'Data')[0]
        return clean(data?.textContent)
      })
    )
    if (matrix.length < 2) return { sheet: name, rows: [] }
    const headers = matrix[0].map((value) => value.toLowerCase())
    return {
      sheet: name,
      rows: matrix.slice(1).map((values) =>
        Object.fromEntries(headers.map((header, cellIndex) => [header, clean(values[cellIndex])]))
      ),
    }
  })
}

function parseXml(text: string): SheetRows[] {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML file.')
  const spreadsheet = spreadsheetXmlSheets(doc).filter((sheet) => sheet.rows.length > 0)
  return spreadsheet.length ? spreadsheet : rowsFromGenericXml(doc)
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const min = Math.max(0, bytes.byteLength - 65_557)
  for (let offset = bytes.byteLength - 22; offset >= min; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset
  }
  throw new Error('Invalid XLSX archive.')
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function unzipXlsx(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  const eocd = findEndOfCentralDirectory(bytes)
  const entries = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder()
  const result = new Map<string, Uint8Array>()

  for (let index = 0; index < entries; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('Invalid XLSX directory.')
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const fileNameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const fileName = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength))

    if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('Invalid XLSX entry.')
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize)
    const payload = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : null
    if (payload) result.set(fileName.replace(/^\//, ''), payload)

    offset += 46 + fileNameLength + extraLength + commentLength
  }
  return result
}

function xmlText(entries: Map<string, Uint8Array>, path: string): Document | null {
  const bytes = entries.get(path)
  if (!bytes) return null
  const text = new TextDecoder().decode(bytes)
  return new DOMParser().parseFromString(text, 'application/xml')
}

function sharedStrings(entries: Map<string, Uint8Array>): string[] {
  const doc = xmlText(entries, 'xl/sharedStrings.xml')
  if (!doc) return []
  return [...doc.getElementsByTagNameNS('*', 'si')].map((item) =>
    [...item.getElementsByTagNameNS('*', 't')].map((text) => text.textContent ?? '').join('')
  )
}

function xlsxCellValue(cell: Element, strings: string[]): string {
  const type = cell.getAttribute('t')
  if (type === 'inlineStr') {
    return [...cell.getElementsByTagNameNS('*', 't')].map((item) => item.textContent ?? '').join('')
  }
  const raw = cell.getElementsByTagNameNS('*', 'v')[0]?.textContent ?? ''
  if (type === 's') return strings[Number(raw)] ?? ''
  return raw
}

function xlsxRows(doc: Document, strings: string[]): Row[] {
  const matrix = [...doc.getElementsByTagNameNS('*', 'row')].map((row) => {
    const values: string[] = []
    for (const cell of [...row.getElementsByTagNameNS('*', 'c')]) {
      const ref = cell.getAttribute('r') ?? ''
      const letters = ref.match(/[A-Z]+/)?.[0] ?? 'A'
      let column = 0
      for (const letter of letters) column = column * 26 + letter.charCodeAt(0) - 64
      values[column - 1] = xlsxCellValue(cell, strings)
    }
    return values
  })
  if (matrix.length < 2) return []
  const headers = matrix[0].map((value) => clean(value).toLowerCase())
  return matrix.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, clean(values[index])]))
  )
}

async function parseXlsx(buffer: ArrayBuffer): Promise<SheetRows[]> {
  const entries = await unzipXlsx(buffer)
  const workbook = xmlText(entries, 'xl/workbook.xml')
  const relationships = xmlText(entries, 'xl/_rels/workbook.xml.rels')
  if (!workbook || !relationships) throw new Error('Invalid XLSX workbook.')

  const targets = new Map(
    [...relationships.getElementsByTagNameNS('*', 'Relationship')].map((item) => [
      item.getAttribute('Id') ?? '',
      item.getAttribute('Target') ?? '',
    ])
  )
  const strings = sharedStrings(entries)

  return [...workbook.getElementsByTagNameNS('*', 'sheet')]
    .map((sheet) => {
      const name = sheet.getAttribute('name') ?? 'Sheet'
      const relationId =
        sheet.getAttributeNS(
          'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
          'id'
        ) ?? sheet.getAttribute('r:id') ?? ''
      const target = targets.get(relationId)
      if (!target) return { sheet: name, rows: [] }
      const normalized = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`
      const document = xmlText(entries, normalized.replace('xl/xl/', 'xl/'))
      return { sheet: name, rows: document ? xlsxRows(document, strings) : [] }
    })
    .filter((sheet) => sheet.rows.length > 0)
}

function rowType(sheet: string, row: Row): string {
  const explicit = clean(row.record_type || row.type || row.kind).toLowerCase()
  if (explicit) return explicit
  const normalizedSheet = sheet.toLowerCase().replace(/[ _-]/g, '')
  if (normalizedSheet.startsWith('communit')) return 'community'
  if (normalizedSheet.startsWith('team')) return 'team'
  if (normalizedSheet.startsWith('demand') || normalizedSheet.startsWith('need')) return 'demand'
  if (normalizedSheet.startsWith('travel') || normalizedSheet.startsWith('route')) return 'travel'
  if (normalizedSheet.startsWith('setting') || normalizedSheet.startsWith('config')) return 'settings'
  return ''
}

function buildInput(sheets: SheetRows[], fileName: string): ResourceAllocationInput {
  const communities = new Map<string, ResourceAllocationCommunityInput>()
  const teams: ResourceAllocationTeamInput[] = []
  const travel: ResourceAllocationTravelEdgeInput[] = []
  let days = DEFAULT_DAYS
  let budget: number | undefined
  let targetPriorityCoverage: number | undefined

  const demandRows: Array<{ community: string; row: Row }> = []
  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      const type = rowType(sheet.sheet, row)
      if (type === 'community' || type === 'communities') {
        const id = clean(row.id || row.community || row.name)
        if (!id) continue
        communities.set(id, {
          id,
          accessible: boolean(row.accessible, true),
          max_teams: number(row.max_teams, 30),
          demand: [],
        })
      } else if (type === 'demand' || type === 'need') {
        const community = clean(row.community || row.community_id || row.location)
        if (community) demandRows.push({ community, row })
      } else if (type === 'team' || type === 'teams') {
        const id = clean(row.id || row.team || row.name)
        if (!id) continue
        teams.push({
          id,
          current_community: clean(row.current_community || row.community || row.location) || null,
          skills: list(row.skills || row.services),
          capacity: number(row.capacity),
          max_daily_capacity: row.max_daily_capacity ? number(row.max_daily_capacity) : undefined,
          max_travel_cost: row.max_travel_cost ? number(row.max_travel_cost) : undefined,
          max_travel_minutes: row.max_travel_minutes ? number(row.max_travel_minutes) : undefined,
          cost_per_capacity: number(row.cost_per_capacity),
        })
      } else if (type === 'travel' || type === 'route') {
        const from = clean(row.from)
        const to = clean(row.to)
        if (!from || !to) continue
        travel.push({
          from,
          to,
          cost: number(row.cost),
          minutes: row.minutes ? number(row.minutes) : undefined,
        })
      } else if (type === 'settings' || type === 'config') {
        const parsedDays = list(row.days)
        if (parsedDays.length > 0) days = parsedDays
        if (row.budget) budget = number(row.budget)
        if (row.target_priority_coverage) targetPriorityCoverage = number(row.target_priority_coverage)
      }
    }
  }

  for (const { community, row } of demandRows) {
    const target = communities.get(community)
    if (!target) throw new Error(`Demand references unknown community: ${community}`)
    const service = clean(row.service)
    if (!service) throw new Error(`Demand in ${community} is missing service.`)
    target.demand.push({
      service,
      units: number(row.units),
      priority: priority(row.priority),
      program: clean(row.program) || undefined,
    })
  }

  if (communities.size === 0) throw new Error('Import requires at least one community.')
  if (teams.length === 0) throw new Error('Import requires at least one team.')

  const knownCommunities = new Set(communities.keys())
  for (const team of teams) {
    if (team.current_community && !knownCommunities.has(team.current_community))
      throw new Error(`Team ${team.id} references unknown community: ${team.current_community}`)
  }
  for (const edge of travel) {
    if (!knownCommunities.has(edge.from) || !knownCommunities.has(edge.to))
      throw new Error(`Travel edge references unknown community: ${edge.from} → ${edge.to}`)
  }

  const currentAllocation = Object.fromEntries(
    teams.map((team) => [team.id, team.current_community ?? null])
  )

  return {
    operation: 'optimize',
    planning_period: { days },
    communities: [...communities.values()],
    teams,
    travel_edges: travel,
    current_allocation: currentAllocation,
    budget,
    target_priority_coverage: targetPriorityCoverage ?? 0.9,
    provenance: {
      source: `client-import:${fileName}`,
      imported_at: new Date().toISOString(),
      mapping_version: 'resource-allocation-import/1',
    },
  }
}

export async function importResourceAllocationFile(file: File): Promise<ResourceAllocationInput> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'csv') return buildInput([{ sheet: 'data', rows: parseCsv(await file.text()) }], file.name)
  if (extension === 'xml') return buildInput(parseXml(await file.text()), file.name)
  if (extension === 'xlsx') return buildInput(await parseXlsx(await file.arrayBuffer()), file.name)
  throw new Error('Supported formats: CSV, XML and XLSX.')
}

export const RESOURCE_ALLOCATION_IMPORT_COLUMNS =
  'record_type,id,community,service,units,priority,current_community,skills,capacity,max_teams,from,to,cost,minutes,days,budget'
