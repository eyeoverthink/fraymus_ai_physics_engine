const defaultGatewayOrigin = "https://fraymus-cloud.srv1944678.hstgr.cloud";
const discoveryTimeoutMs = 8_000;
const chatTimeoutMs = 120_000;

type GatewayFetch = typeof fetch;

export interface GatewayModel {
  id: string;
  status: "connected";
  reason: string;
  source: "live";
}

export interface GatewayChatResult {
  status: "succeeded" | "failed";
  message: string;
  model?: string;
  fallback: boolean;
  source: "live";
  upstreamStatus?: number;
}

export interface ModelGateway {
  discover(): Promise<GatewayModel[]>;
  chat(message: string): Promise<GatewayChatResult>;
}

function gatewayOrigin(configured?: string): string {
  const url = new URL(configured ?? process.env.SFA_MODEL_GATEWAY_URL ?? defaultGatewayOrigin);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("SFA model gateway must be an HTTPS origin without embedded credentials");
  }
  return url.origin;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeFailureMessage(status?: number): string {
  return status
    ? `The live model gateway could not complete the request (HTTP ${status}).`
    : "The live model gateway is currently unreachable.";
}

export function createModelGateway(options: {
  baseUrl?: string;
  fetch?: GatewayFetch;
} = {}): ModelGateway {
  const origin = gatewayOrigin(options.baseUrl);
  const fetcher = options.fetch ?? fetch;

  return {
    async discover(): Promise<GatewayModel[]> {
      const response = await fetcher(`${origin}/api/health`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(discoveryTimeoutMs),
      });
      if (!response.ok) throw new Error(`Gateway health returned HTTP ${response.status}`);
      const body: unknown = await response.json();
      if (!isRecord(body) || body.ok !== true || (body.llm !== "ollama" && body.llm !== "claude")) {
        throw new Error("Gateway health response did not match the approved contract");
      }
      return [{
        id: body.llm,
        status: "connected",
        reason: `Discovered from the approved live gateway (${body.llm}).`,
        source: "live",
      }];
    },

    async chat(message: string): Promise<GatewayChatResult> {
      try {
        const response = await fetcher(`${origin}/api/chat`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({ message }),
          signal: AbortSignal.timeout(chatTimeoutMs),
        });
        const body: unknown = await response.json().catch(() => undefined);
        if (
          response.ok &&
          isRecord(body) &&
          body.ok === true &&
          typeof body.reply === "string" &&
          body.reply.length > 0 &&
          typeof body.model === "string" &&
          body.model.length > 0 &&
          (body.fallback === undefined || typeof body.fallback === "boolean")
        ) {
          return {
            status: "succeeded",
            message: body.reply,
            model: body.model,
            fallback: body.fallback === true,
            source: "live",
            upstreamStatus: response.status,
          };
        }
        return {
          status: "failed",
          message: safeFailureMessage(response.status),
          fallback: false,
          source: "live",
          upstreamStatus: response.status,
        };
      } catch {
        return {
          status: "failed",
          message: safeFailureMessage(),
          fallback: false,
          source: "live",
        };
      }
    },
  };
}