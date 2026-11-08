"""Minimal ASGI entry point; service infrastructure follows in Phase 03."""

from fastapi import FastAPI

app = FastAPI(title="Chord House API", version="0.1.0")
