$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-File {
  param([string]$RelPath, [string]$Content)
  $full = Join-Path $root $RelPath
  $parent = Split-Path $full -Parent
  if ($parent -and -not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  [+] $RelPath" -ForegroundColor DarkGray
}

Write-File 'src/App.tsx' @'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { HomePage } from '@/pages/HomePage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="*" element={<HomePage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
'@

Write-File 'src/pages/HomePage.tsx' @'
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi } from '@/services/api';

export function HomePage() {
  const { data, loading } = useAsync(() => tournamentApi.list(), []);
  return (
    <div className="min-h-screen bg-bg-base p-8 text-white">
      <h1 className="font-display text-4xl font-bold">RANGER ESPORTS</h1>
      <p className="mt-2 text-ink-muted">PUBG Tournament Platform</p>
      {loading ? <p className="mt-6">Loading…</p> : (
        <ul className="mt-6 space-y-2">
          {(data ?? []).map(t => (
            <li key={t.id} className="surface p-4">
              <p className="font-display text-lg font-bold">{t.name}</p>
              <p className="text-xs text-ink-faint">{t.status} · {t.maxTeams} teams</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
'@

Write-Host "[OK] Minimal ishlaydigan versiya yaratildi." -ForegroundColor Green