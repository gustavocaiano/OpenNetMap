from app.services.nmap_parser import parse_nmap_ping_scan


def test_parse_nmap_ping_scan_filters_up_ipv4_hosts():
    xml_payload = """
    <nmaprun>
      <host>
        <status state="up" />
        <address addr="10.0.0.10" addrtype="ipv4" />
        <hostnames><hostname name="srv-01" /></hostnames>
      </host>
      <host>
        <status state="down" />
        <address addr="10.0.0.20" addrtype="ipv4" />
      </host>
    </nmaprun>
    """

    assert parse_nmap_ping_scan(xml_payload) == [{"ip_address": "10.0.0.10", "detected_hostname": "srv-01"}]


def test_parse_nmap_ping_scan_ignores_hosts_without_explicit_up_status():
    xml_payload = """
    <nmaprun>
      <host>
        <address addr="10.0.0.30" addrtype="ipv4" />
      </host>
      <host>
        <status state="up" />
        <address addr="10.0.0.40" addrtype="ipv4" />
      </host>
    </nmaprun>
    """

    assert parse_nmap_ping_scan(xml_payload) == [{"ip_address": "10.0.0.40", "detected_hostname": None}]
