from uuid import UUID

from app.models import Network, ScanJob
from app.models.enums import ScanJobStatus
from app.services.host_service import merge_discovered_hosts


def test_core_api_flow_and_shapes(client, db_session):
    maps_response = client.get("/api/v1/maps")
    assert maps_response.status_code == 200
    assert maps_response.json() == []

    map_response = client.post("/api/v1/maps", json={"name": "  Lab  ", "description": "  Primary lab  "})
    assert map_response.status_code == 201
    map_payload = map_response.json()
    assert map_payload["name"] == "Lab"
    assert map_payload["description"] == "Primary lab"
    assert map_payload["device_count"] == 0
    map_id = map_payload["id"]

    device_response = client.post(
        f"/api/v1/maps/{map_id}/devices",
        json={"name": " Edge ", "type": "router", "notes": "  core  ", "pos_x": 10.5, "pos_y": 20.25},
    )
    assert device_response.status_code == 201
    device_payload = device_response.json()
    assert device_payload["notes"] == "core"
    assert device_payload["network_ids"] == []
    device_id = device_payload["id"]

    network_response = client.post(
        f"/api/v1/maps/{map_id}/networks",
        json={
            "name": " Users ",
            "cidr": "10.0.0.0/24",
            "vlan_tag": 10,
            "notes": "  access  ",
            "network_kind": "segment",
            "layout_mode": "node",
            "dhcp_enabled": True,
            "gateway_ip": "10.0.0.1",
            "dns_servers": ["1.1.1.1", "8.8.8.8"],
            "color": "#AABBCC",
        },
    )
    assert network_response.status_code == 201
    network_payload = network_response.json()
    assert network_payload["device_ids"] == []
    assert network_payload["host_count"] == 0
    assert network_payload["latest_scan_job"] is None
    assert network_payload["network_kind"] == "segment"
    assert network_payload["layout_mode"] == "node"
    assert network_payload["dhcp_enabled"] is True
    assert network_payload["gateway_ip"] == "10.0.0.1"
    assert network_payload["dns_servers"] == ["1.1.1.1", "8.8.8.8"]
    assert network_payload["color"] == "#aabbcc"
    network_id = network_payload["id"]

    link_response = client.put(
        f"/api/v1/devices/{device_id}/networks/{network_id}",
        json={
            "ip_address": "10.0.0.2",
            "label": "  uplink  ",
            "color": "#2563EB",
            "device_anchor": "left",
            "network_anchor": "top",
        },
    )
    assert link_response.status_code == 204
    relink_response = client.put(
        f"/api/v1/devices/{device_id}/networks/{network_id}",
        json={
            "ip_address": "10.0.0.3",
            "label": "  wan  ",
            "color": "#16A34A",
            "device_anchor": "bottom",
            "network_anchor": "right",
        },
    )
    assert relink_response.status_code == 204

    devices_response = client.get(f"/api/v1/maps/{map_id}/devices")
    assert devices_response.status_code == 200
    assert devices_response.json()[0]["network_ids"] == [network_id]
    assert devices_response.json()[0]["connections"] == [
        {
            "network_id": network_id,
            "role": "origin",
            "ip_address": "10.0.0.3",
            "label": "wan",
            "color": "#16a34a",
            "device_anchor": "bottom",
            "network_anchor": "right",
        }
    ]

    scan_job_response = client.post(f"/api/v1/networks/{network_id}/scan-jobs", json={"scan_profile": "ping_sweep"})
    assert scan_job_response.status_code == 201
    scan_job_payload = scan_job_response.json()
    assert set(scan_job_payload) == {
        "id",
        "network_id",
        "status",
        "scan_profile",
        "hosts_found_count",
        "raw_output_available",
        "error_message",
        "created_at",
        "started_at",
        "finished_at",
        "updated_at",
    }
    assert scan_job_payload["status"] == ScanJobStatus.pending
    assert scan_job_payload["scan_profile"] == "ping_sweep"
    assert scan_job_payload["hosts_found_count"] == 0
    assert scan_job_payload["raw_output_available"] is False
    scan_job_id = scan_job_payload["id"]

    network = db_session.get(Network, UUID(network_id))
    scan_job = db_session.get(ScanJob, UUID(scan_job_id))
    merge_discovered_hosts(db_session, network, scan_job, [{"ip_address": "10.0.0.10", "detected_hostname": "host-10"}])
    scan_job.status = ScanJobStatus.succeeded
    scan_job.hosts_found_count = 1
    db_session.commit()

    hosts_response = client.get(f"/api/v1/networks/{network_id}/hosts")
    assert hosts_response.status_code == 200
    hosts_payload = hosts_response.json()
    assert len(hosts_payload) == 1
    host_id = hosts_payload[0]["id"]

    update_host_response = client.patch(
        f"/api/v1/hosts/{host_id}", json={"hostname": "  srv-01  ", "type": "server", "needs_review": False, "notes": "  ok  "}
    )
    assert update_host_response.status_code == 200
    updated_host = update_host_response.json()
    assert updated_host["hostname"] == "srv-01"
    assert updated_host["notes"] == "ok"

    network_detail = client.get(f"/api/v1/maps/{map_id}/networks").json()[0]
    assert network_detail["device_ids"] == [device_id]
    assert network_detail["host_count"] == 1
    assert network_detail["latest_scan_job"]["id"] == scan_job_id
    assert network_detail["latest_scan_job"]["hosts_found_count"] == 1
    assert network_detail["network_kind"] == "segment"
    assert network_detail["layout_mode"] == "node"
    assert network_detail["dhcp_enabled"] is True
    assert network_detail["gateway_ip"] == "10.0.0.1"
    assert network_detail["dns_servers"] == ["1.1.1.1", "8.8.8.8"]
    assert network_detail["color"] == "#aabbcc"

    updated_network_response = client.patch(
        f"/api/v1/networks/{network_id}",
        json={
            "layout_mode": "container",
            "dhcp_enabled": False,
            "gateway_ip": "10.0.0.254",
            "dns_servers": ["9.9.9.9"],
            "color": "#123456",
        },
    )
    assert updated_network_response.status_code == 200
    updated_network_payload = updated_network_response.json()
    assert updated_network_payload["layout_mode"] == "container"
    assert updated_network_payload["dhcp_enabled"] is False
    assert updated_network_payload["gateway_ip"] == "10.0.0.254"
    assert updated_network_payload["dns_servers"] == ["9.9.9.9"]
    assert updated_network_payload["color"] == "#123456"

    graph_response = client.get(f"/api/v1/maps/{map_id}/graph")
    assert graph_response.status_code == 200
    graph_payload = graph_response.json()
    assert set(graph_payload) == {"map", "devices", "networks", "hosts", "device_network_links"}
    assert graph_payload["map"]["id"] == map_id
    assert graph_payload["devices"][0]["id"] == device_id
    assert graph_payload["networks"][0]["id"] == network_id
    assert graph_payload["networks"][0]["network_kind"] == "segment"
    assert graph_payload["networks"][0]["layout_mode"] == "container"
    assert graph_payload["networks"][0]["dhcp_enabled"] is False
    assert graph_payload["networks"][0]["gateway_ip"] == "10.0.0.254"
    assert graph_payload["networks"][0]["dns_servers"] == ["9.9.9.9"]
    assert graph_payload["networks"][0]["color"] == "#123456"
    assert graph_payload["hosts"][0]["network_id"] == network_id
    assert graph_payload["device_network_links"] == [
        {
            "device_id": device_id,
            "network_id": network_id,
            "role": "origin",
            "ip_address": "10.0.0.3",
            "label": "wan",
            "color": "#16a34a",
            "device_anchor": "bottom",
            "network_anchor": "right",
        }
    ]


