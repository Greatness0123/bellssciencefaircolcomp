import asyncio
import ipaddress
import json
import socket
from typing import Optional, Tuple


class DemoDiscoveryProtocol(asyncio.DatagramProtocol):
    def __init__(self) -> None:
        self.transport: Optional[asyncio.DatagramTransport] = None

    def connection_made(self, transport: asyncio.BaseTransport) -> None:
        self.transport = transport  # type: ignore[assignment]

    def datagram_received(self, data: bytes, address: Tuple[str, int]) -> None:
        try:
            request = json.loads(data.decode("utf-8"))
            source_ip = ipaddress.ip_address(address[0].split("%", 1)[0])
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
            return

        if (
            not source_ip.is_private
            and not source_ip.is_loopback
        ) or request.get("service") != "sentinel-demo" or request.get("type") != "discover":
            return

        nonce = request.get("nonce")
        if not isinstance(nonce, str) or not nonce:
            return

        route_probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            route_probe.connect(address)
            server_ip = route_probe.getsockname()[0]
        except OSError:
            return
        finally:
            route_probe.close()

        if self.transport is not None:
            response = {
                "service": "sentinel-demo",
                "type": "ready",
                "nonce": nonce,
                "host": server_ip,
                "port": 8000,
            }
            self.transport.sendto(json.dumps(response).encode("utf-8"), address)
