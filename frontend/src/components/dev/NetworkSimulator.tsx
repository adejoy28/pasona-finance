import React, { useState } from "react";
import { Wifi, WifiOff, ServerCrash, KeyRound } from "lucide-react";

type SimState = "online" | "offline" | "server_error" | "auth_expired";

/**
 * Dev-Only Network Simulator (Phase 3 Acceptance):
 * - Simulates: Online, Offline, Server Unreachable (500), Session Expired (401)
 * - Renders ONLY when import.meta.env.DEV is true.
 */
export function NetworkSimulator() {
  if (!import.meta.env.DEV) return null;

  const [state, setState] = useState<SimState>("online");
  const [collapsed, setCollapsed] = useState(true);

  const applyState = (next: SimState) => {
    setState(next);

    switch (next) {
      case "online":
        window.dispatchEvent(new Event("online"));
        window.dispatchEvent(new CustomEvent("pasona:server-restored"));
        window.dispatchEvent(new CustomEvent("pasona:auth-restored"));
        break;
      case "offline":
        window.dispatchEvent(new Event("offline"));
        break;
      case "server_error":
        window.dispatchEvent(new CustomEvent("pasona:server-unreachable"));
        break;
      case "auth_expired":
        window.dispatchEvent(new CustomEvent("pasona:reauth-required"));
        break;
    }
  };

  return (
    <div className="fixed bottom-24 left-4 z-[99] select-none text-[11px] font-bold">
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Network Simulator (Dev Only)"
          className="px-2.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-xl flex items-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer backdrop-blur-md"
        >
          {state === "online" && <Wifi size={12} className="text-emerald-400" />}
          {state === "offline" && <WifiOff size={12} className="text-amber-400" />}
          {state === "server_error" && <ServerCrash size={12} className="text-rose-400" />}
          {state === "auth_expired" && <KeyRound size={12} className="text-indigo-400" />}
          <span className="capitalize">{state.replace("_", " ")}</span>
        </button>
      ) : (
        <div className="p-2 rounded-2xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl flex flex-col gap-1 backdrop-blur-md animate-slide-up">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800 text-[10px] text-slate-400">
            <span>Network Simulator</span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-slate-400 hover:text-white cursor-pointer px-1"
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            onClick={() => applyState("online")}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left cursor-pointer transition-colors ${
              state === "online" ? "bg-emerald-500/20 text-emerald-300 font-black" : "hover:bg-slate-800 text-slate-300"
            }`}
          >
            <Wifi size={13} className="text-emerald-400" />
            <span>Online (Normal)</span>
          </button>

          <button
            type="button"
            onClick={() => applyState("offline")}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left cursor-pointer transition-colors ${
              state === "offline" ? "bg-amber-500/20 text-amber-300 font-black" : "hover:bg-slate-800 text-slate-300"
            }`}
          >
            <WifiOff size={13} className="text-amber-400" />
            <span>Offline Mode</span>
          </button>

          <button
            type="button"
            onClick={() => applyState("server_error")}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left cursor-pointer transition-colors ${
              state === "server_error" ? "bg-rose-500/20 text-rose-300 font-black" : "hover:bg-slate-800 text-slate-300"
            }`}
          >
            <ServerCrash size={13} className="text-rose-400" />
            <span>Server Error (500)</span>
          </button>

          <button
            type="button"
            onClick={() => applyState("auth_expired")}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left cursor-pointer transition-colors ${
              state === "auth_expired" ? "bg-indigo-500/20 text-indigo-300 font-black" : "hover:bg-slate-800 text-slate-300"
            }`}
          >
            <KeyRound size={13} className="text-indigo-400" />
            <span>Session Expired (401)</span>
          </button>
        </div>
      )}
    </div>
  );
}
