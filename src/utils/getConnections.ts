export default async function getConnections(config: string) {
    const connections = await fetch(`${config}?connection=List`);
    return await connections.text();
}