import { FormEvent, useState } from "react"
import type { NewsDoc } from "./TokenNews"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

interface ChatPanelProps {
  token: string
  docs: NewsDoc[]
}

const endpoint = "http://127.0.0.1:8000/chat"

export default function ChatPanel({ token, docs }: ChatPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = Boolean(message.trim()) && (sessionId || docs.length > 0)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        token,
        message: message.trim(),
      }
      if (sessionId) {
        payload.session_id = sessionId
      } else {
        payload.docs = docs
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`Chat API returned ${res.status}`)
      }
      const data = await res.json()
      setSessionId(data.session_id)
      setHistory(data.history || [])
      setMessage("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-neutral-900 rounded-2xl p-6 space-y-4 border border-neutral-800/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Ask Grok about {token.toUpperCase()}</p>
          <p className="text-xs text-gray-500">
            Powered by the latest news context. Sessions reset if you refresh.
          </p>
        </div>
        {sessionId && (
          <span className="text-[11px] text-gray-500 uppercase tracking-wide">
            Session {sessionId.split("-")[0]}
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {history.length === 0 && (
          <p className="text-sm text-gray-500">
            Start typing below to ask how today&apos;s news might impact the token.
          </p>
        )}
        {history.map((msg, idx) => (
          <div
            key={`${msg.role}-${idx}`}
            className={`rounded-xl px-4 py-3 text-sm ${
              msg.role === "user" ? "bg-[#1f2937]" : "bg-[#0f172a]"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              {msg.role === "user" ? "You" : "Grok"}
            </p>
            <p className="text-gray-200 whitespace-pre-line">{msg.content}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            docs.length === 0 && !sessionId
              ? "News is still loading…"
              : "Ask about catalysts, risks, or trading setups…"
          }
          disabled={loading}
          className="w-full h-24 rounded-xl bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#587BFA] resize-none"
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{sessionId ? "Continuing existing session." : "First message will include the latest docs."}</span>
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              canSubmit && !loading
                ? "bg-[#587BFA] hover:bg-[#3b6ef0] text-white"
                : "bg-neutral-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </section>
  )
}
