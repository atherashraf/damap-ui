@echo off
echo Pushing src/lib to damap-lib...
git subtree split --prefix=src/lib -b damap-lib-branch
git push damap-lib damap-lib-branch:main --force
git branch -D damap-lib-branch
echo Done.
pause