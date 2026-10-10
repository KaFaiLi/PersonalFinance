"""Optional QA: requires Python Playwright and Chromium; start npm run preview first.
Run BROWSER_PATH=/usr/bin/chromium python scripts/browser-qa.py.
No private inputs, real accounts or network APIs are used.
"""
import json,os,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url=os.environ.get('PREVIEW_URL','http://127.0.0.1:4173')
checks=[]
def check(name,ok=True):
 if not ok and 'overflow' in name:
  print(page.evaluate('Array.from(document.querySelectorAll("body *")).filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,15).map(e=>({tag:e.tagName,id:e.id,cls:typeof e.className==="string"?e.className:"svg",width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))'))
 assert ok,name
 checks.append(name)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('BROWSER_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
 errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r.url))
 page.goto(url);expect(page.locator('#summary .metric')).to_have_count(3)
 check('desktop main layout',page.locator('main').bounding_box()['width']>1000)
 check('desktop no horizontal document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 check('no default persistence',page.evaluate('localStorage.length===0'))
 page.keyboard.press('Tab');check('skip link keyboard focus',page.locator('.skip').evaluate('(e)=>e===document.activeElement'))
 page.keyboard.press('Enter');check('skip link target',page.url.endswith('#main'))
 page.locator('nav a[href="#inputs"]').click();expect(page.locator('#input-form')).to_be_visible()
 page.locator('#salary').fill('46000');page.locator('#targetGrowth').fill('3');page.locator('#input-form button[type=submit]').click()
 expect(page.locator('#dashboard')).to_be_visible();check('form submits and routes to dashboard')
 page.locator('#save-device').click();check('explicit persistence',page.evaluate('localStorage.length===1'))
 with page.expect_download() as d:page.locator('#export-json').click()
 data=json.loads(Path(d.value.path()).read_text());check('JSON export input values',data['inputs']['salary']==46000 and data['inputs']['targetGrowth']==.03)
 page.locator('#reset').click();page.locator('#load-device').click();page.locator('nav a[href="#inputs"]').click();expect(page.locator('#salary')).to_have_value('46000');check('reset and device restore')
 page.reload();expect(page.locator('#salary')).to_have_value('42000');check('reload does not automatically load stored personal data')
 page.locator('#import-json').set_input_files({'name':'test.json','mimeType':'application/json','buffer':json.dumps(data).encode()});expect(page.locator('#salary')).to_have_value('46000');check('JSON import roundtrip')
 page.locator('#import-json').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"schema":"invalid"}'});expect(page.locator('#status')).to_contain_text('匯入失敗');expect(page.locator('#salary')).to_have_value('46000');check('invalid import retains previous state')
 page.locator('#import-json').set_input_files({'name':'test.json','mimeType':'application/json','buffer':json.dumps(data).encode()});expect(page.locator('#status')).to_contain_text('已驗證');check('repeat import same filename works')
 page.locator('#targetGrowth').fill('300');page.locator('#input-form button[type=submit]').click();expect(page.locator('#input-error')).not_to_be_empty();check('invalid rate blocked');page.locator('#targetGrowth').fill('3')
 # Open second section's advanced controls; zero and blank remain distinct.
 page.locator('#form-sections > section').nth(1).locator('summary').click()
 page.locator('#override-value').fill('0');page.locator('#set-override').click();expect(page.locator('#override-status')).to_contain_text('0.0%')
 page.locator('#input-form button[type=submit]').click();check('zero monthly override accepted')
 with page.expect_download() as d:page.locator('#export-json').click()
 zero=json.loads(Path(d.value.path()).read_text());check('zero override exports distinctly from blank',zero['inputs']['overrides'][0]==0 and zero['inputs']['overrides'][1] is None)
 # Annual/monthly audit and CSV.
 page.locator('summary').filter(has_text='逐月及年度').click();page.locator('#audit-year').select_option('50');expect(page.locator('#audit tbody tr')).to_have_count(12)
 with page.expect_download() as d:page.locator('#export-ledger').click()
 csv=Path(d.value.path()).read_text(encoding='utf-8-sig');check('600 monthly CSV rows',len(csv.splitlines())==601)
 page.locator('nav a[href="#dca"]').click();page.locator('#dca-dcaYears').fill('10');page.locator('#update-dca').click();expect(page.locator('#dca-result')).to_contain_text('10年獨立');check('independent DCA flow')
 page.locator('nav a[href="#history"]').click();expect(page.locator('#fixed-history tbody tr')).to_have_count(4);expect(page.locator('#rolling-chart tbody tr')).to_have_count(181)
 page.locator('#show-dividends').check();expect(page.locator('#history-chart .adjusted')).to_have_count(1);check('history fixed, rolling and dividend distinction')
 # Mobile all routes; check horizontally scrollable tables stay contained.
 page.set_viewport_size({'width':390,'height':844})
 for route in ['dashboard','inputs','dca','history','method']:
  page.locator(f'nav a[href="#{route}"]').click();expect(page.locator('#'+route)).to_be_visible();check('mobile '+route+' no document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 page.locator('nav a[href="#inputs"]').click();page.locator('#reset').click();page.locator('#years').fill('7');page.locator('#input-form button[type=submit]').click();expect(page.locator('#year-label')).to_have_text('7');check('non-five-year horizon')
 # Unconfirmed support cannot appear as viable wealth.
 with page.expect_download() as d:page.locator('#export-json').click()
 unconfirmed=json.loads(Path(d.value.path()).read_text());unconfirmed['inputs']['gift']=100000;unconfirmed['inputs']['giftConfirmed']=False
 page.locator('#import-json').set_input_files({'name':'support.json','mimeType':'application/json','buffer':json.dumps(unconfirmed).encode()});expect(page.locator('#funding')).to_contain_text('資助尚未確認');check('unconfirmed support labelled and wealth withheld',page.locator('#summary .metric').nth(1).inner_text().find('未獲資金支持')>=0)
 page.locator('#reset').click();page.locator('#forget-device').click();check('delete explicit device save',page.evaluate('localStorage.length===0'))
 for _ in range(3):
  for route in ['inputs','dashboard','dca','history','method']:page.locator(f'nav a[href="#{route}"]').click()
 check('repeated navigation no runtime errors',errors==[])
 check('no remote API or analytics requests',all(r.startswith(url) for r in requests))
 browser.close()
print(json.dumps({'passed':len(checks),'checks':checks,'runtimeErrors':errors},ensure_ascii=False,indent=2))
