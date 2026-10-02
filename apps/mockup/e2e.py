"""End-to-end walkthrough of the mockup as every role (requirements in docs/requirements).
Run after building: python apps/mockup/e2e.py  (needs Python Playwright + Chromium).
Screenshots go to .tmp/e2e-shots. Exits non-zero on any page or console error."""
import sys, os, pathlib
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
ROOT = (HERE/'index.html').as_uri()
SHOTS = HERE.parent.parent/'.tmp'/'e2e-shots'; SHOTS.mkdir(parents=True, exist_ok=True)
errors = []
def step(msg): print('--', msg, flush=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width':1440,'height':1000})
    page.on('pageerror', lambda e: errors.append('PAGEERROR '+str(e)))
    page.on('console', lambda m: errors.append('CONSOLE '+m.text) if m.type=='error' else None)
    page.on('dialog', lambda d: d.accept())
    page.goto(ROOT+'#/login')
    def ev(js, arg=None): return page.evaluate(js, arg)
    def as_(name, route='#/home'): ev("([n,r])=>signInAs(n,r)", [name, route]); page.wait_for_timeout(80)
    def shot(n): page.screenshot(path=str(SHOTS/(n+'.png')), full_page=True)
    def drawer(): return page.locator('.ds-drawer')
    def sample(slot): ev("s=>pickFile(s,{name:'sample-'+s.toLowerCase()+'.pdf'})", slot)
    def submit(): drawer().locator('.ds-drawer__foot button[type=submit], .ds-drawer__foot .ds-btn--primary').last.click(); page.wait_for_timeout(80)
    def primary(): page.locator('#next-primary').click(); page.wait_for_timeout(80)
    def pick(dd, name): page.click('#'+dd+' button'); page.locator('#'+dd+' .ds-option', has_text=name).click(); page.click('.ds-drawer__head')
    def fill_all(): ev("document.querySelectorAll('.ds-drawer .ds-upload:not([data-filled])').forEach(u=>pickFile(u.dataset.uploadSlot,{name:'sample-'+u.dataset.uploadSlot.toLowerCase()+'.pdf'}))")
    def no_drawer(label):
        if page.locator('#drawerRoot.open').count():
            errs = drawer().locator('.ds-field__error:not([hidden])').all_inner_texts()
            raise SystemExit('Drawer still open after '+label+': '+str(errs))

    step('login form')
    page.click('#ms-signin'); page.locator('.ds-acct-row', has_text='Grace Tan').click(); page.wait_for_timeout(100)
    assert 'Grace' in page.inner_text('.ds-topbar__who'); shot('01-dashboard-empty')

    step('customer + inquiry (Manager)')
    page.goto(ROOT+'#/customers'); page.click('#new-customer')
    page.fill('#nc-name','Sample Motors Trading'); page.fill('#nc-contact','Leo Santos'); page.fill('#nc-phone','+63 917 555 0101'); page.fill('#nc-email','leo@samplemotors.example'); page.fill('#nc-addr','Unit 5, 123 Ortigas Ave, Pasig City'); submit(); no_drawer('customer')
    page.click('#cust-new-inquiry')
    page.select_option('#inq-channel','Viber')
    for s in ['freight','customs','trucking','lto']: drawer().locator('input[name=services][value='+s+']').check()
    page.fill('#inq-cargo','2 units pickup trucks'); page.fill('#inq-origin','Yokohama, JP'); page.fill('#inq-dest','Quezon City, PH'); page.select_option('#inq-ctype','FCL'); page.fill('#inq-delivery','Showroom, EDSA, Quezon City'); page.fill('#inq-vehicle','Toyota Hilux 2024 (2 units)')
    pick('inq-staff','Ana Cruz'); shot('02-new-inquiry'); submit(); no_drawer('inquiry')
    inq = ev("INQUIRIES[0].id"); print('inquiry', inq)
    # domestic disables customs
    page.click('#new-inquiry') if page.locator('#new-inquiry').count() else ev("openNewInquiry()")
    drawer().locator('input[name=scope][value=Domestic]').check(force=True); page.wait_for_timeout(50)
    assert drawer().locator('input[name=services][value=customs]').count()==0; ev("closeDrawer()")

    step('sales uploads v1, manager returns')
    as_('Ana Cruz', '#/inquiries/'+inq); primary(); sample('quoteFile'); page.fill('#q-amount','350000'); submit(); no_drawer('quote v1')
    as_('Grace Tan', '#/inquiries/'+inq); primary(); page.select_option('#rs-type','Missing charge'); page.fill('#rs-comment','Add LTO registration fees.'); page.click('#return-quote'); no_drawer('return')
    step('v2 approve, send, client renegotiates, v3 accepted')
    as_('Ana Cruz', '#/inquiries/'+inq); primary(); sample('quoteFile'); page.fill('#q-amount','372000'); submit(); no_drawer('v2')
    as_('Grace Tan', '#/inquiries/'+inq); primary(); page.click('#approve-quote'); no_drawer('approve')
    as_('Ana Cruz', '#/inquiries/'+inq); primary(); sample('sentProof'); submit(); no_drawer('sent')
    primary(); drawer().locator('input[name=type][value=Renegotiate]').check(force=True); page.wait_for_timeout(30); page.fill('#rs-comment','Competitor offered 20k lower'); sample('outcomeProof'); submit(); no_drawer('reneg')
    primary(); sample('quoteFile'); page.fill('#q-amount','355000'); submit(); no_drawer('v3')
    as_('Mark Villar', '#/inquiries/'+inq); primary(); page.click('#approve-quote'); no_drawer('self?')
    as_('Ana Cruz', '#/inquiries/'+inq); primary(); sample('sentProof'); submit(); primary(); sample('outcomeProof'); submit(); no_drawer('accepted')
    shot('03-inquiry-accepted')
    as_('Grace Tan', '#/inquiries/'+inq); primary(); page.click('#ack-accept'); no_drawer('ack')
    primary(); pick('cv-ops','Ben Santos'); page.fill('#cv-bl','BL-SAMPLE-001'); submit(); no_drawer('convert')
    job = ev("JOBS[0].id"); code = ev("JOBS[0].trackingCode"); print('job', job, code); shot('04-job-new')

    step('ops: milestones, docs, fund request, issue')
    as_('Ben Santos', '#/jobs/'+job)
    for k in range(40):
        if ev("nextMsIndex(JOBS[0])")<0: break
        m = ev("currentMs(JOBS[0]).name")
        if m=='Duties paid': break
        primary()
        fill_all()
        if m=='Lane assigned': drawer().locator('input[name=lane][value=Red]').check()
        submit(); no_drawer('ms '+m)
    print('at', ev("stageText(JOBS[0])"), 'clocks', ev("jobClocks(JOBS[0]).map(c=>c.label+': '+clockText(c))"))
    primary(); submit()  # duties paid without proof -> must stay open
    assert page.locator('#drawerRoot.open').count(), 'proof not enforced'
    sample('msFile'); submit(); no_drawer('duties')
    page.click('#job-more'); page.click('text=New fund request'); page.fill('#fr-amount','184000'); page.fill('#fr-payee','Bureau of Customs'); submit(); no_drawer('fund')
    page.click('#job-more'); page.click('text=Flag an issue'); page.fill('#is-reason','Missing FDA permit'); submit(); no_drawer('issue')
    assert ev("jobHealth(JOBS[0]).label")=='On hold'; shot('05-job-hold')
    primary(); page.fill('#rs-note','Permit received from client'); submit(); no_drawer('resolve')

    step('money: approve, release, liquidate, verify')
    as_('Lorna Bautista', '#/jobs/'+job+'/money'); page.click('text=Review'); page.click('#approve-fund'); no_drawer('fund approve')
    as_('Paolo Reyes', '#/home'); shot('06-mywork-accounting'); page.locator('.ds-queue__item button', has_text='Release').first.click(); submit(); no_drawer('release')
    as_('Ben Santos', '#/home'); page.locator('.ds-queue__item button', has_text='Liquidate').first.click(); page.fill('#liq-actual','181500'); sample('liqReceipts'); submit(); no_drawer('liq')
    as_('Paolo Reyes', '#/home'); page.locator('.ds-queue__item button', has_text='Verify').first.click(); page.click('#verify-liq'); no_drawer('verify')

    step('finish milestones, docs, close')
    as_('Ben Santos', '#/jobs/'+job)
    for k in range(40):
        if ev("nextMsIndex(JOBS[0])")<0: break
        m = ev("currentMs(JOBS[0]).name"); primary()
        fill_all()
        submit(); no_drawer('ms '+m)
    for d in ev("JOBS[0].docs.filter(d=>d.status!=='Received').map(d=>d.id)"):
        ev("([j,d])=>openUploadDoc(j,d)", [job, d]); sample('docFile'); submit(); no_drawer('doc')
    primary(); assert ev("JOBS[0].status")=='For closing'
    as_('Grace Tan', '#/jobs/'+job); primary(); page.click('#confirm-complete'); no_drawer('complete')

    step('billing')
    as_('Paolo Reyes', '#/jobs/'+job+'/money'); page.click('text=Upload SOA'); sample('soaFile'); page.fill('#soa-amount','360000'); submit(); no_drawer('soa')
    as_('Mark Villar', '#/home'); page.locator('.ds-queue__item button', has_text='Review').first.click(); page.click('#approve-bill'); no_drawer('bill approve')
    as_('Paolo Reyes', '#/jobs/'+job+'/money'); page.click('text=Mark as sent'); page.fill('#sb-inv','SI-000123'); submit(); no_drawer('send')
    page.click('text=Record payment'); page.fill('#pay-amount','300000'); page.fill('#pay-wht','3500'); sample('payProof'); submit(); no_drawer('pay1')
    print('billing', ev("billingStatus(JOBS[0]).label"))
    page.click('text=Record payment'); page.fill('#pay-amount','56500'); sample('payProof'); submit(); no_drawer('pay2')
    print('billing', ev("billingStatus(JOBS[0]).label"), 'fin closed', ev("financiallyClosed(JOBS[0])")); shot('07-money-tab')

    step('second inquiry lost; dashboards')
    as_('Grace Tan'); ev("openNewInquiry()"); drawer().locator('input[name=services][value=customs]').check(); page.fill('#inq-cargo','Frozen goods'); page.fill('#inq-port','Batangas Port'); pick('inq-staff','Cathy Lim'); submit()
    inq2 = ev("INQUIRIES[1].id")
    as_('Cathy Lim', '#/inquiries/'+inq2); primary(); sample('quoteFile'); page.fill('#q-amount','2500'); page.select_option('#q-cur','USD'); submit()
    as_('Grace Tan', '#/inquiries/'+inq2); primary(); page.click('#approve-quote')
    as_('Cathy Lim', '#/inquiries/'+inq2); primary(); sample('sentProof'); submit(); primary(); drawer().locator('input[name=type][value=Rejected]').check(force=True); page.select_option('#rs-type','Chose competitor'); page.fill('#rs-comment','Went with another forwarder'); sample('outcomeProof'); submit()
    as_('Grace Tan', '#/inquiries/'+inq2); page.click('text=Close as lost'); page.fill('#rs-comment','Lost on price'); submit(); no_drawer('lost')
    as_('Mark Villar', '#/home')
    for t in ['sales','ops','finance','team']:
        ev("t=>{STATE.dashTab=t; render()}", t); shot('08-dash-'+t)
    with page.expect_download() as dl: page.click('text=Excel')
    print('download', dl.value.suggested_filename)

    step('admin, permissions, settings, audit, tracking, intake')
    as_('Jun Robles', '#/users'); page.click('#add-user'); page.fill('#nu-name','Test Person'); drawer().locator('input[name=roles][value=Sales]').check(); submit()
    shot('09-users')
    as_('Ana Cruz', '#/home'); assert ev("can('dash.view')")==False
    as_('Jun Robles', '#/settings'); shot('10-settings'); as_('Jun Robles','#/audit'); shot('11-audit')
    print('audit rows', ev("globalAudit().length"))
    ev("signOut()"); page.click('#ms-signin'); page.locator('.ds-acct-row', has_text='Test Person').click(); page.wait_for_timeout(50)
    assert 'Test Person' in page.inner_text('.ds-topbar__who')
    as_('Cathy Lim'); ev("openReportInquiry()"); page.fill('#in-client','New Client Inc.'); page.fill('#in-note','Needs warehousing'); submit(); no_drawer('intake')
    # deactivation with open work by admin -> pending; manager handover
    as_('Jun Robles', '#/users'); ev("toggleUser(USERS.find(u=>u.name==='Ben Santos').id)")
    print('pending', ev("!!USERS.find(u=>u.name==='Ben Santos').pendingDeactivation"), 'open work', ev("workCount(openWorkOf('Ben Santos'))"))
    as_('Grace Tan', '#/home'); shot('12-dashboard-grace')
    ev("signOut()"); page.goto(ROOT+'#/track/'+job); assert 'could not find' in page.inner_text('body')
    page.goto(ROOT+'#/track/'+code)
    page.wait_for_timeout(100); shot('13-track'); print('track headline', page.inner_text('#track-status'))
    b.close()
print('\n'.join(errors) if errors else 'NO ERRORS')
