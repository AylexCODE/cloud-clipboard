import { ExtensionContext, window } from "vscode";
import { clearCache, getCacheStats } from "../utils/clipboardCache";

export default async function clearLocalCache(context: ExtensionContext) {
    try{
        const stats = getCacheStats(context);

        if(stats.namespaceCount === 0){
            window.showInformationMessage("Cloud Clipboard: Local cache is already empty.");
            return;
        }

        const confirmed = await window.showWarningMessage(
            `Clear the local offline cache? This covers ${stats.clipboardCount} cached clipboard${stats.clipboardCount === 1 ? "" : "s"} across ${stats.namespaceCount} namespace${stats.namespaceCount === 1 ? "" : "s"}, used only as a fallback when the server is unreachable — nothing on the server is affected.`,
            { modal: true }, "Clear Cache"
        );
        if(confirmed !== "Clear Cache") return;

        await clearCache(context);
        window.showInformationMessage("Cloud Clipboard: Local cache cleared.");
    }catch(error){
        console.error(error);
        window.showErrorMessage("An error occurred. Error ID: CLEAR_CACHE");
    }
}
