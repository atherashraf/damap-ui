@echo off
setlocal

set REMOTE=damap-lib
set BRANCH=main
set PREFIX=src/libs/damap

echo Fetching %REMOTE%...
git fetch %REMOTE%
if errorlevel 1 goto :error

echo Pulling subtree into %PREFIX%...
git subtree pull --prefix=%PREFIX% %REMOTE% %BRANCH% --squash
if errorlevel 1 goto :error

echo Done.
goto :eof

:error
echo Failed.
exit /b 1