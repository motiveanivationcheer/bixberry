import type { NetworkMetrics, DeviceHealth } from '../types';

export type MetricsListener = (metrics: NetworkMetrics) => void;
export type DeviceHealthListener = (health: DeviceHealth) => void;

export class OptimizationEngine {
  private static isMonitoring = false;
  private static timerId: NodeJS.Timeout | null = null;
  private static pingIntervalMs = 5000;
  private static consecutiveErrors = 0;
  private static metricsListeners: Set<MetricsListener> = new Set();
  private static deviceHealthListeners: Set<DeviceHealthListener> = new Set();

  private static currentMetrics: NetworkMetrics = {
    currentLatency: 42,
    jitter: 4,
    minLatency: 35,
    maxLatency: 68,
    avgLatency: 45,
    packetLoss: 0,
    stabilityScore: 94,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'wifi',
    history: []
  };

  private static currentHealth: DeviceHealth = {
    batteryLevel: null,
    isCharging: null,
    wakeLockActive: false,
    thermalStatus: 'normal',
    eventLoopDelayMs: 2,
    memoryUsageMb: null,
    backgroundGuidanceDone: {
      batteryExemption: true,
      backgroundData: true,
      appPinning: false,
      dozeMode: true
    }
  };

  private static wakeLockSentinel: any = null;

  public static getStatus(): boolean {
    return this.isMonitoring;
  }

  public static getMetrics(): NetworkMetrics {
    return { ...this.currentMetrics };
  }

  public static getDeviceHealth(): DeviceHealth {
    return { ...this.currentHealth };
  }

  public static subscribeMetrics(cb: MetricsListener): () => void {
    this.metricsListeners.add(cb);
    cb(this.currentMetrics);
    return () => this.metricsListeners.delete(cb);
  }

  public static subscribeDeviceHealth(cb: DeviceHealthListener): () => void {
    this.deviceHealthListeners.add(cb);
    cb(this.currentHealth);
    return () => this.deviceHealthListeners.delete(cb);
  }

  public static setIntervalMs(ms: number) {
    this.pingIntervalMs = Math.max(1000, Math.min(30000, ms));
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  // Start real active monitoring & keep-alive
  public static async startMonitoring(): Promise<boolean> {
    if (this.isMonitoring) return true;
    this.isMonitoring = true;
    this.consecutiveErrors = 0;

    // Engage WakeLock if available
    await this.acquireWakeLock();

    // Initial probe
    await this.executeProbe();

    // Scheduled loop
    this.scheduleNextProbe();
    return true;
  }

  // Stop active monitoring
  public static stopMonitoring(): boolean {
    this.isMonitoring = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.releaseWakeLock();
    return false;
  }

  private static scheduleNextProbe() {
    if (!this.isMonitoring) return;

    // Exponential backoff if consecutive errors occur
    const backoffMultiplier = Math.min(Math.pow(1.5, this.consecutiveErrors), 6);
    const delay = Math.round(this.pingIntervalMs * backoffMultiplier);

    this.timerId = setTimeout(async () => {
      await this.executeProbe();
      this.scheduleNextProbe();
    }, delay);
  }

  // Execute single high-precision ping probe
  private static async executeProbe() {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`/api/ping?t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('HTTP Ping failed');

      const end = performance.now();
      const latency = Math.round(end - start);
      this.consecutiveErrors = 0;

      this.recordLatency(latency, true);
    } catch {
      this.consecutiveErrors++;
      this.recordLatency(999, false);
    }
  }

  // Update sliding window of measurements
  private static recordLatency(latency: number, isSuccess: boolean) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const prevHistory = this.currentMetrics.history;
    const newHistory = [...prevHistory.slice(-19), { time: timeStr, latency: isSuccess ? latency : 999 }];

    const validPings = newHistory.filter(h => h.latency < 900).map(h => h.latency);
    const failedCount = newHistory.filter(h => h.latency >= 900).length;
    const packetLoss = Math.round((failedCount / newHistory.length) * 100);

    const minLatency = validPings.length > 0 ? Math.min(...validPings) : this.currentMetrics.minLatency;
    const maxLatency = validPings.length > 0 ? Math.max(...validPings) : this.currentMetrics.maxLatency;
    const avgLatency = validPings.length > 0 ? Math.round(validPings.reduce((a, b) => a + b, 0) / validPings.length) : this.currentMetrics.avgLatency;

    // Calculate jitter
    let jitterSum = 0;
    for (let i = 1; i < validPings.length; i++) {
      jitterSum += Math.abs(validPings[i] - validPings[i - 1]);
    }
    const jitter = validPings.length > 1 ? Math.round(jitterSum / (validPings.length - 1)) : this.currentMetrics.jitter;

    // Stability score calculation (0 - 100)
    let score = 100;
    if (avgLatency > 150) score -= 35;
    else if (avgLatency > 80) score -= 18;
    else if (avgLatency > 50) score -= 8;

    if (jitter > 25) score -= 25;
    else if (jitter > 10) score -= 12;

    if (packetLoss > 0) score -= (packetLoss * 2);
    score = Math.max(10, Math.min(100, score));

    this.currentMetrics = {
      ...this.currentMetrics,
      currentLatency: isSuccess ? latency : this.currentMetrics.currentLatency,
      minLatency,
      maxLatency,
      avgLatency,
      jitter,
      packetLoss,
      stabilityScore: score,
      history: newHistory,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };

    // Notify listeners
    this.metricsListeners.forEach(listener => listener({ ...this.currentMetrics }));
  }

  // WakeLock management
  public static async acquireWakeLock(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.currentHealth.wakeLockActive = true;
        this.deviceHealthListeners.forEach(l => l({ ...this.currentHealth }));

        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
          this.currentHealth.wakeLockActive = false;
          this.deviceHealthListeners.forEach(l => l({ ...this.currentHealth }));
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public static async releaseWakeLock(): Promise<void> {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      } catch {
        // ignore
      }
    }
    this.currentHealth.wakeLockActive = false;
    this.deviceHealthListeners.forEach(l => l({ ...this.currentHealth }));
  }

  public static updateGuidanceCheck(key: keyof DeviceHealth['backgroundGuidanceDone'], value: boolean) {
    this.currentHealth.backgroundGuidanceDone[key] = value;
    this.deviceHealthListeners.forEach(l => l({ ...this.currentHealth }));
  }
}
