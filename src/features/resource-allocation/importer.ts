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

function parseNumber(
  value: unknown,
  label: string,
  options: { optional?: boolean; min?: number; max?: number; integer?: boolean } = {}
): number | undefined {
  const raw = clean(value)
  if (!raw) {
    if (options.optional) return undefined
    throw new Error(`${label} is required.`)
  }
  const parsed = Number(raw.replace(',', '.'))
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid number; received "${raw}".`)
  if (options.integer && !Number.isInteger(parsed)) throw new Error(`${label} must be an integer.`)
  if (options.min !== undefined && parsed < options.min)
    throw new Error(`${label} must be at least ${options.min}.`)
  if (options.max !== undefined && parsed > options.max)
    throw new Error(`${label} must be at most ${options.max}.`)
  return parsed
}

function parseBoolean(value: unknown, label: string, fallback?: boolean): boolean {
  const normalized = clean(value).toLowerCase()
  if (!normalized) {
    if (fallback !== undefined) return fallback
    throw new Error(`${label} is required and must be true/false.`)
  }
  if (['false', '0', 'no', 'n', 'ні', 'nie'].includes(normalized)) return false
  if (['true', '1', 'yes', 'y', 'так'].includes(normalized)) return true
  throw new Error(`${label} must be true/false; received "${clean(value)}".`)
}

function list(value: unknown): string[] {
  return clean(value)
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parsePriority(value: unknown, label: string): ResourceAllocationPriority {
  const normalized = clean(value).toLowerCase()
  if (!normalized) return 'normal'
  if (normalized === 'critical' || normalized === 'high' || normalized === 'normal') return normalized
  throw new Error(`${label} must be one of critical, high or normal; received "${clean(value)}".`)
}

function sanitizeSourceFileName(fileName: string): string {
  const leaf = fileName.split(/[\\/]/).pop() ?? 'import'
  const sanitized = leaf.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[^\p{L}\p{N}._ -]/gu, '_').trim()
  return (sanitized || 'import').slice(0, 120)
}

const PII_COLUMNS = new Set([
  'first_name',
  'last_name',
  'full_name',
  'beneficiary_name',
  'beneficiary_id',
  'phone',
  'phone_number',
  'email',
  'email_address',
  'address',
  'home_address',
  'passport',
  'passport_number',
  'document_number',
  'date_of_birth',
  'dob',
])

function rejectPiiColumns(sheets: SheetRows[]) {
  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      for (const [key, value] of Object.entries(row)) {
        if (PII_COLUMNS.has(key.toLowerCase()) && clean(value))
          throw new Error(`Personal-data column "${key}" is not allowed in Resource Allocation imports.`)
      }
    }
  }
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
  const headers = rows[0].map((value) => value.trim().toLowerCase().replace(/^\uFEFF/, ''))
  return rows
    .slice(1)
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, clean(values[index])])))
}

function rowsFromGenericXml(doc: Document): SheetRows[] {
  const directRows = [...doc.querySelectorAll('row, Row')]
  if (directRows.length === 0) return []

  const rows = directRows
    .map((node) => {
      const element = node as Element
      const cells = [...element.children]
      if (cells.some((child) => child.tagName.toLowerCase() === 'cell')) return null
      return Object.fromEntries(cells.map((child) => [child.tagName.toLowerCase(), clean(child.textContent)]))
    })
    .filter((row): row is Row => row !== null)

  return rows.length ? [{ sheet: 'data', rows }] : []
}

function spreadsheetXmlSheets(doc: Document): SheetRows[] {
  const worksheets = [...doc.getElementsByTagNameNS('*', 'Worksheet')]
  return worksheets.map((worksheet, index) => {
    const name =
      worksheet.getAttributeNS('urn:schemas-microsoft-com:office:spreadsheet', 'Name') ??
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
      rows: matrix
        .slice(1)
        .map((values) => Object.fromEntries(headers.map((header, cellIndex) => [header, clean(values[cellIndex])]))),
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
  const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const stream = new Blob([source]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
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
  return matrix
    .slice(1)
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, clean(values[index])])))
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
        sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ??
        sheet.getAttribute('r:id') ??
        ''
      const target = targets.get(relationId)
      if (!target) return { sheet: name, rows: [] }
      const normalized = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`
      const document = xmlText(entries, normalized.replace('xl/xl/', 'xl/'))
      return { sheet: name, rows: document ? xlsxRows(document, strings) : [] }
    })
    .filter((sheet) => sheet.rows.length > 0)
}

