import { FileType, Uri, workspace } from "vscode";
import path = require("path");

export default async function getDirectory(uri?: Uri): Promise <string | undefined> {
    if(uri){
        const dir = await workspace.fs.stat(uri);
        return dir.type === FileType.Directory ? uri.fsPath : path.dirname(uri.fsPath);
    }

    return undefined;
}