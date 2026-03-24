import { FileType, Uri, window, workspace } from "vscode";

export default async function getFiles(dirs: Uri): Promise<Uri[]> {
    const files: Uri[] = [];

    try{
        if((await workspace.fs.stat(dirs)).type === FileType.File){
            files.push(dirs);
        }else{
            const directories = await workspace.fs.readDirectory(dirs);
            for(const [name, type] of directories){
                const path = Uri.joinPath(dirs, name);
        
                if(type === FileType.Directory){
                    const inner = await getFiles(path);
                    files.push(...inner);
                }else if(type === FileType.File){
                    files.push(path);
                }
            }
        }

        return files;
    }catch{
        window.showErrorMessage("An error occured. Error ID: GET_FILES");
        return [];
    }
}