def test_device_network_link_metadata_validation(client):
    map_id = client.post("/api/v1/maps", json={"name": "Manual Map"}).json()["id"]
    device_id = client.post(
        f"/api/v1/maps/{map_id}/devices", json={"name": "Edge", "type": "router"}
    ).json()["id"]
    network_id = client.post(
        f"/api/v1/maps/{map_id}/networks", json={"name": "LAN", "cidr": "10.10.0.0/24"}
    ).json()["id"]

    blank_link_response = client.put(f"/api/v1/devices/{device_id}/networks/{network_id}")
    assert blank_link_response.status_code == 204

    invalid_ip_response = client.put(
        f"/api/v1/devices/{device_id}/networks/{network_id}",
        json={"ip_address": "10.11.0.8"},
    )
    assert invalid_ip_response.status_code == 422
    assert invalid_ip_response.json()["error"]["code"] == "device_link_ip_outside_network"

    invalid_color_response = client.put(
        f"/api/v1/devices/{device_id}/networks/{network_id}",
        json={"color": "blue"},
    )
    assert invalid_color_response.status_code == 422
    assert invalid_color_response.json()["error"]["code"] == "invalid_color"


def test_network_lan_metadata_validation(client):
    map_id = client.post("/api/v1/maps", json={"name": "Validation Map"}).json()["id"]

    invalid_gateway = client.post(
        f"/api/v1/maps/{map_id}/networks",
        json={"name": "LAN", "cidr": "10.30.0.0/24", "gateway_ip": "not-an-ip"},
    )
    assert invalid_gateway.status_code == 422
    assert invalid_gateway.json()["error"]["code"] == "invalid_ip_address"

    invalid_dns = client.post(
        f"/api/v1/maps/{map_id}/networks",
        json={"name": "LAN", "cidr": "10.30.1.0/24", "dns_servers": ["8.8.8.8", "bad-ip"]},
    )
    assert invalid_dns.status_code == 422
    assert invalid_dns.json()["error"]["code"] == "invalid_ip_address"


