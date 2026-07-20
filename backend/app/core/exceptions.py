"""Typed HTTP exceptions with consistent JSON error bodies."""
from fastapi import HTTPException, status


class AppHTTPException(HTTPException):
    """Base class carrying an optional machine-readable ``code``."""

    def __init__(self, status_code: int, detail: str, code: str = "error", headers=None):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code


class UnauthorizedError(AppHTTPException):
    def __init__(self, detail: str = "not authenticated", code: str = "unauthorized"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            code=code,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenError(AppHTTPException):
    def __init__(self, detail: str = "not enough privileges", code: str = "forbidden"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN, detail=detail, code=code
        )


class NotFoundError(AppHTTPException):
    def __init__(self, detail: str = "resource not found", code: str = "not_found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND, detail=detail, code=code
        )


class ConflictError(AppHTTPException):
    def __init__(self, detail: str = "conflict", code: str = "conflict"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT, detail=detail, code=code
        )


class BadRequestError(AppHTTPException):
    def __init__(self, detail: str = "bad request", code: str = "bad_request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST, detail=detail, code=code
        )
