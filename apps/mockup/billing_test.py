"""Billing tab tally check. node apps/mockup/build.mjs && python apps/mockup/billing_test.py
Loads the sample data and checks that every figure on a job's Billing tab adds up, before and after charges change."""
import sys, pathlib
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8")
APP = (pathlib.Path(__file__).resolve().parent/"index.html").as_uri()
CHECK = """() => {
  const out = [];
  for(const j of JOBS){
    if(!readinessApplies(j)) continue;
    const ch = chargesOf(j), total = sumOf(ch, c=>c.amount), cents = x=>Math.round(x*100);
    const svc = sumOf(ch.filter(c=>c.kind===CHARGE_KINDS[0]), c=>c.amount), pass = sumOf(ch.filter(c=>c.kind===CHARGE_KINDS[1]), c=>c.amount);
    if(cents(svc+pass)!==cents(total)) out.push(j.id+': service + pass-through != total');
    const ids = ch.map(c=>c.id); if(new Set(ids).size!==ids.length) out.push(j.id+': duplicate charge ids');
    const fundIds = ch.filter(c=>c.fundId).map(c=>c.fundId); if(new Set(fundIds).size!==fundIds.length) out.push(j.id+': a fund request is billed twice');
    ch.filter(c=>c.fundId).forEach(c=>{ const f = j.funds.find(x=>x.id===c.fundId); if(!f || cents(c.amount)!==cents(f.liq.actual)) out.push(j.id+': '+c.fundId+' billed '+c.amount+' but receipts say '+(f&&f.liq&&f.liq.actual)); });
    const shown = document.createElement('div'); shown.innerHTML = jobBillingTab(j);
    
    const i = inqById(j.inquiryId), v = i && acceptedVersion(i);
    if(v){ const vals = [...shown.querySelectorAll('#charges .ds-stat__value')].map(e=>e.textContent); if(vals[4]!==money(total-toPHP(v))) out.push(j.id+': difference '+vals[4]+' != charges - quote');
    if(vals[0]!==money(svc) || vals[1]!==money(pass)) out.push(j.id+': subtotals '+vals[0]+' / '+vals[1]+' != '+money(svc)+' / '+money(pass));
    if(vals[2]!==money(total)) out.push(j.id+': charges listed '+vals[2]+' != '+money(total)); }
  }
  return out;
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(); p = b.new_page(); errs = []; p.on("pageerror", lambda e: errs.append(str(e))); p.goto(APP)
    p.evaluate("signInAs('Grace Tan','#/home')"); p.evaluate("loadSampleData()")
    bad = p.evaluate(CHECK)
    # change charges the way the UI does, then re-check
    p.evaluate("""() => { const j = JOBS.find(j=>j.id===JOBS[3].id); j.handover = null;
      chargesOf(j).push({ id:nextId('party'), desc:'Odd cents', amount:0.1, kind:CHARGE_KINDS[0], by:'x', on:todayDMY() }, { id:nextId('party'), desc:'Odd cents 2', amount:0.2, kind:CHARGE_KINDS[1], by:'x', on:todayDMY() });
      removeCharge(j.id, chargesOf(j)[0].id); addChargesFromFunds(j.id); }""")
    bad += p.evaluate(CHECK)
    # full money flow on a job: excess, shortfall and vendor-paid requests -> receipts -> closed -> billed at cost
    flow = p.evaluate("""() => {
      const keep = CURRENT_USER, as = (n, fn)=>{ CURRENT_USER = userByName(n); try { return fn(); } finally { CURRENT_USER = keep; } };
      const j = JOBS[3], mk = (amount, actual, how)=>{ const f = { id:nextId('fr'), by:'Rico Domingo', on:todayDMY(), purpose:'Trucking', amount, payee:'Trucker', neededBy:todayDMY(), source:'Company funds', how, support:null, status:'Approved', review:{ by:'Grace Tan', on:todayDMY(), decision:'Approved' } }; j.funds.push(f);
        as('Paolo Reyes', ()=>{ f.status = 'Released'; f.release = { by:'Paolo Reyes', on:todayDMY(), mode:'Cash', ref:'', proof:'v.pdf' }; });
        as('Rico Domingo', ()=>submitReceipts(j, f, actual, 'r.pdf')); as('Paolo Reyes', ()=>{ f.status = 'Verified'; f.verify = { by:'Paolo Reyes', on:todayDMY() }; }); return f; };
      j.handover = null; const fs = [mk(10000, 9500.55, 'cash'), mk(10000, 10800.25, 'cash'), mk(7000, 7000, 'vendor')];
      as('Grace Tan', ()=>{ addChargesFromFunds(j.id); chargesOf(j).push({ id:nextId('party'), desc:'Fee', amount:1234.56, kind:CHARGE_KINDS[0], by:'x', on:todayDMY() }); });
      const billed = fs.map(f=>chargesOf(j).filter(c=>c.fundId===f.id).map(c=>c.amount));
      const v = acceptedVersion(inqById(j.inquiryId)); v.currency = 'USD'; v.amount = 1000;
      return billed; }""")
    for want, got in zip([[9500.55], [10800.25], [7000]], flow):
        if got != want: bad.append(f"fund billed {got}, receipts say {want}")
    bad += p.evaluate(CHECK) + errs
    b.close()
print("\n".join(bad) or "billing tally: OK"); sys.exit(1 if bad else 0)
