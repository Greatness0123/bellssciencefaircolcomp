# Live Sensor Setup Guide (Suricata + Network Monitoring)

This guide provides end-to-end instructions for configuring the physical or virtual **Security Sensor** for Sentinel AI, installing **Suricata**, setting up **SPAN / Port Mirroring**, creating custom detection rules, and connecting the live telemetry pipeline to the Sentinel AI backend.

---

## 1. Architecture & Network Topology

In a live deployment, network traffic flows between users/clients and the server. A copy of that traffic is duplicated by a managed switch and sent to the Sensor Host's capture interface.

```
+--------------------------------------------------------------------+
|                           MANAGED SWITCH                           |
|                                                                    |
|  [Port 1] Test Client        [Port 2] App Server   [Port 3] SPAN   |
|  (10.10.20.45)               (10.10.10.10)         (Mirror Port)   |
+-------+-----------------------------+--------------------+---------+
        |                             |                    |
        | [Normal Traffic / Tests]    |                    | [Mirrored Packets]
        v                             v                    v
+------------------+          +---------------+    +------------------------+
|   TEST CLIENT    |          |  APP SERVER   |    |      SENSOR HOST       |
|  (Laptop running |          | (API / DB /   |    | (Ubuntu Server Linux)  |
|   eval scripts)  |          |  Services)    |    |   • Capture NIC (promisc)
+------------------+          +---------------+    |   • Suricata Engine    |
                                                   |   • /var/log/.../eve.json
                                                   |   • Sentinel AI Backend|
                                                   +------------------------+
```

---

## 2. Hardware & System Requirements

### Sensor Machine Options:
* **Option A (Dedicated Physical Host):** Mini PC, desktop, or laptop with at least 1 Ethernet interface (2 recommended: one for sensor capture, one for sensor management/SSH).
* **Option B (Virtual Machine):** Ubuntu Server 22.04 LTS / 24.04 LTS running in VirtualBox, VMware, or Proxmox with a bridged network adapter set to **Promiscuous Mode: Allow All**.
* **Option C (Single-Machine Testbed):** Both App Server and Suricata running on the same Linux host listening on `lo` (loopback) or a Docker bridge network (`br0`).

### Specifications:
* **OS:** Ubuntu Server 22.04 LTS or 24.04 LTS (recommended)
* **CPU:** 2+ cores
* **RAM:** 4 GB minimum (8 GB recommended)
* **Disk:** 20 GB free space (for logs and rules)

---

## 3. Preparing the Linux Sensor Host

### Step 3.1: Identify Network Interfaces
Run:
```bash
ip -brief address show
```
Identify your network interfaces:
* Management interface (e.g., `eth0` or `enp3s0`): has an IP on your local network for SSH and web access.
* Monitoring / SPAN interface (e.g., `eth1` or `enp4s0`): connected to the switch mirror port (should NOT have an IP address assigned).

### Step 3.2: Enable Promiscuous Mode
The monitoring NIC must accept all packets passing through it, not just packets addressed to its own MAC address:
```bash
# Replace 'eth1' with your actual capture interface name
sudo ip link set dev eth1 promisc on
sudo ip link set dev eth1 up
```

To make promiscuous mode persistent across reboots, add a systemd service or netplan configuration:
```bash
sudo nano /etc/systemd/system/promisc.service
```
Paste:
```ini
[Unit]
Description=Enable promiscuous mode on capture interface
After=network.target

[Service]
Type=oneshot
ExecStart=/sbin/ip link set dev eth1 promisc on
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```
Enable it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now promisc.service
```

---

## 4. Installing Suricata

Install the official stable Suricata repository from the OISF team:

```bash
# Add official PPA
sudo add-apt-repository ppa:oisf/suricata-stable -y
sudo apt update

# Install Suricata and jq (helpful for inspecting JSON logs)
sudo apt install suricata jq -y

