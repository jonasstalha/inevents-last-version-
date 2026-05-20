@echo off
echo Deploying Firebase Storage rules...
firebase deploy --only storage
echo.
echo Storage rules deployed successfully!
pause
