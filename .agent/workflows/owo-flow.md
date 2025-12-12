---
description: Workflow for Owo Flow development - auto-run npm/expo commands
---

// turbo-all

## Start Mobile App (Expo)
```bash
cd c:\Users\USER\.gemini\antigravity\scratch\owo_flow\mobile
npx expo start
```

## Start Backend Server
```bash
cd c:\Users\USER\.gemini\antigravity\scratch\owo_flow
venv\Scripts\activate
uvicorn chatbot.main:app --reload --host 0.0.0.0
```

## Install NPM Packages
```bash
cd c:\Users\USER\.gemini\antigravity\scratch\owo_flow\mobile
npm install
```

## Run Tests
```bash
cd c:\Users\USER\.gemini\antigravity\scratch\owo_flow
pytest tests/
```
