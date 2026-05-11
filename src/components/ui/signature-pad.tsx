import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";

export interface SignaturePadRef {
    toDataURL: () => string;
    clear: () => void;
    isEmpty: () => boolean;
}

interface SignaturePadProps {
    width?: number;
    height?: number;
    className?: string;
    penColor?: string;
    backgroundColor?: string;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
    ({ width, height = 200, className = "", penColor = "#000000", backgroundColor = "transparent" }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [isDrawing, setIsDrawing] = useState(false);
        const [hasContent, setHasContent] = useState(false);

        useImperativeHandle(ref, () => ({
            toDataURL: () => {
                return canvasRef.current?.toDataURL("image/png") || "";
            },
            clear: () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (backgroundColor !== "transparent") {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                setHasContent(false);
            },
            isEmpty: () => !hasContent,
        }));

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Set canvas resolution
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.scale(dpr, dpr);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = 2;
            ctx.strokeStyle = penColor;

            if (backgroundColor !== "transparent") {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, rect.width, rect.height);
            }
        }, [penColor, backgroundColor]);

        const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };
            const rect = canvas.getBoundingClientRect();

            if ("touches" in e) {
                return {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top,
                };
            }
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault();
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx) return;

            const { x, y } = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
            setHasContent(true);
        };

        const draw = (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault();
            if (!isDrawing) return;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx) return;

            const { x, y } = getCoords(e);
            ctx.lineTo(x, y);
            ctx.stroke();
        };

        const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault();
            setIsDrawing(false);
        };

        return (
            <canvas
                ref={canvasRef}
                className={`border-2 border-dashed border-border rounded-lg cursor-crosshair touch-none ${className}`}
                style={{ width: width || "100%", height }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        );
    }
);

SignaturePad.displayName = "SignaturePad";

export { SignaturePad };
