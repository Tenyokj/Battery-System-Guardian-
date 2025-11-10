// ============================================================
// Battery & System Guardian — Main Electron Process
// ============================================================

const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');
const notifier = require('node-notifier');
const psList = require('ps-list').default;

let tray = null;
let popupWindow = null;

// Default battery limits
let batteryMin = 25;
let batteryMax = 80;

// ------------------------------------------------------------
// App Initialization
// ------------------------------------------------------------
app.whenReady().then(() => {
  console.log('✅ App ready');
  if (process.platform === 'darwin') app.dock.hide();

  const iconPath = path.join(__dirname, 'batteryTemplate.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Battery & System Guardian');

  // Left click on tray icon — show/hide popup
  tray.on('click', (event, bounds) => togglePopup(bounds));

  // Right click (context menu)
  const menu = Menu.buildFromTemplate([{ label: 'Quit', role: 'quit' }]);
  tray.setContextMenu(menu);

  // Start background monitoring
  startBatteryMonitor();
});

// ------------------------------------------------------------
// Create or toggle popup window
// ------------------------------------------------------------
function togglePopup(bounds) {
  if (popupWindow && popupWindow.isVisible()) {
    popupWindow.hide();
    return;
  }

  if (!popupWindow) {
    popupWindow = new BrowserWindow({
      width: 1100,
      height: 260,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      webPreferences: {
        sandbox: false,
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    popupWindow.loadFile(path.join(__dirname, 'popup.html'));
    popupWindow.on('blur', () => popupWindow.hide());
  }

  const { x, y } = bounds;
  const { width, height } = popupWindow.getBounds();
  popupWindow.setBounds({
    x: Math.round(x - width / 2),
    y: Math.round(y),
    width,
    height,
  });
  popupWindow.show();
}

// ------------------------------------------------------------
// Battery Monitoring (runs every 30s)
// ------------------------------------------------------------
async function startBatteryMonitor() {
  console.log('⚡ Battery monitoring started');
  setInterval(async () => {
    try {
      const battery = await si.battery();
      if (!battery.hasBattery) return;

      const { percent, isCharging } = battery;
      tray.setToolTip(`Battery: ${percent}%`);

      if (percent >= batteryMax && isCharging) {
        showNotification('🔋 Battery Full', 'Please unplug your charger.');
      } else if (percent <= batteryMin && !isCharging) {
        showNotification('🔌 Battery Low', 'Please plug in your charger.');
      }
    } catch (err) {
      console.error('Battery monitoring error:', err.message);
    }
  }, 30000);
}

// ------------------------------------------------------------
// Notification helper
// ------------------------------------------------------------
function showNotification(title, message) {
  notifier.notify({ title, message, sound: true });
}

// ------------------------------------------------------------
// IPC Handlers — communication between popup and main
// ------------------------------------------------------------

// Battery
ipcMain.handle('getBattery', async () => await si.battery());

// Update battery limits
ipcMain.on('updateSettings', (_, { min, max }) => {
  batteryMin = min;
  batteryMax = max;
  console.log(`⚙️ Updated limits: ${min}% – ${max}%`);
});

// Processes
ipcMain.handle('getProcesses', async () => {
  const list = await psList();
  return list;
});

// Memory
ipcMain.handle('getMem', async () => await si.mem());

// File system
ipcMain.handle('getFsSize', async () => await si.fsSize());

// System + OS info
ipcMain.handle('getSystemOS', async () => {
  const system = await si.system();
  const os = await si.osInfo();
  return { system, os };
});

// CPU + temperature
ipcMain.handle('getCPUInfo', async () => {
  const cpu = await si.cpu();
  const temp = await si.cpuTemperature();
  return { cpu, temp };
});

// Network
ipcMain.handle('getNetworkInfo', async () => {
  const interfaces = await si.networkInterfaces();
  const stats = await si.networkStats();
  return { interfaces, stats };
});

// Disk info
ipcMain.handle('getDiskInfo', async () => {
  const layout = await si.diskLayout();
  const io = await si.disksIO();
  return { layout, io };
});

// Graphics info
ipcMain.handle('getGraphicsInfo', async () => await si.graphics());

// Users
ipcMain.handle('getUsersInfo', async () => await si.users());

// System time
ipcMain.handle('getSystemTime', async () => await si.time());