function rowType(sheet: string, row: Row): string {
  const explicit = clean(row.record_type || row.type || row.kind).toLowerCase().replace(/[ -]/g, '_')
  if (explicit) return explicit
  const normalizedSheet = sheet.toLowerCase().replace(/[ _-]/g, '')
  if (normalizedSheet.startsWith('communit') && normalizedSheet.includes('day')) return 'community_day'
  if (normalizedSheet.startsWith('communit')) return 'community'
  if (normalizedSheet.startsWith('team') && normalizedSheet.includes('day')) return 'team_day'
  if (normalizedSheet.startsWith('team')) return 'team'
  if (normalizedSheet.startsWith('baseline')) return 'baseline'
  if (normalizedSheet.startsWith('demand') || normalizedSheet.startsWith('need')) return 'demand'
  if (normalizedSheet.startsWith('travel') || normalizedSheet.startsWith('route')) return 'travel'
  if (normalizedSheet.startsWith('setting') || normalizedSheet.startsWith('config')) return 'settings'
  return ''
}

function required(value: unknown, label: string): string {
  const result = clean(value)
  if (!result) throw new Error(`${label} is required.`)
  return result
}

function validateDay(day: string, days: string[], label: string) {
  if (!days.includes(day)) throw new Error(`${label} references day "${day}" outside planning_period.days.`)
}

function nullableDestination(value: unknown): string | null {
  const normalized = clean(value)
  if (!normalized || ['none', 'null', 'unassigned', '-'].includes(normalized.toLowerCase())) return null
  return normalized
}

