# ASRTAVA On-Premises Air-Gapped Installation Guide

## 1. Operating Model & Perpetual Licensing
This installation runs **100% offline inside the hospital's on-site datacenter**.
- Zero internet access required.
- Zero external cloud dependencies.
- Perpetual license bound to local hardware MAC/motherboard hash; never terminates upon lack of internet connection.
- Guaranteed emergency care continuity.

## 2. Server Prerequisites
- **Hardware**: Dedicated Rack Server or High-End Workstation (e.g. Dell PowerEdge / HP ProLiant), 8 Cores, 32 GB RAM, 1 TB NVMe SSD (RAID 1/10 recommended).
- **OS**: Ubuntu 22.04 LTS / RHEL 9 or Windows Server 2022.
- **Network**: Local Hospital LAN (Gigabit Ethernet / Wi-Fi 6).

## 3. Installation Walkthrough

### Step 1: Extract Offline Distribution Archive
```bash
tar -xzvf asrtava-v3.0.0-onprem-bundle.tar.gz -C /opt/asrtava
cd /opt/asrtava
```

### Step 2: Install Perpetual License Key
Copy your issued license file `asrtava_license.key` into `/opt/asrtava/storage/`:
```bash
cp /media/usb/asrtava_license.key /opt/asrtava/storage/
```

### Step 3: Run Database Migrations
```bash
chmod +x scripts/run_migrations.sh
./scripts/run_migrations.sh
```

### Step 4: Start Air-Gapped Stack
```bash
docker compose -f docker/docker-compose.onprem.yml --env-file .env.onprem.example up -d
```

### Step 5: Network Access
The ASRTAVA Web Portal will be immediately accessible to all hospital workstations on the local network via `http://<hospital_server_ip>`.

