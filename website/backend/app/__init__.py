"""
Backend application package for SmartLivingAdvisor.

This module exposes the FastAPI application via ``app`` to make imports
straightforward for ASGI servers such as uvicorn or hypercorn.
"""

from .main import app

__all__ = ["app"]


