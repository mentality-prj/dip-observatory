import type {Locale} from '@/lib/observatory-i18n'

type JsonObject = Record<string,unknown>
const obj=(x:unknown):JsonObject|null=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as JsonObject:null
const field=(o:JsonObject|null,k:string)=>o?.[k]
const str=(x:unknown)=>typeof x==='string'&&x.trim()?x:null
const copy={
 en:{title:'Kernel evidence',state:'Status',execution:'Execution',decision:'Decision',source:'Source snapshot',revision:'Revision',authority:'Authority',verified:'Backend-authoritative',unverified:'Not independently verified',action:'Execution eligibility',eligible:'Backend reports actionable',blocked:'Not actionable: inspect Kernel result',jobs:'Scheduled jobs',donors:'Donors',unknown:'Not recorded',warning:'This display does not issue repair orders; an actionable flag is not permission to execute real-world work.'},
 uk:{title:'Докази Kernel',state:'Статус',execution:'Виконання',decision:'Рішення',source:'Snapshot джерела',revision:'Ревізія',authority:'Джерело повноважень',verified:'Підтверджено бекендом Kernel',unverified:'Незалежно не перевірено',action:'Дозвіл до застосування',eligible:'Kernel повідомляє про виконуваність',blocked:'Не дозволено до виконання — перевірте результат',jobs:'Заплановані роботи',donors:'Донори',unknown:'Немає даних',warning:'Цей інтерфейс не видає ремонтних наказів. Ознака actionable не означає дозвіл на реальні операції.'},
 pl:{title:'Dowody Kernel',state:'Status',execution:'Wykonanie',decision:'Decyzja',source:'Migawka źródła',revision:'Rewizja',authority:'Autorytet',verified:'Potwierdzone przez backend Kernel',unverified:'Niezweryfikowane niezależnie',action:'Możliwość wykonania',eligible:'Backend zgłasza wykonalność',blocked:'Nie można wykonać: sprawdź wynik Kernel',jobs:'Zaplanowane zadania',donors:'Dawcy',unknown:'Nie zapisano',warning:'Interfejs nie zleca napraw. Flaga actionable nie oznacza uprawnienia do realnych działań.'}
} as const

export type KernelEvidence={
 executionId:string|null;decisionId:string|null;kind:string|null;sourceSnapshot:string|null;
 revision:string|null;authoritative:boolean;actionable:boolean;jobs:Array<{id:string;technician:string;start:number;finish:number}>;donors:string[]
}
export function kernelEvidenceFromRecord(input:unknown):KernelEvidence {
 const top=obj(input),result=obj(field(top,'result')),workflow=obj(field(result,'workflow'))
 const ingestion=obj(field(workflow,'ingestion'))
 const payload=obj(field(ingestion,'payload'))
 const source=obj(field(ingestion,'source'))??obj(field(workflow,'source'))
 const runtime=obj(field(result,'runtime')),outcome=obj(field(runtime,'operator_outcome'))
 const decision=obj(field(runtime,'decision'))
 const rawJobs=field(decision,'scheduled_jobs')
 const jobs=Array.isArray(rawJobs)?rawJobs.flatMap(j=>{
  const a=obj(j),id=str(field(a,'job_id')),technician=str(field(a,'technician_id'))
  const start=field(a,'start_slot'),finish=field(a,'finish_slot')
  if(!id||!technician||typeof start!=='number'||!Number.isFinite(start)||
     typeof finish!=='number'||!Number.isFinite(finish)||start<0||finish<start)return []
  return [{id,technician,start,finish}]
 }):[]
 const donors=field(outcome,'selected_donor_ids')
 const authoritative=field(outcome,'authoritative')===true
 return{
  executionId:str(field(workflow,'execution_id')),
  decisionId:str(field(payload,'decision_id')),
  kind:str(field(outcome,'kind')),
  sourceSnapshot:str(field(source,'snapshot_id')),
  revision:str(field(workflow,'revision'))??str(field(workflow,'revision_id')),
  authoritative,
  actionable:authoritative&&field(outcome,'actionable')===true,
  jobs,donors:Array.isArray(donors)?donors.filter((v):v is string=>typeof v==='string'):[],
 }
}
export function OperatorEvidence({locale,record}:{locale:Locale,record:unknown}){
 const t=copy[locale],e=kernelEvidenceFromRecord(record)
 const fields=[[t.execution,e.executionId],[t.decision,e.decisionId],[t.state,e.kind],[t.source,e.sourceSnapshot],
 [t.revision,e.revision],[t.authority,e.authoritative?t.verified:t.unverified],[t.action,e.actionable?t.eligible:t.blocked],
 [t.jobs,String(e.jobs.length)],[t.donors,e.donors.join(', ')||null]] as const
 return <section data-testid="rr-kernel-evidence" data-kernel-authoritative={String(e.authoritative)} data-actionable={String(e.actionable)}
   className="mt-3 border border-white/20 p-4">
   <h4 className="font-semibold">{t.title}</h4>
   <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
    {fields.map(([key,value])=><div key={key}><dt className="text-xs text-slate-400">{key}</dt><dd className="mt-1 break-words text-slate-100">{value??t.unknown}</dd></div>)}
   </dl>
   {e.actionable&&e.jobs.length>0?<ul className="mt-3 space-y-2">{e.jobs.map((j,i)=><li key={j.id+'-'+i} className="font-mono text-xs">{j.id} · {j.technician} · {j.start}–{j.finish}</li>)}</ul>:null}
   <p className="mt-4 text-xs text-amber-200">{t.warning}</p>
 </section>
}
