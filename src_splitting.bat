@echo off
echo Starting lib/demo split...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"
# Create target folders
New-Item -ItemType Directory -Force -Path '.\src\lib' | Out-Null;
New-Item -ItemType Directory -Force -Path '.\src\lib\pages' | Out-Null;
New-Item -ItemType Directory -Force -Path '.\src\demo' | Out-Null;
New-Item -ItemType Directory -Force -Path '.\src\demo\pages' | Out-Null;
New-Item -ItemType Directory -Force -Path '.\src\demo\components' | Out-Null;

# Move library folders
Move-Item '.\src\api' '.\src\lib\api';
Move-Item '.\src\assets' '.\src\lib\assets';
Move-Item '.\src\hooks' '.\src\lib\hooks';
Move-Item '.\src\types' '.\src\lib\types';
Move-Item '.\src\utils' '.\src\lib\utils';

# Move components
Move-Item '.\src\components' '.\src\lib\components';
if (Test-Path '.\src\lib\components\test') { Move-Item '.\src\lib\components\test' '.\src\demo\components\test' };
if (Test-Path '.\src\lib\components\gis_viewer') { Move-Item '.\src\lib\components\gis_viewer' '.\src\demo\components\gis_viewer' };

# Move library pages
Move-Item '.\src\pages\admin' '.\src\lib\pages\admin';
Move-Item '.\src\pages\DAMap.tsx' '.\src\lib\pages\DAMap.tsx';
Move-Item '.\src\pages\LayerDesigner.tsx' '.\src\lib\pages\LayerDesigner.tsx';

# Move demo pages
Move-Item '.\src\pages\GeoserverTest.tsx' '.\src\demo\pages\GeoserverTest.tsx';
Move-Item '.\src\pages\GISViewer.tsx' '.\src\demo\pages\GISViewer.tsx';
Move-Item '.\src\pages\MapAdmin.tsx' '.\src\demo\pages\MapAdmin.tsx';
Move-Item '.\src\pages\MapOverlayer.tsx' '.\src\demo\pages\MapOverlayer.tsx';
Move-Item '.\src\pages\TestIDWLayer.tsx' '.\src\demo\pages\TestIDWLayer.tsx';
Move-Item '.\src\pages\CustomizeAttributeTable.tsx' '.\src\demo\pages\CustomizeAttributeTable.tsx';

# Remove empty pages folder
if (Test-Path '.\src\pages') { Remove-Item '.\src\pages' -Force -ErrorAction SilentlyContinue };

# Move demo shell
Move-Item '.\src\App.tsx' '.\src\demo\App.tsx';
Move-Item '.\src\main.tsx' '.\src\demo\main.tsx';
Move-Item '.\src\layouts' '.\src\demo\layouts';
Move-Item '.\src\routes' '.\src\demo\routes';

# Move library root files
Move-Item '.\src\config.ts' '.\src\lib\config.ts';
Move-Item '.\src\damap.bootstrap.ts' '.\src\lib\damap.bootstrap.ts';
Move-Item '.\src\damap.css' '.\src\lib\damap.css';
Move-Item '.\src\damap.ts' '.\src\lib\damap.ts';
Move-Item '.\src\vite-env.d.ts' '.\src\lib\vite-env.d.ts';

Write-Host '';
Write-Host '✔ Split complete' -ForegroundColor Green;
"

echo Done.
pause