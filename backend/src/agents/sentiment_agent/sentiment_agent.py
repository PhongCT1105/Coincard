import os
import json
from typing import Dict
from xai_sdk import Client
from xai_sdk.chat import system, user
from dotenv import load_dotenv
load_dotenv()

class Emotion(str):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL  = "neutral"
    Emotions = [POSITIVE, NEGATIVE, NEUTRAL]


def sentiment_analysis(text: str) -> Dict[str, float]:
    """
    Perform sentiment analysis using Grok via xAI SDK.
    Env vars required:
        XAI_API_KEY   - your xAI API key
        XAI_MODEL     - optional, default "grok-3-mini"
    Returns:
        {'positive': float, 'negative': float, 'neutral': float}
    """
    api_key = os.getenv("XAI_API_KEY")
    model   = os.getenv("XAI_MODEL", "grok-3-mini")

    if not api_key:
        raise RuntimeError("Missing XAI_API_KEY in environment.")

    client = Client(api_key=api_key)
    chat = client.chat.create(model=model)

    chat.append(system(
        "You are an emotion classifier. "
        "Output valid JSON in the format: "
        '{"positive": float, "negative": float, "neutral": float}'
    ))
    chat.append(user(f"Text: {text}"))

    response = chat.sample().content.strip()

    # Safe JSON parsing
    try:
        data = json.loads(response)
        # Ensure all emotions exist, fill missing with 0
        return {k: float(data.get(k, 0.0)) for k in Emotion.Emotions}
    except Exception:
        return {"positive": 0.0, "negative": 0.0, "neutral": 0.0}


def __main__():
    sample_text = "I love using this new AI tool! It's fantastic."
    result = sentiment_analysis(sample_text)
    print(result)


if __name__ == "__main__":
    __main__()
