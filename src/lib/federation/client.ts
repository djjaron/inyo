import type { InstanceManifest } from "./manifest";

const DIVIDEN_API_KEY = process.env.DIVIDEN_API_KEY;
const DIVIDEN_BASE_URL = "https://api.dividen.ai/v1";

export interface FederationStatus {
  registered: boolean;
  instanceId: string | null;
  lastHeartbeatAt: string | null;
  peersCount: number;
  _mock: boolean;
}

export interface RegisterResult {
  success: boolean;
  instanceId: string | null;
  message: string;
  _mock: boolean;
}

export interface HeartbeatResult {
  success: boolean;
  _mock: boolean;
}

export async function registerInstance(manifest: InstanceManifest): Promise<RegisterResult> {
  if (!DIVIDEN_API_KEY) {
    return {
      success: true,
      instanceId: "inyo-demo",
      message: "Mock registration — set DIVIDEN_API_KEY to connect to the live network",
      _mock: true,
    };
  }

  try {
    const res = await fetch(`${DIVIDEN_BASE_URL}/instances`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIVIDEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ manifest }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Dividen API error ${res.status}: ${text}`);
    }

    const response = await res.json() as { instanceId: string };
    return { success: true, instanceId: response.instanceId, message: "Registered", _mock: false };
  } catch (err) {
    return { success: false, instanceId: null, message: (err as Error).message, _mock: false };
  }
}

export async function sendHeartbeat(instanceId: string): Promise<HeartbeatResult> {
  if (!DIVIDEN_API_KEY) {
    return { success: true, _mock: true };
  }

  try {
    const res = await fetch(`${DIVIDEN_BASE_URL}/instances/${instanceId}/heartbeat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIVIDEN_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return { success: res.ok, _mock: false };
  } catch {
    return { success: false, _mock: false };
  }
}

export async function getFederationStatus(): Promise<FederationStatus> {
  if (!DIVIDEN_API_KEY) {
    return { registered: false, instanceId: null, lastHeartbeatAt: null, peersCount: 0, _mock: true };
  }

  try {
    const res = await fetch(`${DIVIDEN_BASE_URL}/instances/inyo/status`, {
      headers: {
        Authorization: `Bearer ${DIVIDEN_API_KEY}`,
      },
    });

    if (!res.ok) {
      return { registered: false, instanceId: null, lastHeartbeatAt: null, peersCount: 0, _mock: false };
    }

    const data = await res.json() as FederationStatus;
    return { ...data, _mock: false };
  } catch {
    return { registered: false, instanceId: null, lastHeartbeatAt: null, peersCount: 0, _mock: false };
  }
}
