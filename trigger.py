import ipaddress
import json
import select
import socket
import time
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DISCOVERY_PORT = 39547


def get_private_addresses():
    try:
        addresses = socket.gethostbyname_ex(socket.gethostname())[2]
    except OSError:
        addresses = []

    private_addresses = []
    for address in dict.fromkeys(addresses):
        try:
            if ipaddress.ip_address(address).is_private:
                private_addresses.append(address)
        except ValueError:
            continue
    return private_addresses or ["0.0.0.0"]


def discover_backend() -> str:
    discovery_sockets = []
    for local_address in get_private_addresses():
        discovery_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        discovery_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        try:
            discovery_socket.bind((local_address, 0))
        except OSError:
            discovery_socket.close()
            continue
        discovery_sockets.append(discovery_socket)

    if not discovery_sockets:
        raise OSError("No usable private network interface was found")

    print("Sentinel lab client: looking for the dashboard on this LAN...")

    try:
        while True:
            nonce = uuid.uuid4().hex
            probe = {
                "service": "sentinel-demo",
                "type": "discover",
                "nonce": nonce,
            }
            for discovery_socket in discovery_sockets:
                discovery_socket.sendto(
                    json.dumps(probe).encode("utf-8"),
                    ("255.255.255.255", DISCOVERY_PORT),
                )
            retry_at = time.monotonic() + 2

            while time.monotonic() < retry_at:
                readable, _, _ = select.select(
                    discovery_sockets,
                    [],
                    [],
                    max(0.1, retry_at - time.monotonic()),
                )
                for discovery_socket in readable:
                    response_data, _ = discovery_socket.recvfrom(1024)
                    try:
                        response = json.loads(response_data.decode("utf-8"))
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        continue

                    if (
                        response.get("service") == "sentinel-demo"
                        and response.get("type") == "ready"
                        and response.get("nonce") == nonce
                    ):
                        backend = f"http://{response['host']}:{response['port']}"
                        try:
                            with urlopen(f"{backend}/health", timeout=2) as health:
                                if health.status != 200:
                                    continue
                        except (HTTPError, URLError, TimeoutError):
                            continue
                        for open_socket in discovery_sockets:
                            open_socket.close()
                        return backend

            print("Dashboard not found yet; retrying discovery...")
    finally:
        for discovery_socket in discovery_sockets:
            discovery_socket.close()


def api_request(url: str, method: str, payload=None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(
        url,
        data=body,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urlopen(request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    backend = discover_backend()
    client_name = socket.gethostname()

    try:
        incident = api_request(
            f"{backend}/api/demo/threat",
            "POST",
            {
                "client_name": client_name,
                "scenario": "Authorized lab access simulation",
            },
        )
    except (HTTPError, URLError, TimeoutError) as error:
        print(f"Dashboard connection failed: {error}")
        return 1

    incident_id = incident["incident_id"]
    print(f"Lab event submitted: {incident_id}")
    print("Waiting for the analyst to review the dashboard alert...")

    while True:
        try:
            state = api_request(
                f"{backend}/api/demo/threat/{incident_id}",
                "GET",
            )
        except (HTTPError, URLError, TimeoutError) as error:
            print(f"Dashboard connection failed: {error}")
            return 1

        if state.get("status") == "neutralized":
            print("ACCESS DENIED: incident neutralized by the analyst.")
            return 0
        time.sleep(1)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Lab client stopped.")
        raise SystemExit(130)
