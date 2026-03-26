from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    gatus_config_path: str = "/config/config.yaml"
    secret_key: str = "changeme-in-production"
    database_url: str = "sqlite:///./gatus_generator.db"
    auth_username: str = ""
    auth_password: str = ""
    standalone_mode: bool = False
    max_saved_configs: int = 25
    demo_mode: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
