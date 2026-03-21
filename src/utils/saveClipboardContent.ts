export default async function saveClipboardContent(config: string, connection: string, content: string) {
    const clipboard = await fetch(`${config}?connection=${connection}`, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: content
    });

    return clipboard.status;
}