function buildInput(sheets: SheetRows[], fileName: string): ResourceAllocationInput {
  rejectPiiColumns(sheets)

  const rowsByType = new Map<string, Row[]>()
  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      const type = rowType(sheet.sheet, row)
      if (!type) throw new Error(`Unable to determine record_type in sheet "${sheet.sheet}".`)
      if (
        !['community', 'communities', 'demand', 'need', 'team', 'teams', 'team_day', 'community_day', 'travel', 'route', 'baseline', 'settings', 'config'].includes(
          type
        )
      )
        throw new Error(`Unsupported record_type "${type}".`)
      const normalized =
        type === 'communities'
          ? 'community'
          : type === 'need'
            ? 'demand'
            : type === 'teams'
              ? 'team'
              : type === 'route'
                ? 'travel'
                : type === 'config'
                  ? 'settings'
                  : type
      rowsByType.set(normalized, [...(rowsByType.get(normalized) ?? []), row])
    }
  }

  const settingsRows = rowsByType.get('settings') ?? []
  if (settingsRows.length > 1) throw new Error('Import supports one settings row.')
  const settings = settingsRows[0] ?? {}
  const parsedDays = list(settings.days)
  const days = parsedDays.length > 0 ? parsedDays : DEFAULT_DAYS
  if (days.length > 31) throw new Error('Planning period supports at most 31 days.')
  if (new Set(days).size !== days.length) throw new Error('planning_period.days must be unique.')

  const budget = parseNumber(settings.budget, 'settings.budget', { optional: true, min: 0 })
  const targetPriorityCoverage = parseNumber(settings.target_priority_coverage, 'settings.target_priority_coverage', {
    optional: true,
    min: 0,
    max: 1,
  })
  const planningUnit = clean(settings.planning_unit) || 'client-defined-demand-unit'

  const communities = new Map<string, ResourceAllocationCommunityInput>()
  for (const row of rowsByType.get('community') ?? []) {
    const id = required(row.id || row.community || row.name, 'community.id')
    if (communities.has(id)) throw new Error(`Duplicate community id: ${id}`)
    const maxTeams = parseNumber(row.max_teams, `community ${id}.max_teams`, {
      optional: true,
      min: 0,
      integer: true,
    })
    communities.set(id, {
      id,
      accessible: parseBoolean(row.accessible, `community ${id}.accessible`, true),
      max_teams: maxTeams ?? 30,
      demand: [],
      allowed_programs: list(row.allowed_programs).length ? list(row.allowed_programs) : undefined,
    })
  }
  if (communities.size === 0) throw new Error('Import requires at least one community.')

  const teams: ResourceAllocationTeamInput[] = []
  const teamsById = new Map<string, ResourceAllocationTeamInput>()
  for (const row of rowsByType.get('team') ?? []) {
    const id = required(row.id || row.team || row.name, 'team.id')
    if (teamsById.has(id)) throw new Error(`Duplicate team id: ${id}`)
    const skills = list(row.skills || row.services)
    if (skills.length === 0) throw new Error(`Team ${id} requires at least one skill.`)
    const team: ResourceAllocationTeamInput = {
      id,
      current_community: clean(row.current_community || row.community || row.location) || null,
      skills,
      capacity: parseNumber(row.capacity, `team ${id}.capacity`, { min: 0 }) as number,
      allowed_communities: list(row.allowed_communities).length ? list(row.allowed_communities) : undefined,
      max_daily_capacity: parseNumber(row.max_daily_capacity, `team ${id}.max_daily_capacity`, {
        optional: true,
        min: 0,
      }),
      max_travel_cost: parseNumber(row.max_travel_cost, `team ${id}.max_travel_cost`, {
        optional: true,
        min: 0,
      }),
      max_travel_minutes: parseNumber(row.max_travel_minutes, `team ${id}.max_travel_minutes`, {
        optional: true,
        min: 0,
      }),
      cost_per_capacity:
        parseNumber(row.cost_per_capacity, `team ${id}.cost_per_capacity`, { optional: true, min: 0 }) ?? 0,
      programs: list(row.programs),
    }
    teams.push(team)
    teamsById.set(id, team)
  }
  if (teams.length === 0) throw new Error('Import requires at least one team.')

  const knownCommunities = new Set(communities.keys())
  for (const team of teams) {
    if (team.current_community && !knownCommunities.has(team.current_community))
      throw new Error(`Team ${team.id} references unknown community: ${team.current_community}`)
    for (const community of team.allowed_communities ?? [])
      if (!knownCommunities.has(community))
        throw new Error(`Team ${team.id} allowed_communities references unknown community: ${community}`)
  }

  for (const row of rowsByType.get('community_day') ?? []) {
    const communityId = required(row.id || row.community || row.community_id, 'community_day.community')
    const target = communities.get(communityId)
    if (!target) throw new Error(`community_day references unknown community: ${communityId}`)
    const day = required(row.day, `community_day ${communityId}.day`)
    validateDay(day, days, `community_day ${communityId}`)
    target.accessibility = {
      ...(target.accessibility ?? {}),
      [day]: parseBoolean(row.accessible, `community_day ${communityId} ${day}.accessible`),
    }
  }

  for (const row of rowsByType.get('demand') ?? []) {
    const communityId = required(row.community || row.community_id || row.location, 'demand.community')
    const target = communities.get(communityId)
    if (!target) throw new Error(`Demand references unknown community: ${communityId}`)
    const service = required(row.service, `demand in ${communityId}.service`)
    const item = {
      service,
      units: parseNumber(row.units, `demand ${communityId}/${service}.units`, { min: 0 }) as number,
      priority: parsePriority(row.priority, `demand ${communityId}/${service}.priority`),
      program: clean(row.program) || undefined,
    }
    const day = clean(row.day)
    if (day) {
      validateDay(day, days, `demand ${communityId}/${service}`)
      target.daily_demand = { ...(target.daily_demand ?? {}) }
      target.daily_demand[day] = [...(target.daily_demand[day] ?? []), item]
    } else {
      target.demand.push(item)
    }
  }

  for (const row of rowsByType.get('team_day') ?? []) {
    const teamId = required(row.id || row.team || row.team_id, 'team_day.team')
    const team = teamsById.get(teamId)
    if (!team) throw new Error(`team_day references unknown team: ${teamId}`)
    const day = required(row.day, `team_day ${teamId}.day`)
    validateDay(day, days, `team_day ${teamId}`)
    const hasAvailability = Boolean(clean(row.available))
    const hasCapacity = Boolean(clean(row.capacity))
    if (!hasAvailability && !hasCapacity)
      throw new Error(`team_day ${teamId}/${day} requires available and/or capacity.`)
    if (hasAvailability)
      team.availability = {
        ...(team.availability ?? {}),
        [day]: parseBoolean(row.available, `team_day ${teamId}/${day}.available`),
      }
    if (hasCapacity)
      team.daily_capacity = {
        ...(team.daily_capacity ?? {}),
        [day]: parseNumber(row.capacity, `team_day ${teamId}/${day}.capacity`, { min: 0 }) as number,
      }
  }

  const travel: ResourceAllocationTravelEdgeInput[] = []
  for (const row of rowsByType.get('travel') ?? []) {
    const from = required(row.from, 'travel.from')
    const to = required(row.to, 'travel.to')
    if (!knownCommunities.has(from) || !knownCommunities.has(to))
      throw new Error(`Travel edge references unknown community: ${from} → ${to}`)
    travel.push({
      from,
      to,
      cost: parseNumber(row.cost, `travel ${from}→${to}.cost`, { optional: true, min: 0 }) ?? 0,
      minutes: parseNumber(row.minutes, `travel ${from}→${to}.minutes`, { optional: true, min: 0 }),
    })
  }

  let baselinePlan: Record<string, Record<string, string | null>> | undefined
  const baselineRows = rowsByType.get('baseline') ?? []
  if (baselineRows.length > 0) {
    baselinePlan = Object.fromEntries(days.map((day) => [day, {}]))
    for (const row of baselineRows) {
      const day = required(row.day, 'baseline.day')
      validateDay(day, days, 'baseline')
      const teamId = required(row.team || row.team_id || row.id, `baseline ${day}.team`)
      if (!teamsById.has(teamId)) throw new Error(`Baseline references unknown team: ${teamId}`)
      if (Object.prototype.hasOwnProperty.call(baselinePlan[day], teamId))
        throw new Error(`Duplicate baseline assignment for ${day}/${teamId}.`)
      const destination = nullableDestination(row.community || row.destination || row.location)
      if (destination && !knownCommunities.has(destination))
        throw new Error(`Baseline references unknown community: ${destination}`)
      baselinePlan[day][teamId] = destination
    }
    const missing = days.flatMap((day) =>
      teams.filter((team) => !Object.prototype.hasOwnProperty.call(baselinePlan?.[day] ?? {}, team.id)).map(
        (team) => `${day}/${team.id}`
      )
    )
    if (missing.length > 0)
      throw new Error(
        `Baseline plan must contain every team for every planning day. Missing: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}`
      )
  }

  const currentAllocation = Object.fromEntries(teams.map((team) => [team.id, team.current_community ?? null]))
  const safeFileName = sanitizeSourceFileName(fileName)

  return {
    operation: 'optimize',
    planning_period: { days },
    communities: [...communities.values()],
    teams,
    travel_edges: travel,
    current_allocation: currentAllocation,
    baseline_plan: baselinePlan,
    budget,
    target_priority_coverage: targetPriorityCoverage ?? 0.9,
    provenance: {
      source: `client-import:${safeFileName}`,
      imported_at: new Date().toISOString(),
      mapping_version: 'resource-allocation-import/2',
      planning_unit: planningUnit,
    },
  }
}