# Verify installation
suricata --build-info
```

Stop the service while configuring:
```bash
sudo systemctl stop suricata
```

---

## 5. Configuring Suricata & EVE JSON Logging

Suricata's main configuration file is `/etc/suricata/suricata.yaml`.

### Step 5.1: Backup Configuration
```bash
sudo cp /etc/suricata/suricata.yaml /etc/suricata/suricata.yaml.bak
```

### Step 5.2: Configure Monitored Subnets
Open the configuration file:
```bash
sudo nano /etc/suricata/suricata.yaml
```
Locate the `vars:` section and configure `HOME_NET` to match your lab network range:
```yaml
vars:
  address-groups:
    HOME_NET: "[10.10.10.0/24,10.10.20.0/24,192.168.1.0/24]"
    EXTERNAL_NET: "!$HOME_NET"
```

### Step 5.3: Ensure `eve-log` is Enabled
Locate the `outputs:` section and ensure `eve-log` is configured with `file` type and structured JSON output:
```yaml
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      types:
        - alert:
            payload: yes             # Include packet payload excerpt for evidence
            payload-buffer-size: 4kb
            packet: yes
            metadata: yes
            tagged-packets: yes
        - http:
            extended: yes
        - dns:
            version: 2
        - tls:
            extended: yes
        - flow
```

### Step 5.4: Set the Capture Interface
Under the `af-packet:` section, set the capture interface to your monitoring NIC:
```yaml
af-packet:
  - interface: eth1   # <-- Replace with your capture interface (e.g., eth1, enp4s0)
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
```

### Step 5.5: Add Rule File Path
Ensure custom local rules are included under `rule-files:`:
```yaml
default-rule-path: /etc/suricata/rules
rule-files:
  - suricata.rules
  - local.rules       # Custom Sentinel AI detection rules
```

---

## 6. Configuring Switch Port Mirroring (SPAN)

If using a managed hardware switch (e.g., Cisco, TP-Link Omada, Netgear ProSAFE, Ubiquiti):

### Concept:
* **Source Port(s):** The port(s) connected to the AI Application Server or the Test Client.
* **Destination Port:** The port connected to the Sensor Machine's capture interface (`eth1`).
* **Traffic Direction:** `Both` (Transmit & Receive).

### Example Cisco IOS Configuration:
```cisco
configure terminal
monitor session 1 source interface gigabitEthernet 0/1 both
monitor session 1 destination interface gigabitEthernet 0/24
end
```

### Example TP-Link / Netgear Web UI:
1. Navigate to **Switching** -> **Port Mirroring** (or **Traffic Mirroring**).
2. Enable Port Mirroring.
3. Set **Monitor Port (Destination)** to the port connected to the Sensor.
4. Set **Mirrored Ports (Source)** to the server port, direction **Ingress & Egress**.
5. Save configuration.

---

## 7. Writing Custom Detection Rules

Create `/etc/suricata/rules/local.rules` to define reproducible detection rules for the 4 science fair test scenarios:

```bash
sudo nano /etc/suricata/rules/local.rules
```

Paste the following rules:

```suricata
# =========================================================================
# SENTINEL AI - SCIENCE FAIR DETECTION RULES
# Rule ID Range: 1000001 - 1000020
# =========================================================================

# Scenario 1: Port Scan / Rapid Connection Attempts
# Flags: TCP SYN packets to 5+ ports within 10 seconds from single source
alert tcp any any -> $HOME_NET any (msg:"SENTINEL-AI Port Scan Reconnaissance Detected"; flags:S; threshold: type threshold, track by_src, count 5, seconds 10; classtype:attempted-recon; sid:1000001; rev:1;)

# Scenario 2: Repeated Failed Logins (HTTP 401 Unauthorized bursts)
alert http $HOME_NET any -> any any (msg:"SENTINEL-AI High Volume Authentication Failures"; content:"401 Unauthorized"; http_stat_code; threshold: type threshold, track by_dst, count 5, seconds 30; classtype:suspicious-login; sid:1000002; rev:1;)

# Scenario 3: Access to Restricted / Unauthorized Endpoints
# Flags requests targeting administrative or protected paths
alert http any any -> $HOME_NET any (msg:"SENTINEL-AI Unauthorized Access Attempt to Restricted Route"; content:"/api/v1/admin"; http_uri; classtype:policy-violation; sid:1000003; rev:1;)

# Scenario 4: Suspicious Outbound Data Volume / Exfiltration Indicator
alert tcp $HOME_NET any -> $EXTERNAL_NET any (msg:"SENTINEL-AI Potential Large Data Exfiltration Outbound"; dsize:>10000000; classtype:bad-unknown; sid:1000004; rev:1;)

