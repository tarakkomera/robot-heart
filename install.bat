@echo off
cd /d "c:\Users\tarak\Documents\Codex\2026-09-07\files-pasted-by-the-user-absolutely\robot-heart"
echo Installing resources for robot-heart...
call npx -y pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo pnpm failed, running npm install with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
echo.
echo Installation complete!
pause