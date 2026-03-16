import ipaddress
import re

from sqlalchemy import cast, literal
from sqlalchemy.dialects import postgresql

from app.api.error_handlers import api_error


HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def validate_ipv4_cidr(cidr: object) -> str:
    try:
        network = ipaddress.IPv4Network(str(cidr), strict=False)
    except ValueError as exc:
        raise api_error(422, "invalid_cidr", str(exc)) from exc
    return str(network)


def validate_ipv4_address(ip_address: object) -> str:
    try:
        return str(ipaddress.IPv4Address(str(ip_address)))
    except ValueError as exc:
        raise api_error(422, "invalid_ip_address", str(exc)) from exc


def ensure_ip_in_network(ip_address: str, cidr: str) -> None:
    ip = ipaddress.IPv4Address(validate_ipv4_address(ip_address))
    network = ipaddress.IPv4Network(validate_ipv4_cidr(cidr), strict=False)
    if ip not in network:
        raise api_error(422, "host_ip_outside_network", "Host IP must be inside network CIDR")


def ensure_device_link_ip_in_network(ip_address: str, cidr: str) -> None:
    ip = ipaddress.IPv4Address(validate_ipv4_address(ip_address))
    network = ipaddress.IPv4Network(validate_ipv4_cidr(cidr), strict=False)
    if ip not in network:
        raise api_error(422, "device_link_ip_outside_network", "Device link IP must be inside network CIDR")


def validate_hex_color(color: str) -> str:
    if not HEX_COLOR_RE.fullmatch(color):
        raise api_error(422, "invalid_color", "Color must be a hex value like #RRGGBB")
    return color.lower()


def sql_cidr_value(session, value: str):
    bind = getattr(session, "bind", None)
    if bind is not None and bind.dialect.name == "postgresql":
        return cast(literal(value), postgresql.CIDR())
    return value


def sql_inet_value(session, value: str):
    bind = getattr(session, "bind", None)
    if bind is not None and bind.dialect.name == "postgresql":
        return cast(literal(value), postgresql.INET())
    return value
