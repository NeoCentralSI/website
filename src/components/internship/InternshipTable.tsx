import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Loading, Spinner } from "@/components/ui/spinner";
import { SearchIcon, FilterIcon, CheckIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EmptyState from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";

type ColumnFilterElement = { kind: "element"; element: React.ReactNode };
type ColumnFilterControl = {
    kind?: "control";
    type?: "text" | "select";
    value?: string;
    onChange?: (value: string) => void;
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
};

export type Column<T> = {
    key: string;
    header: React.ReactNode | (() => React.ReactNode);
    className?: string;
    width?: string | number;
    accessor?: keyof T | ((row: T, index: number) => React.ReactNode);
    render?: (row: T, index: number) => React.ReactNode;
    filter?: ColumnFilterElement | ColumnFilterControl;
    sortable?: boolean;
    rowSpan?: (row: T, index: number) => number;
};

export type InternshipTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    isRefreshing?: boolean;
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    enableColumnFilters?: boolean;
    actions?: React.ReactNode;
    emptyText?: string;
    rowKey?: (row: T, index: number) => string;
    rowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
    className?: string;
    // Selection
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    // Sorting
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    onSortChange?: (field: string, order: "asc" | "desc") => void;
    // Expansion
    expandedRowRender?: (row: T, index: number) => React.ReactNode;
    isRowExpanded?: (row: T, index: number) => boolean;
    onRowClick?: (row: T, index: number) => void;
    hidePagination?: boolean;
    appendRow?: React.ReactNode;
    isRowSelectable?: (row: T, index: number) => boolean;
};

function buildPages(current: number, total: number): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    const window = 1;
    const start = Math.max(1, current - window);
    const end = Math.min(total, current + window);
    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("ellipsis");
    }
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < total) {
        if (end < total - 1) pages.push("ellipsis");
        pages.push(total);
    }
    return pages;
}

