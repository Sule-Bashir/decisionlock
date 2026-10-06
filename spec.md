# DecisionLock AI — Technical Specification

## Architecture
Frontend (Next.js on Vercel)
        ↓
Backend API (Node/Express on Render)
        ↓
Groq API (conflict detection + fix)

## Data Model
Project:
  id: string
  name: string
  description: string
  createdAt: timestamp

Rule:
  id: string
  projectId: string
  text: string
  category: "technology" | "security" | "process"
  importance: "low" | "medium" | "critical"

ScanResult:
  id: string
  projectId: string
  inputText: string
  complianceScore: number (0-100)
  satisfied: Rule[]
  violations: Violation[]
  createdAt: timestamp

Violation:
  ruleId: string
  ruleText: string
  risk: "low" | "medium" | "high"
  explanation: string
  suggestedFix: string

## API Endpoints

POST /api/projects
  body: { name, description }
  returns: Project

GET /api/projects/:id
  returns: Project with rules

POST /api/projects/:id/rules
  body: { text, category, importance }
  returns: Rule

POST /api/projects/:id/scan
  body: { inputText }
  returns: ScanResult

POST /api/projects/:id/fix
  body: { inputText, violations }
  returns: { fixedText }

## AI Prompt Strategy

### Scan Prompt
System: You are a compliance checker. Given a list of project rules and a block of AI-generated output, identify which rules are satisfied and which are violated. Return JSON only.

User: 
RULES:
{rule list}

AI OUTPUT:
{input text}

Return:
{
  "complianceScore": number,
  "satisfied": [rule ids],
  "violations": [
    { "ruleId": string, "risk": string, "explanation": string, "suggestedFix": string }
  ]
}

### Fix Prompt
System: Rewrite the AI output so it respects all project rules. Return only the corrected text.

## Frontend Components
- ProjectList
- ProjectForm
- RuleList
- RuleForm
- ScanInput
- ScanResultView (score bar, satisfied list, violations list)
- FixButton + FixedOutputView

## Deployment
- GitHub repo contains: scope.md, prd.md, spec.md, frontend/, backend/
- Vercel: connected to frontend/ folder
- Render: connected to backend/ folder
- Environment variables: GROQ_API_KEY on Render
