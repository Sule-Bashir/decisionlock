# DecisionLock AI — Scope

## Problem
AI coding assistants forget project decisions and constraints. A developer tells the AI "use PostgreSQL, never Firebase," and twenty prompts later the AI suggests Firebase again. The result is repeated mistakes, inconsistent code, and code the developer cannot explain.

## Target User
Solo developers and small teams using AI coding assistants (Claude Code, Cursor, Codex, OpenCode) to build software.

## Core Value Proposition
DecisionLock is an AI project memory firewall. It stores the decisions and rules a project has committed to, then scans AI-generated output for violations before the developer accepts it.

## MVP Scope (In)
1. Create a project with a name and description.
2. Add decisions/rules to a project (e.g., "Use PostgreSQL," "Never expose user data").
3. Paste AI-generated code or text.
4. Scan the pasted output against the project's rules.
5. Display a compliance score, satisfied rules, and detected conflicts.
6. Offer an AI-powered fix for detected conflicts.

## Out of Scope
- User accounts and authentication
- Multi-user collaboration
- Real-time IDE integration
- Browser extensions
- Mobile native apps

## Success Criteria
A working end-to-end demo: create project → add rules → paste conflicting AI output → see conflict detected → see corrected output.
