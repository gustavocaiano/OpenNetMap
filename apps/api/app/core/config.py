from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "sqlite+pysqlite:///:memory:"
    log_level: str = "INFO"
    worker_poll_interval_seconds: int = 5
    scan_xml_dir: Path = Field(
        default=Path("/var/lib/openetmap/scans"),
        validation_alias=AliasChoices("RAW_SCAN_OUTPUT_DIR", "SCAN_XML_DIR"),
    )
    nmap_command: str = Field(
        default="nmap",
        validation_alias=AliasChoices("NMAP_BIN", "NMAP_COMMAND"),
    )


settings = Settings()
