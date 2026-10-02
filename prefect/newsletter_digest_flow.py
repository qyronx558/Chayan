"""
Prefect flow: ChayanJobs newsletter digest cron.

Runs the TypeScript newsletter worker (scripts/newsletter-digest.ts)
4 days a week (Mon, Wed, Fri, Sat) at 8:00 AM IST. The worker is
idempotent (NewsletterSend rows in the database prevent duplicate
sends per day).

Quick start (Prefect 3.x):
    pip install prefect
    prefect server start          # or use Prefect Cloud (prefect cloud login)
    python prefect/newsletter_digest_flow.py   # registers + serves the flow

The flow stays running and schedules itself on the cron. Verify with:
    prefect deployment inspect newsletter-digest/newsletter-digest

Manual run without Prefect:
    npx tsx --env-file=.env scripts/newsletter-digest.ts
"""

import subprocess
import sys
from pathlib import Path

from prefect import flow

REPO_ROOT = Path(__file__).resolve().parent.parent

# Mon(1), Wed(3), Fri(5), Sat(6) at 08:00 IST
CRON = "0 8 * * 1,3,5,6"


@flow(name="newsletter-digest")
def newsletter_digest_flow() -> None:
    """Recurring job/result/admit-card digest for newsletter subscribers."""
    command = ["npx", "tsx", "--env-file=.env", "scripts/newsletter-digest.ts"]
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
        raise RuntimeError(f"newsletter worker exited with code {result.returncode}")


if __name__ == "__main__":
    newsletter_digest_flow.serve(
        name="newsletter-digest",
        cron=CRON,
        timezone="Asia/Kolkata",
    )
