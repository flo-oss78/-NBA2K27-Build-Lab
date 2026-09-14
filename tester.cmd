@echo off
setlocal EnableExtensions
chcp 65001 >nul
title NBA 2K27 Build Lab - tests

rem Lance les tests sans rien publier.
rem   tester.cmd          fichiers locaux
rem   tester.cmd --prod   site en production
cd /d "%~dp0"

set "NODE=node"
where node >nul 2>nul || set "NODE=%ProgramFiles%\nodejs\node.exe"
"%NODE%" outils\tests.mjs %*
set "CODE=%errorlevel%"

echo.
pause
exit /b %CODE%
