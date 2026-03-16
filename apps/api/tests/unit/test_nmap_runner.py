import ipaddress

from app.services import nmap_runner


def test_run_ping_scan_normalizes_runtime_cidr_objects(monkeypatch):
    captured = {}

    class Completed:
        stdout = "<xml />"

    def fake_run(command, check, capture_output, text):
        captured["command"] = command
        assert isinstance(command[-1], str)
        assert check is True
        assert capture_output is True
        assert text is True
        return Completed()

    monkeypatch.setattr(nmap_runner.subprocess, "run", fake_run)

    output = nmap_runner.run_ping_scan(ipaddress.IPv4Network("10.0.0.0/24"))

    assert output == "<xml />"
    assert captured["command"][-1] == "10.0.0.0/24"
