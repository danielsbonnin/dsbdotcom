
# Workflow Cleanup Script
echo "🧹 Cleaning up redundant GitHub Actions workflows..."

# Remove redundant AI Agent workflow (keep the fixed version)
echo "📌 Keeping ai-agent-fixed.yml as the primary AI Agent workflow"
echo "🗑️  Removing redundant ai-agent.yml..."
# gh api -X DELETE repos/:owner/:repo/actions/workflows/164863251

# Remove disabled workflow files
# rm ".github/workflows/gemini-ai-agent.yml.disabled"
# rm ".github/workflows/ai-agent-backup.yml.disabled"
# rm ".github/workflows/ai-agent-advanced.yml.disabled"
# rm ".github/workflows/ai-agent-advanced-fixed.yml.disabled"

echo "✅ Cleanup completed!"
