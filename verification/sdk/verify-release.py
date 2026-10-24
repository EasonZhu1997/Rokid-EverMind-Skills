"""Read-only verification of downloaded original release assets and SDK bytes."""
import hashlib
import json
from pathlib import Path
import sys
import tarfile
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
provenance = json.loads((HERE / 'release-provenance.json').read_text())
if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 verification/sdk/verify-release.py DOWNLOADED_ASSET_DIRECTORY')
downloads = Path(sys.argv[1])
for name, digest in provenance['archives'].items():
    assert hashlib.sha256((downloads / name).read_bytes()).hexdigest() == digest, name
sdk = ROOT / 'skills/aiui-everos-direct/sdk'
for name, digest in provenance['sdk_files'].items():
    local = (sdk / name).read_bytes()
    assert hashlib.sha256(local).hexdigest() == digest, name + ': repository source differs from tested release'
    for archive_name, prefix in [('aiui-everos-sdk-v0.1.0.zip', 'everos-sdk/'), ('aiui-everos-direct.zip', 'aiui-everos-direct/sdk/')]:
        with zipfile.ZipFile(downloads / archive_name) as archive:
            assert archive.testzip() is None
            assert archive.read(prefix + name) == local
    with tarfile.open(downloads / 'eason-aiui-everos-0.1.0.tgz') as archive:
        assert len(archive.getmembers()) == 5
        assert archive.extractfile('package/' + name).read() == local
print(json.dumps({'release_archives_verified': 3, 'repository_runtime_and_types_match_release': True, 'archives_extracted': False}))
