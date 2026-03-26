from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime

from ..database import get_session
from ..models import Config, ConfigCreate, ConfigRead, ConfigUpdate

router = APIRouter(prefix="/configs", tags=["configs"])


@router.get("/", response_model=list[ConfigRead])
def list_configs(session: Session = Depends(get_session)):
    configs = session.exec(select(Config).order_by(Config.updated_at.desc())).all()
    return configs


@router.post("/", response_model=ConfigRead, status_code=201)
def create_config(config: ConfigCreate, session: Session = Depends(get_session)):
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
    config = session.get(Config, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    session.delete(config)
    session.commit()
