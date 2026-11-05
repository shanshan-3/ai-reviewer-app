import { fork } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIMITS, MESSAGES } from './materialExtractionLimits.js';
export { LIMITS, MESSAGES } from './materialExtractionLimits.js';

export async function extractMaterial(file, overrides = {}) {
    const limits = { ...LIMITS, ...overrides };
    for (const [key, value] of Object.entries(limits)) {
        if (!Object.hasOwn(LIMITS, key) || !Number.isSafeInteger(value) || value < 1 || value > LIMITS[key]) {
            throw new Error(`Invalid or increased limit: ${key}`);
        }
    }
    const started = performance.now();
    const worker = fork(fileURLToPath(new URL('materialExtractionWorker.js', import.meta.url)), [], {
        execArgv: ['--max-old-space-size=192'], windowsHide: true,
        stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    });
    let outcome, reason, stderr = '', peakMemoryBytes = 0;
    let monitoring = false, failureStage, exitCode, exitSignal;
    const stop = (code, stage) => { reason ??= code; failureStage ??= stage; worker.kill('SIGKILL'); };
    const deadline = setTimeout(() => stop('TIME_LIMIT', 'deadline'), limits.timeMs);
    // shortcut: Linux monitors RSS; Windows development has heap/time limits only.
    const monitor = process.platform === 'linux' ? setInterval(async () => {
        if (monitoring) return;
        monitoring = true;
        try {
            const status = await readFile(`/proc/${worker.pid}/status`, 'utf8');
            const rss = Number(status.match(/^VmRSS:\s+(\d+) kB/m)?.[1]);
            if (!Number.isFinite(rss)) {
                // Exited workers have no RSS while their final IPC message/close event is still arriving.
                if (/^State:\s+[ZX]\b/m.test(status)) return;
                stop('WORKER_FAILED', 'rss-unavailable');
                return;
            }
            peakMemoryBytes = Math.max(peakMemoryBytes, rss * 1024);
            if (peakMemoryBytes > limits.memoryBytes) stop('MEMORY_LIMIT', 'rss-limit');
        } catch (error) {
            if (error.code !== 'ENOENT' && error.code !== 'ESRCH') stop('WORKER_FAILED', 'rss-read');
        } finally { monitoring = false; }
    }, 25) : undefined;
    worker.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-2000); });
    worker.on('message', message => { outcome = message; });
    await new Promise(done => {
        worker.once('error', () => { reason ??= 'WORKER_FAILED'; failureStage ??= 'worker-error'; });
        worker.once('close', (code, signal) => { exitCode = code; exitSignal = signal; done(); });
        worker.send({ file: resolve(file), limits }, error => { if (error) stop('WORKER_FAILED', 'ipc-send'); });
    });
    clearTimeout(deadline);
    clearInterval(monitor);
    peakMemoryBytes = Math.max(peakMemoryBytes, (outcome?.metrics?.childMaxRssKiB ?? 0) * 1024);
    if (/heap out of memory/i.test(stderr) || peakMemoryBytes > limits.memoryBytes) reason = 'MEMORY_LIMIT';
    if (!outcome) reason ??= 'WORKER_FAILED';
    const elapsedMs = Math.round(performance.now() - started);
    if (reason) console.error('Material extraction failed', JSON.stringify({
        code: reason, stage: failureStage ?? 'worker-exit', exitCode, exitSignal,
        receivedOutcome: Boolean(outcome), elapsedMs, peakMemoryBytes,
        nodeVersion: process.version, platform: process.platform,
        stderrPresent: Boolean(stderr.trim()), heapOutOfMemory: /heap out of memory/i.test(stderr),
        moduleLoadFailure: /ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND/.test(stderr),
    }));
    if (reason) outcome = { status: 'rejected', code: reason, message: MESSAGES[reason], sections: [], warnings: [], metrics: {} };
    return { ...outcome, metrics: { ...outcome.metrics, elapsedMs, peakMemoryBytes }, limits };
}
