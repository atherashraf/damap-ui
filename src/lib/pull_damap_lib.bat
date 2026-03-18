@echo off
echo Pulling damap-lib into src/lib...
git fetch damap-lib
git subtree pull --prefix=lib damap-lib main --squash
echo Done.
pause