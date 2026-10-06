import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { execFileSync } from "child_process";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const projects = new Map();

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// Use curl instead of Node fetch — works reliably on Termux
function curlPost(url, apiKey, bodyObj) {
  const args = [
    "-s", "-S", "--fail-with-body", "--max-time", "60",
    "-X", "POST", url,
    "-H", "Content-Type: application/json",
    "-H", `Authorization: Bearer ${apiKey}`,
    "-d", JSON.stringify(bodyObj)
  ];
  const stdout = execFileSync("curl", args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  return JSON.parse(stdout);
}

app.post("/api/projects", (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const id = newId();
  const project = {
    id,
    name,
    description: description || "",
    rules: [],
    createdAt: new Date().toISOString()
  };
  projects.set(id, project);
  res.json(project);
});

app.get("/api/projects/:id", (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  res.json(project);
});

app.post("/api/projects/:id/rules", (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });

  const { text, category, importance } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  const rule = {
    id: newId(),
    text,
    category: category || "technology",
    importance: importance || "critical"
  };
  project.rules.push(rule);
  res.json(rule);
});

app.post("/api/projects/:id/scan", async (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });

  const { inputText } = req.body;
  if (!inputText) return res.status(400).json({ error: "inputText is required" });

  if (project.rules.length === 0) {
    return res.status(400).json({ error: "project has no rules yet" });
  }

  const rulesList = project.rules
    .map((r, i) => `${i + 1}. [${r.importance}] ${r.text}`)
    .join("\n");

  const prompt = `You are a strict compliance checker for a software project.

PROJECT RULES:
${rulesList}

AI-GENERATED OUTPUT TO CHECK:
"""
${inputText}
"""

Analyze the AI output against each rule. Return ONLY valid JSON, no markdown, no explanation, in this exact shape:
{
  "complianceScore": <number 0-100>,
  "satisfied": [<rule numbers that are respected>],
  "violations": [
    {
      "ruleNumber": <number>,
      "risk": "low" | "medium" | "high",
      "explanation": "<why this violates the rule>",
      "suggestedFix": "<short concrete fix>"
    }
  ]
}`;

  try {
    const data = curlPost(GROQ_URL, GROQ_API_KEY, {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You return only valid JSON. No markdown fences." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });

    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(502).json({ error: "model returned invalid JSON", raw: content });
    }

    parsed.violations = (parsed.violations || []).map(v => {
      const rule = project.rules[v.ruleNumber - 1];
      return {
        ...v,
        ruleText: rule ? rule.text : "unknown rule"
      };
    });

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: "scan failed", detail: String(err) });
  }
});

app.post("/api/projects/:id/fix", async (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });

  const { inputText, violations } = req.body;
  if (!inputText) return res.status(400).json({ error: "inputText is required" });

  const rulesList = project.rules.map((r, i) => `${i + 1}. ${r.text}`).join("\n");
  const violationsList = (violations || [])
    .map(v => `- Rule: ${v.ruleText}\n  Problem: ${v.explanation}`)
    .join("\n");

  const prompt = `Rewrite the following AI-generated output so it respects ALL project rules.

PROJECT RULES:
${rulesList}

VIOLATIONS TO FIX:
${violationsList}

ORIGINAL OUTPUT:
"""
${inputText}
"""

Return ONLY the corrected output. No explanation, no markdown fences.`;

  try {
    const data = curlPost(GROQ_URL, GROQ_API_KEY, {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You rewrite code and text to comply with rules. Return only the corrected output." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    let fixedText = data.choices?.[0]?.message?.content || "";
    fixedText = fixedText.replace(/```/g, "").trim();

    res.json({ fixedText });
  } catch (err) {
    res.status(500).json({ error: "fix failed", detail: String(err) });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "decisionlock-backend" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DecisionLock backend listening on port ${PORT}`);
});
