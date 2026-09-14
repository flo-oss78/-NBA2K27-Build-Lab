@echo off
setlocal EnableExtensions
chcp 65001 >nul
title NBA 2K27 Build Lab - deploiement

rem Toujours depuis le dossier du projet, d'ou que ce script soit lance :
rem double-clic, raccourci, ou terminal ouvert dans un autre dossier.
rem (Un deploiement lance depuis C:\Users\flore a deja failli publier le
rem dossier personnel entier.)
cd /d "%~dp0"

echo.
echo  NBA 2K27 Build Lab - deploiement
echo  Dossier : %CD%
echo.

rem Garde-fou : on ne publie jamais un dossier qui n'est pas ce projet.
if not exist "wrangler.toml" goto mauvais_dossier
if not exist "index.html" goto mauvais_dossier
if not exist "functions\api\builds.js" goto mauvais_dossier

set "NODE=node"
where node >nul 2>nul || set "NODE=%ProgramFiles%\nodejs\node.exe"
"%NODE%" --version >nul 2>nul || goto pas_de_node
rem Chemin COMPLET de npx.cmd : appele par son seul nom entre guillemets
rem ("npx"), cmd.exe perd le dossier du script, et npx.cmd cherche alors ses
rem fichiers dans le projet (Cannot find module ...\node_modules\npm\bin\npx-cli.js).
set "NPX="
for /f "delims=" %%P in ('where npx.cmd 2^>nul') do if not defined NPX set "NPX=%%P"
if not defined NPX set "NPX=%ProgramFiles%\nodejs\npx.cmd"
if not exist "%NPX%" goto pas_de_node

echo [1/4] Tests sur les fichiers locaux
"%NODE%" outils\tests.mjs
if errorlevel 1 goto tests_ko

echo.
echo [2/4] Etat du depot git
set "SALE="
for /f "delims=" %%L in ('git status --porcelain 2^>nul') do set "SALE=1"
if defined SALE (
  echo  Des modifications ne sont pas commitees : la production ne correspondra pas a GitHub.
  choice /C ON /N /M " Deployer quand meme ? [O/N] "
  if errorlevel 2 goto annule
) else (
  echo  Depot propre.
)
set "AVANCE=0"
for /f %%N in ('git rev-list --count @{u}..HEAD 2^>nul') do set "AVANCE=%%N"
if not "%AVANCE%"=="0" echo  Attention : %AVANCE% commit^(s^) pas encore pousse^(s^) sur GitHub.

echo.
echo [3/4] Deploiement sur Cloudflare Pages
rem --yes : npx installe sans demander confirmation une nouvelle version de
rem wrangler (sinon le script s'arrete sur « Ok to proceed? (y) »).
rem wrangler@4 : version explicite, pour que npx ignore une installation
rem globale de wrangler incomplete (AppData\Roaming\npm) qui plante au lancement.
call "%NPX%" --yes wrangler@4 pages deploy . --project-name=nba2k27-build-lab --commit-dirty=true
if errorlevel 1 goto deploiement_ko

echo.
echo [4/4] Verification de la production
"%NODE%" outils\tests.mjs --prod
if errorlevel 1 goto prod_ko

echo.
echo  Deploiement termine et verifie en production.
goto fin_ok

:mauvais_dossier
echo  ERREUR : ce dossier n'est pas le projet NBA 2K27 Build Lab.
echo  Le script doit rester a la racine du projet, a cote de index.html.
goto fin_ko

:pas_de_node
echo  ERREUR : Node.js est introuvable. Installe-le depuis https://nodejs.org
goto fin_ko

:tests_ko
echo.
echo  DEPLOIEMENT ANNULE : des tests echouent sur les fichiers locaux.
echo  Rien n'a ete publie. Corrige les erreurs ci-dessus puis relance.
goto fin_ko

:annule
echo  Deploiement annule. Rien n'a ete publie.
goto fin_ko

:deploiement_ko
echo.
echo  ERREUR : Wrangler a echoue. Si la connexion a expire : npx wrangler login
goto fin_ko

:prod_ko
echo.
echo  ATTENTION : le deploiement est passe, mais la production ne repond pas
echo  comme attendu. Voir les tests en echec ci-dessus.
goto fin_ko

:fin_ok
echo.
pause
exit /b 0

:fin_ko
echo.
pause
exit /b 1
