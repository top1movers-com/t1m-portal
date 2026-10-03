/* ============================== PDF DOWNLOADS ==============================
   Accounting can download a PDF for one fund request, one vendor bill, a job's bills, or a job's billing handover.
   The PDF is written here (no library): A4 pages, Helvetica, the Top1Movers logo, drawn with the portal's colours. */
const PDF = { W:595, H:842, M:50, TOP:96, BOTTOM:54 };
const PDF_C = { navy:'0.184 0.227 0.561', navyTint:'0.906 0.918 0.973', ink:'0.08 0.09 0.2', gray:'0.329 0.357 0.486', line:'0.84 0.85 0.91', red:'0.898 0.22 0.231', white:'1 1 1', zebra:'0.968 0.972 0.99',
  success:{ fg:'0.122 0.478 0.333', bg:'0.89 0.96 0.925' }, warning:{ fg:'0.66 0.4 0.02', bg:'0.99 0.945 0.86' }, danger:{ fg:'0.7 0.216 0.176', bg:'0.99 0.9 0.89' }, info:{ fg:'0.184 0.227 0.561', bg:'0.906 0.918 0.973' }, neutral:{ fg:'0.329 0.357 0.486', bg:'0.93 0.935 0.96' } };
PDF_C.brand = PDF_C.info;
let PDF_LOGO = null;
function pdfAscii(s){
  return String(s==null?'':s).replace(/₱/g,'PHP ').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[—–]/g,'-').replace(/…/g,'...').replace(/→/g,'->')
    .replace(/[^\x20-\x7E\xB7]/g, ch=>/\s/.test(ch)?' ':'?');
}
function pdfWidth(s, size, bold){
  let w = 0;
  for(const ch of s){ w += /[ilj.,:;'|!]/.test(ch) ? .27 : /[fFtrI()\[\]\-\/]/.test(ch) ? .34 : /[mwMW]/.test(ch) ? .8 : /[A-Z0-9]/.test(ch) ? .62 : .54; }
  return w*size*(bold?1.06:1);
}
function pdfWrap(text, width, size, bold){
  const lines = [];
  String(text==null?'':text).split('\n').forEach(par0=>{ const par = pdfAscii(par0);
    let cur = '';
    par.split(' ').forEach(word=>{
      const next = cur ? cur+' '+word : word;
      if(cur && pdfWidth(next, size, bold) > width){ lines.push(cur); cur = word; } else cur = next;
    });
    lines.push(cur);
  });
  return lines;
}
/* The logo is drawn once on a white canvas and stored as raw RGB, so the PDF needs no image decoder. */
function pdfLoadLogo(){
  if(PDF_LOGO) return Promise.resolve(PDF_LOGO);
  return new Promise(res=>{
    const img = new Image();
    img.onload = ()=>{
      const w = 560, h = Math.round(w*img.naturalHeight/img.naturalWidth), c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0,0,w,h); g.drawImage(img, 0, 0, w, h);
      const px = g.getImageData(0,0,w,h).data; let raw = '';
      for(let i=0;i<px.length;i+=4) raw += String.fromCharCode(px[i], px[i+1], px[i+2]);
      PDF_LOGO = { w, h, raw }; res(PDF_LOGO);
    };
    img.onerror = ()=>res(null); img.src = LOGO_SRC;
  });
}
function pdfDoc(kind){
  const pages = []; let ops, y;
  const newPage = ()=>{ ops = []; pages.push(ops); y = PDF.H - PDF.TOP; };
  const room = h=>{ if(y - h < PDF.BOTTOM) newPage(); };
  const esc = s=>s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  const text = (s, x, size, bold, rgb)=>ops.push(rgb+' rg BT /'+(bold?'F2':'F1')+' '+size+' Tf '+x.toFixed(1)+' '+y.toFixed(1)+' Td ('+esc(s)+') Tj ET');
  const rect = (x, yy, w, h, fill, stroke)=>ops.push((fill?fill+' rg ':'')+(stroke?stroke+' RG 0.6 w ':'')+x.toFixed(1)+' '+yy.toFixed(1)+' '+w.toFixed(1)+' '+h.toFixed(1)+' re '+(fill&&stroke?'B':fill?'f':'S'));
  const rrect = (x, yy, w, h, r, fill)=>{ const k = r*.5523; ops.push(fill+' rg '+(x+r)+' '+yy+' m '+(x+w-r)+' '+yy+' l '+(x+w-r+k)+' '+yy+' '+(x+w)+' '+(yy+r-k)+' '+(x+w)+' '+(yy+r)+' c '+(x+w)+' '+(yy+h-r)+' l '+(x+w)+' '+(yy+h-r+k)+' '+(x+w-r+k)+' '+(yy+h)+' '+(x+w-r)+' '+(yy+h)+' c '+(x+r)+' '+(yy+h)+' l '+(x+r-k)+' '+(yy+h)+' '+x+' '+(yy+h-r+k)+' '+x+' '+(yy+h-r)+' c '+x+' '+(yy+r)+' l '+x+' '+(yy+r-k)+' '+(x+r-k)+' '+yy+' '+(x+r)+' '+yy+' c f'); };
  const hline = (yy, rgb, w)=>ops.push(rgb+' RG '+(w||0.5)+' w '+PDF.M+' '+yy.toFixed(1)+' m '+(PDF.W-PDF.M)+' '+yy.toFixed(1)+' l S');
  const d = {
    /* big title, grey sub-line, optional status pill */
    title(s, sub, pillText, tone){
      room(70); text(pdfAscii(s), PDF.M, 22, true, PDF_C.navy); y -= 18;
      pdfWrap(sub||'', PDF.W-2*PDF.M, 10).forEach(l=>{ text(l, PDF.M, 10, false, PDF_C.gray); y -= 14; });
      if(pillText){ const t = pdfAscii(pillText).toUpperCase(), w = pdfWidth(t, 8, true)+20, c = PDF_C[tone||'neutral']; y -= 4; rrect(PDF.M, y-5, w, 17, 8.5, c.bg); text(t, PDF.M+10, 8, true, c.fg); y -= 22; }
      return d;
    },
    /* a large amount strip: label and value */
    amount(label, value, note){
      room(64); y -= 4; rect(PDF.M, y-48, PDF.W-2*PDF.M, 52, PDF_C.navyTint); rect(PDF.M, y-48, 4, 52, PDF_C.navy); y -= 12;
      text(pdfAscii(label).toUpperCase(), PDF.M+18, 8, true, PDF_C.gray); y -= 24; text(pdfAscii(value), PDF.M+18, 20, true, PDF_C.navy);
      if(note){ const n = pdfAscii(note); text(n, PDF.W-PDF.M-14-pdfWidth(n, 9, false), 9, false, PDF_C.gray); } y -= 22; return d;
    },
    heading(s){ room(46); y -= 16; rect(PDF.M, y-6, PDF.W-2*PDF.M, 20, PDF_C.navyTint); rect(PDF.M, y-6, 3, 20, PDF_C.red); text(pdfAscii(s).toUpperCase(), PDF.M+12, 9, true, PDF_C.navy); y -= 20; return d; },
    /* label / value rows in a bordered card; rows is [[label, value], ...] */
    card(rows){
      const LW = 140, PAD = 6, items = rows.map(([k,v])=>({ k:pdfAscii(k), lines:pdfWrap(v===''||v==null?'-':v, PDF.W-2*PDF.M-LW-24, 10, true) }));
      let i = 0;
      while(i < items.length){
        let h = 0, n = 0; const avail = y - PDF.BOTTOM;
        while(i+n < items.length && (n===0 || h + items[i+n].lines.length*13 + 2*PAD <= avail)){ h += items[i+n].lines.length*13 + 2*PAD; n++; }
        rect(PDF.M, y-h, PDF.W-2*PDF.M, h, PDF_C.white, PDF_C.line);
        for(let k=0;k<n;k++){ const it = items[i+k], rh = it.lines.length*13 + 2*PAD; y -= PAD + 9; const top = y; text(it.k, PDF.M+12, 9.5, false, PDF_C.gray); it.lines.forEach(l=>{ text(l, PDF.M+LW+12, 10, true, PDF_C.ink); y -= 13; }); y = top - rh + PAD + 9; if(k<n-1) hline(y, PDF_C.line, 0.4); }
        i += n; if(i < items.length) newPage();
      }
      y -= 6; return d;
    },
    para(s, rgb){ pdfWrap(s, PDF.W-2*PDF.M, 10).forEach(l=>{ room(14); text(l, PDF.M, 10, false, rgb||PDF_C.gray); y -= 14; }); y -= 4; return d; },
    /* table row; cols: [{ w, text, bold, right }]; opts: { head, shade, total } */
    row(cols, opts){
      opts = opts || {}; const size = opts.head ? 8 : 9.5, strong = opts.head || opts.total, cells = cols.map(c=>pdfWrap(opts.head?String(c.text).toUpperCase():c.text, c.w-12, size, c.bold||strong)), n = Math.max(...cells.map(c=>c.length)), h = n*13+8;
      room(h);
      if(opts.head) rect(PDF.M, y-h, PDF.W-2*PDF.M, h, PDF_C.navy);
      else if(opts.shade) rect(PDF.M, y-h, PDF.W-2*PDF.M, h, PDF_C.zebra);
      else if(opts.total) rect(PDF.M, y-h, PDF.W-2*PDF.M, h, PDF_C.navyTint);
      let x = PDF.M; const top = y - 13;
      cols.forEach((c,i)=>{ y = top; cells[i].forEach(l=>{ const b = c.bold||strong, lx = c.right ? x + c.w - 6 - pdfWidth(l, size, b) : x + 6; text(opts.head?l.toUpperCase():l, lx, size, b, opts.head?PDF_C.white:PDF_C.ink); y -= 13; }); x += c.w; });
      y = top + 13 - h; if(!opts.head && !opts.total) hline(y, PDF_C.line, 0.4); return d;
    },
    /* a checklist line: label, optional detail, and a Done / Missing tag */
    check(label, ok, sub){
      const lines = sub ? pdfWrap(sub, 330, 9) : [], h = 24 + lines.length*12; room(h+4);
      const c = ok ? PDF_C.success : PDF_C.warning, t = ok ? 'DONE' : 'MISSING', w = pdfWidth(t, 7.5, true)+16;
      rect(PDF.M, y-h, PDF.W-2*PDF.M, h, PDF_C.white, PDF_C.line); y -= 8;
      rrect(PDF.W-PDF.M-12-w, y-9, w, 15, 7.5, c.bg); rrect(PDF.M+11, y-6, 8, 8, 4, c.fg);
      y -= 5; text(pdfAscii(label), PDF.M+26, 10, true, PDF_C.ink); text(t, PDF.W-PDF.M-12-w+8, 7.5, true, c.fg); y -= 10;
      lines.forEach(l=>{ text(l, PDF.M+26, 9, false, PDF_C.gray); y -= 12; }); y -= h - 8 - 5 - 10 - lines.length*12 + 4; return d;
    },
    gap(n){ y -= n||8; return d; },
    async save(filename){
      const logo = await pdfLoadLogo(), total = pages.length, offs = [], when = pdfAscii(todayDMY()), by = pdfAscii(me());
      pages.forEach((p,i)=>{
        const head = [], put = s=>head.push(s), tx = (s, x, yy, size, bold, rgb)=>put(rgb+' rg BT /'+(bold?'F2':'F1')+' '+size+' Tf '+x.toFixed(1)+' '+yy+' Td ('+esc(s)+') Tj ET');
        if(logo){ const lw = 150, lh = lw*logo.h/logo.w; put('q '+lw+' 0 0 '+lh.toFixed(1)+' '+PDF.M+' '+(PDF.H-30-lh).toFixed(1)+' cm /Im1 Do Q'); }
        const lab = pdfAscii(kind||'').toUpperCase(); tx(lab, PDF.W-PDF.M-pdfWidth(lab, 8, true), PDF.H-44, 8, true, PDF_C.gray);
        put(PDF_C.red+' rg '+PDF.M+' '+(PDF.H-66)+' 56 3 re f'); put(PDF_C.line+' RG 0.6 w '+(PDF.M+56)+' '+(PDF.H-64.5)+' m '+(PDF.W-PDF.M)+' '+(PDF.H-64.5)+' l S');
        put(PDF_C.line+' RG 0.6 w '+PDF.M+' 46 m '+(PDF.W-PDF.M)+' 46 l S');
        tx('Top1Movers Worldwide Inc.  |  Generated by '+by+' on '+when, PDF.M, 32, 8, false, PDF_C.gray);
        tx('Mockup record. Not an invoice.', PDF.M, 22, 7.5, false, PDF_C.gray);
        const pg = 'Page '+(i+1)+' of '+total; tx(pg, PDF.W-PDF.M-pdfWidth(pg, 8, false), 32, 8, false, PDF_C.gray);
        p.unshift(head.join('\n'));
      });
      const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids ['+pages.map((_,i)=>(6+i*2)+' 0 R').join(' ')+'] /Count '+total+' >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        logo ? '<< /Type /XObject /Subtype /Image /Width '+logo.w+' /Height '+logo.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length '+logo.raw.length+' >>\nstream\n'+logo.raw+'\nendstream' : '<< >>'];
      pages.forEach((p,i)=>{ const c = p.join('\n'); objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+PDF.W+' '+PDF.H+'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>'+(logo?' /XObject << /Im1 5 0 R >>':'')+' >> /Contents '+(7+i*2)+' 0 R >>'); objs.push('<< /Length '+c.length+' >>\nstream\n'+c+'\nendstream'); });
      let body = '%PDF-1.4\n'; objs.forEach((o,i)=>{ offs.push(body.length); body += (i+1)+' 0 obj\n'+o+'\nendobj\n'; });
      const xref = body.length; body += 'xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n'+offs.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
      const bytes = new Uint8Array(body.length); for(let i=0;i<body.length;i++) bytes[i] = body.charCodeAt(i) & 255;
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type:'application/pdf' })); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    }
  };
  newPage(); return d;
}
const PDF_BILL_COLS = [{ w:160, k:'Vendor / for' }, { w:75, k:'Date' }, { w:55, k:'Request' }, { w:90, k:'File' }, { w:115, k:'Amount', right:true }];
function pdfBillRows(d, bills){
  d.row(PDF_BILL_COLS.map(c=>({ w:c.w, text:c.k, right:c.right })), { head:true });
  bills.forEach((b,i)=>d.row([b.vendor+(b.desc?' - '+b.desc:''), b.date, b.fundId||'-', b.file||'-', money(b.amount)].map((t,x)=>({ w:PDF_BILL_COLS[x].w, text:t, right:PDF_BILL_COLS[x].right, bold:x===0 })), { shade:i%2===1 }));
}
function pdfStamp(f){ return f.replace(/[^A-Za-z0-9._-]+/g,'-'); }
function downloadFundPdf(jobId, fid){
  const j = jobById(jobId), f = j.funds.find(x=>x.id===fid);
  if(!canView('money.view', j)) return denied();
  const tone = f.status==='Verified' ? 'success' : f.status==='Returned' || frLate(f) ? 'danger' : 'info';
  const d = pdfDoc('Fund request record').title('Fund request '+f.id, j.id+'  |  '+custById(j.customerId).name, frLabel(f), tone).amount('Amount requested', money(f.amount), f.purpose);
  const req = [['Purpose', f.purpose], ['Pay to', f.payee], ['How it is paid', FR_HOW[f.how||'cash']], ['Needed by', f.neededBy], ['Requested by', f.by+', '+f.on]];
  if(f.review) req.push([f.review.decision==='Approved'?'Approved by':'Returned by', f.review.by+', '+f.review.on+(f.review.comment&&f.review.decision!=='Approved'?'. '+f.review.comment:'')]);
  d.heading('Request').card(req).heading('Release');
  if(f.release) d.card([['Released by', f.release.by+', '+f.release.on], ['Mode', f.release.mode], ['Reference no.', f.release.ref||'-'], ['Proof file', f.release.proof||'-']]); else d.para('Not released yet.');
  d.heading('Receipts');
  if(f.liq){ const rows = [['Amount spent', money(f.liq.actual)], ['Released minus spent', money(f.amount-f.liq.actual)], ['Receipts file', f.liq.receipts||'-'], ['Submitted by', f.liq.by+', '+f.liq.on]]; if(f.liq.note) rows.push(['Note', f.liq.note]); rows.push(['Checked by Accounting', f.verify ? f.verify.by+', '+f.verify.on : 'Not yet confirmed']); d.card(rows); }
  else d.para('No receipts submitted yet.');
  const bills = j.vendorBills.filter(b=>b.fundId===f.id);
  if(bills.length){ d.heading('Vendor quotations and bills linked to this request'); pdfBillRows(d, bills); }
  d.heading('Who did what, in order');
  const W = [80, 110, 305];
  d.row(['Date','Who','What happened'].map((t,k)=>({ w:W[k], text:t })), { head:true });
  fundTrail(f).slice().reverse().forEach((t,i)=>d.row([t.ts, t.actor, t.action+': '+t.detail].map((x,k)=>({ w:W[k], text:x, bold:k===0 })), { shade:i%2===1 }));
  d.save(pdfStamp(f.id+'-'+j.id)+'.pdf');
}
function downloadBillPdf(jobId, billId){
  const j = jobById(jobId), b = j.vendorBills.find(x=>x.id===billId);
  if(!canView('money.view', j)) return denied();
  pdfDoc('Vendor quotation / bill').title('Vendor quotation / bill', j.id+'  |  '+custById(j.customerId).name).amount('Amount on the paper', money(b.amount), b.vendor)
    .heading('Details').card([['Vendor', b.vendor], ['For', b.desc], ['Date on the paper', b.date], ['File', b.file||'-'], ['Fund request', b.fundId||'Not linked to a request'], ['Recorded by', b.by]])
    .save(pdfStamp('Bill-'+b.vendor+'-'+j.id)+'.pdf');
}
function downloadBillsPdf(jobId){
  const j = jobById(jobId);
  if(!canView('money.view', j)) return denied();
  const total = sumOf(j.vendorBills, b=>b.amount), n = plural(j.vendorBills.length,'entry','entries');
  const d = pdfDoc('Vendor quotations and bills').title('Vendor quotations and bills', j.id+'  |  '+custById(j.customerId).name+'  |  '+n).amount('Total on the papers', money(total), n).heading('All entries');
  pdfBillRows(d, j.vendorBills);
  d.row([{ w:380, text:'Total' }, { w:115, text:money(total), right:true }], { total:true });
  d.save(pdfStamp('Bills-'+j.id)+'.pdf');
}
function downloadBillingPdf(jobId){
  const j = jobById(jobId), rs = readinessStatus(j);
  if(rs.key==='na') return denied('Billing readiness starts after delivery.');
  const items = readinessItems(j), ch = chargesOf(j), total = sumOf(ch, c=>c.amount), i = inqById(j.inquiryId), v = i ? acceptedVersion(i) : null, quoted = v ? toPHP(v) : null;
  const d = pdfDoc('Billing handover').title('Billing handover', j.id+'  |  '+custById(j.customerId).name, rs.label, rs.tone).amount('Charges to bill', money(total), plural(ch.length,'line'));
  d.heading('Handover checklist');
  items.forEach(it=>d.check(it.label, it.ok, it.sub));
  if(j.handover){ d.heading('Handover'); const rows = [['Marked ready by', j.handover.readyBy+', '+j.handover.readyOn]]; if(j.handover.receivedOn) rows.push(['Received by Finance', j.handover.receivedBy+', '+j.handover.receivedOn]); if(j.handover.ref) rows.push(['Finance reference', j.handover.ref]); d.card(rows); }
  d.heading('Charges to bill');
  if(ch.length){
    const W = [190, 75, 115, 115];
    d.row(['Charge','Type','Evidence','Amount'].map((t,k)=>({ w:W[k], text:t, right:k===3 })), { head:true });
    ch.forEach((c,x)=>d.row([c.desc+'\n'+c.by+', '+c.on, c.kind, c.file||'-', money(c.amount)].map((t,k)=>({ w:W[k], text:t, right:k===3, bold:k===0 })), { shade:x%2===1 }));
    d.row([{ w:380, text:'Service fees' }, { w:115, text:money(sumOf(ch.filter(c=>c.kind===CHARGE_KINDS[0]), c=>c.amount)), right:true }], { shade:true });
    d.row([{ w:380, text:'Paid at cost (costs paid for the client)' }, { w:115, text:money(sumOf(ch.filter(c=>c.kind!==CHARGE_KINDS[0]), c=>c.amount)), right:true }]);
    d.row([{ w:380, text:'Total charges' }, { w:115, text:money(total), right:true }], { total:true });
    if(quoted!=null) d.gap(12).card([['Accepted quote (v'+v.v+')', money(quoted)], ['Difference', money(total-quoted)+(total>=quoted?' (listed is above the quote)':' (listed is below the quote)')]]);
  } else d.para('No charges listed yet.');
  d.gap(12).para('Finance bills from this list in their own system. This page is a handover record, not an invoice.');
  d.save(pdfStamp('Billing-'+j.id)+'.pdf');
}

