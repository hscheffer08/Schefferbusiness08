from pathlib import Path

path = Path('src/components/Admin.tsx')
text = path.read_text()

replacements = [
    (
        "import ReferralAdmin from '@/components/ReferralAdmin';",
        "import ReferralAdmin from '@/components/ReferralAdmin';\nimport AdminImpact from '@/components/AdminImpact';",
    ),
    (
        "const [adminTab, setAdminTab] = useState<'dashboard' | 'referrals' | 'answers'>('dashboard');",
        "const [adminTab, setAdminTab] = useState<'dashboard' | 'impact' | 'referrals' | 'answers'>('dashboard');",
    ),
    (
        "          <button\n            onClick={() => setAdminTab('referrals')}",
        "          <button\n            onClick={() => setAdminTab('impact')}\n            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${\n              adminTab === 'impact' ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-200'\n            }`}\n          >\n            <TrendingUp className=\"w-4 h-4\" />\n            Impacto\n          </button>\n          <button\n            onClick={() => setAdminTab('referrals')}",
    ),
    (
        "        {adminTab === 'referrals' ? (\n          <ReferralAdmin />",
        "        {adminTab === 'impact' ? (\n          <AdminImpact />\n        ) : adminTab === 'referrals' ? (\n          <ReferralAdmin />",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'Expected Admin.tsx marker not found: {old[:90]!r}')
    text = text.replace(old, new, 1)

path.write_text(text)
print('Admin impact tab integrated.')
