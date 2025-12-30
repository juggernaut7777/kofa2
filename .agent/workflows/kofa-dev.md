---
description: Workflow for KOFA development - auto-run safe commands
---
# KOFA Development Workflow

// turbo-all

## Safe Commands (Auto-Run Enabled)
1. `git add -A` - Stage all changes
2. `git status` - Check git status  
3. `git log --oneline -5` - View recent commits
4. `npm run dev` - Start dev server
5. `npm install` - Install dependencies

## Deployment Commands
1. `git commit -m "message"` - Commit changes
2. `git push origin main` - Push to GitHub

## Notes
- Vercel auto-deploys from GitHub on push
- Heroku requires manual deploy from dashboard
