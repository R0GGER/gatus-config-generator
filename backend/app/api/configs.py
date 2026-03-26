from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from datetime import datetime

from ..database import get_session
from ..models import Config, ConfigCreate, ConfigRead, ConfigUpdate
from ..settings import get_settings

router = APIRouter(prefix="/configs", tags=["configs"])


@router.get("/", response_model=list[ConfigRead])
def list_configs(session: Session = Depends(get_session)):
    configs = session.exec(select(Config).order_by(Config.updated_at.desc())).all()
    return configs


def _check_demo_mode():
    if get_settings().demo_mode:
        raise HTTPException(status_code=403, detail="This action is disabled in demo mode.")


@router.post("/", response_model=ConfigRead, status_code=201)
def create_config(config: ConfigCreate, session: Session = Depends(get_session)):
    _check_demo_mode()
    settings = get_settings()
    count = session.exec(select(func.count()).select_from(Config)).one()
    if count >= settings.max_saved_configs:
        raise HTTPException(
            status_code=409,
            detail=f"Maximum number of saved configs reached ({settings.max_saved_configs}). Delete an existing config first.",
        )
    db_config = Config.model_validate(config)
    session.add(db_config)
    session.commit()
    session.refresh(db_config)
    return db_config


@router.get("/{config_id}", response_model=ConfigRead)
def get_config(config_id: int, session: Session = Depends(get_session)):
    config = session.get(Config, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config


@router.put("/{config_id}", response_model=ConfigRead)
def update_config(
    config_id: int,
    config_update: ConfigUpdate,
    session: Session = Depends(get_session),
):
    _check_demo_mode()
    config = session.get(Config, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    update_data = config_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    for key, value in update_data.items():
        setattr(config, key, value)

    session.add(config)
    session.commit()
    session.refresh(config)
    return config


@router.delete("/{config_id}", status_code=204)
def delete_config(config_id: int, session: Session = Depends(get_session)):
    _check_demo_mode()
    config = session.get(Config, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    session.delete(config)
    session.commit()
