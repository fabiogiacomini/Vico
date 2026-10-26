"""Exercise a disposable CI emulator with synthetic data, never a user's device."""
from pathlib import Path
import os,re,subprocess,time,xml.etree.ElementTree as ET
OUT=Path('dist-android/smoke');OUT.mkdir(parents=True,exist_ok=True)
PACKAGE='org.vico.prototype'
def adb(*args):
 return subprocess.check_output(['adb',*args],stderr=subprocess.STDOUT).decode(errors='replace')
def tree():
 adb('shell','uiautomator','dump','/sdcard/vico-smoke.xml')
 return ET.fromstring(adb('shell','cat','/sdcard/vico-smoke.xml'))
def wait_text(text,timeout=60):
 deadline=time.monotonic()+timeout
 while time.monotonic()<deadline:
  root=tree()
  if any(text in (n.get('text','')+' '+n.get('content-desc','')) for n in root.iter('node')):return root
  if any('Private storage unavailable' in n.get('text','') for n in root.iter('node')):raise RuntimeError('Encrypted native storage failed at startup.')
  time.sleep(2)
 raise RuntimeError('Expected UI state not found: '+text)
def tap(text):
 nodes=[]
 for attempt in range(7):
  root=tree()
  nodes=[n for n in root.iter('node') if text in (n.get('text','')+' '+n.get('content-desc','')) and n.get('enabled')=='true']
  if nodes:break
  size=list(map(int,re.findall(r'\d+',adb('shell','wm','size'))))[-2:]
  adb('shell','input','swipe',str(size[0]//2),str(int(size[1]*0.78)),str(size[0]//2),str(int(size[1]*0.35)),'400');time.sleep(1)
 if not nodes:raise RuntimeError('Could not find enabled control: '+text)
 exact=[n for n in nodes if n.get('text')==text or n.get('content-desc')==text]
 n=(exact or nodes)[-1]; nums=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
 if len(nums)!=4:raise RuntimeError('No usable bounds for '+text)
 adb('shell','input','tap',str((nums[0]+nums[2])//2),str((nums[1]+nums[3])//2))
def screenshot(name):
 with (OUT/name).open('wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
def reopen():
 adb('shell','am','force-stop',PACKAGE);adb('shell','am','start','-W','-n',PACKAGE+'/.MainActivity')
try:
 apk=os.environ.get('VICO_SMOKE_APK','dist-android/Vico-ci-smoke.apk')
 adb('install','-r',apk);reopen();wait_text('Stay together.');screenshot('01-home.png')
 tap('Explore the practice outing');wait_text('YOUR ACTIVE PLAN');wait_text('Practice route');screenshot('02-route.png')
 reopen();wait_text('1 saved locally');tap('Open A little further, together');wait_text('YOUR ACTIVE PLAN')
 tap('Settings');tap('Delete this outing permanently');wait_text('Type DELETE to confirm')
 editable=[n for n in tree().iter('node') if n.get('class')=='android.widget.EditText']
 if not editable:raise RuntimeError('Delete confirmation input missing.')
 b=list(map(int,re.findall(r'\d+',editable[-1].get('bounds',''))));adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2));adb('shell','input','text','DELETE');adb('shell','input','keyevent','KEYCODE_BACK')
 tap('Permanently delete');wait_text('0 saved locally');reopen();wait_text('0 saved locally');screenshot('03-after-delete.png')
 adb('shell','pidof',PACKAGE)
 (OUT/'result.txt').write_text('PASS: autonomous release startup, SQLCipher availability guard, synthetic outing creation, encrypted persistence after restart, permanent local deletion, and no resurrection after restart. Emulator API 35 x86_64. Physical phones and background behavior not validated.\n')
 print((OUT/'result.txt').read_text())
except Exception:
 screenshot('failure.png')
 (OUT/'failure-ui.xml').write_text(adb('shell','cat','/sdcard/vico-smoke.xml'))
 raise