export type ResourceAllocationImportSummary = {
  days: number
  communities: number
  teams: number
  openingDemand: number
  scheduledDemand: number
  horizonDemand: number
  baselineProvided: boolean
  dailyDemandDays: number
  availabilityRules: number
}

export function summarizeResourceAllocationImport(input: ResourceAllocationInput): ResourceAllocationImportSummary {
  const openingDemand = input.communities.reduce(
    (sum, community) => sum + community.demand.reduce((total, demand) => total + demand.units, 0),
    0
  )
  const scheduledDemand = input.communities.reduce(
    (sum, community) =>
      sum +
      Object.values(community.daily_demand ?? {}).reduce(
        (daySum, demands) => daySum + demands.reduce((total, demand) => total + demand.units, 0),
        0
      ),
    0
  )
  const dailyDemandDays = new Set(
    input.communities.flatMap((community) =>
      Object.entries(community.daily_demand ?? {})
        .filter(([, demands]) => demands.length > 0)
        .map(([day]) => day)
    )
  ).size
  const availabilityRules =
    input.communities.reduce((sum, community) => sum + Object.keys(community.accessibility ?? {}).length, 0) +
    input.teams.reduce(
      (sum, team) => sum + Object.keys(team.availability ?? {}).length + Object.keys(team.daily_capacity ?? {}).length,
      0
    )

  return {
    days: input.planning_period?.days.length ?? 0,
    communities: input.communities.length,
    teams: input.teams.length,
    openingDemand,
    scheduledDemand,
    horizonDemand: openingDemand + scheduledDemand,
    baselineProvided: Boolean(input.baseline_plan),
    dailyDemandDays,
    availabilityRules,
  }
}

