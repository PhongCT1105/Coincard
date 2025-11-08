def ingest_news(token):
    from xdk import Client
    import os
    from dotenv import load_dotenv

    load_dotenv()
    BEARER_TOKEN = os.getenv("BEARER_TOKEN")
    client = Client(bearer_token=BEARER_TOKEN)

    # Fetch recent Posts mentioning the specified token
    response = client.posts.search_recent(
        query=f'{token} lang:en -is:retweet -is:quote -is:reply',
        max_results=30,
    )

    # Print the first Post's text
    if response.data:
        print(f"Fetched {len(response.data)} posts:\n")
        for i, post in enumerate(response.data, start=1):
            print(f"{i}. {post['text']}\n{'-'*60}")
    else:
        print("No Posts found.")

if __name__ == "__main__":
    ingest_news("bitcoin")