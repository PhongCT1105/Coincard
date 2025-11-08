# Backend API Notes

## `POST /news`
- Body: `{ "token": "BTC", "top_k": 3 }`
- Response contains `results` (list of posts with `id`, `title`, `context`, `link`, `sentiment`, `sentiment_score`).
- Nothing is cached server-side anymore; store whichever subset of `results` you want to show or send to the Grok agent.

## `POST /ask`
- Body shape:
  ```json
  {
    "token": "BTC",
    "question": "What is driving price action?",
    "documents": [
      {
        "id": "123",
        "title": "BTC whales reduce holdings",
        "context": "Full text from the news item",
        "link": "https://x.com/...",
        "sentiment": {
          "positive": 0.41,
          "negative": 0.10,
          "neutral": 0.49
        }
      }
    ]
  }
  ```
- Only the `context` field is required per document; any other keys (sentiment, metadata, etc.) are forwarded to the model for traceability.
- The endpoint returns `{ "token": "BTC", "answer": "...", "sources": [...] }` where `sources` mirrors the subset of documents that were actually used.
