# UCoach - AI Gym Coach

An AI-powered gym coaching app built with Expo (React Native), Node.js, and a Python ML service for real-time exercise analysis.

## Prerequisites

Make sure you have these installed before running:

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.10+ | [python.org](https://www.python.org/) |
| **Expo Go** | Latest | Install from App Store / Play Store on your phone |

## Quick Start (One Command)

```powershell
# 1. Clone the repo and cd into it
cd gym-coach

# 2. Install frontend dependencies (first time only)
npm install

# 3. Install backend dependencies (first time only)
cd backend && npm install && cd ..

# 4. Install ML dependencies (first time only)
cd ml_service && pip install -r ptt/requirements.txt && cd ..

# 5. Start everything
npm run dev
```

That's it. This single command starts **all 3 services**:

| Service | Port | What it does |
|---------|------|-------------|
| Expo dev server | 8081 | Serves the React Native app |
| Node.js backend | 5825 | REST API, auth, database |
| Python ML service | 8010 | Exercise pose analysis |

> **Note:** The app **automatically detects your computer's IP address** so you don't need to change any config files when switching networks.

## Connecting Your Phone

1. Make sure your phone and computer are on the **same WiFi network**
2. Open **Expo Go** on your phone
3. Scan the QR code shown in the terminal

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all 3 services at once |
| `npm run start` | Start only the Expo dev server |
| `npm run backend` | Start only the Node.js backend |
| `npm run ml` | Start only the Python ML service |

## Project Structure

```
gym-coach/
  app/              # React Native screens (Expo Router file-based routing)
    (tabs)/          # Tab navigation screens (home, camera, workouts, etc.)
    config/          # App configuration (API URL auto-detection)
    context/         # React contexts (Auth, Theme)
    components/      # Reusable UI components
  backend/           # Node.js + Express API
    routes/          # API route handlers
    controllers/     # Business logic
    db/              # Database connection (Supabase PostgreSQL)
    models/          # Data models
  ml_service/        # Python FastAPI service
    ptt/             # Pose tracking & analysis engine
  assets/            # Images, icons, fonts
  start-all.ps1     # One-command startup script
```

## Environment Setup

The backend requires a `backend/config.env` file with:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_here
```

> **This file is gitignored.** Ask a team member for the credentials, or check the team's shared docs.

## Troubleshooting

**"Cannot find module" error in backend**
```powershell
cd backend && npm install
```

**Port already in use**
The startup script automatically kills stale processes. If it still happens:
```powershell
# Find and kill whatever is on port 5825 or 8010
Get-NetTCPConnection -LocalPort 5825 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**App can't connect to backend on phone**
- Make sure phone and computer are on the same WiFi
- Check that Windows Firewall isn't blocking port 5825
