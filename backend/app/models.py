from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class ConfigBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    yaml_content: str
    config_json: str  # JSON blob of the full form state


class Config(ConfigBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ConfigCreate(ConfigBase):
    pass


class ConfigUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    yaml_content: Optional[str] = None
    config_json: Optional[str] = None


class ConfigRead(ConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime
