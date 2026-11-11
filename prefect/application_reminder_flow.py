"""
Prefect flow: ChayanJobs application-reminder cron.

Runs the TypeScript reminder worker (scripts/application-reminders.ts)
daily at 9:00 AM IST. The worker is idempotent (ReminderLog rows in the
database prevent duplicate sends).

Quick start (Prefect 3.x):
    pip install prefect
    prefect server start          # or use Prefect Cloud (prefect cloud login)
    python prefect/application_reminder_flow.py   # registers + serves the flow

The flow stays running and schedules itself on the cron. Verify with:
    prefect deployment inspect application-reminder/application-reminder

If you prefer Vercel cron instead, point a cron job at:
    npx tsx --env-file=.env scripts/application-reminders.ts
"""

import subprocess
import sys
from pathlib import Path

from prefect import flow

REPO_ROOT = Path(__file__).resolve().parent.parent


@flow(name="application-reminder")
def application_reminder_flow() -> None:
    """Daily application deadline/admit-card/result reminder delivery."""
    command = ["npx", "tsx", "--env-file=.env", "scripts/application-reminders.ts"]
    result = subprocess.run(
        command,
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
    )
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"reminder worker exited with code {result.returncode}")


if __name__ == "__main__":
    application_reminder_flow.serve(
        name="application-reminder",
        cron="0 9 * * *",
        timezone="Asia/Kolkata",
    )
