import { Uri, workspace } from "vscode";

export default async function getNonCollidingPath(filePath: Uri): Promise<Uri> {
    const lastSlash = filePath.path.lastIndexOf("/");
    const dir = filePath.path.slice(0, lastSlash);
    const fileName = filePath.path.slice(lastSlash + 1);

    const dotIndex = fileName.lastIndexOf(".");
    const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
    const ext = dotIndex > 0 ? fileName.slice(dotIndex) : "";

    let counter = 1;
    let candidate = filePath;

    while(true){
        try{
            await workspace.fs.stat(candidate);
            candidate = filePath.with({ path: `${dir}/${base} (${counter})${ext}` });
            counter++;
        }catch{
            return candidate;
        }
    }
}
