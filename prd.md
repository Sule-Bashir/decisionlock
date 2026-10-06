# DecisionLock AI — Product Requirements Document

## Overview
DecisionLock is a web app that acts as a memory firewall for AI-assisted software projects. It prevents AI assistants from violating decisions the developer has already made.

## User Stories

### US-1: Create a Project
As a developer, I want to create a project so I can store its decisions in one place.
- Input: project name, description
- Output: project saved, dashboard shown

### US-2: Add a Decision
As a developer, I want to add a rule to my project so the system knows what to enforce.
- Input: rule text, category (technology / security / process), importance (low / medium / critical)
- Output: rule appears in project guard list

### US-3: Scan AI Output
As a developer, I want to paste AI-generated code and have it checked against my rules.
- Input: pasted text
- Output: compliance score, list of satisfied rules, list of violations with risk level

### US-4: Fix a Conflict
As a developer, I want the app to suggest a corrected version of the AI output.
- Input: click "Fix with AI"
- Output: corrected text that respects all project rules

## Screens
1. **Landing / Dashboard** — project list, create project button
2. **Project Detail** — rules list, "Check AI Output" button
3. **Scan Result** — compliance score, violations, fix button
4. **Fixed Output** — corrected text, copy button

## Non-Functional Requirements
- Mobile-responsive UI
- Scan result in under 5 seconds
- Clear visual distinction between satisfied rules and violations
- Works with pasted code in any language

## Tech Stack
- Frontend: Next.js, deployed on Vercel
- Backend: Node.js/Express, deployed on Render
- AI: Groq API for conflict detection and fix generation
