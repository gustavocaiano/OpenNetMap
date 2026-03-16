from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError


def error_payload(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def api_error(status_code: int, code: str, message: str) -> HTTPException:
    exc = HTTPException(status_code=status_code, detail=message)
    setattr(exc, "code", code)
    return exc


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    def handle_http_exception(_: Request, exc: HTTPException) -> JSONResponse:
        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        code = getattr(exc, "code", None) or f"http_{exc.status_code}"
        return JSONResponse(status_code=exc.status_code, content=error_payload(code, message))

    @app.exception_handler(RequestValidationError)
    def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        first_error = exc.errors()[0] if exc.errors() else None
        message = first_error.get("msg", "Validation failed") if first_error else "Validation failed"
        return JSONResponse(status_code=422, content=error_payload("validation_error", message))

    @app.exception_handler(IntegrityError)
    def handle_integrity_error(_: Request, __: IntegrityError) -> JSONResponse:
        return JSONResponse(status_code=409, content=error_payload("integrity_error", "Resource conflict"))

    @app.exception_handler(Exception)
    def handle_unexpected_error(_: Request, __: Exception) -> JSONResponse:
        return JSONResponse(status_code=500, content=error_payload("internal_error", "Internal server error"))
