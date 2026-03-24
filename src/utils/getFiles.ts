import { FileType, Uri, window, workspace } from "vscode";
import { FilesData } from "../types";

export default async function getFiles(dirs: Uri): Promise<FilesData> {
    const files: Uri[] = [];
    let totalSizeBytes: number = 0;

    try{
        if((await workspace.fs.stat(dirs)).type === FileType.File){
            totalSizeBytes += (await workspace.fs.stat(dirs)).size;
            files.push(dirs);
        }else{
            const directories = await workspace.fs.readDirectory(dirs);
            for(const [name, type] of directories){
                const path = Uri.joinPath(dirs, name);
        
                if(type === FileType.Directory){
                    const inner = (await getFiles(path));
                    files.push(...inner.files);
                    totalSizeBytes += inner.bytes;
                }else if(type === FileType.File){
                    files.push(path);
                    totalSizeBytes =+ (await workspace.fs.stat(path)).size;
                }
            }
        }
        
        return {
            bytes: totalSizeBytes,
            files
        };
    }catch{
        window.showErrorMessage("An error occurred. Error ID: GET_FILES");
        return {
            bytes: 0,
            files: []
        };
    }
}