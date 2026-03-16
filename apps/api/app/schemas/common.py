from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def normalize_optional_string(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def normalize_required_string(value: str) -> str:
    return value.strip()


def trim_string(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip()
