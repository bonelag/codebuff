@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "BINARY_NAME=cusbuff"
set "VERSION=1.0.679-local"
if not "%~1"=="" set "VERSION=%~1"

set "ROOT_DIR=%CD%"
set "OUTPUT_DIR=%ROOT_DIR%\dist-local\%BINARY_NAME%"

rem Public env values used by the compiled CLI. The custom model endpoint is
rem read at runtime from the .env file copied next to cusbuff.exe.
set "NEXT_PUBLIC_CB_ENVIRONMENT=prod"
set "NEXT_PUBLIC_CODEBUFF_APP_URL=https://codebuff.com"
set "NEXT_PUBLIC_SUPPORT_EMAIL=support@codebuff.com"
set "NEXT_PUBLIC_POSTHOG_API_KEY=phc_dummy_posthog_key"
set "NEXT_PUBLIC_POSTHOG_HOST_URL=https://us.i.posthog.com"
set "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy_publishable"
set "NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL=https://billing.stripe.com/p/login/test_dummy"
set "NEXT_PUBLIC_WEB_PORT=3000"

echo Building %BINARY_NAME%.exe version %VERSION%...
pushd "%ROOT_DIR%\cli"
call bun .\scripts\build-binary.ts "%BINARY_NAME%" "%VERSION%"
if errorlevel 1 (
  popd
  echo.
  echo Build failed.
  exit /b 1
)
popd

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

copy /Y "%ROOT_DIR%\cli\bin\%BINARY_NAME%.exe" "%OUTPUT_DIR%\%BINARY_NAME%.exe" >nul
if errorlevel 1 (
  echo.
  echo Failed to copy %BINARY_NAME%.exe. Close any running %BINARY_NAME%.exe and try again.
  exit /b 1
)

copy /Y "%ROOT_DIR%\cli\bin\tree-sitter.wasm" "%OUTPUT_DIR%\tree-sitter.wasm" >nul
if errorlevel 1 (
  echo.
  echo Failed to copy tree-sitter.wasm.
  exit /b 1
)

if exist "%ROOT_DIR%\.env" (
  copy /Y "%ROOT_DIR%\.env" "%OUTPUT_DIR%\.env" >nul
) else (
  > "%OUTPUT_DIR%\.env" (
    echo NEXT_PUBLIC_CB_ENVIRONMENT=prod
    echo NEXT_PUBLIC_CODEBUFF_APP_URL=https://codebuff.com
    echo NEXT_PUBLIC_SUPPORT_EMAIL=support@codebuff.com
    echo NEXT_PUBLIC_POSTHOG_API_KEY=phc_dummy_posthog_key
    echo NEXT_PUBLIC_POSTHOG_HOST_URL=https://us.i.posthog.com
    echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy_publishable
    echo NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL=https://billing.stripe.com/p/login/test_dummy
    echo NEXT_PUBLIC_WEB_PORT=3000
    echo.
    echo CODEBUFF_OPENAI_BASE_URL=http://localhost:20128/v1
    echo CODEBUFF_OPENAI_API_KEY=dummy-local-key
    echo CODEBUFF_OPENAI_MODEL=ds/deepseek-v4-pro-max
  )
)

echo.
echo Built portable custom CLI:
echo   %OUTPUT_DIR%\%BINARY_NAME%.exe
echo.
echo Runtime env:
echo   %OUTPUT_DIR%\.env
echo.
echo Run:
echo   cd /d "%OUTPUT_DIR%"
echo   .\%BINARY_NAME%.exe

endlocal