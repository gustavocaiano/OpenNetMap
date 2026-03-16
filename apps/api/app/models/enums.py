from enum import Enum


class DeviceType(str, Enum):
    router = "router"
    firewall = "firewall"
    server = "server"


class HostType(str, Enum):
    unknown = "unknown"
    server = "server"
    vm = "vm"
    workstation = "workstation"


class HostDiscoverySource(str, Enum):
    nmap = "nmap"
    manual = "manual"


class ScanJobStatus(str, Enum):
    pending = "pending"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class NetworkLayoutMode(str, Enum):
    node = "node"
    container = "container"


class NetworkKind(str, Enum):
    segment = "segment"
    link = "link"


class DeviceNetworkLinkRole(str, Enum):
    origin = "origin"
    member = "member"


class ConnectionAnchor(str, Enum):
    auto = "auto"
    top = "top"
    right = "right"
    bottom = "bottom"
    left = "left"
