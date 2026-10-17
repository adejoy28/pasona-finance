import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";

export function TestInputPage() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [text3, setText3] = useState("");
  const [text4, setText4] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Input Test — Pasona";
  }, []);

  const addLog = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLog((prev) => [...prev.slice(-20), entry]);
  };

  return (
    <div style={{ padding: "24px", fontFamily: "monospace", background: "#0f1120", color: "#e2e8f0", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>
        Input Freeze Test
      </h1>

      {/* TEST 1: Bare-bones input */}
      <section style={{ marginBottom: "32px", padding: "16px", border: "1px solid #334155", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#94a3b8" }}>
          TEST 1: Plain HTML input (no classes, no styles)
        </h2>
        <input
          type="text"
          placeholder="Type here..."
          value={text1}
          onChange={(e) => { setText1(e.target.value); addLog("test1: onChange"); }}
          onFocus={() => addLog("test1: FOCUS")}
          onBlur={() => addLog("test1: BLUR")}
          style={{ width: "100%", padding: "12px", fontSize: "16px", border: "1px solid #475569", borderRadius: "4px", background: "#1e293b", color: "#e2e8f0" }}
        />
      </section>

      {/* TEST 2: Input with transition-colors (removed from login) */}
      <section style={{ marginBottom: "32px", padding: "16px", border: "1px solid #334155", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#94a3b8" }}>
          TEST 2: Input with transition-colors + focus:border (original culprit)
        </h2>
        <input
          type="text"
          placeholder="Type here..."
          value={text2}
          onChange={(e) => setText2(e.target.value)}
          onFocus={() => addLog("test2: FOCUS")}
          onBlur={() => addLog("test2: BLUR")}
          style={{ width: "100%", padding: "12px", fontSize: "16px", border: "1px solid #475569", borderRadius: "4px", background: "#1e293b", color: "#e2e8f0", transition: "border-color 0.15s ease" }}
        />
      </section>

      {/* TEST 3: Input in background container with gradients (like auth-shell) */}
      <section style={{ marginBottom: "32px", padding: "16px", border: "1px solid #334155", borderRadius: "8px", background: "radial-gradient(60% 50% at 18% 12%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(50% 50% at 85% 90%, rgba(99,102,241,0.18), transparent 60%), linear-gradient(180deg, #0c0e1a 0%, #080a19 100%)" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#94a3b8" }}>
          TEST 3: Input inside auth-shell gradient background
        </h2>
        <div style={{ borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "24px" }}>
          <input
            type="text"
            placeholder="Type here..."
            value={text3}
            onChange={(e) => setText3(e.target.value)}
            onFocus={() => addLog("test3: FOCUS")}
            onBlur={() => addLog("test3: BLUR")}
            style={{ width: "100%", padding: "12px", fontSize: "16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", background: "rgba(2,6,23,0.6)", color: "#e2e8f0", outline: "none" }}
          />
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>Same bg as auth shell card</div>
        </div>
      </section>

      {/* TEST 4: Input with will-change / transform / GPU layers */}
      <section style={{ marginBottom: "32px", padding: "16px", border: "1px solid #334155", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#94a3b8" }}>
          TEST 4: Input with GPU compositing properties
        </h2>
        <input
          type="text"
          placeholder="Type here..."
          value={text4}
          onChange={(e) => setText4(e.target.value)}
          onFocus={() => addLog("test4: FOCUS")}
          onBlur={() => addLog("test4: BLUR")}
          style={{ width: "100%", padding: "12px", fontSize: "16px", border: "1px solid #475569", borderRadius: "4px", background: "#1e293b", color: "#e2e8f0", willChange: "transform", transform: "translateZ(0)", backfaceVisibility: "hidden" }}
        />
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>will-change + translateZ + backfaceVisibility — forces GPU layer</div>
      </section>

      {/* Live event log */}
      <section style={{ padding: "16px", border: "1px solid #334155", borderRadius: "8px", background: "#0a0b1a" }}>
        <h2 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#94a3b8" }}>
          Event Log
        </h2>
        <div ref={logRef} style={{ maxHeight: "200px", overflowY: "auto", fontSize: "11px", color: "#22c55e", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          {log.length === 0 ? "Tap any input above — events appear here. If log stops, UI thread is frozen." : log.map((entry, i) => <div key={i}>{entry}</div>)}
        </div>
      </section>

      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <Link to="/login" style={{ color: "#818cf8", fontSize: "13px" }}>← Back to Login</Link>
      </div>
    </div>
  );
}