def test_device_network_link_role_defaults_and_override(client):
    map_id = client.post("/api/v1/maps", json={"name": "Hierarchy Map"}).json()["id"]
    origin_device_id = client.post(
        f"/api/v1/maps/{map_id}/devices", json={"name": "Gateway", "type": "router"}
    ).json()["id"]
    member_device_id = client.post(
        f"/api/v1/maps/{map_id}/devices", json={"name": "Laptop", "type": "server"}
    ).json()["id"]
    override_device_id = client.post(
        f"/api/v1/maps/{map_id}/devices", json={"name": "Firewall", "type": "firewall"}
    ).json()["id"]
    network_id = client.post(
        f"/api/v1/maps/{map_id}/networks", json={"name": "LAN", "cidr": "10.20.0.0/24"}
    ).json()["id"]

    first_link_response = client.put(f"/api/v1/devices/{origin_device_id}/networks/{network_id}")
    assert first_link_response.status_code == 204

    second_link_response = client.put(f"/api/v1/devices/{member_device_id}/networks/{network_id}")
    assert second_link_response.status_code == 204

    override_link_response = client.put(
        f"/api/v1/devices/{override_device_id}/networks/{network_id}",
        json={"role": "origin", "label": "  backup uplink  "},
    )
    assert override_link_response.status_code == 204

    devices_payload = client.get(f"/api/v1/maps/{map_id}/devices").json()
    connections_by_device = {device["id"]: device["connections"][0] for device in devices_payload}

    assert connections_by_device[origin_device_id]["role"] == "origin"
    assert connections_by_device[member_device_id]["role"] == "member"
    assert connections_by_device[override_device_id] == {
        "network_id": network_id,
        "role": "origin",
        "ip_address": None,
        "label": "backup uplink",
        "color": None,
        "device_anchor": "auto",
        "network_anchor": "auto",
    }

    graph_links = client.get(f"/api/v1/maps/{map_id}/graph").json()["device_network_links"]
    graph_roles = {(link["device_id"], link["network_id"]): link["role"] for link in graph_links}
    assert graph_roles[(origin_device_id, network_id)] == "origin"
    assert graph_roles[(member_device_id, network_id)] == "member"
    assert graph_roles[(override_device_id, network_id)] == "origin"


