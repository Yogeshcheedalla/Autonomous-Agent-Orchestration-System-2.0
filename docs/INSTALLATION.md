# Akansha Autonomous Automation — Installation & Quickstart

## System Requirements
- **OS**: Windows 10/11 64-bit
- **Node.js**: v18+ (tested on Node v24.18.1)
- **Python**: 3.10+ (for Browser Use & Open Interpreter)
- **PowerShell**: 5.1+ (Built-in on Windows)

---

## Quickstart Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Akansha Backend Server
```bash
npx tsx server/index.ts
```

### 3. Launch Frontend Client
```bash
npm run client
```

### 4. Run OSWorld 20-Scenario Validation Suite
```bash
npx tsx validation/scenarios/run_osworld_suite.ts
```

---

## Optional Adapter Services

### UI-TARS Desktop (GUI Agent)
```bash
git clone https://github.com/bytedance/UI-TARS-desktop.git
cd UI-TARS-desktop
# Run local daemon on port 8000
```

### Odysseus Local AI Workspace
```bash
git clone https://github.com/odysseus-dev/odysseus.git
cd odysseus
docker compose up -d
```
