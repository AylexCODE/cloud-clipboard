import { FileType, Uri, window, workspace } from "vscode";
import path = require("path");

export default async function getDirectory(uri?: Uri): Promise <string | undefined> {
    try{
        if(uri){
            const dir = await workspace.fs.stat(uri);
            return dir.type === FileType.Directory ? uri.fsPath : path.dirname(uri.fsPath);
        }

        return undefined;
    }catch{
        window.showErrorMessage("An error occurred. Error ID: GET_DIRECTORY");
        return undefined;
    }
}