---
name: Web Scraper & Researcher
description: Enables the agent to autonomously scrape documentation, tutorials, and Github issues to solve complex problems and learn new frameworks.
---

# Web Research & Scraping Skill

When you encounter an unfamiliar API, a missing dependency, or a complex bug with third-party integrations (like Resend, WhatsApp Cloud API, or FastAPI edge cases), activate this skill.

## Core Directives

1. **Information Verification:**
   - Do not hallucinate API endpoints or payload structures.
   - If integrating a 3rd party tool, always use `search_web` to find the official documentation.
   - Use `read_url_content` or `browser_subagent` to read the actual docs page before writing the integration code.

2. **Learning & Memory Integration:**
   - When learning a new pattern from the web, explicitly document it in the project context so it isn't forgotten.
   - If a stack overflow post or GitHub issue thread solves a bug, summarize the solution in a comment above the patched code.

3. **KOFA Specific Research:**
   - Always prioritize finding specific solutions for FastAPI (Python 3.10+) and React 18+ integrations.
   - If looking for modern UI/UX components, search for "Accessible Tailwind CSS patterns" or "Framer Motion React examples" before building from scratch.
