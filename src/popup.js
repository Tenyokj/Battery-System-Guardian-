// ============================================================
// Battery & System Guardian — Popup Renderer
// ============================================================

const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('status');
  const minInput = document.getElementById('min');
  const maxInput = document.getElementById('max');
  const saveBtn = document.getElementById('save');
  const processList = document.getElementById('process-list');
  const procCount = document.getElementById('proccount');
  const memoryList = document.getElementById('memory-list');
  const fsList = document.getElementById('fs-list');
  const systemOsList = document.getElementById('sysOS-list');

  // ------------------------------------------------------------
  // Battery info
  // ------------------------------------------------------------
  const battery = await ipcRenderer.invoke('getBattery');
  status.textContent = `Battery: ${battery.percent}% (${battery.isCharging ? 'Charging' : 'Not charging'})`;

  saveBtn.addEventListener('click', () => {
    const min = parseInt(minInput.value);
    const max = parseInt(maxInput.value);
    ipcRenderer.send('updateSettings', { min, max });
    status.textContent = `✅ Settings saved: ${min}% - ${max}%`;
  });

  // ------------------------------------------------------------
  // Process list
  // ------------------------------------------------------------
  async function updateProcesses() {
    try {
      const processes = await ipcRenderer.invoke('getProcesses');
      const out = processes
        .map(p => `${p.name.padEnd(25)} PID:${p.pid.toString().padEnd(6)} CPU:${(p.cpu || 0).toFixed(1)}%`)
        .join('\n');

      processList.textContent = out;
      procCount.textContent = processes.length;
    } catch (err) {
      processList.textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // Memory info
  // ------------------------------------------------------------
  async function updateMemoryInfo() {
    try {
      const memory = await ipcRenderer.invoke('getMem');
      const totalGB = (memory.total / 1024 ** 3).toFixed(1);
      const usedGB = (memory.used / 1024 ** 3).toFixed(1);
      const usedPercent = ((memory.used / memory.total) * 100).toFixed(1);

      memoryList.textContent = `💾 Memory: ${usedGB} / ${totalGB} GB (${usedPercent}%) used`;
    } catch (err) {
      memoryList.textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // File system info
  // ------------------------------------------------------------
  async function updateFsInfo() {
    try {
      const drives = await ipcRenderer.invoke('getFsSize');
      const out = drives
        .map(d => {
          const totalGB = (d.size / 1024 ** 3).toFixed(1);
          const usedGB = (d.used / 1024 ** 3).toFixed(1);
          const percent = d.use.toFixed(1);
          return `${d.mount.padEnd(15)} ${usedGB}/${totalGB} GB (${percent}%)`;
        })
        .join('\n');
      fsList.textContent = out;
    } catch (err) {
      fsList.textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // System & OS info
  // ------------------------------------------------------------
  async function updateSystemInfo() {
    try {
      const info = await ipcRenderer.invoke('getSystemOS');
      const out = `
🖥️ ${info.system.manufacturer} ${info.system.model}
💻 ${info.os.distro} (${info.os.platform})
🔢 Kernel: ${info.os.kernel}
⚙️ Arch: ${info.os.arch}
      `;
      systemOsList.textContent = out.trim();
    } catch (err) {
      systemOsList.textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // CPU info
  // ------------------------------------------------------------
  async function updateCPUInfo() {
    try {
      const info = await ipcRenderer.invoke('getCPUInfo');
      const cpu = info.cpu;
      const temp = info.temp.main || 0;

      let emoji = '🟢';
      let label = 'Normal';
      if (temp >= 70) { emoji = '🔴'; label = 'Hot'; }
      else if (temp >= 50) { emoji = '🟠'; label = 'Warm'; }

      const out = `
🧩 ${cpu.manufacturer} ${cpu.brand}
⚙️ ${cpu.cores} cores / ${cpu.physicalCores} physical
🔁 Speed: ${cpu.speed} GHz
🔥 Temp: ${temp ? temp + '°C' : 'N/A'}  ${emoji} ${label}
      `;
      document.getElementById('cpu-list').textContent = out.trim();
    } catch (err) {
      document.getElementById('cpu-list').textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // Network info
  // ------------------------------------------------------------
  async function updateNetworkInfo() {
    try {
      const info = await ipcRenderer.invoke('getNetworkInfo');
      const iface = info.interfaces.find(i => i.operstate === 'up') || info.interfaces[0];
      const stat = info.stats[0] || {};

      const formatBytes = bytes =>
        bytes > 1024 * 1024
          ? (bytes / 1024 / 1024).toFixed(1) + ' MB/s'
          : (bytes / 1024).toFixed(1) + ' KB/s';

      const rx = stat.rx_sec || 0;
      const tx = stat.tx_sec || 0;
      const activity = rx + tx;

      let emoji = '⚫';
      let label = 'Idle';
      if (activity > 500 * 1024) { emoji = '🔴'; label = 'High'; }
      else if (activity > 50 * 1024) { emoji = '🟠'; label = 'Medium'; }
      else if (activity > 0) { emoji = '🟢'; label = 'Active'; }

      const out = `
📡 Interface: ${iface.iface || 'N/A'}
🔌 IP: ${iface.ip4 || 'No IP'}
⬇️ Download: ${formatBytes(rx)}
⬆️ Upload: ${formatBytes(tx)}
📶 Status: ${emoji} ${label}
      `;
      document.getElementById('network-list').textContent = out.trim();
    } catch (err) {
      document.getElementById('network-list').textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // Disk info
  // ------------------------------------------------------------
  async function updateDiskInfo() {
    try {
      const info = await ipcRenderer.invoke('getDiskInfo');
      const disk = info.layout[0] || {};
      const io = info.io || {};

      const readIO = io.rIO || 0;
      const writeIO = io.wIO || 0;
      const totalIO = io.tIO || 0;

      let emoji = '⚫';
      let label = 'Idle';
      if (totalIO > 100000) { emoji = '🔴'; label = 'High'; }
      else if (totalIO > 10000) { emoji = '🟠'; label = 'Medium'; }
      else if (totalIO > 0) { emoji = '🟢'; label = 'Active'; }

      const formatGB = bytes => (bytes / 1024 ** 3).toFixed(1) + ' GB';

      const out = `
📀 Model: ${disk.name || 'Unknown'}
💾 Type: ${disk.interfaceType || 'N/A'}
⚙️ Size: ${disk.size ? formatGB(disk.size) : 'N/A'}
⬇️ Read Ops: ${readIO.toLocaleString()}
⬆️ Write Ops: ${writeIO.toLocaleString()}
📊 Total IO: ${totalIO.toLocaleString()}
📶 Status: ${emoji} ${label}
      `;
      document.getElementById('disk-list').textContent = out.trim();
    } catch (err) {
      document.getElementById('disk-list').textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // Graphics info
  // ------------------------------------------------------------
  async function updateGraphicsInfo() {
    try {
      const info = await ipcRenderer.invoke('getGraphicsInfo');
      const gpu = info.controllers[0] || {};
      const display = info.displays[0] || {};

      const load = gpu.utilizationGpu || 0;
      const vram = gpu.vram
        ? gpu.vram + ' MB'
        : gpu.vramDynamic
        ? gpu.vramDynamic + ' MB (dynamic)'
        : 'Shared';

      const resX = display.resolutionx || screen.width;
      const resY = display.resolutiony || screen.height;

      let emoji = '⚫';
      let label = 'Idle';
      if (load > 80) { emoji = '🔴'; label = 'High'; }
      else if (load > 40) { emoji = '🟠'; label = 'Medium'; }
      else if (load > 0) { emoji = '🟢'; label = 'Active'; }

      const out = `
🧩 GPU: ${gpu.vendor || 'Apple'} ${gpu.model || 'Integrated GPU'}
🎛️ VRAM: ${vram}
📺 Display: ${resX}x${resY}
📶 Status: ${emoji} ${label}
      `;
      document.getElementById('graphics-list').textContent = out.trim();
    } catch (err) {
      document.getElementById('graphics-list').textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // Users info
  // ------------------------------------------------------------
  async function updateUsersInfo() {
    try {
      const users = await ipcRenderer.invoke('getUsersInfo');
      if (!users || users.length === 0) {
        document.getElementById('users-list').textContent = 'No active users';
        return;
      }

      const out = users
        .map(u => `👤 ${u.user} (${u.tty || 'console'}) — ${u.date}`)
        .join('\n');
      document.getElementById('users-list').textContent = out;
    } catch (err) {
      document.getElementById('users-list').textContent = `Error: ${err.message}`;
    }
  }

  // ------------------------------------------------------------
  // System time
  // ------------------------------------------------------------
    async function updateSystemTime() {
        try {
            const t = await ipcRenderer.invoke('getSystemTime');

            const uptimeHours = (t.uptime / 3600).toFixed(1);
            const current = new Date().toLocaleTimeString(); // ✅ use system local time
            const timezone = t.timezone || 'Unknown';

            const out = `
        ⌛ Uptime: ${uptimeHours} hours
        🕰️ Current Time: ${current}
        🌍 Timezone: ${timezone}
            `;

            document.getElementById('time-list').textContent = out.trim();
        } catch (err) {
            document.getElementById('time-list').textContent = `Error: ${err.message}`;
        }
    }

  // ------------------------------------------------------------
  // Initialize + auto refresh
  // ------------------------------------------------------------
  updateProcesses();
  updateMemoryInfo();
  updateFsInfo();
  updateSystemInfo();
  updateCPUInfo();
  updateNetworkInfo();
  updateDiskInfo();
  updateGraphicsInfo();
  updateUsersInfo();
  updateSystemTime();

  setInterval(updateProcesses, 5000);
  setInterval(updateMemoryInfo, 5000);
  setInterval(updateFsInfo, 5000);
  setInterval(updateSystemInfo, 5000);
  setInterval(updateCPUInfo, 5000);
  setInterval(updateNetworkInfo, 5000);
  setInterval(updateDiskInfo, 5000);
  setInterval(updateGraphicsInfo, 5000);
  setInterval(updateUsersInfo, 10000);
  setInterval(updateSystemTime, 5000);
});