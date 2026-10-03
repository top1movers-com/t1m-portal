/* ============================== SELECT -> DESIGN-SYSTEM DROPDOWN ==============================
   A native <select> opens a list the browser draws, which ignores the design system. On devices with a mouse every
   `.ds-select-wrap > select.ds-select` is upgraded to the `.ds-dropdown` listbox from the style guide (ARIA combobox
   pattern: arrows, Home/End, type-ahead, Enter/Space, Escape). The real <select> stays in the DOM, visually hidden, so
   FormData, `onchange="..."` handlers, `.value = ...` and `required` keep working. Touch devices keep the native picker. */
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)');
function upgradeSelect(sel){
  const wrap = sel.parentElement;
  if(sel.dataset.upgraded || !wrap || !wrap.classList.contains('ds-select-wrap') || !FINE_POINTER.matches) return;
  sel.dataset.upgraded = '1'; sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
  wrap.classList.add('ds-dropdown'); if(sel.classList.contains('ds-select--sm')) wrap.dataset.size = 'sm';
  const id = sel.id || 'dd'+Math.random().toString(36).slice(2, 8), lbl = document.querySelector('label[for="'+sel.id+'"]');
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = sel.className.replace('ds-select--native', '');
  btn.setAttribute('role', 'combobox'); btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id+'-list');
  btn.setAttribute('aria-label', (sel.getAttribute('aria-label') || (lbl && lbl.textContent.trim()) || sel.name || 'Choose').replace(/\s+/g, ' '));
  btn.innerHTML = '<span class="ds-dropdown__value"></span>';
  const list = document.createElement('ul'); list.className = 'ds-menu'; list.id = id+'-list'; list.setAttribute('role', 'listbox'); list.tabIndex = -1;
  sel.after(btn); wrap.insertBefore(list, wrap.querySelector('.ds-icon').nextSibling);
  const val = btn.querySelector('.ds-dropdown__value');
  let opts = [], active = 0, buf = '', bufT;
  const enabled = i => opts[i] && !opts[i].hasAttribute('aria-disabled');
  const sync = ()=>{ const o = sel.selectedOptions[0]; val.textContent = o ? o.textContent : ''; (o && o.value==='' && sel.options.length>1) ? val.setAttribute('data-placeholder', '') : val.removeAttribute('data-placeholder'); btn.disabled = sel.disabled; };
  const build = ()=>{
    list.innerHTML = [...sel.options].map((o, i)=>'<li class="ds-option" role="option" id="'+id+'-o'+i+'" data-i="'+i+'" aria-selected="'+(o.selected)+'"'+(o.disabled?' aria-disabled="true"':'')+'><span class="ds-option__text">'+esc(o.textContent)+'</span>'+icon('check')+'</li>').join('');
    opts = [...list.querySelectorAll('.ds-option')];
  };
  const setActive = (i, dir = 1)=>{ if(!opts.length) return; for(let n = 0; n < opts.length && !enabled((i + opts.length) % opts.length); n++) i += dir; active = (i + opts.length) % opts.length;
    opts.forEach(o=>o.removeAttribute('data-active')); opts[active].setAttribute('data-active', ''); btn.setAttribute('aria-activedescendant', opts[active].id); opts[active].scrollIntoView({ block:'nearest' }); };
  const isOpen = ()=>wrap.hasAttribute('data-open');
  const open = ()=>{
    if(sel.disabled) return;
    document.querySelectorAll('.ds-dropdown[data-open]').forEach(d=>{ if(d!==wrap){ d.removeAttribute('data-open'); const b = d.querySelector('[role=combobox]'); b && b.setAttribute('aria-expanded', 'false'); } });
    build(); const r = btn.getBoundingClientRect(), need = Math.min(296, opts.length*36 + 8);
    if(window.innerHeight - r.bottom < need + 12 && r.top > window.innerHeight - r.bottom) wrap.dataset.placement = 'top'; else wrap.removeAttribute('data-placement');
    wrap.setAttribute('data-open', ''); btn.setAttribute('aria-expanded', 'true'); setActive(Math.max(0, sel.selectedIndex));
  };
  const close = ()=>{ wrap.removeAttribute('data-open'); btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant'); };
  const choose = i=>{
    if(!enabled(i)) return;
    if(sel.selectedIndex !== i){ sel.selectedIndex = i; sel.dispatchEvent(new Event('input', { bubbles:true })); sel.dispatchEvent(new Event('change', { bubbles:true })); }
    sync(); close(); btn.focus();
  };
  btn.addEventListener('click', ()=>isOpen() ? close() : open());
  btn.addEventListener('keydown', e=>{
    const k = e.key;
    if(k==='ArrowDown' || k==='ArrowUp'){ e.preventDefault(); if(!isOpen()) return open(); setActive(active + (k==='ArrowDown' ? 1 : -1), k==='ArrowDown' ? 1 : -1); }
    else if(k==='Home' || k==='End'){ if(isOpen()){ e.preventDefault(); setActive(k==='Home' ? 0 : opts.length - 1, k==='Home' ? 1 : -1); } }
    else if(k==='Enter' || k===' '){ e.preventDefault(); isOpen() ? choose(active) : open(); }
    else if(k==='Escape'){ if(isOpen()){ e.preventDefault(); e.stopPropagation(); close(); } }
    else if(k==='Tab'){ close(); }
    else if(k.length===1 && !e.ctrlKey && !e.metaKey){ clearTimeout(bufT); buf += k.toLowerCase(); bufT = setTimeout(()=>buf = '', 600);
      if(!isOpen()) open(); const hit = opts.findIndex((o, i)=>enabled(i) && o.textContent.trim().toLowerCase().startsWith(buf)); if(hit >= 0) setActive(hit); }
  });
  list.addEventListener('mousemove', e=>{ const o = e.target.closest('.ds-option'); if(o && enabled(+o.dataset.i)) setActive(+o.dataset.i); });
  list.addEventListener('mousedown', e=>e.preventDefault());
  list.addEventListener('click', e=>{ const o = e.target.closest('.ds-option'); if(o) choose(+o.dataset.i); });
  document.addEventListener('click', e=>{ if(isOpen() && !wrap.contains(e.target)) close(); });
  /* Keep the trigger honest when code changes the native select directly (.value = ..., innerHTML = ..., aria-invalid). */
  const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  Object.defineProperty(sel, 'value', { get(){ return d.get.call(this); }, set(v){ d.set.call(this, v); sync(); }, configurable:true });
  new MutationObserver(sync).observe(sel, { childList:true, subtree:true, attributes:true, attributeFilter:['disabled'] });
  new MutationObserver(()=>sel.getAttribute('aria-invalid')==='true' ? btn.setAttribute('aria-invalid', 'true') : btn.removeAttribute('aria-invalid')).observe(sel, { attributes:true, attributeFilter:['aria-invalid'] });
  if(lbl){ lbl.addEventListener('click', e=>{ e.preventDefault(); btn.focus(); }); }
  sync();
}
const upgradeSelects = (root)=>(root||document).querySelectorAll('.ds-select-wrap > select.ds-select').forEach(upgradeSelect);
new MutationObserver(()=>upgradeSelects()).observe(document.documentElement, { childList:true, subtree:true });
document.addEventListener('DOMContentLoaded', ()=>upgradeSelects());
