"""Package installed upstream notices alongside a preview APK. No network or secrets."""
from pathlib import Path
import json, os, re, sys, zipfile

root = Path(__file__).resolve().parent.parent
output = Path(sys.argv[1]) if len(sys.argv) == 2 else root / 'dist-android/THIRD-PARTY-NOTICES.zip'
output.parent.mkdir(parents=True, exist_ok=True)
notices = []
for directory, dirs, files in os.walk(root / 'node_modules', followlinks=False):
    dirs[:] = sorted(d for d in dirs if d not in {'.cache', '.bin', '.git'})
    for name in sorted(files):
        if re.match(r'^(licen[cs]e|notice|copying|copyright)([.\-_]|$)', name, re.I):
            path = Path(directory) / name
            if path.is_file() and not path.is_symlink():
                notices.append(path)
assert notices, 'Install the locked dependencies before collecting notices.'
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(root / 'LICENSE', 'Vico-MIT.txt')
    archive.write(root / 'THIRD_PARTY_NOTICES.md', 'README.md')
    archive.write(root / 'docs/dependency-inventory.json', 'javascript-package-inventory.json')
    for path in sorted((root / 'docs/licenses').rglob('*')):
        if path.is_file():
            archive.write(path, 'project-notices/' + path.relative_to(root / 'docs/licenses').as_posix())
    for path in notices:
        archive.write(path, 'installed-packages/' + path.relative_to(root / 'node_modules').as_posix())
print(json.dumps({'archive': output.name, 'installedNoticeFiles': len(notices)}))
