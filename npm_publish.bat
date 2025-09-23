@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: Get version from package.json
for /f "delims=" %%v in ('node -p "require('./package.json').version" 2^>nul') do set VERSION=%%v

if "%VERSION%"=="" (
  echo [ERROR] Could not read version from package.json. Is it valid JSON?
  exit /b 1
)

echo.
echo ======================================
echo 📦 Preparing to publish damap v%VERSION%
echo ======================================
echo.

:: Run build
npm run build
if errorlevel 1 (
  echo [ERROR] Build failed.
  exit /b 1
)

:: Confirm publish
set /p confirm=Are you sure you want to publish v%VERSION% to npm? (y/N):
if /i not "%confirm%"=="y" (
  echo [INFO] Publish cancelled.
  exit /b 0
)

:: Run publish
npm publish --access=public
if errorlevel 1 (
  echo [ERROR] Publish failed.
  exit /b 1
)

echo.
echo ✅ Successfully published damap v%VERSION% to npm!
echo.

endlocal
