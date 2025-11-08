def ingest_news(token, top_k=3):
    from xdk import Client
    import os
    from dotenv import load_dotenv

    load_dotenv()
    BEARER_TOKEN = os.getenv("BEARER_TOKEN")
    client = Client(bearer_token=BEARER_TOKEN)

    # Originals only
    response = client.posts.search_recent(
        query=f'{token} lang:en -is:retweet -is:quote -is:reply',
        max_results=30,
    )

    if not response.data:
        print("No Posts found.")
        return

    def score_post(text: str) -> float:
        t = text or ""
        # light, zero-dependency scoring: longer + has link + repeats token
        length_bonus = min(len(t) / 280.0, 1.0)
        link_bonus   = 0.3 if "http" in t else 0.0
        kw_hits      = t.lower().count(token.lower())
        relevance    = 0.4 * kw_hits
        # small penalty for very short posts
        short_penalty = -0.4 if len(t.strip()) < 40 else 0.0
        return length_bonus + link_bonus + relevance + short_penalty

    # Score and pick top_k
    scored = [(score_post(p["text"]), p) for p in response.data]
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [p for _, p in scored[:top_k]]

    print(f"Fetched {len(response.data)} posts; showing top {len(top)} by simple score:\n")
    for i, post in enumerate(top, start=1):
        print(f"{i}. {post['text']}\n{'-'*60}")

if __name__ == "__main__":
    ingest_news("BTC")
