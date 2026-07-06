@echo off
setlocal
@REM git subtree push --prefix=src/libs/damap damap-lib main
set REMOTE=damap-lib
set BRANCH=main
set PREFIX=src/libs/damap
set TEMP_BRANCH=damap-lib-sync

echo Splitting subtree from %PREFIX%...
git subtree split --prefix=%PREFIX% -b %TEMP_BRANCH%
if errorlevel 1 goto :error

echo Pushing %TEMP_BRANCH% to %REMOTE%/%BRANCH%...
git push %REMOTE% %TEMP_BRANCH%:%BRANCH% --force
if errorlevel 1 goto :error

echo Deleting temporary branch %TEMP_BRANCH%...
git branch -D %TEMP_BRANCH%
if errorlevel 1 goto :error

echo Done.
goto :eof

:error
echo Failed.
exit /b 1