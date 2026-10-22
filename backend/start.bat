@echo off
REM Starts the CareerNet API on Windows. Double-click or run: backend\start.bat
cd /d "%~dp0"
if not exist .env (
  echo No .env found - copying .env.example. Edit DATABASE_URL, JWT_SECRET and GEMINI_API_KEY!
  copy .env.example .env
)
if not exist node_modules (
  echo Installing backend dependencies...
  call npm install
)
call npm run dev
