import { useEffect, useRef, useState } from "react"
import { Sparkles, Zap, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const tools = [
  {
    name: "News Retriever",
    description: "Search recent social + news data for a ticker.",
  },
  {
    name: "Sentiment Scorer",
    description: "Classifies tone per document or tweet.",
  },
  {
    name: "Strategy Composer",
    description: "Chains agents automatically to answer complex requests.",
  },
  {
    name: "Portfolio Hooks",
    description: "Access Snowflake positions, PnL, and transaction history.",
  },
]

export default function Strategy() {
  const [autoOrchestrate, setAutoOrchestrate] = useState(true)
  const [goal, setGoal] = useState("Build a short-term plan for BTC using news + sentiment.")
  const [token, setToken] = useState("BTC")
  const { user } = useAuth()
  const [plannerResult, setPlannerResult] = useState<any | null>(null)
  const [plannerLoading, setPlannerLoading] = useState(false)
  const [plannerError, setPlannerError] = useState<string | null>(null)
  const sourceRef = useRef<EventSource | null>(null)

  const runPlanner = () => {
    if (!goal.trim()) return
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
    setPlannerLoading(true)
    setPlannerError(null)
    setPlannerResult({ steps: [], final_answer: "" })
    try {
      const params = new URLSearchParams({
        goal,
        token,
        user_id: user?.user_id || "U01",
        max_steps: "4",
        stop_score: "0.55",
      })
      const source = new EventSource(
        `http://127.0.0.1:8000/orchestrate/plan-sse?${params.toString()}`
      )
      sourceRef.current = source

      source.onmessage = (event) => {
        if (!event.data) return
        if (event.data === "Planner started") return
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === "step") {
            setPlannerResult((prev: any) => ({
              ...prev,
              steps: [...(prev?.steps || []), payload.data],
            }))
          } else if (payload.type === "final") {
            setPlannerResult((prev: any) => ({
              ...prev,
              final_answer: payload.final_answer,
              context: payload.context,
            }))
            source.close()
            sourceRef.current = null
            setPlannerLoading(false)
          }
        } catch (error) {
          console.error("Failed to parse SSE payload", error, event.data)
        }
      }

      source.onerror = () => {
        setPlannerError("Planner stream failed.")
        source.close()
        sourceRef.current = null
        setPlannerLoading(false)
      }
    } catch (err) {
      setPlannerError(err instanceof Error ? err.message : "Planner failed.")
      setPlannerResult(null)
      setPlannerLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.close()
      }
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white p-10 space-y-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-gray-500">Strategic Lab</p>
        <h1 className="text-4xl font-bold">Plan mode</h1>
        <p className="text-gray-400 max-w-3xl">
          Orchestrate the agents, tools, and data sources we’ve built. Select flows manually
          or let the LLM compose a playbook that fuses news, sentiment, market structure, and
          behavioral insights into one actionable brief.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoOrchestrate((prev) => !prev)}
            className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
              autoOrchestrate ? "bg-[#587BFA] text-white" : "bg-neutral-900 text-gray-300"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {autoOrchestrate ? "LLM Orchestrator ON" : "LLM Orchestrator OFF"}
          </button>
          <span className="text-xs text-gray-500">
            When ON, Grok chooses the necessary agents in sequence.
          </span>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">LLM orchestration</h2>
              <button
                onClick={runPlanner}
                disabled={plannerLoading}
                className="px-4 py-2 rounded-2xl bg-white text-black text-sm font-semibold flex items-center gap-2 disabled:bg-neutral-800 disabled:text-gray-500"
              >
                {plannerLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Run plan
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-500">User goal</label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#587BFA]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-500">Token</label>
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#587BFA]"
                />
                <label className="text-xs uppercase tracking-wide text-gray-500">User ID</label>
                <input
                  value={user?.user_id || "U01"}
                  disabled
                  className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-gray-400"
                />
              </div>
            </div>
            {plannerError && <p className="text-sm text-red-400">{plannerError}</p>}
            {plannerResult && (
              <div className="rounded-2xl border border-neutral-800 p-4 space-y-3 text-sm">
                <p className="text-gray-400">
                  <strong>Final answer:</strong> {plannerResult.final_answer}
                </p>
                <div className="space-y-2">
                  {plannerResult.steps?.map((step: any) => (
                    <div key={`${step.step}-${step.action}`} className="border-b border-neutral-800 pb-2">
                      <p className="text-xs text-gray-500 flex items-center justify-between">
                        <span>Step {step.step}: {step.action}</span>
                        {typeof step.score === "number" && (
                          <span className="text-[11px] text-gray-500">score {(step.score).toFixed(2)}</span>
                        )}
                      </p>
                      <p className="text-gray-300">{step.thought}</p>
                      {Array.isArray(step.candidate_tools) && (
                        <ul className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                          {step.candidate_tools.map((c: any) => (
                            <li key={c.name} className="px-2 py-1 rounded-full border border-neutral-700">
                              {c.name}: {(Number(c.score) || 0).toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-gray-400">{step.result}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
            <h2 className="text-xl font-semibold">Toolbox</h2>
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="rounded-2xl border border-neutral-800 px-4 py-3 space-y-1"
              >
                <p className="font-semibold">{tool.name}</p>
                <p className="text-sm text-gray-400">{tool.description}</p>
                <button className="text-xs text-[#587BFA] flex items-center gap-1 hover:text-white">
                  <Zap className="w-4 h-4" /> Trigger
                </button>
              </div>
            ))}
          </div>

          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-3">
            <h2 className="text-xl font-semibold">Last orchestration</h2>
            <p className="text-sm text-gray-400">
              Track the last plan the LLM executed. This helps you audit decisions before
              committing to trades.
            </p>
            <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-4 text-sm text-gray-300 space-y-2">
              <p className="text-xs text-gray-500">03:24 UTC</p>
              <p>
                <strong>Flow:</strong> News Agent → Reasoning Agent → Behavioral Agent
              </p>
              <p>
                <strong>Outcome:</strong> Highlighted ETH mean-reversion setup with BTC hedge.
              </p>
              <button className="text-xs text-[#587BFA] hover:text-white">View report</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
