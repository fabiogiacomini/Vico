#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo 'Usage: sign-android-preview.sh unsigned.apk signed.apk' >&2
  exit 2
fi
: "${VICO_APKSIGNER:?Set VICO_APKSIGNER to the Android SDK apksigner script}"
: "${VICO_KEYSTORE:?Set VICO_KEYSTORE to the owner private PKCS12 file}"
: "${VICO_KEYSTORE_PASSWORD_FILE:?Set VICO_KEYSTORE_PASSWORD_FILE to its private password file}"
for vico_file in "$1" "$VICO_APKSIGNER" "$VICO_KEYSTORE" "$VICO_KEYSTORE_PASSWORD_FILE"; do
  test -f "$vico_file"
done
if [ "$1" = "$2" ]; then echo 'Keep the unsigned input separate from the signed output.' >&2; exit 2; fi
bash "$VICO_APKSIGNER" sign --ks "$VICO_KEYSTORE" --ks-key-alias vico --ks-pass "file:$VICO_KEYSTORE_PASSWORD_FILE" --v1-signing-enabled false --v2-signing-enabled true --v3-signing-enabled true --v4-signing-enabled false --out "$2" "$1"
bash "$VICO_APKSIGNER" verify --verbose --print-certs "$2" > "$2.signing.txt"
python3 - "$1" "$2" <<'PY'
import sys,zipfile,json,re,hashlib
from pathlib import Path
before,after=map(Path,sys.argv[1:])
def payload(p):
 with zipfile.ZipFile(p) as z:
  entries = [i for i in z.infolist() if not i.is_dir()]
  assert len({i.filename for i in entries}) == len(entries), 'Duplicate APK ZIP entries.'
  result = {}
  for entry in entries:
   with z.open(entry) as stream:
    result[entry.filename] = (entry.file_size, hashlib.file_digest(stream, 'sha256').hexdigest())
  return result
assert payload(before)==payload(after), 'Signing changed the application payload.'
expected=json.loads(Path('.github/android-signing-certificate.json').read_text())['sha256']
report=Path(str(after)+'.signing.txt').read_text()
digests=re.findall(r'Signer #\d+ certificate SHA-256 digest: ([a-fA-F0-9]+)',report)
assert digests==[expected], 'APK certificate does not match the public owner certificate.'
print('Verified owner signature and unchanged application payload.')
PY
