export default async function getClipboardContent(config: string, connection: string) {
    const clipboard = await fetch(`${config}?connection=${connection}`);
    return await clipboard.text();
}