def test_active_scan_conflict_and_scan_job_list_limit(client):
    map_id = client.post("/api/v1/maps", json={"name": "Scan Lab"}).json()["id"]
    network_id = client.post(
        f"/api/v1/maps/{map_id}/networks", json={"name": "Subnet", "cidr": "192.168.1.0/24"}
    ).json()["id"]

    first = client.post(f"/api/v1/networks/{network_id}/scan-jobs", json={"scan_profile": "ping_sweep"})
    second = client.post(f"/api/v1/networks/{network_id}/scan-jobs", json={"scan_profile": "ping_sweep"})

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "active_scan_job_exists"


def test_link_network_rejects_scan_jobs_and_normalizes_layout_mode(client):
    map_id = client.post("/api/v1/maps", json={"name": "Link Lab"}).json()["id"]
    network_response = client.post(
        f"/api/v1/maps/{map_id}/networks",
        json={"name": "P2P", "cidr": "192.168.50.0/30", "network_kind": "link", "layout_mode": "container"},
    )
    assert network_response.status_code == 201
    network_id = network_response.json()["id"]
    assert network_response.json()["network_kind"] == "link"
    assert network_response.json()["layout_mode"] == "node"

    scan_response = client.post(f"/api/v1/networks/{network_id}/scan-jobs", json={"scan_profile": "ping_sweep"})
    assert scan_response.status_code == 409
    assert scan_response.json()["error"]["code"] == "network_scan_not_allowed"


def test_host_ip_in_cidr_and_cidr_change_blocked(client, db_session):
    map_id = client.post("/api/v1/maps", json={"name": "CIDR Lab"}).json()["id"]
    network_id = client.post(
        f"/api/v1/maps/{map_id}/networks", json={"name": "Subnet", "cidr": "172.16.0.0/24"}
    ).json()["id"]
    scan_job_id = client.post(f"/api/v1/networks/{network_id}/scan-jobs", json={"scan_profile": "ping_sweep"}).json()["id"]

    network = db_session.get(Network, UUID(network_id))
    scan_job = db_session.get(ScanJob, UUID(scan_job_id))
    merge_discovered_hosts(db_session, network, scan_job, [{"ip_address": "172.16.0.2", "detected_hostname": None}])
    db_session.commit()

    response = client.patch(f"/api/v1/networks/{network_id}", json={"cidr": "172.16.1.0/24"})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "network_cidr_locked"

    invalid_merge_job = ScanJob(network_id=UUID(network_id), scan_profile="ping_sweep")
    db_session.add(invalid_merge_job)
    db_session.commit()
    try:
        merge_discovered_hosts(db_session, network, invalid_merge_job, [{"ip_address": "172.17.0.2", "detected_hostname": None}])
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 422
    else:
        raise AssertionError("Expected host IP validation error")


def test_segment_to_link_change_blocked_when_hosts_or_scan_jobs_exist(client, db_session):
    map_id = client.post("/api/v1/maps", json={"name": "Kind Lock Lab"}).json()["id"]
    network_id = client.post(
        f"/api/v1/maps/{map_id}/networks", json={"name": "Subnet", "cidr": "172.18.0.0/24"}
    ).json()["id"]
    scan_job_id = client.post(f"/api/v1/networks/{network_id}/scan-jobs", json={"scan_profile": "ping_sweep"}).json()["id"]

    network = db_session.get(Network, UUID(network_id))
    scan_job = db_session.get(ScanJob, UUID(scan_job_id))
    merge_discovered_hosts(db_session, network, scan_job, [{"ip_address": "172.18.0.10", "detected_hostname": "host-1"}])
    db_session.commit()

    response = client.patch(f"/api/v1/networks/{network_id}", json={"network_kind": "link"})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "network_kind_change_blocked"
