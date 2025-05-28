# GitHub Repository Setup Script
# Run this script to set up your private repository and push your code

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Green
    git init
}

# Refresh PATH to include newly installed GitHub CLI
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

# Check if GitHub CLI is installed
if (-not (Get-Command "gh" -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI (gh) is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Get repository name
$repoName = Read-Host "Enter repository name (default: danielsbonnin.com)"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "danielsbonnin.com"
}

# Create GitHub repository
Write-Host "Creating private GitHub repository: $repoName" -ForegroundColor Green
gh repo create $repoName --private --description "Personal website with AI agent automation"

# Add remote origin
$username = gh api user --jq '.login'
git remote add origin "https://github.com/$username/$repoName.git"

# Add all files
Write-Host "Adding files to git..." -ForegroundColor Green
git add .

# Commit files
Write-Host "Creating initial commit..." -ForegroundColor Green
git commit -m "Initial commit: Next.js website with AI agent automation system

- Added GitHub Actions workflows for AI agent automation
- Created issue templates for task assignment
- Configured CI/CD pipeline
- Added comprehensive documentation"

# Set default branch to main
git branch -M main

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push -u origin main

Write-Host "Repository setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/$username/$repoName"
Write-Host "2. Go to Settings > Actions > General"
Write-Host "3. Enable 'Allow all actions and reusable workflows'"
Write-Host "4. Create your first AI agent task by opening an issue!"
Write-Host ""
Write-Host "Read AI-AGENT-README.md for detailed usage instructions"
