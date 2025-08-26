from __future__ import annotations

import re
from typing import Optional
from urllib.parse import urlparse

try:
    from newspaper import Article  # type: ignore
except Exception:  # pragma: no cover - optional at runtime, but required in prod
    Article = None  # type: ignore


_URL_RE = re.compile(r"^(https?://)\S+", re.IGNORECASE)


def is_url(text_or_url: str) -> bool:
    if not text_or_url:
        return False
    if _URL_RE.match(text_or_url.strip()):
        return True
    # Fallback: detect schemeless URLs like www.domain.com/article
    parsed = urlparse(text_or_url)
    return bool(parsed.netloc and parsed.path)


def get_domain(url: str) -> str:
    netloc = urlparse(url).netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]
    return netloc


def check_credibility(domain: str) -> str:
    # Baseline mapping adapted from the previous prototype
    source_cred = {
        "bbc.com": "Credible mainstream news organization.",
        "cnn.com": "Credible mainstream news organization.",
        "reuters.com": "Credible mainstream news organization (wire service).",
        "apnews.com": "Credible mainstream news organization (wire service).",
        "nytimes.com": "Credible mainstream news organization.",
        "theguardian.com": "Credible mainstream news organization.",
        "npr.org": "Credible public media organization.",
        "bloomberg.com": "Credible business and financial news organization.",
        "aljazeera.com": "Credible international news organization.",

        "theonion.com": "Satire; not real news.",
        "babylonbee.com": "Satire; not real news.",
        "clickhole.com": "Satire; not real news.",

        "infowars.com": "Widely regarded as a source of misinformation/conspiracies.",
        "beforeitsnews.com": "Widely regarded as a source of misinformation/conspiracies.",
        "naturalnews.com": "Widely regarded as a source of misinformation/conspiracies.",
        "worldtruth.tv": "Widely regarded as a source of misinformation/conspiracies.",
        "yournewswire.com": "Widely regarded as a source of misinformation/conspiracies.",

        "foxnews.com": "Mixed reputation; credible reporting plus partisan opinion content.",
        "msnbc.com": "Mixed reputation; credible reporting plus partisan opinion content.",
        "newsweek.com": "Mixed reputation; credible reporting with occasional issues.",
        "washingtontimes.com": "Mixed reputation; credible reporting with occasional issues.",

        "unknown": "Source credibility unknown or not in database.",
    }
    if not domain:
        return "unknown"
    if domain in source_cred:
        return source_cred[domain]
    for key in source_cred:
        if domain.endswith(key):
            return source_cred[key]
    return "unknown"


def scrape_text(url: str) -> Optional[str]:
    if Article is None:
        return None
    try:
        art = Article(url)
        art.download()
        art.parse()
        text = (art.text or "").strip()
        return text or None
    except Exception:
        return None


def credibility_fake_prior(domain: str, description: Optional[str] = None) -> float:
    """
    Map domain credibility to a prior probability that content is fake.
    Lower = more trustworthy; Higher = more likely fake. Range [0,1].
    """
    desc = (description or check_credibility(domain)).lower()
    if not desc:
        return 0.5
    # Simple heuristic mapping
    if any(k in desc for k in ["credible", "reputable", "public media", "wire service"]):
        return 0.2
    if any(k in desc for k in ["satire", "not real news"]):
        return 0.7
    if any(k in desc for k in ["misinformation", "conspiracy", "purveyor"]):
        return 0.85
    if any(k in desc for k in ["mixed reputation", "partisan", "occasional issues", "bias"]):
        return 0.5
    if "unknown" in desc:
        return 0.5
    return 0.5


