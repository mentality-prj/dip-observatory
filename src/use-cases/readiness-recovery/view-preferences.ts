/**
 * Presentation-only, bounded UX preferences. NEVER persist scenario, tenant, execution,
 * source data, metrics, policy, credentials or private decision artifacts in localStorage.
 */
export const RR_VIEW_PREFERENCE_KEY='qdip.observatory.rr.view.v1'
export type RRViewTemplate='BUSINESS'|'ANALYST'|'COMPACT'
export type RRWidget='DECISION_SUMMARY'|'ALTERNATIVES'|'EVIDENCE'|'BASELINES'|'DIAGNOSTICS'

export const RR_WIDGET_CATALOG: readonly RRWidget[] = [
  'DECISION_SUMMARY','ALTERNATIVES','EVIDENCE','BASELINES','DIAGNOSTICS',
]
export type RRViewPreferences={
  version:1
  template:RRViewTemplate
  widgets:RRWidget[]
  density:'COMFORTABLE'|'COMPACT'
}

const TEMPLATES:Record<RRViewTemplate,RRViewPreferences>={
  BUSINESS:{version:1,template:'BUSINESS',density:'COMFORTABLE',widgets:['DECISION_SUMMARY','ALTERNATIVES','BASELINES']},
  ANALYST:{version:1,template:'ANALYST',density:'COMFORTABLE',widgets:[...RR_WIDGET_CATALOG]},
  COMPACT:{version:1,template:'COMPACT',density:'COMPACT',widgets:['DECISION_SUMMARY','ALTERNATIVES']},
}
export function templatePreferences(name:RRViewTemplate):RRViewPreferences{
  const src=TEMPLATES[name]
  return {...src,widgets:[...src.widgets]}
}
export function parseRRViewPreferences(value:unknown):RRViewPreferences{
  if (!value || typeof value !== 'object' || Array.isArray(value)) return templatePreferences('BUSINESS')
  const raw=value as Record<string,unknown>
  // Reject unknown extra fields rather than silently retaining private payload.
  if(Object.keys(raw).some(key=>!['version','template','widgets','density'].includes(key))) return templatePreferences('BUSINESS')
  if(raw.version!==1||!['BUSINESS','ANALYST','COMPACT'].includes(String(raw.template)) ||
      !['COMFORTABLE','COMPACT'].includes(String(raw.density))||!Array.isArray(raw.widgets)){
    return templatePreferences('BUSINESS')
  }
  const widgets=raw.widgets
  if(widgets.length>RR_WIDGET_CATALOG.length || widgets.some(key=>!RR_WIDGET_CATALOG.includes(key as RRWidget))) {
    return templatePreferences('BUSINESS')
  }
  return {
    version:1,
    template:raw.template as RRViewTemplate,
    density:raw.density as RRViewPreferences['density'],
    widgets:RR_WIDGET_CATALOG.filter(widget=>widgets.includes(widget)),
  }
}
export function readRRViewPreferences(storage:Pick<Storage,'getItem'>):RRViewPreferences{
  try {
    const value=storage.getItem(RR_VIEW_PREFERENCE_KEY)
    return value?parseRRViewPreferences(JSON.parse(value) as unknown):templatePreferences('BUSINESS')
  }catch{return templatePreferences('BUSINESS')}
}
export function saveRRViewPreferences(storage:Pick<Storage,'setItem'>,value:RRViewPreferences):boolean{
  try {
    // Canonicalize before storing; unknown fields (including IDs) are discarded.
    const safe=parseRRViewPreferences(value)
    storage.setItem(RR_VIEW_PREFERENCE_KEY,JSON.stringify(safe))
    return true
  }catch{return false}
}
export function toggleRRWidget(view:RRViewPreferences,widget:RRWidget):RRViewPreferences{
  const widgets=new Set(view.widgets)
  if(widgets.has(widget))widgets.delete(widget)
  else widgets.add(widget)
  return {...view,widgets:RR_WIDGET_CATALOG.filter(item=>widgets.has(item))}
}