export async function importResourceAllocationFile(file: File): Promise<ResourceAllocationInput> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'csv') return buildInput([{ sheet: 'data', rows: parseCsv(await file.text()) }], file.name)
  if (extension === 'xml') return buildInput(parseXml(await file.text()), file.name)
  if (extension === 'xlsx') return buildInput(await parseXlsx(await file.arrayBuffer()), file.name)
  throw new Error('Supported formats: CSV, XML and XLSX.')
}

export const RESOURCE_ALLOCATION_IMPORT_COLUMN_LIST = [
  'record_type',
  'id',
  'day',
  'community',
  'service',
  'units',
  'priority',
  'program',
  'current_community',
  'skills',
  'capacity',
  'available',
  'accessible',
  'max_teams',
  'allowed_communities',
  'allowed_programs',
  'programs',
  'max_daily_capacity',
  'max_travel_cost',
  'max_travel_minutes',
  'cost_per_capacity',
  'from',
  'to',
  'cost',
  'minutes',
  'days',
  'budget',
  'target_priority_coverage',
  'planning_unit',
  'team',
] as const

export const RESOURCE_ALLOCATION_IMPORT_COLUMNS = RESOURCE_ALLOCATION_IMPORT_COLUMN_LIST.join(',')

type ResourceAllocationImportColumn = (typeof RESOURCE_ALLOCATION_IMPORT_COLUMN_LIST)[number]
type ResourceAllocationCsvRow = Partial<
  Record<ResourceAllocationImportColumn, string | number | boolean | null>
>

function csvCell(value: unknown): string {
  const raw = value == null ? '' : String(value)
  return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw
}

function buildImportCsv(rows: ResourceAllocationCsvRow[]): string {
  return (
    '\uFEFF' +
    [
      RESOURCE_ALLOCATION_IMPORT_COLUMNS,
      ...rows.map((row) =>
        RESOURCE_ALLOCATION_IMPORT_COLUMN_LIST.map((column) => csvCell(row[column])).join(',')
      ),
    ].join('\n')
  )
}

