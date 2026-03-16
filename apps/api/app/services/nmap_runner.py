import subprocess

from app.core.config import settings


def run_ping_scan(cidr: object) -> str:
    normalized_cidr = str(cidr)
    completed = subprocess.run(
        [settings.nmap_command, "-sn", "-oX", "-", normalized_cidr],
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout
