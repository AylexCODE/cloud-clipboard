export default async function withSlowNotice<T>(promise: Promise<T>, onSlow: () => void, delayMs: number = 4000): Promise<T> {
    const timer = setTimeout(onSlow, delayMs);
    try{
        return await promise;
    }finally{
        clearTimeout(timer);
    }
}
