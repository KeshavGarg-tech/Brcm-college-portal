from pathlib import Path

root = Path('/home/ubuntu/work/northstar')
for name in ['client/src/pages/Home.tsx', 'client/src/pages/Portal.tsx']:
    path = root / name
    text = path.read_text()
    replacements = {
        'Northstar Academy': 'BRCM College of Engineering and Technology',
        'Northstar': 'BRCM College',
        'northstar': 'BRCM',
        'academy portal': 'college portal',
        'school portal': 'college portal',
        'school sign-in': 'college sign-in',
        'school’s': 'college’s',
        'school': 'college',
        'academy': 'college',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = text.replace('className="absolute inset-0 h-full w-full object-cover opacity-90"', 'className="absolute inset-0 h-full w-full object-cover"')
    path.write_text(text)

pkg = root / 'package.json'
text = pkg.read_text().replace('northstar-academy-portal', 'brcm-college-portal')
pkg.write_text(text)
