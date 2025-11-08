import json
from typing import List, Dict, Optional, Sequence, Union
from src.infra.redis_client import get_redis
from src.settings import settings
import uuid

DOCS_TTL = settings.docs_ttl_seconds
LATEST_TTL = settings.docs_ttl_seconds  # same TTL is fine


def new_run_id() -> str:
    """Generate a unique run identifier for each /news call."""
    return str(uuid.uuid4())

def _docs_key(run_id: str) -> str:
    return f"docs:{run_id}"

def _latest_key(token: str) -> str:
    return f"latest_run:{token.upper()}"

def save_docs(run_id: str, docs: List[Dict]) -> None:
    r = get_redis()
    r.setex(_docs_key(run_id), DOCS_TTL, json.dumps(docs))

def set_latest_run(token: str, run_id: str) -> None:
    r = get_redis()
    r.setex(_latest_key(token), LATEST_TTL, run_id)

def get_latest_run(token: str) -> Optional[str]:
    r = get_redis()
    return r.get(_latest_key(token))

def load_docs(
    run_id: str,
    selected: Optional[Sequence[Union[str, int]]] = None
) -> List[Dict]:
    """
    selected can be:
      - None       -> return all docs
      - [ids...]   -> match by doc id (or link tail)
      - [1,3,5]    -> match by 1-based indices as displayed in UI
    """
    r = get_redis()
    raw = r.get(_docs_key(run_id))
    if not raw:
        return []

    docs: List[Dict] = json.loads(raw)
    if not selected:
        return docs

    # Build helper map: index -> id (fallback to link tail)
    idx_to_id = []
    for i, d in enumerate(docs, start=1):
        link_tail = (d.get("link","").split("/")[-1] if d.get("link") else None)
        did = d.get("id") or link_tail or f"doc{i}"
        idx_to_id.append((i, str(did)))

    # Normalize selection to a set of ids
    wanted_ids = set()
    for s in selected:
        if isinstance(s, int):
            if 1 <= s <= len(idx_to_id):
                wanted_ids.add(idx_to_id[s-1][1])
        else:
            wanted_ids.add(str(s))

    # Filter docs
    out = []
    for i, d in enumerate(docs, start=1):
        link_tail = (d.get("link","").split("/")[-1] if d.get("link") else None)
        did = d.get("id") or link_tail or f"doc{i}"
        if str(did) in wanted_ids:
            out.append(d)

    return out or []
