import { MonitoringData } from "@/types";

export interface DataPoint {
    date: string;
    value: number;
}

/**
 * Calculates the moving average for a series of numbers.
 * @param data Array of numbers
 * @param window Window size for the moving average
 */
export function calculateMovingAverage(data: number[], window: number = 7): number | null {
    if (data.length < window) return null;
    const slice = data.slice(-window);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return sum / window;
}

/**
 * Calculates the standard deviation for a series of numbers.
 * @param data Array of numbers
 */
export function calculateStandardDeviation(data: number[]): number {
    if (data.length < 2) return 0;
    const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
}

/**
 * Detects if the current value is an anomaly based on history.
 * A value is considered a low anomaly if it is below (mean - multiplier * stdDev).
 * 
 * @param history Array of historical DataPoints
 * @param current The current value to check
 * @param options Configuration options for detection
 */
export function detectAnomaly(
    history: DataPoint[],
    current: number,
    options: {
        window: number;
        multiplier: number;
        enabled: boolean;
    } = { window: 7, multiplier: 2.0, enabled: true }
): boolean {
    if (!options.enabled) return false;
    if (history.length < options.window) return false;

    const values = history.map(d => d.value);
    const movingAvg = calculateMovingAverage(values, options.window);

    if (movingAvg === null) return false;

    // We use the same window for StdDev to keep it local to the moving average period,
    // or use the whole history? Usually local window is more responsive, but let's use the window 
    // to be consistent with the "Moving Average" concept.
    const relevantValues = values.slice(-options.window);
    const stdDev = calculateStandardDeviation(relevantValues);

    const lowerBound = movingAvg - (options.multiplier * stdDev);

    return current < lowerBound;
}

/**
 * Calculates the percentage difference between current value and the average of the previous period.
 * @param current Current value
 * @param history History data
 * @param window Window size
 */
export function calculateComparison(current: number, history: DataPoint[], window: number = 7): { diffPercent: number; label: string } | undefined {
    if (history.length === 0) return undefined;

    // Compare against the average of the last 'window' days
    const values = history.map(d => d.value);
    const prevAvg = calculateMovingAverage(values, window);

    if (prevAvg === null) return undefined;

    const diff = current - prevAvg;
    const diffPercent = (diff / prevAvg) * 100;

    return {
        diffPercent,
        label: `vs média ${window} dias`
    };
}

/**
 * (Optional) Detect trend - e.g. 3 consecutive drops.
 */
export function detectTrend(
    history: DataPoint[],
    current: number,
    options: {
        enabled: boolean;
        consecutivePeriods: number;
    } = { enabled: true, consecutivePeriods: 3 }
): boolean {
    if (!options.enabled) return false;
    // Need current + at least N-1 history points
    if (history.length < options.consecutivePeriods) return false;

    // Combine history + current to check strictly the last N transitions
    // [h1, h2, h3] + current. 
    // If N=3, we check current < h3, h3 < h2, h2 < h1 ? 
    // Or just strictly decreasing sequence of length N+1 (N comparisons).
    // Let's assume "consecutive periods in fall" implies the value has been dropping for N steps.

    // Construct full series ending at current
    const series = [...history.map(h => h.value), current];

    // Check last N steps
    // sequence: ... v[k-3], v[k-2], v[k-1], v[k]
    // step 1: v[k] < v[k-1]
    // step 2: v[k-1] < v[k-2]
    // ...

    let isTrend = true;
    for (let i = 0; i < options.consecutivePeriods; i++) {
        const idx = series.length - 1 - i;
        if (idx <= 0) { isTrend = false; break; }
        if (series[idx] >= series[idx - 1]) {
            isTrend = false;
            break;
        }
    }

    return isTrend;
}
