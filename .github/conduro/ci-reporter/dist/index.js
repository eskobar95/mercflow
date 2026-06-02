#!/usr/bin/env node

// src/index.ts
import { readFileSync } from "fs";

// src/checks.ts
function classifyFindings(findings) {
  const blocking = [];
  const advisory = [];
  const reactDoctor = findings.reactDoctor;
  if (reactDoctor && typeof reactDoctor.score === "number") {
    const finding = {
      source: "ci-react-doctor",
      severity: reactDoctor.score < 50 ? "blocking" : "advisory",
      detail: `React Doctor score ${reactDoctor.score}`
    };
    (finding.severity === "blocking" ? blocking : advisory).push(finding);
  }
  if (Array.isArray(reactDoctor?.issues)) {
    for (const issue of reactDoctor.issues) {
      advisory.push({
        source: "ci-react-doctor",
        severity: "advisory",
        detail: issue.message ?? "React Doctor issue",
        file: issue.file,
        line: issue.line
      });
    }
  }
  const semgrep = findings.semgrep;
  for (const result of semgrep?.results ?? []) {
    const severity = result.extra?.severity?.toLowerCase() ?? "info";
    const finding = {
      source: "ci-semgrep",
      severity: severity === "error" ? "blocking" : "advisory",
      detail: result.extra?.message ?? result.check_id ?? "Semgrep finding",
      file: result.path,
      line: result.start?.line
    };
    (finding.severity === "blocking" ? blocking : advisory).push(finding);
  }
  const socket = findings.socket;
  const socketIssues = socket?.issues ?? socket?.results ?? [];
  for (const issue of socketIssues) {
    const sev = issue.severity?.toLowerCase() ?? "low";
    const finding = {
      source: "ci-socket",
      severity: sev === "high" || sev === "critical" ? "blocking" : "advisory",
      detail: issue.title ?? "Socket supply-chain finding",
      file: issue.file,
      line: issue.line
    };
    (finding.severity === "blocking" ? blocking : advisory).push(finding);
  }
  return { blocking, advisory };
}
function hasBlockingFindings(classified) {
  return classified.blocking.length > 0;
}

// src/index.ts
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--") || value === void 0) continue;
    switch (key) {
      case "--react-doctor":
        args.reactDoctor = value;
        i += 1;
        break;
      case "--semgrep":
        args.semgrep = value;
        i += 1;
        break;
      case "--socket":
        args.socket = value;
        i += 1;
        break;
      case "--pr-number":
      case "--pr":
        args.prNumber = Number.parseInt(value, 10);
        i += 1;
        break;
      case "--commit-sha":
      case "--sha":
        args.commitSha = value;
        i += 1;
        break;
      case "--repo":
        args.repo = value;
        i += 1;
        break;
      default:
        break;
    }
  }
  return args;
}
function readJsonFile(path, label) {
  if (!path) return void 0;
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read ${label} file (${path}): ${message}`);
    process.exit(1);
  }
}
function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
async function postIngest(workerUrl, apiKey, payload) {
  const res = await fetch(`${workerUrl.replace(/\/$/, "")}/ci/ingest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`POST /ci/ingest failed (${res.status}): ${text}`);
    process.exit(1);
  }
  const body = await res.json();
  if (!body.traceId) {
    console.error("POST /ci/ingest did not return traceId");
    process.exit(1);
  }
  if (res.status === 202 || body.pending) {
    console.log(`CI audit queued (traceId=${body.traceId})`);
  }
  return { traceId: body.traceId, blocking: body.blocking ?? false };
}
async function pollStatus(workerUrl, apiKey, traceId, timeoutMs) {
  const started = Date.now();
  const intervalMs = 5e3;
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(
      `${workerUrl.replace(/\/$/, "")}/ci/status/${encodeURIComponent(traceId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` }
      }
    );
    if (res.status === 404) {
      await sleep(intervalMs);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      console.error(`GET /ci/status failed (${res.status}): ${text}`);
      process.exit(1);
    }
    const body = await res.json();
    if (body.status === "completed" || body.status === "failed") {
      return { blocking: body.blocking ?? false, status: body.status ?? "completed" };
    }
    await sleep(intervalMs);
  }
  console.warn(`Timed out waiting for CI audit status after ${timeoutMs}ms`);
  return { blocking: false, status: "timeout" };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function runGateCli(argv) {
  try {
    const args = parseArgs(argv);
    if (!args.reactDoctor && !args.semgrep && !args.socket) {
      console.error("gate requires one of: --react-doctor, --semgrep, --socket");
      return 1;
    }
    const findings = {
      reactDoctor: readJsonFile(args.reactDoctor, "react-doctor"),
      semgrep: readJsonFile(args.semgrep, "semgrep"),
      socket: readJsonFile(args.socket, "socket")
    };
    const classified = classifyFindings(findings);
    if (hasBlockingFindings(classified)) {
      for (const finding of classified.blocking) {
        console.error(`BLOCKING [${finding.source}] ${finding.detail}`);
      }
      return 1;
    }
    console.log(
      `Gate passed (${classified.advisory.length} advisory finding(s), 0 blocking)`
    );
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return 1;
  }
}
async function runCli(argv) {
  try {
    const args = parseArgs(argv);
    const apiKey = requireEnv("CONDURO_API_KEY");
    const workerUrl = requireEnv("CONDURO_WORKER_URL");
    if (!args.prNumber || !args.commitSha || !args.repo) {
      console.error("Missing required flags: --pr-number, --commit-sha, --repo");
      return 1;
    }
    const findings = {
      reactDoctor: readJsonFile(args.reactDoctor, "react-doctor"),
      semgrep: readJsonFile(args.semgrep, "semgrep"),
      socket: readJsonFile(args.socket, "socket")
    };
    const classified = classifyFindings(findings);
    if (hasBlockingFindings(classified)) {
      console.error(`Blocking findings detected (${classified.blocking.length})`);
    } else {
      console.log(`Advisory findings: ${classified.advisory.length}`);
    }
    const ingest = await postIngest(workerUrl, apiKey, {
      prNumber: args.prNumber,
      commitSha: args.commitSha,
      repoFullName: args.repo,
      findings
    });
    const polled = await pollStatus(workerUrl, apiKey, ingest.traceId, 36e4);
    const blocking = polled.blocking || ingest.blocking;
    if (blocking) {
      console.error("Conduro CI reported blocking findings \u2014 failing check");
      return 1;
    }
    console.log(`Conduro CI passed (traceId=${ingest.traceId}, status=${polled.status})`);
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return 1;
  }
}
async function main() {
  const argv = process.argv.slice(2);
  const code = argv[0] === "gate" ? await runGateCli(argv.slice(1)) : await runCli(argv);
  process.exit(code);
}
var isDirectRun = typeof process.argv[1] === "string" && (process.argv[1].endsWith("/index.ts") || process.argv[1].endsWith("/index.js") || process.argv[1].includes("conduro-reporter"));
if (isDirectRun) {
  void main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exit(1);
  });
}
export {
  runCli,
  runGateCli
};