export function InternshipTable<T extends Record<string, any>>({
    columns,
    data,
    loading,
    isRefreshing,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    searchValue,
    onSearchChange,
    enableColumnFilters,
    actions,
    emptyText = "Tidak ada data",
    rowKey,
    rowProps,
    className,
    selectedIds = [],
    onSelectionChange,
    sortBy,
    sortOrder,
    onSortChange,
    expandedRowRender,
    isRowExpanded,
    onRowClick,
    hidePagination = false,
    appendRow,
    isRowSelectable,
}: InternshipTableProps<T>) {
    const [localSearch, setLocalSearch] = useState(searchValue || "");

    // Reset local search if searchValue prop changes externally (e.g. on navigation)
    useEffect(() => {
        setLocalSearch(searchValue || "");
    }, [searchValue]);

    // Handle debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== searchValue) {
                // Only trigger search if 0 or >= 2 chars
                if (localSearch.length === 0 || localSearch.length >= 2) {
                    onSearchChange?.(localSearch);
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localSearch, onSearchChange, searchValue]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize || 1));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);

    const pages = useMemo(() => buildPages(page, totalPages), [page, totalPages]);

    const getRowKey = (row: T, index: number) => {
        if (rowKey) return rowKey(row, index);
        return (row.id as string) ?? String(index);
    };

    const selectableData = data.filter((row, idx) => isRowSelectable ? isRowSelectable(row, idx) : true);

    const isAllSelected = selectableData.length > 0 && selectableData.every((row, idx) => selectedIds.includes(getRowKey(row, idx)));
    const isSomeSelected = selectableData.some((row, idx) => selectedIds.includes(getRowKey(row, idx))) && !isAllSelected;

    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;
        if (checked) {
            const newIds = Array.from(new Set([...selectedIds, ...selectableData.map((row, idx) => getRowKey(row, idx))]));
            onSelectionChange(newIds);
        } else {
            const currentIds = selectableData.map((row, idx) => getRowKey(row, idx));
            const newIds = selectedIds.filter(id => !currentIds.includes(id));
            onSelectionChange(newIds);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        if (!onSelectionChange) return;
        if (checked) {
            onSelectionChange([...selectedIds, id]);
        } else {
            onSelectionChange(selectedIds.filter(i => i !== id));
        }
    };

    const handleSort = (key: string) => {
        if (!onSortChange) return;
        const isAsc = sortBy === key && sortOrder === "asc";
        onSortChange(key, isAsc ? "desc" : "asc");
    };

    return (
        <Card className={cn("p-4", className)}>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                        {onSearchChange !== undefined && (
                            <div className="relative w-full sm:max-w-md">
                                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari (min. 2 karakter)..."
                                    className="pl-8"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                />
                                {loading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground italic text-xs flex items-center gap-1">
                                        <Spinner className="size-3" />
                                        Mencari...
                                    </div>
                                )}
                            </div>
                        )}
                        {loading && !onSearchChange && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Spinner className="size-4" />
                                <span>Memuat...</span>
                            </div>
                        )}
                    </div>
                    {!loading && actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>

                <div className="rounded-md border border-black/10 relative">
                    {isRefreshing && !loading && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-md">
                            <Spinner className="h-8 w-8" />
                        </div>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {onSelectionChange && (
                                    <TableHead className="w-10 px-4">
                                        <Checkbox
                                            checked={isAllSelected || (isSomeSelected ? "indeterminate" : false)}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                )}
                                {columns.map((col) => (
                                    <TableHead key={col.key} className={cn("align-middle", col.className)} style={{ width: col.width }}>
                                        <div className={cn("flex items-center gap-2", col.className?.includes("text-center") && "justify-center")}>
                                            <div
                                                className={cn(
                                                    "truncate",
                                                    col.sortable && onSortChange && "cursor-pointer hover:text-foreground/80 transition-colors"
                                                )}
                                                onClick={() => col.sortable && handleSort(col.key)}
                                            >
                                                {typeof col.header === 'function' ? col.header() : col.header}
                                            </div>

                                            {col.sortable && onSortChange && (
                                                <div className="flex flex-col cursor-pointer" onClick={() => handleSort(col.key)}>
                                                    {sortBy === col.key ? (
                                                        sortOrder === 'asc' ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                                                    ) : (
                                                        <ArrowUpDown className="size-3 text-muted-foreground opacity-50" />
                                                    )}
                                                </div>
                                            )}
                                            {enableColumnFilters && col.filter ? (
                                                (col.filter as ColumnFilterElement).kind === 'element' ? (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                                                <FilterIcon className="size-3.5" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent align="start" className="w-56 p-3">
                                                            {(col.filter as ColumnFilterElement).element}
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : (
                                                    ((col.filter as ColumnFilterControl).type ?? 'text') === 'select' ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={cn(
                                                                        "h-6 w-6 shrink-0",
                                                                        (col.filter as any)?.value ? "text-primary" : undefined
                                                                    )}
                                                                >
                                                                    <FilterIcon className="size-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="w-56">
                                                                {((col.filter as ColumnFilterControl).options ?? []).map((opt: { label: string; value: string }) => {
                                                                    const active = ((col.filter as ColumnFilterControl).value ?? '') === opt.value;
                                                                    return (
                                                                        <DropdownMenuItem
                                                                            key={opt.value}
                                                                            onClick={() => (col.filter as ColumnFilterControl).onChange?.(opt.value)}
                                                                            className="cursor-pointer hover:bg-accent focus:bg-accent"
                                                                        >
                                                                            <div className="flex items-center w-full gap-2">
                                                                                <div className={cn(
                                                                                    "size-4 rounded flex items-center justify-center border-2 transition-all",
                                                                                    active
                                                                                        ? "border-primary bg-primary shadow-sm"
                                                                                        : "border-gray-300 hover:border-gray-400 bg-background"
                                                                                )}>
                                                                                    <CheckIcon className={cn(
                                                                                        "size-3 transition-all",
                                                                                        active ? "text-primary-foreground opacity-100 scale-100" : "text-transparent opacity-0 scale-50"
                                                                                    )} />
                                                                                </div>
                                                                                <span className={cn(
                                                                                    "flex-1",
                                                                                    active && "font-medium"
                                                                                )}>{opt.label}</span>
                                                                            </div>
                                                                        </DropdownMenuItem>
                                                                    );
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={cn(
                                                                        "h-6 w-6 shrink-0",
                                                                        (col.filter as any)?.value ? "text-primary" : undefined
                                                                    )}
                                                                >
                                                                    <FilterIcon className="size-3.5" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent align="start" className="w-56 p-3">
                                                                <Input
                                                                    placeholder={(col.filter as ColumnFilterControl).placeholder ?? 'Filter...'}
                                                                    className="h-8 text-xs"
                                                                    value={(col.filter as ColumnFilterControl).value ?? ''}
                                                                    onChange={(e) => (col.filter as ColumnFilterControl).onChange?.(e.target.value)}
                                                                />
                                                                <div className="flex justify-end mt-2">
                                                                    <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={() => (col.filter as ColumnFilterControl).onChange?.('')}>
                                                                        Reset
                                                                    </Button>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )
                                                )
                                            ) : null}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="text-center py-12">
                                        <Loading />
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="p-0">
                                        <EmptyState
                                            title="Tidak Ada Data"
                                            description={emptyText}
                                            size="sm"
                                            className="py-8"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, idx) => {
                                    const key = getRowKey(row, idx);
                                    const isSelected = selectedIds.includes(key);
                                    const customProps = rowProps?.(row, idx) || {};
                                    const expanded = isRowExpanded?.(row, idx);
                                    
                                    return (
                                        <React.Fragment key={key}>
                                            <TableRow
                                                {...customProps}
                                                className={cn(
                                                    isSelected && "bg-accent/50", 
                                                    onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors",
                                                    customProps.className
                                                )}
                                                onClick={() => onRowClick?.(row, idx)}
                                            >
                                                {onSelectionChange && (
                                                    <TableCell className="px-4">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => handleSelectRow(key, !!checked)}
                                                            aria-label={`Select row ${idx + 1}`}
                                                            disabled={isRowSelectable ? !isRowSelectable(row, idx) : false}
                                                        />
                                                    </TableCell>
                                                )}
                                                {columns.map((col) => {
                                                    const content = col.render
                                                        ? col.render(row, idx)
                                                        : typeof col.accessor === "function"
                                                            ? col.accessor(row, idx)
                                                            : col.accessor
                                                                ? (row[col.accessor as keyof T] as any)
                                                                : null;
                                                    
                                                    const rs = col.rowSpan ? col.rowSpan(row, idx) : 1;
                                                    if (rs === 0) return null;

                                                    return (
                                                        <TableCell 
                                                            key={col.key} 
                                                            className={col.className}
                                                            rowSpan={rs > 1 ? rs : undefined}
                                                        >
                                                            {content}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                            {expanded && expandedRowRender && (
                                                <TableRow className="bg-muted/30 hover:bg-muted/30 border-t-0">
                                                    <TableCell colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="p-0">
                                                        {expandedRowRender(row, idx)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                            {appendRow && (
                                <TableRow className="border-t-0 hover:bg-transparent">
                                    <TableCell colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="p-0">
                                        {appendRow}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {!hidePagination && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        {!loading ? (
                            <>
                                <div className="text-xs text-muted-foreground">
                                    Menampilkan {from}-{to} dari {total}
                                </div>
                                <div className="flex items-center gap-3">
                                    {onPageSizeChange && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-muted-foreground">Baris:</span>
                                            <select
                                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                value={pageSize}
                                                onChange={(e) => {
                                                    const newSize = Number(e.target.value);
                                                    onPageSizeChange(newSize);
                                                    if (page > Math.ceil(total / newSize)) {
                                                        onPageChange(1);
                                                    }
                                                }}
                                            >
                                                {[10, 20, 50].map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); onPageChange(Math.max(1, page - 1)); }} />
                                            </PaginationItem>
                                            {pages.map((p, i) => (
                                                p === "ellipsis" ? (
                                                    <PaginationEllipsis key={`e-${i}`} />
                                                ) : (
                                                    <PaginationItem key={p}>
                                                        <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); onPageChange(p); }}>
                                                            {p}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); onPageChange(Math.min(totalPages, page + 1)); }} />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </>
                        ) : (
                            <div className="h-10 invisible" /> // Placeholder to prevent jump
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

export default InternshipTable;
