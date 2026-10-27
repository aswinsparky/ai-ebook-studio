# Script to run all test suites
Write-Host "=== 1. Running Backend Tests (pytest) ===" -ForegroundColor Green
$env:PYTHONPATH = "backend"
& "backend\.venv\Scripts\pytest.exe" backend\tests -v

Write-Host "`n=== 2. Running Frontend Unit Tests (Vitest) ===" -ForegroundColor Green
Set-Location frontend
& npm.cmd test

Write-Host "`n=== 3. Testing Frontend Production Build ===" -ForegroundColor Green
& npm.cmd run build

Write-Host "`nAll tests completed successfully!" -ForegroundColor Cyan
Set-Location ..

