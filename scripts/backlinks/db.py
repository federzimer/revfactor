"""SQLite schema + connection helpers for the RevFactor backlinks DB.

One row per known URL in `links`. One row per monthly check in `checks`,
giving a time series of uptime + brand-mention + dofollow + quality.
"""
from __future__ import annotations
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "scripts" / "backlinks" / "backlinks.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,
  link_type TEXT,
  source TEXT,
  source_batch TEXT,
  date_added TEXT,
  notes TEXT,
  first_seen_at TEXT NOT NULL,
  last_synced_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_links_domain ON links(domain);
CREATE INDEX IF NOT EXISTS idx_links_type ON links(link_type);

CREATE TABLE IF NOT EXISTS checks (
  id INTEGER PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  checked_at TEXT NOT NULL,
  http_status INTEGER,
  is_alive INTEGER NOT NULL,
  fetch_method TEXT,
  brand_mention_present INTEGER,
  outbound_link_present INTEGER,
  rel_attr TEXT,
  is_dofollow INTEGER,
  anchor_text TEXT,
  excerpt TEXT,
  quality_score INTEGER NOT NULL,
  quality_grade TEXT NOT NULL,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_checks_link_time ON checks(link_id, checked_at DESC);
"""


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    return conn


def domain_of(url: str) -> str:
    from urllib.parse import urlparse
    host = urlparse(url).netloc.lower()
    return host[4:] if host.startswith("www.") else host


def classify(url: str) -> str:
    """Best-effort link-type label from the host."""
    d = domain_of(url)
    table = {
        "medium.com": "medium",
        "sites.google.com": "google-sites",
        "weebly.com": "weebly",
        "reddit.com": "reddit",
        "quora.com": "quora",
        "facebook.com": "facebook",
        "linkedin.com": "linkedin",
        "youtube.com": "youtube",
        "tiktok.com": "tiktok",
        "instagram.com": "instagram",
        "x.com": "twitter",
        "twitter.com": "twitter",
    }
    for needle, label in table.items():
        if needle in d:
            return label
    return "editorial"
