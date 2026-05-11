import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface FileToDownload {
    fileName: string;
    filePath: string;
    subfolder?: string;
}

export async function downloadFilesAsZip(files: FileToDownload[], zipName: string) {
    if (files.length === 0) {
        toast.error('Tidak ada file untuk diunduh');
        return;
    }

    const zip = new JSZip();
    const toastId = toast.loading(`Menyiapkan ${files.length} file...`);

    try {
        const downloadPromises = files.map(async (file, index) => {
            try {
                const response = await fetch(file.filePath);
                if (!response.ok) throw new Error(`Gagal mengunduh ${file.fileName}`);
                const blob = await response.blob();
                
                // Add to zip, optionally in a subfolder
                const path = file.subfolder ? `${file.subfolder}/${file.fileName}` : file.fileName;
                zip.file(path, blob);
                
                toast.loading(`Mengunduh: ${index + 1}/${files.length}`, { id: toastId });
            } catch (error) {
                console.error(`Error downloading ${file.fileName}:`, error);
                toast.error(`Gagal mengunduh: ${file.fileName}`, { id: toastId });
            }
        });

        await Promise.all(downloadPromises);

        toast.loading('Sedang mengompres file...', { id: toastId });
        const content = await zip.generateAsync({ type: 'blob' });
        
        saveAs(content, `${zipName}.zip`);
        toast.success('Berhasil mengunduh zip', { id: toastId });
    } catch (error) {
        console.error('Error creating zip:', error);
        toast.error('Gagal membuat file zip', { id: toastId });
    }
}
