import { useRef, useEffect, useState } from "react";
import { renderAsync } from "docx-preview";
import { Loader2, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocxViewerProps {
    url: string;
    className?: string;
    style?: React.CSSProperties;
}

export function DocxViewer({ url, className, style }: DocxViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url || !containerRef.current) return;

        const loadDocx = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();

                if (containerRef.current) {
                    containerRef.current.innerHTML = "";
                    await renderAsync(blob, containerRef.current, undefined, {
                        className: "docx",
                        inWrapper: true,
                        ignoreLastRenderedPageBreak: false,
                    });
                }
            } catch (err) {
                console.error("DOCX preview error:", err);
                setError("Gagal memuat pratinjau DOCX. Pastikan file valid.");
            } finally {
                setLoading(false);
            }
        };

        loadDocx();
    }, [url]);

    return (
        <div
            className={cn("relative w-full bg-gray-100/50 overflow-auto flex flex-col items-center", className)}
            style={style}
        >
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground font-medium">Memuat pratinjau...</span>
                    </div>
                </div>
            )}

            {error ? (
                <div className="flex flex-col items-center justify-center h-full p-10 text-destructive gap-4">
                    <FileWarning className="size-12 opacity-20" />
                    <div className="text-center">
                        <p className="font-semibold">Oops! Ada masalah</p>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                </div>
            ) : (
                <div
                    ref={containerRef}
                    className="bg-white shadow-xl my-4 sm:my-8 mx-auto min-h-[calc(100%-4rem)] w-full max-w-4xl"
                />
            )}
        </div>
    );
}

export default DocxViewer;
