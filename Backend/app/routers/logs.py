import random
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Query
from app.schemas import LogEntry

router = APIRouter(prefix="/api/logs", tags=["logs"])


def generate_logs(level_filter: Optional[str] = None) -> List[LogEntry]:
    sources = ["vsphere", "docker", "orchestrator", "api", "database"]
    levels = ["info", "warning", "error", "debug"]

    messages = {
        "vsphere": {
            "info": ["VM started successfully", "Resource pool allocated", "Snapshot created"],
            "warning": ["High memory usage detected", "Storage latency elevated"],
            "error": ["VM migration failed", "Connection to host lost"],
            "debug": ["VM heartbeat received", "Resource check completed"]
        },
        "docker": {
            "info": ["Container started", "Image pulled successfully", "Network connected"],
            "warning": ["Container memory limit approaching", "Image size large"],
            "error": ["Container crashed", "Failed to pull image"],
            "debug": ["Container health check OK", "Volume mounted"]
        },
        "orchestrator": {
            "info": ["Deployment completed", "Service scaled", "Rolling update finished"],
            "warning": ["Pod restart detected", "Node capacity low"],
            "error": ["Service deployment failed", "Health check failed"],
            "debug": ["Scheduler evaluation done", "Endpoint updated"]
        },
        "api": {
            "info": ["Request processed", "Cache hit", "API key validated"],
            "warning": ["Rate limit approaching", "Slow query detected"],
            "error": ["Database connection failed", "Invalid request payload"],
            "debug": ["Request logged", "Response serialized"]
        },
        "database": {
            "info": ["Query executed", "Connection established", "Index used"],
            "warning": ["Slow query detected", "Connection pool at 80%"],
            "error": ["Connection timeout", "Deadlock detected"],
            "debug": ["Transaction committed", "Cache invalidated"]
        }
    }

    logs = []
    now = datetime.now()

    for i in range(50):
        source = random.choice(sources)
        level = level_filter or random.choice(levels)
        message = random.choice(messages[source][level])
        timestamp = now - timedelta(minutes=random.randint(0, 60))

        logs.append(LogEntry(
            timestamp=timestamp.isoformat(),
            level=level.upper(),
            source=source,
            message=message
        ))

    logs.sort(key=lambda x: x.timestamp, reverse=True)
    return logs


@router.get("", response_model=List[LogEntry])
def get_logs(level: Optional[str] = Query(None, enum=["info", "warning", "error", "debug"])):
    return generate_logs(level)
