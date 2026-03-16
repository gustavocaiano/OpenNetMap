import ipaddress

import pytest

from app.services.validators import (
    ensure_device_link_ip_in_network,
    ensure_ip_in_network,
    validate_hex_color,
    validate_ipv4_address,
    validate_ipv4_cidr,
)


def test_validate_ipv4_cidr_normalizes_input():
    assert validate_ipv4_cidr("10.0.0.5/24") == "10.0.0.0/24"


def test_validate_ipv4_cidr_accepts_runtime_network_objects():
    assert validate_ipv4_cidr(ipaddress.IPv4Network("10.0.0.0/24")) == "10.0.0.0/24"


def test_validate_ipv4_address_accepts_runtime_address_objects():
    assert validate_ipv4_address(ipaddress.IPv4Address("10.0.0.5")) == "10.0.0.5"


def test_ensure_ip_in_network_rejects_outside_address():
    with pytest.raises(Exception) as excinfo:
        ensure_ip_in_network("10.0.1.5", "10.0.0.0/24")
    assert excinfo.value.status_code == 422
    assert excinfo.value.detail == "Host IP must be inside network CIDR"


def test_ensure_device_link_ip_in_network_rejects_outside_address():
    with pytest.raises(Exception) as excinfo:
        ensure_device_link_ip_in_network("10.0.1.5", "10.0.0.0/24")
    assert excinfo.value.status_code == 422
    assert excinfo.value.detail == "Device link IP must be inside network CIDR"


def test_validate_hex_color_normalizes_case():
    assert validate_hex_color("#A1B2C3") == "#a1b2c3"


def test_validate_hex_color_rejects_invalid_value():
    with pytest.raises(Exception) as excinfo:
        validate_hex_color("blue")
    assert excinfo.value.status_code == 422
    assert excinfo.value.detail == "Color must be a hex value like #RRGGBB"
