import pytest


@pytest.fixture
def flow_module(load_flow):
    return load_flow("newsletter_digest_flow.py")


def test_schedule_is_mon_wed_fri_sat_at_8am(flow_module):
    assert flow_module.CRON == "0 8 * * 1,3,5,6"
    assert flow_module.newsletter_digest_flow.flow_name == "newsletter-digest"


def test_runs_the_digest_worker(flow_module, fake_run):
    flow_module.newsletter_digest_flow()

    [call] = fake_run.calls
    assert call["command"] == ["npx", "tsx", "--env-file=.env", "scripts/newsletter-digest.ts"]
    assert call["cwd"] == str(flow_module.REPO_ROOT)
    assert (flow_module.REPO_ROOT / "scripts" / "newsletter-digest.ts").exists()


def test_quiet_success_prints_nothing(flow_module, fake_run, capsys):
    flow_module.newsletter_digest_flow()
    assert capsys.readouterr() == ("", "")


def test_raises_when_the_worker_fails(flow_module, fake_run, capsys):
    fake_run.result.update(returncode=1, stderr="boom")
    with pytest.raises(RuntimeError, match="newsletter worker exited with code 1"):
        flow_module.newsletter_digest_flow()
    assert "boom" in capsys.readouterr().err
