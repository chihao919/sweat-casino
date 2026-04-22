"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [info, setInfo] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().slice(11, 19)} ${msg}`]);
  };

  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;

    // Check all Capacitor-related globals
    const data: Record<string, string> = {
      "window.Capacitor": String(!!win.Capacitor),
      "window.Capacitor.isNativePlatform": "N/A",
      "window.Capacitor.getPlatform": "N/A",
      "window.webkit": String(!!win.webkit),
      "window.webkit.messageHandlers": "N/A",
      "window.webkit.messageHandlers.bridge": "N/A",
      "window.androidBridge": String(!!win.androidBridge),
      "window.CapacitorCustomPlatform": String(!!win.CapacitorCustomPlatform),
      "navigator.userAgent": navigator.userAgent.slice(0, 100),
      "location.protocol": location.protocol,
      "location.hostname": location.hostname,
    };

    if (win.Capacitor) {
      const cap = win.Capacitor as Record<string, unknown>;
      data["window.Capacitor.isNativePlatform"] = String(
        typeof cap.isNativePlatform === "function"
          ? (cap.isNativePlatform as () => boolean)()
          : cap.isNativePlatform
      );
      data["window.Capacitor.getPlatform"] = String(
        typeof cap.getPlatform === "function"
          ? (cap.getPlatform as () => string)()
          : cap.getPlatform
      );
      data["Capacitor.Plugins"] = JSON.stringify(Object.keys((cap.Plugins as object) || {}));
    }

    if (win.webkit) {
      const webkit = win.webkit as Record<string, unknown>;
      data["window.webkit.messageHandlers"] = String(!!webkit.messageHandlers);
      if (webkit.messageHandlers) {
        const handlers = webkit.messageHandlers as Record<string, unknown>;
        data["window.webkit.messageHandlers.bridge"] = String(!!handlers.bridge);
        data["messageHandler keys"] = JSON.stringify(Object.keys(handlers));
      }
    }

    setInfo(data);
    addLog("Initial check complete");

    // Try importing @capacitor/core
    import("@capacitor/core").then((mod) => {
      addLog(`@capacitor/core loaded`);
      addLog(`Capacitor.getPlatform() = ${mod.Capacitor.getPlatform()}`);
      addLog(`Capacitor.isNativePlatform() = ${mod.Capacitor.isNativePlatform()}`);
      addLog(`Capacitor.isPluginAvailable('App') = ${mod.Capacitor.isPluginAvailable("App")}`);
      addLog(`Capacitor.isPluginAvailable('Health') = ${mod.Capacitor.isPluginAvailable("Health")}`);
    }).catch((err) => {
      addLog(`@capacitor/core import error: ${err}`);
    });

    // Retry check after delays
    const delays = [500, 1000, 2000, 3000];
    delays.forEach((delay) => {
      setTimeout(() => {
        const w = window as unknown as Record<string, unknown>;
        const hasCapacitor = !!w.Capacitor;
        const hasWebkit = !!(w.webkit as Record<string, unknown>)?.messageHandlers;
        addLog(`[${delay}ms] Capacitor=${hasCapacitor}, webkit.messageHandlers=${hasWebkit}`);

        if (w.Capacitor) {
          const cap = w.Capacitor as Record<string, unknown>;
          if (typeof cap.getPlatform === "function") {
            addLog(`[${delay}ms] platform=${(cap.getPlatform as () => string)()}`);
          }
        }
      }, delay);
    });

    // Try Health plugin
    setTimeout(async () => {
      try {
        const { Health } = await import("@capgo/capacitor-health");
        addLog("Health plugin imported");
        const avail = await Health.isAvailable();
        addLog(`Health.isAvailable() = ${JSON.stringify(avail)}`);
      } catch (err) {
        addLog(`Health plugin error: ${err}`);
      }
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 font-mono text-xs">
      <h1 className="text-lg font-bold mb-4 text-white">Capacitor Debug</h1>

      <h2 className="text-sm font-bold text-yellow-400 mb-2">Globals</h2>
      <div className="space-y-1 mb-6">
        {Object.entries(info).map(([key, val]) => (
          <div key={key} className="flex">
            <span className="text-zinc-500 w-64 shrink-0">{key}:</span>
            <span className={val === "true" ? "text-green-400" : val === "false" ? "text-red-400" : "text-white"}>
              {val}
            </span>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-bold text-yellow-400 mb-2">Logs</h2>
      <div className="space-y-0.5">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}
