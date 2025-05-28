#!/usr/bin/env powershell

# Gemini AI Agent Setup Script
# This script will configure your Gemini API key as a GitHub secret

Write-Host "🤖 Setting up Gemini AI Agent Integration" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Check if GitHub CLI is available
if (-not (Get-Command "gh" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not available. Please install it first." -ForegroundColor Red
    Write-Host "   https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
try {
    $user = gh api user --jq '.login' 2>$null
    Write-Host "✅ Authenticated as: $user" -ForegroundColor Green
}
catch {
    Write-Host "❌ Not authenticated with GitHub CLI" -ForegroundColor Red
    Write-Host "   Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔐 Adding Gemini API Key to GitHub Secrets" -ForegroundColor Cyan
Write-Host ""

# Prompt for Gemini API key
Write-Host "Please enter your Gemini API key:" -ForegroundColor Yellow
Write-Host "(The key will be hidden as you type)" -ForegroundColor Gray
$geminiApiKey = Read-Host -AsSecureString
$geminiApiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($geminiApiKey))

if ([string]::IsNullOrWhiteSpace($geminiApiKeyPlain)) {
    Write-Host "❌ No API key provided. Exiting." -ForegroundColor Red
    exit 1
}

# Add the secret to GitHub
Write-Host ""
Write-Host "Adding GEMINI_API_KEY to GitHub repository secrets..." -ForegroundColor Blue

try {
    Write-Output $geminiApiKeyPlain | gh secret set GEMINI_API_KEY
    Write-Host "✅ GEMINI_API_KEY successfully added to GitHub secrets!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to add secret: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verify the secret was added
Write-Host ""
Write-Host "🔍 Verifying secrets..." -ForegroundColor Blue
$secrets = gh secret list --json name | ConvertFrom-Json
$geminiSecretExists = $secrets | Where-Object { $_.name -eq "GEMINI_API_KEY" }

if ($geminiSecretExists) {
    Write-Host "✅ GEMINI_API_KEY verified in repository secrets" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not verify GEMINI_API_KEY in secrets" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Gemini AI Agent Setup Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Your AI agent is now ready to use!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 How to test it:" -ForegroundColor Cyan
Write-Host "1. Create a new issue with the 'ai-agent' label" -ForegroundColor White
Write-Host "2. Or comment '@ai-agent' on any existing issue" -ForegroundColor White
Write-Host "3. Watch the magic happen in GitHub Actions!" -ForegroundColor White
Write-Host ""
Write-Host "📖 Example issue creation:" -ForegroundColor Cyan
Write-Host 'gh issue create --title "[AI-TASK] Add a new contact form" --body "Create a responsive contact form component with validation" --label "ai-agent,task"' -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Monitor workflow runs:" -ForegroundColor Cyan
$repoInfo = gh repo view --json owner,name | ConvertFrom-Json
Write-Host "https://github.com/$($repoInfo.owner.login)/$($repoInfo.name)/actions" -ForegroundColor Blue
Write-Host ""

# Clear the sensitive variable
$geminiApiKeyPlain = $null
[System.GC]::Collect()

Write-Host "⚡ Your AI agent is powered by Gemini 1.5 Pro!" -ForegroundColor Magenta
