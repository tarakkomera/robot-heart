@echo off
cd /d "c:\Users\tarak\Documents\Codex\2026-09-07\files-pasted-by-the-user-absolutely\robot-heart"
echo Starting SQLite Database Server...
start /b node server/index.js
echo Starting Robot Heart dev server...
call npm run dev -- --force

