import pytest


@pytest.fixture
def flow_module(load_flow):
    return load_flow("application_reminder_flow.py")


def test_flow_is_registered_with_its_name(flow_module):
    assert flow_module.application_reminder_flow.flow_name == "application-reminder"


def test_runs_the_reminder_worker_from_repo_root(flow_module, fake_run):
    flow_module.application_reminder_flow()

    [call] = fake_run.calls
    assert call["command"] == ["npx", "tsx", "--env-file=.env", "scripts/application-reminders.ts"]
    assert call["cwd"] == str(flow_module.REPO_ROOT)
    assert call["capture_output"] is True
    assert call["text"] is True
    assert (flow_module.REPO_ROOT / "scripts" / "application-reminders.ts").exists()


def test_forwards_worker_output(flow_module, fake_run, capsys):
    fake_run.result.update(stdout="sent 3 reminders", stderr="warning: slow db")
    flow_module.application_reminder_flow()

    out, err = capsys.readouterr()
    assert "sent 3 reminders" in out
    assert "warning: slow db" in err


def test_raises_when_the_worker_fails(flow_module, fake_run):
    fake_run.result["returncode"] = 2
    with pytest.raises(RuntimeError, match="exited with code 2"):
        flow_module.application_reminder_flow()
