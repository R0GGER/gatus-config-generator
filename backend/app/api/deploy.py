import os
import yaml
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from ..settings import Settings, get_settings

router = APIRouter(prefix="/deploy", tags=["deploy"])


class DeployRequest(BaseModel):
    yaml_content: str


class ValidateRequest(BaseModel):
    yaml_content: str


class SettingsResponse(BaseModel):
    gatus_config_path: str
    config_writable: bool


@router.get("/settings", response_model=SettingsResponse)
def get_deploy_settings(settings: Settings = Depends(get_settings)):
    config_path = Path(settings.gatus_config_path)
    writable = os.access(config_path.parent, os.W_OK) if config_path.parent.exists() else False
    return SettingsResponse(
        gatus_config_path=settings.gatus_config_path,
        config_writable=writable,
    )


class DeployedConfigResponse(BaseModel):
    yaml_content: str
    exists: bool


@router.get("/current", response_model=DeployedConfigResponse)
def get_deployed_config(settings: Settings = Depends(get_settings)):
    config_path = Path(settings.gatus_config_path)
    if not config_path.exists():
        raise HTTPException(status_code=404, detail="No deployed config found")
    try:
        content = config_path.read_text(encoding="utf-8")
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Cannot read config: {e}")
    return DeployedConfigResponse(yaml_content=content, exists=True)


@router.post("/validate")
def validate_yaml(request: ValidateRequest):
    try:
        parsed = yaml.safe_load(request.yaml_content)
        if not isinstance(parsed, dict):
            raise HTTPException(status_code=422, detail="YAML must be a mapping at the top level")

        errors = []

        if "endpoints" not in parsed and "external-endpoints" not in parsed:
            errors.append("Warning: no endpoints defined")

        if "endpoints" in parsed:
            for i, ep in enumerate(parsed["endpoints"]):
                if not isinstance(ep, dict):
                    errors.append(f"Endpoint {i}: not a valid mapping")
                    continue
                if "name" not in ep:
                    errors.append(f"Endpoint {i}: 'name' missing")
                if "url" not in ep:
                    errors.append(f"Endpoint {i} ({ep.get('name', '?')}): 'url' missing")

        return {"valid": len(errors) == 0, "warnings": errors}

    except yaml.YAMLError as e:
        raise HTTPException(status_code=422, detail=f"Invalid YAML: {e}")


@router.post("/")
def deploy_config(request: DeployRequest, settings: Settings = Depends(get_settings)):
    if settings.demo_mode:
        raise HTTPException(status_code=403, detail="Deploy is disabled in demo mode.")
    try:
        yaml.safe_load(request.yaml_content)
    except yaml.YAMLError as e:
        raise HTTPException(status_code=422, detail=f"Invalid YAML: {e}")

    config_path = Path(settings.gatus_config_path)

    if not config_path.parent.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Config path does not exist: {config_path.parent}",
        )

    backup_path = config_path.with_suffix(".yaml.bak")
    if config_path.exists():
        config_path.rename(backup_path)

    try:
        config_path.write_text(request.yaml_content, encoding="utf-8")
    except OSError as e:
        if backup_path.exists():
            backup_path.rename(config_path)
        raise HTTPException(status_code=500, detail=f"Write error: {e}")

    return {
        "status": "success",
        "message": f"Config deployed to {settings.gatus_config_path}",
        "backup": str(backup_path) if backup_path.exists() else None,
    }
