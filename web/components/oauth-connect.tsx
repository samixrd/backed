"use client";

import { useEffect, useRef, useState } from "react";

// Client-side connector: generates the OAuth auth request (PKCE), stashes the verifier + state in
// sessionStorage, then sends the user to Binance to approve. On return, /oauth/callback handles the
// code and posts it to the server route which exchanges it for a token and discovers tools.

export function OAuthConnect() {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("ready");
  const [tools, setTools] = useState<{ name: string; description?: string }[]>([]);
  const started = useRef(false);

  async function start() {
    setStatus("starting");
    const res = await fetch("/api/oauth/start");
    const j = await res.json();
    if (j.url) {
      // Persist verifier+state in sessionStorage so the callback can complete PKCE.
      sessionStorage.setItem("mcp_verifier", j.verifier);
      sessionStorage.setItem("mcp_state", j.state);
      setUrl(j.url);
      setStatus("open-browser");
      // Auto-open the Binance approval page.
      window.open(j.url, "_blank", "noopener");
    } else {
      setStatus("error: " + (j.error || "no url"));
    }
  }

  async function refreshStatus() {
    const res = await fetch("/api/oauth/status");
    const j = await res.json();
    if (j.connected) {
      setStatus("connected");
      setTools(j.tools || []);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    refreshStatus();
    const id = setInterval(refreshStatus, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded border border-border bg-surface p-5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Binance Agent OS connection</p>
      <div className="mt-3 flex items-center gap-3">
        {status === "connected" ? (
          <span className="rounded bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            CONNECTED
          </span>
        ) : (
          <span className="rounded bg-accent-faint px-2 py-0.5 text-[10px] font-semibold text-accent">
            {status === "ready" ? "NOT CONNECTED" : status.toUpperCase()}
          </span>
        )}
        {status !== "connected" && (
          <button
            onClick={start}
            disabled={status === "open-browser"}
            className="focus-ring rounded bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-50"
          >
            {status === "open-browser" ? "Waiting for approval…" : "Connect Binance"}
          </button>
        )}
      </div>

      {tools.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-faint">Discovered tools ({tools.length})</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tools.map((t) => (
              <span key={t.name} className="rounded border border-border bg-surface-raised px-2 py-1 font-mono text-[10px] text-muted" title={t.description}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {status === "open-browser" && (
        <p className="mt-3 text-[10px] text-faint">
          If the approval tab didn't open, <a className="text-accent underline" href={url!} target="_blank" rel="noopener">click here</a>.
          Approve the connection, then wait for the status to flip to CONNECTED.
        </p>
      )}
    </div>
  );
}