/**
 * Minimal valid, directly importable CSV. Clients can replace the sample values
 * while retaining the canonical Resource Allocation import contract.
 */
export function buildResourceAllocationTemplateCsv(): string {
  return buildImportCsv([
    {
      record_type: 'settings',
      days: 'Mon|Tue',
      target_priority_coverage: 0.9,
      planning_unit: 'service-visit',
    },
    { record_type: 'community', community: 'Location A', accessible: true, max_teams: 2 },
    { record_type: 'community', community: 'Location B', accessible: true, max_teams: 2 },
    {
      record_type: 'demand',
      community: 'Location A',
      service: 'psychosocial',
      units: 10,
      priority: 'critical',
    },
    {
      record_type: 'demand',
      community: 'Location B',
      service: 'legal',
      units: 8,
      priority: 'high',
    },
    {
      record_type: 'team',
      id: 'Team A',
      current_community: 'Location A',
      skills: 'psychosocial|legal',
      capacity: 8,
      max_travel_minutes: 120,
    },
    {
      record_type: 'team',
      id: 'Team B',
      current_community: 'Location B',
      skills: 'legal',
      capacity: 7,
      max_travel_minutes: 120,
    },
    { record_type: 'travel', from: 'Location A', to: 'Location B', cost: 4, minutes: 35 },
    { record_type: 'travel', from: 'Location B', to: 'Location A', cost: 4, minutes: 35 },
    { record_type: 'baseline', day: 'Mon', team: 'Team A', community: 'Location A' },
    { record_type: 'baseline', day: 'Mon', team: 'Team B', community: 'Location B' },
    { record_type: 'baseline', day: 'Tue', team: 'Team A', community: 'Location A' },
    { record_type: 'baseline', day: 'Tue', team: 'Team B', community: 'Location B' },
  ])
}

/**
 * Fictional five-day dataset intentionally unrelated to the default Responsible
 * Citizens profile. It exercises daily demand, availability, accessibility,
 * travel constraints and a complete baseline so a prospect can edit and re-upload it.
 */
