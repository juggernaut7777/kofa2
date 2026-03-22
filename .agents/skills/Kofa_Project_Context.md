---
name: KOFA Project Context & Memory
description: Acts as the core memory bank for the KOFA project, helping the agent quickly understand architecture, previous fixes, and project goals.
---

# KOFA Project Core Memory

When working on the KOFA project (kofaapp.me), use this foundational knowledge to guide your decisions.

## Project Overview
KOFA is an AI-powered business management SAAS platform for African vendors.
**Core 5 Features:**
1. Product Inventory (add, track stock, scan-to-add)
2. Walk-in Sales (quick sale + receipt via WhatsApp)
3. Credit/Debt Tracking (+ "Send WhatsApp reminder" button)
4. Public Storefront (shareable link + cart)
5. AI Assistant (natural language commands like "I sold 3 bags of rice")

## Known Architecture & Quirks
- **Database:** Azure SQL. The schema is defined in `models.py` but we recently ran a `MASTER_MIGRATION.sql` to force the DB into shape. 
- **Critical Field Transition:** Older code used `vendor_id`. The application now strictly uses `user_id`. Watch out for legacy code trying to use `vendor_id`.
- **Frontend App:** A React SPA served statically by FastAPI in production (or independently via Vite in dev).
- **Recent Fixes (Do NOT revert):**
  - Wrapped `vendor_id` updates in `EXEC()` inside SQL migrations to bypass T-SQL parse-time errors.
  - Removed duplicate `POST /products/import` routes in FastAPI.
  - Fixed React Error #310 in `BusinessAI.jsx` by moving hooks above the early return.

## Agent Approach for KOFA
- **Scrape to Learn:** If encountering an unfamiliar API (like Resend for emails, or WhatsApp Cloud API), use web scraping tools to read the official docs before guessing.
- **Action over Talk:** When a bug is found, fix it proactively. 
- **Clean Code:** Delete unused stubs/code immediately to reduce technical debt.
