import { useState } from "react"
import { Check, Sparkles, Zap } from "lucide-react"

const agents = [
  {
    name: "News Agent",
    description: "Fetches latest token sentiment from X and enriches with Grok titles + sentiment.",
    outputs: ["Docs cache", "Per-post sentiment"],
  },
  {
    name: "Reasoning Agent",
    description: "Grok analysis with dynamic context packing for precise answers.",
    outputs: ["Structured answer", "Source citations"],
  },
  {
    name: "Behavioral Agent",
    description: "Studies transaction history to infer trader persona and style-matched coins.",
    outputs: ["Persona summary", "Ranked tokens"],
  },
  {
    name: "Market Data",
    description: "CoinGecko historical prices, sparkline-ready data, and volatility snapshots.",
    outputs: ["Time-series data", "Volatility bands"],
  },
]

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
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [autoOrchestrate, setAutoOrchestrate] = useState(true)

  const toggleAgent = (name: string) => {
    setSelectedAgents((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    )
  }

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
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Available agents</h2>
              <span className="text-sm text-gray-500">{selectedAgents.length} selected</span>
            </div>
            <div className="space-y-4">
              {agents.map((agent) => (
                <button
                  key={agent.name}
                  onClick={() => toggleAgent(agent.name)}
                  className={`w-full text-left rounded-2xl p-4 border transition ${
                    selectedAgents.includes(agent.name)
                      ? "border-[#587BFA] bg-[#0f1b3a]"
                      : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-sm text-gray-400">{agent.description}</p>
                    </div>
                    {selectedAgents.includes(agent.name) && (
                      <Check className="w-5 h-5 text-[#587BFA]" />
                    )}
                  </div>
                  <ul className="text-xs text-gray-500 mt-3 flex gap-2 flex-wrap">
                    {agent.outputs.map((output) => (
                      <li
                        key={output}
                        className="px-3 py-1 rounded-full border border-neutral-700"
                      >
                        {output}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
            <h2 className="text-xl font-semibold">Manual playbook</h2>
            <p className="text-sm text-gray-400">
              Queue agents in the order you want to run them. Once you hit launch, the system
              executes each tool with the shared context.
            </p>
            <div className="border border-dashed border-neutral-700 rounded-2xl p-4 text-sm text-gray-500">
              {selectedAgents.length === 0
                ? "No agents selected. Pick at least one to build a playbook."
                : selectedAgents.map((agent, idx) => (
                    <div
                      key={agent}
                      className="flex items-center gap-3 py-2 text-gray-300 border-b border-neutral-800 last:border-0"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-800 text-xs">
                        {idx + 1}
                      </span>
                      <span>{agent}</span>
                    </div>
                  ))}
            </div>
            <button
              className="px-4 py-3 rounded-2xl bg-white text-black font-semibold disabled:bg-neutral-800 disabled:text-gray-500 transition"
              disabled={selectedAgents.length === 0}
            >
              Launch selected flow
            </button>
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
