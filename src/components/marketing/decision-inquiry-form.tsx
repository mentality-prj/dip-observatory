"use client";
import { FormEvent,useRef,useState } from "react";
import type { MarketingLocale } from "./qdip-copy";
import styles from "./qdip-site.module.css";

const text={
 en:{fields:["Name","Organization","Email","What decision does your team make repeatedly?","What information is used?","What alternatives are usually considered?","What constraints matter?","Additional context"],submit:"Describe your decision",submitting:"Sending…",success:"Thank you. Your decision has been submitted.",successDetail:"We’ll review whether it is a good fit for QDIP.",error:"We couldn’t send your request. Please try again."},
 uk:{fields:["Ім’я","Організація","Email","Яке рішення ваша команда приймає регулярно?","Яку інформацію ви використовуєте?","Які альтернативи зазвичай розглядаєте?","Які обмеження мають значення?","Додатковий контекст"],submit:"Опишіть ваше рішення",submitting:"Надсилання…",success:"Дякуємо. Ваше рішення надіслано.",successDetail:"Ми перевіримо, чи підходить воно для QDIP.",error:"Не вдалося надіслати запит. Спробуйте ще раз."},
 pl:{fields:["Imię i nazwisko","Organizacja","Email","Jaką decyzję Twój zespół podejmuje regularnie?","Jakich informacji używacie?","Jakie alternatywy zwykle rozważacie?","Jakie ograniczenia mają znaczenie?","Dodatkowy kontekst"],submit:"Opisz swoją decyzję",submitting:"Wysyłanie…",success:"Dziękujemy. Twoja decyzja została przesłana.",successDetail:"Sprawdzimy, czy jest odpowiednim przypadkiem dla QDIP.",error:"Nie udało się wysłać zgłoszenia. Spróbuj ponownie."}
} as const;

type AnalyticsEvent="decision_form_started"|"decision_form_submit"|"decision_form_success"|"decision_form_error";
function track(event:AnalyticsEvent,locale:MarketingLocale){if(typeof window==="undefined")return;const w=window as Window&{dataLayer?:Array<Record<string,string>>};w.dataLayer?.push({event,locale})}

export function DecisionInquiryForm({locale}:{locale:MarketingLocale}){
 const c=text[locale],started=useRef(false),[state,setState]=useState<"idle"|"submitting"|"success"|"error">("idle");
 function onFocus(){if(!started.current){started.current=true;track("decision_form_started",locale)}}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(state==="submitting")return;const form=event.currentTarget;setState("submitting");track("decision_form_submit",locale);const fd=new FormData(form);const payload={name:fd.get("name"),organization:fd.get("organization"),email:fd.get("email"),decision:fd.get("decision"),information:fd.get("information"),alternatives:fd.get("alternatives"),constraints:fd.get("constraints"),context:fd.get("context"),website:fd.get("website"),locale};try{const response=await fetch("/api/decision-inquiry",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});if(!response.ok)throw new Error("submit_failed");setState("success");track("decision_form_success",locale);form.reset()}catch{setState("error");track("decision_form_error",locale)}}
 if(state==="success")return <div className={styles.formStatus} role="status"><h3>{c.success}</h3><p>{c.successDetail}</p></div>;
 const names=["name","organization","email","decision","information","alternatives","constraints","context"] as const;
 return <form className={styles.valueGrid} onSubmit={submit} onFocus={onFocus} noValidate={false}>{names.map((name,i)=>{const required=i<4;const long=i>=3;return <label key={name}>{c.fields[i]}{long?<textarea name={name} required={required} maxLength={i===3?4000:i===7?4000:3000}/>:<input name={name} required={required} type={name==="email"?"email":"text"} maxLength={name==="email"?254:name==="organization"?160:120}/>}</label>})}<label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><button className={styles.primaryButtonLarge} type="submit" disabled={state==="submitting"} aria-disabled={state==="submitting"}>{state==="submitting"?c.submitting:c.submit}</button>{state==="error"&&<p className={styles.formError} role="alert">{c.error}</p>}</form>
}
