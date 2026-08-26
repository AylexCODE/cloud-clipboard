export default function formatRelativeTime(isoDate: string): string | undefined {
    const date = new Date(isoDate);
    if(isNaN(date.getTime())) return undefined;

    const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
    if(diffSec < 60) return "just now";

    const diffMin = Math.round(diffSec / 60);
    if(diffMin < 60) return `${diffMin}m ago`;

    const diffHour = Math.round(diffMin / 60);
    if(diffHour < 24) return `${diffHour}h ago`;

    const diffDay = Math.round(diffHour / 24);
    if(diffDay < 30) return `${diffDay}d ago`;

    return date.toLocaleDateString();
}
