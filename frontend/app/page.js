"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const DEMO_RULES = [
  "Use PostgreSQL for the database.",
  "Never use Firebase.",
  "Never expose private user data.",
  "Payments must require human confirmation."
];

const DEMO_AI_OUTPUT = `const db = firebase.firestore();

app.get("/api/users", async (req, res) => {
  const users = await db.collection("users").get();
  const data = users.docs.map(d => ({
    email: d.data().email,
    name: d.data().name
  }));
  res.json(data);
});

app.post("/api/pay", async (req, res) => {
  await processPayment(req.body.amount);
  res.json({ success: true });
});`;

export default function Home() {
  const [screen, setScreen] = useState("landing");
  const [project, setProject] = useState(null);
  const [aiOutput, setAiOutput] = useState(DEMO_AI_OUTPUT);
  const [scanResult, setScanResult] = useState(null);
  const [fixedText, setFixedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function launchDemo() {
    setLoading(true);
    setError("");
    try {
      const pRes = await fetch(`${API}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "AgentPay",
          description: "Demo project for DecisionLock"
        })
      });
      const proj = await pRes.json();

      for (const text of DEMO_RULES) {
        await fetch(`${API}/api/projects/${proj.id}/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            category: "technology",
            importance: "critical"
          })
        });
      }

      const refreshed = await fetch(`${API}/api/projects/${proj.id}`);
      const fullProj = await refreshed.json();
      setProject(fullProj);
      setScreen("dashboard");
    } catch (e) {
      setError("Could not reach backend. Is it running on port 3001?");
    } finally {
      setLoading(false);
    }
  }

  async function runScan() {
    if (!project) return;
    setLoading(true);
    setError("");
    setScanResult(null);
    try {
      const res = await fetch(`${API}/api/projects/${project.id}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: aiOutput })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error + (data.detail ? ": " + data.detail : ""));
      } else {
        setScanResult(data);
      }
    } catch (e) {
      setError("Scan failed. Check the backend terminal for details.");
    } finally {
      setLoading(false);
    }
  }

  async function runFix() {
    if (!project || !scanResult) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/projects/${project.id}/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText: aiOutput,
          violations: scanResult.violations
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error + (data.detail ? ": " + data.detail : ""));
      } else {
        setFixedText(data.fixedText);
        setScreen("fixed");
      }
    } catch (e) {
      setError("Fix failed. Check the backend terminal for details.");
    } finally {
      setLoading(false);
    }
  }

  function scoreClass(score) {
    if (score < 50) return "low";
    if (score < 80) return "mid";
    return "high";
  }

  if (screen === "landing") {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">DecisionLock</div>
          <div className="status"><span className="dot"></span>ACTIVE</div>
        </div>
        <div className="hero">
          <h1>STOP AI FROM FORGETTING</h1>
          <p>An AI project memory firewall that prevents assistants from violating decisions you already made.</p>
          {error && <div className="error">{error}</div>}
          <button className="btn" onClick={launchDemo} disabled={loading}>
            {loading ? "Setting up..." : "Launch live demo"}
          </button>
        </div>
      </div>
    );
  }

  if (screen === "dashboard") {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">DecisionLock</div>
          <div className="status"><span className="dot"></span>ACTIVE</div>
        </div>

        <div className="card">
          <h2>Project</h2>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {project.name}
          </div>
          <div style={{ fontSize: 13, color: "#666" }}>
            {project.rules.length} rules enforced
          </div>
        </div>

        <div className="card">
          <h2>Project Guard</h2>
          {project.rules.map((r) => (
            <div key={r.id} className="rule">
              <span className="rule-check">✓</span>
              <span>{r.text}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Paste AI Output</h2>
          <textarea
            value={aiOutput}
            onChange={(e) => setAiOutput(e.target.value)}
          />
          {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
          <button
            className="btn"
            onClick={runScan}
            disabled={loading}
            style={{ marginTop: 12, width: "100%" }}
          >
            {loading ? "Scanning..." : "SCAN AI OUTPUT →"}
          </button>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <div>Analyzing against project rules...</div>
          </div>
        )}

        {scanResult && (
          <div className="card">
            <h2>DecisionLock Analysis</h2>
            <div className={`score ${scoreClass(scanResult.complianceScore)}`}>
              {scanResult.complianceScore}%
            </div>
            <div style={{ textAlign: "center", color: "#666", fontSize: 13, marginBottom: 20 }}>
              compliance score
            </div>

            {scanResult.violations.length === 0 ? (
              <div style={{ color: "#4ade80", textAlign: "center", padding: 20 }}>
                ✓ No conflicts detected
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, fontWeight: 600 }}>
                  ⚠ {scanResult.violations.length} CONFLICT{scanResult.violations.length > 1 ? "S" : ""} DETECTED
                </div>
                {scanResult.violations.map((v, i) => (
                  <div key={i} className="violation">
                    <span className={`risk ${v.risk}`}>{v.risk}</span>
                    <div className="violation-rule">"{v.ruleText}"</div>
                    <div className="violation-text">{v.explanation}</div>
                    <div className="violation-fix">Fix: {v.suggestedFix}</div>
                  </div>
                ))}
                <button
                  className="btn"
                  onClick={runFix}
                  disabled={loading}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  {loading ? "Fixing..." : "FIX CONFLICTS WITH AI"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (screen === "fixed") {
    return (
      <div className="container">
        <div className="header">
          <div className="logo">DecisionLock</div>
          <div className="status"><span className="dot"></span>ACTIVE</div>
        </div>

        <div className="card">
          <h2>Corrected Output</h2>
          <div style={{ fontSize: 13, color: "#4ade80", marginBottom: 12 }}>
            ✓ All project rules now respected
          </div>
          <div className="output">{fixedText}</div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setScreen("dashboard");
            setScanResult(null);
            setFixedText("");
          }}
          style={{ width: "100%" }}
        >
          ← Back to project
        </button>
      </div>
    );
  }

  return null;
}
