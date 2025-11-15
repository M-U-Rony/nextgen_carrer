@echo off
echo Cleaning Next.js build cache...
echo.

REM Kill any running Node.js processes
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul 2>&1

REM Remove .next directory
if exist .next (
    echo Removing .next directory...
    rmdir /s /q .next
    echo .next directory removed.
) else (
    echo .next directory not found.
)

REM Remove cache
if exist node_modules\.cache (
    echo Removing node_modules cache...
    rmdir /s /q node_modules\.cache
    echo Cache removed.
)

echo.
echo Clean complete! Run 'npm run dev' to start the dev server.
pause

