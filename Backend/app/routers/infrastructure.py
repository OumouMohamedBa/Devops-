import random
from datetime import datetime
from fastapi import APIRouter
from app.schemas import InfrastructureStatus, VmStatus

router = APIRouter(prefix="/api/infrastructure", tags=["infrastructure"])


@router.get("/status", response_model=InfrastructureStatus)
def get_infrastructure_status():
    return InfrastructureStatus(
        total_vms=3,
        running_vms=2,
        suspended_vms=1,
        active_containers=6,
        deployed_apps=2,
        status="healthy"
    )


@router.get("/vms", response_model=list[VmStatus])
def get_vms_status():
    vms = [
        VmStatus(
            id="vm-001",
            name="backend-api-01",
            status="running",
            cpu_percent=round(random.uniform(15.0, 45.0), 1),
            memory_percent=round(random.uniform(30.0, 60.0), 1)
        ),
        VmStatus(
            id="vm-002",
            name="backend-api-02",
            status="running",
            cpu_percent=round(random.uniform(10.0, 35.0), 1),
            memory_percent=round(random.uniform(25.0, 50.0), 1)
        ),
        VmStatus(
            id="vm-003",
            name="warm-standby-01",
            status="suspended",
            cpu_percent=0.0,
            memory_percent=0.0
        )
    ]
    return vms
