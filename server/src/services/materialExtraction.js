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
    let monitoring = false;
    const stop = code => { reason ??= code; worker.kill('SIGKILL'); };
    const deadline = setTimeout(() => stop('TIME_LIMIT'), limits.timeMs);
    // shortcut: Linux monitors RSS; Windows development has heap/time limits only.
    const monitor = process.platform === 'linux' ? setInterval(async () => {
        if (monitoring) return;
        monitoring = true;
        try {
            const status = await readFile(`/proc/${worker.pid}/status`, 'utf8');
            const rss = Number(status.match(/^VmRSS:\s+(\d+) kB/m)?.[1]);
            if (!Number.isFinite(rss)) { stop('WORKER_FAILED'); return; }
            peakMemoryBytes = Math.max(peakMemoryBytes, rss * 1024);
            if (peakMemoryBytes > limits.memoryBytes) stop('MEMORY_LIMIT');
        } catch (error) {
            if (error.code !== 'ENOENT' && error.code !== 'ESRCH') stop('WORKER_FAILED');
        } finally { monitoring = false; }
    }, 25) : undefined;
    worker.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-2000); });
    worker.on('message', message => { outcome = message; });
    await new Promise(done => {
        worker.once('error', () => { reason ??= 'WORKER_FAILED'; });
        worker.once('close', done);
        worker.send({ file: resolve(file), limits }, error => { if (error) stop('WORKER_FAILED'); });
    });
    clearTimeout(deadline);
    clearInterval(monitor);
    peakMemoryBytes = Math.max(peakMemoryBytes, (outcome?.metrics?.childMaxRssKiB ?? 0) * 1024);
    if (/heap out of memory/i.test(stderr) || peakMemoryBytes > limits.memoryBytes) reason = 'MEMORY_LIMIT';
    if (!outcome) reason ??= 'WORKER_FAILED';
    if (reason) outcome = { status: 'rejected', code: reason, message: MESSAGES[reason], sections: [], warnings: [], metrics: {} };
    return { ...outcome, metrics: { ...outcome.metrics, elapsedMs: Math.round(performance.now() - started), peakMemoryBytes }, limits };
}
