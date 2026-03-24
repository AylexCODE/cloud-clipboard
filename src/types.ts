import { Uri } from "vscode";

export interface ClipboardData {
    path: string;
    content: string;
}

export interface FilesData {
    bytes: number;
    files: Uri[];
}