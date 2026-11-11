"""Shared fixtures for the Prefect flow tests.

The real `prefect` package is heavy and needs a server, so tests install a tiny
stand-in whose `@flow` decorator returns the plain function. The flow modules
are loaded straight from their file paths because the local folder is also
named `prefect` and would shadow the real package on sys.path.
"""

import importlib.util
import subprocess
import sys
import types
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
FLOWS_DIR = REPO_ROOT / "prefect"


def _fake_prefect() -> types.ModuleType:
    module = types.ModuleType("prefect")

    def flow(name: str | None = None, **_kwargs):
        def decorate(fn):
            fn.flow_name = name
            fn.serve = lambda **kwargs: kwargs
            return fn

        return decorate

    module.flow = flow
    return module


@pytest.fixture
def load_flow(monkeypatch):
    """Import a flow file by name with the fake prefect package in place."""

    def _load(filename: str) -> types.ModuleType:
        monkeypatch.setitem(sys.modules, "prefect", _fake_prefect())
        path = FLOWS_DIR / filename
        spec = importlib.util.spec_from_file_location(f"flows_{path.stem}", path)
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    return _load


@pytest.fixture
def fake_run(monkeypatch):
    """Replace subprocess.run and record each call."""
    calls: list[dict] = []
    result = {"returncode": 0, "stdout": "", "stderr": ""}

    def _run(command, **kwargs):
        calls.append({"command": command, **kwargs})
        return subprocess.CompletedProcess(command, result["returncode"], result["stdout"], result["stderr"])

    monkeypatch.setattr(subprocess, "run", _run)
    return types.SimpleNamespace(calls=calls, result=result)
