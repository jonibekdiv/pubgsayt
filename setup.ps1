# ============================================================
#  RANGER ESPORTS — setup.ps1
#  Ishga tushirish: powershell -ExecutionPolicy Bypass -File setup.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "`n==> RANGER ESPORTS setup boshlandi: $root`n" -ForegroundColor Cyan

# --- Papkalar ---
$dirs = @(
  'src/components/ui','src/components/layout','src/components/leaderboard',
  'src/components/tournament','src/components/common',
  'src/context','src/hooks','src/lib','src/pages','src/services','src/types',
  'src/pages/organizer','src/pages/admin','src/pages/host'
)
foreach ($d in $dirs) {
  $p = Join-Path $root $d
  if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null }
}

function Write-File {
  param([string]$RelPath, [string]$Content)
  $full = Join-Path $root $RelPath
  $parent = Split-Path $full -Parent
  if ($parent -and -not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($full, $Content, $utf8)
  Write-Host "  [+] $RelPath" -ForegroundColor DarkGray
}

# ============ CONFIG ============
Write-File 'package.json' @'
{
  "name": "ranger-esports",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "framer-motion": "^11.3.19",
    "lucide-react": "^0.417.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.4",
    "vite": "^5.3.5"
  }
}
'@

Write-File 'vite.config.ts' @'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
'@

Write-File 'tsconfig.json' @'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "vite.config.ts"]
}
'@

Write-File 'tailwind.config.ts' @'
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { base: '#050914', deep: '#07111F', panel: '#0B1324' },
        brand: { 400: '#3D96FF', 500: '#1E88FF', 600: '#1473FF', 700: '#0B57CC' },
        ink: { DEFAULT: '#FFFFFF', muted: '#CBD5E1', faint: '#64748B' },
        line: '#16233C',
        success: '#22C55E', warning: '#F59E0B', danger: '#EF4444'
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,.45)',
        glow: '0 0 0 1px rgba(30,136,255,.35), 0 8px 28px -6px rgba(30,136,255,.45)'
      },
      keyframes: {
        'pulse-live': { '0%,100%': { opacity: '1' }, '50%': { opacity: '.35' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } }
      },
      animation: {
        'pulse-live': 'pulse-live 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite'
      }
    }
  }
} satisfies Config;
'@

Write-File 'postcss.config.js' 'export default { plugins: { tailwindcss: {}, autoprefixer: {} } };'

Write-File 'index.html' @'
<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <meta name="theme-color" content="#050914"/>
  <title>Ranger Esports — PUBG Tournament Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet"/>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
'@

Write-File '.gitignore' "node_modules`ndist`n*.local`n.DS_Store`n.env"

Write-File 'src/index.css' @'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root { color-scheme: dark; }
  html, body, #root { height: 100%; }
  body {
    @apply bg-bg-base text-ink font-sans antialiased;
    background-image:
      radial-gradient(900px 500px at 12% -8%, rgba(20,115,255,.14), transparent 62%),
      radial-gradient(700px 420px at 92% 4%, rgba(30,136,255,.10), transparent 60%);
    background-attachment: fixed;
  }
}

@layer components {
  .glass { @apply bg-white/[.035] backdrop-blur-xl border border-white/[.07] shadow-glass; }
  .glass-strong { @apply bg-bg-panel/85 backdrop-blur-2xl border border-white/[.08] shadow-glass; }
  .surface { @apply bg-bg-panel border border-line rounded-2xl; }
  .grid-lines {
    background-image:
      linear-gradient(rgba(30,136,255,.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(30,136,255,.055) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { scrollbar-width: none; }
}
'@

Write-File 'src/vite-env.d.ts' '/// <reference types="vite/client" />'

Write-Host "`n[OK] Asosiy config fayllar yaratildi." -ForegroundColor Green
Write-Host "[OK] Endi: npm install && npm run dev`n" -ForegroundColor Green