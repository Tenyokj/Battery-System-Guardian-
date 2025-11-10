# 🔋 Battery & System Guardian

A lightweight macOS tray utility that monitors your battery, CPU, memory, disk, and network activity — all in one clean popup window.

![Preview](preview.png)  
*(You can add your own screenshot here)*

---

## ✨ Features

- 🧠 Real-time CPU usage, temperature, and status  
- 💾 Memory usage overview  
- 💽 Disk layout & I/O activity monitor  
- 🌐 Network interface stats (upload/download speed)  
- 🎨 GPU load and resolution info  
- 🔋 Battery charge notifications  
- 👤 Active users and uptime tracker  
- 🕒 Local system time & timezone  

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/tenyokj/battery-guardian.git
cd battery-guardian

### 2. Install dependencies
npm install
## 3. Run in development mode
npm start


⸻

## 🧱 Build as a macOS App

### To generate a .app (and .dmg installer):
npm run make
### The built files will appear inside the out/make/ folder:

out/make/Battery & System Guardian.app
out/make/Battery & System Guardian.dmg


⸻

🖥️ macOS Permissions

To enable process and active window monitoring, grant:

System Settings → Privacy & Security → Accessibility → Battery Guardian

⸻

📦 Distribution

You can distribute the app in two ways:
	1.	ZIP file: share Battery & System Guardian.zip
	2.	DMG installer: upload to GitHub Releases or send directly

⸻

💡 Development Notes

Built with:
	•	Electron￼
	•	Systeminformation￼
	•	Node Notifier￼
	•	PS-List￼

⸻

🧑‍💻 Author

Tenyokj
🔗 github.com/tenyokj￼

⸻

⚖️ License

This project is licensed under the MIT License — feel free to use, modify, and share.