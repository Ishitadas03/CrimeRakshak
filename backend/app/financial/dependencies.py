"""FastAPI dependency wiring for the Financial Crime module.

Reuses the shared Neo4j connection manager (``app.graph.connection.get_graph``)
so no second driver/pool is created.
"""
from __future__ import annotations

from fastapi import Depends

from app.financial.repositories.financial_repository import FinancialRepository
from app.financial.services.financial_service import FinancialService
from app.graph.connection import Neo4jConnectionManager, get_graph


def get_financial_repository(
    conn: Neo4jConnectionManager = Depends(get_graph),
) -> FinancialRepository:
    return FinancialRepository(conn)


def get_financial_service(
    repo: FinancialRepository = Depends(get_financial_repository),
) -> FinancialService:
    return FinancialService(repo)