/* ---------- Job summary report: one page-set that tells the whole story of a job ---------- */
function downloadJobSummaryPdf(jobId){
  const j = jobById(jobId);
  if(!j || !canView('job.view', j)) return denied();
  const c = custById(j.customerId), h = jobHealth(j), money_ = canView('money.view', j), i = inqById(j.inquiryId), v = i ? acceptedVersion(i) : null;
  const tone = ['success','danger','warning','info'].includes(h.tone) ? h.tone : 'info';
  const d = pdfDoc('Job summary report').title('Job '+j.id, c.name+'  |  '+scopeText(j)+'  |  '+servicesText(j.services), h.label, tone);
  if(v) d.amount('Accepted quote', money(toPHP(v)), 'v'+v.v+(v.currency==='USD' ? ' (USD '+v.amount.toLocaleString('en-US')+')' : ''));
  const team = SERVICE_ORDER.filter(s=>j.services.includes(s)).map(s=>SERVICES[s].short+': '+opsFor(j, s).join(', ')).join('  /  ');
  d.heading('Job').card([['Customer', c.name], ['Route', routeText(j.origin, j.destination)||'-'], ['Current step', stageText(j)], ['Status', j.status+(j.completed ? ' (confirmed by '+j.completed.by+', '+j.completed.on+')' : '')], ['Created', j.createdOn], ['Sales', (j.sales||[]).join(', ')||'-'], ['Operations', team||'-'], ['Billing handover', readinessStatus(j).label]]);
  const W = [170, 80, 70, 85, 90], done = j.ms.filter(m=>m.done).length;
  d.heading('Milestones ('+done+' of '+j.ms.length+' done)').row(['Step','Service','Status','Date','By'].map((t,k)=>({ w:W[k], text:t })), { head:true });
  j.ms.forEach((m,x)=>d.row([m.name, SERVICES[m.svc] ? SERVICES[m.svc].short : '-', m.done ? 'Done' : 'Pending', m.done ? m.date : (m.due ? 'due '+m.due : '-'), m.done ? m.by : '-'].map((t,k)=>({ w:W[k], text:String(t), bold:k===0 })), { shade:x%2===1 }));
  const pend = pendingDocs(j);
  d.heading('Documents ('+(j.docs.length-pend.length)+' of '+j.docs.length+' received)');
  pend.length ? d.para('Still missing: '+pend.map(x=>x.name+(x.status==='Rejected' ? ' (rejected)' : '')).join(', ')+'.') : d.para('All documents received.');
  d.heading('Exceptions ('+j.issues.length+')');
  if(j.issues.length){ const EW = [150, 120, 225]; d.row(['Category','Status','Reason'].map((t,k)=>({ w:EW[k], text:t })), { head:true }); j.issues.forEach((x,k)=>d.row([x.category, EXC_LABEL[x.status]||x.status, x.reason].map((t,n)=>({ w:EW[n], text:String(t), bold:n===0 })), { shade:k%2===1 })); }
  else d.para('No exceptions raised.');
  if(money_){
    const FW = [55, 150, 100, 100, 90];
    d.heading('Fund requests ('+j.funds.length+')');
    if(j.funds.length){
      d.row(['Request','Purpose','Amount','Spent','Status'].map((t,k)=>({ w:FW[k], text:t, right:k===2||k===3 })), { head:true });
      j.funds.forEach((f,k)=>d.row([f.id, f.purpose, money(f.amount), f.liq ? money(f.liq.actual) : '-', frLabel(f)].map((t,n)=>({ w:FW[n], text:String(t), right:n===2||n===3, bold:n===0 })), { shade:k%2===1 }));
      d.row([{ w:205, text:'Total' }, { w:100, text:money(sumOf(j.funds, f=>f.amount)), right:true }, { w:100, text:money(sumOf(j.funds, f=>f.liq ? f.liq.actual : 0)), right:true }, { w:90, text:'' }], { total:true });
    } else d.para('No fund requests.');
    const ch = chargesOf(j), svc = sumOf(ch.filter(x=>x.kind===CHARGE_KINDS[0]), x=>x.amount), pass = sumOf(ch.filter(x=>x.kind===CHARGE_KINDS[1]), x=>x.amount), tot = svc+pass;
    d.heading('Charges to bill');
    if(ch.length){ const rows = [['Service fees', money(svc)], ['At-cost pass-throughs', money(pass)], ['Total charges', money(tot)]]; if(v) rows.push(['Accepted quote', money(toPHP(v))], ['Difference vs quote', money(tot-toPHP(v))]); d.card(rows); }
    else d.para('No charges listed yet.');
  }
  d.gap(8).para('A summary of this job as recorded in the portal. It is a record, not an invoice.');
  d.save(pdfStamp('Job-summary-'+j.id)+'.pdf');
}
