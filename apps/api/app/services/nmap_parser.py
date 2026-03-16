import xml.etree.ElementTree as ET


def parse_nmap_ping_scan(xml_payload: str) -> list[dict[str, str | None]]:
    root = ET.fromstring(xml_payload)
    hosts: list[dict[str, str | None]] = []
    for host in root.findall("host"):
        status = host.find("status")
        if status is None or status.attrib.get("state") != "up":
            continue
        address = None
        for addr in host.findall("address"):
            if addr.attrib.get("addrtype") == "ipv4":
                address = addr.attrib.get("addr")
                break
        if not address:
            continue
        hostname = None
        hostnames = host.find("hostnames")
        if hostnames is not None:
            hostname_node = hostnames.find("hostname")
            if hostname_node is not None:
                hostname = hostname_node.attrib.get("name")
        hosts.append({"ip_address": address, "detected_hostname": hostname})
    return hosts
