# services/people.py
import hashlib
from typing import Optional, Tuple
from google.cloud import firestore

def _norm_email(email: str) -> str:
    return (email or "").strip().lower()

def person_id_for_user(uid: str, email: str) -> str:
    e = _norm_email(email)
    h = hashlib.sha1(e.encode()).hexdigest()[:10]
    return f"per_{uid}_{h}"

def ensure_person_for_user(
    db: firestore.Client,
    *,
    uid: str,
    email: Optional[str] = None,
    display_name: Optional[str] = None,
    summary: Optional[str] = None
) -> Tuple[str, str]:
    """
    Ensure a person exists for this user. Returns (personId, path).
    Prefers email for stable identity; falls back to a random-ish id if no email.
    """
    if email:
        pid = person_id_for_user(uid, email)
    else:
        # No email: fallback id based on uid + name hash (low collision risk)
        base = (display_name or "contact").strip().lower()
        h = hashlib.sha1(f"{uid}:{base}".encode()).hexdigest()[:10]
        pid = f"per_{uid}_{h}"

    ref = db.document(f"people/{pid}")
    snap = ref.get()
    if snap.exists:
        return pid, ref.path

    doc = {
        "displayName": display_name or (email or "Unknown"),
        "emails": [ _norm_email(email) ] if email else [],
        "summary": summary or "",
        "createdByUid": uid,
        "owners": { uid: True },
        "encounterCount": 0,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    ref.set(doc, merge=True)
    return pid, ref.path
