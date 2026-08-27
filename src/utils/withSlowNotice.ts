/**
 * Awaits `promise`, but if it hasn't settled after `delayMs`, calls `onSlow`
 * (e.g. to update a progress notification). Used so a slow free-tier API
 * cold-start reads as "still working" rather than looking hung or failed.
 */
export default async function withSlowNotice<T>(promise: Promise<T>, onSlow: () => void, delayMs: number = 4000): Promise<T> {
    const timer = setTimeout(onSlow, delayMs);
    try{
        return await promise;
    }finally{
        clearTimeout(timer);
    }
}
