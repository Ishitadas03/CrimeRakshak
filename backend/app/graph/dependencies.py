"""FastAPI dependency wiring for the Graph Intelligence module."""
from __future__ import annotations

from fastapi import Depends

from app.graph.connection import Neo4jConnectionManager, get_graph
from app.graph.repositories.graph_repository import GraphRepository
from app.graph.services.graph_service import GraphService


def get_graph_repository(
    conn: Neo4jConnectionManager = Depends(get_graph),
) -> GraphRepository:
    return GraphRepository(conn)


def get_graph_service(
    repo: GraphRepository = Depends(get_graph_repository),
) -> GraphService:
    return GraphService(repo)
