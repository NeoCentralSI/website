import { BellRing } from "lucide-react";

import type { DetailActionItem } from "./studentDetailPending";

/** Scrolls to a section of the detail page. */
function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * "Perlu tindakan Anda": one ribbon under the header listing what waits for the
 * signed-in supervisor; each item scrolls to its section. Nothing is shown when nothing waits.
 */
export function StudentDetailActionRibbon({ items }: { items: DetailActionItem[] }) {
    if (items.length === 0) return null;
    return (
        <section aria-label="Perlu tindakan Anda" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-primary">
                <BellRing className="h-4 w-4" />
                Perlu tindakan Anda
            </span>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    className="font-medium underline-offset-4 hover:underline"
                    onClick={() => scrollToSection(item.target)}
                >
                    {item.label}
                </button>
            ))}
        </section>
    );
}