# Scenario 5: Nmap User-Agent or Script Scanning Tool
alert http any any -> $HOME_NET any (msg:"SENTINEL-AI Security Scanner Tool Detected"; content:"User-Agent|3a| Nmap"; http_header; classtype:attempted-recon; sid:1000005; rev:1;)
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

### Validate Rules & Configuration:
```bash
sudo suricata -T -c /etc/suricata/suricata.yaml -v
```
You should see: `Suricata: Configuration provided was successfully verified. Exiting.`

---

## 8. Connecting Suricata to the Sentinel AI Backend

### Step 8.1: Start Suricata as a Background Daemon
```bash
sudo systemctl enable suricata
sudo systemctl restart suricata
sudo systemctl status suricata
```

Verify that `/var/log/suricata/eve.json` is actively being written to:
```bash
sudo ls -lh /var/log/suricata/eve.json
```

### Step 8.2: Grant Permissions to the Sentinel AI Service
The backend process must have read access to `eve.json`:
```bash
# Add your user to the suricata group, or set read permissions:
sudo chmod 644 /var/log/suricata/eve.json
sudo chmod 755 /var/log/suricata
```

### Step 8.3: Configure Sentinel AI `.env`
In your Sentinel AI `backend/.env` file:
```ini
EVE_LOG_PATH=/var/log/suricata/eve.json
SENSOR_ID=Sensor-01
SENSOR_LOCATION="Server VLAN (Promiscuous SPAN)"
```

The Sentinel AI ingestion worker tails this file in real time, normalizes incoming alerts, writes them to the SQLite database, and pushes them to your React dashboard over WebSockets.

---

## 9. Verification & Minimum Viable Test Scenarios

Run these tests from the **Test Client** laptop to prove end-to-end detection for the science fair demonstration:

### Test 1: Port Scan (Scenario 1)
Run an authorised SYN scan targeting the server:
```bash
# From Test Client:
nmap -sS -p 22,80,443,3000,8000,8080 10.10.10.10
```
* **Suricata Action:** Triggers rule `SID:1000001` ("Port Scan Reconnaissance Detected").
* **Dashboard Result:** New **High** severity alert appears in real time under the ID `SNT-2026-XXXX`.

### Test 2: Restricted Endpoint Access (Scenario 3)
Send an unauthorized request to the protected route:
```bash
# From Test Client:
curl -i http://10.10.10.10:8000/api/v1/admin/secrets
```
* **Suricata Action:** Triggers rule `SID:1000003` ("Unauthorized Access Attempt to Restricted Route").
* **Dashboard Result:** New **Medium** severity alert appears, showing URI evidence and client IP.

### Test 3: Automated Scanner Probe (Scenario 5)
Send a probe with an Nmap user-agent string:
```bash
# From Test Client:
curl -H "User-Agent: Nmap Scripting Engine" http://10.10.10.10:8000/
```
* **Suricata Action:** Triggers rule `SID:1000005` ("Security Scanner Tool Detected").
* **Dashboard Result:** Alert shows the User-Agent header excerpt in the Evidence panel.

---

## 10. Troubleshooting & Visibility Verification

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **`eve.json` is empty / not growing** | Interface is not in promiscuous mode or wrong NIC selected. | Run `sudo tcpdump -i eth1 -n` to verify packets are actually reaching the NIC. Check `af-packet` in `suricata.yaml`. |
| **Suricata fails to start** | YAML syntax error or invalid rule syntax. | Run `sudo suricata -T -c /etc/suricata/suricata.yaml -v` to see the exact line with the error. |
| **No alerts generated during Nmap scan** | `HOME_NET` does not match server IP, or threshold is too high. | Verify that the server's IP is included in `vars.address-groups.HOME_NET` in `suricata.yaml`. |
| **Backend cannot read `eve.json`** | Linux file permission denied. | Run `sudo chmod 644 /var/log/suricata/eve.json`. |
| **Packets missing on encrypted HTTPS** | TLS encrypts payload. | Normal behavior. Suricata inspects TLS SNI headers and packet volume/ports; application-level events (e.g. failed logins) should come from application logs. |

---
*Created for Sentinel AI Cybersecurity Science Fair Prototype.*