export function buildResourceAllocationExampleCsv(): string {
  const rows: ResourceAllocationCsvRow[] = [
    {
      record_type: 'settings',
      days: 'Mon|Tue|Wed|Thu|Fri',
      budget: 360,
      target_priority_coverage: 0.9,
      planning_unit: 'service-session',
    },
    { record_type: 'community', community: 'North Hub', accessible: true, max_teams: 2 },
    { record_type: 'community', community: 'East Outreach', accessible: true, max_teams: 2 },
    { record_type: 'community', community: 'Central Centre', accessible: true, max_teams: 3 },
    { record_type: 'community', community: 'West Point', accessible: true, max_teams: 2 },
    {
      record_type: 'community_day',
      community: 'West Point',
      day: 'Thu',
      accessible: false,
    },
    {
      record_type: 'demand',
      community: 'North Hub',
      service: 'psychosocial',
      units: 34,
      priority: 'critical',
    },
    {
      record_type: 'demand',
      community: 'North Hub',
      service: 'legal',
      units: 16,
      priority: 'high',
    },
    {
      record_type: 'demand',
      community: 'East Outreach',
      service: 'legal',
      units: 28,
      priority: 'critical',
    },
    {
      record_type: 'demand',
      community: 'East Outreach',
      service: 'case-management',
      units: 22,
      priority: 'high',
    },
    {
      record_type: 'demand',
      community: 'Central Centre',
      service: 'case-management',
      units: 24,
      priority: 'normal',
    },
    {
      record_type: 'demand',
      community: 'West Point',
      service: 'child-support',
      units: 26,
      priority: 'high',
    },
    {
      record_type: 'demand',
      day: 'Wed',
      community: 'North Hub',
      service: 'psychosocial',
      units: 9,
      priority: 'critical',
    },
    {
      record_type: 'demand',
      day: 'Fri',
      community: 'East Outreach',
      service: 'legal',
      units: 7,
      priority: 'high',
    },
    {
      record_type: 'team',
      id: 'Field Team Alpha',
      current_community: 'Central Centre',
      skills: 'psychosocial|case-management',
      capacity: 16,
      max_travel_minutes: 160,
      cost_per_capacity: 0.5,
    },
    {
      record_type: 'team',
      id: 'Field Team Beta',
      current_community: 'North Hub',
      skills: 'legal|case-management',
      capacity: 15,
      max_travel_minutes: 160,
      cost_per_capacity: 0.5,
    },
    {
      record_type: 'team',
      id: 'Field Team Gamma',
      current_community: 'West Point',
      skills: 'child-support|psychosocial',
      capacity: 14,
      max_travel_minutes: 180,
      cost_per_capacity: 0.45,
    },
    {
      record_type: 'team',
      id: 'Field Team Delta',
      current_community: 'East Outreach',
      skills: 'legal|child-support',
      capacity: 15,
      max_travel_minutes: 180,
      cost_per_capacity: 0.55,
    },
    {
      record_type: 'team_day',
      id: 'Field Team Delta',
      day: 'Fri',
      available: false,
      capacity: 0,
    },
    { record_type: 'travel', from: 'Central Centre', to: 'North Hub', cost: 7, minutes: 70 },
    { record_type: 'travel', from: 'North Hub', to: 'Central Centre', cost: 7, minutes: 70 },
    { record_type: 'travel', from: 'Central Centre', to: 'East Outreach', cost: 6, minutes: 60 },
    { record_type: 'travel', from: 'East Outreach', to: 'Central Centre', cost: 6, minutes: 60 },
    { record_type: 'travel', from: 'Central Centre', to: 'West Point', cost: 5, minutes: 50 },
    { record_type: 'travel', from: 'West Point', to: 'Central Centre', cost: 5, minutes: 50 },
    { record_type: 'travel', from: 'North Hub', to: 'East Outreach', cost: 8, minutes: 85 },
    { record_type: 'travel', from: 'East Outreach', to: 'North Hub', cost: 8, minutes: 85 },
    { record_type: 'travel', from: 'North Hub', to: 'West Point', cost: 10, minutes: 110 },
    { record_type: 'travel', from: 'West Point', to: 'North Hub', cost: 10, minutes: 110 },
    { record_type: 'travel', from: 'East Outreach', to: 'West Point', cost: 9, minutes: 100 },
    { record_type: 'travel', from: 'West Point', to: 'East Outreach', cost: 9, minutes: 100 },
  ]

  const baseline: Record<string, Record<string, string | null>> = {
    Mon: {
      'Field Team Alpha': 'Central Centre',
      'Field Team Beta': 'North Hub',
      'Field Team Gamma': 'West Point',
      'Field Team Delta': 'East Outreach',
    },
    Tue: {
      'Field Team Alpha': 'North Hub',
      'Field Team Beta': 'East Outreach',
      'Field Team Gamma': 'West Point',
      'Field Team Delta': 'East Outreach',
    },
    Wed: {
      'Field Team Alpha': 'North Hub',
      'Field Team Beta': 'East Outreach',
      'Field Team Gamma': 'West Point',
      'Field Team Delta': 'Central Centre',
    },
    Thu: {
      'Field Team Alpha': 'North Hub',
      'Field Team Beta': 'East Outreach',
      'Field Team Gamma': 'Central Centre',
      'Field Team Delta': 'Central Centre',
    },
    Fri: {
      'Field Team Alpha': 'North Hub',
      'Field Team Beta': 'East Outreach',
      'Field Team Gamma': 'West Point',
      'Field Team Delta': null,
    },
  }

  for (const [day, assignments] of Object.entries(baseline)) {
    for (const [team, community] of Object.entries(assignments)) {
      rows.push({ record_type: 'baseline', day, team, community })
    }
  }

  return buildImportCsv(rows)
}
