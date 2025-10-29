import React, { useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, FilterIcon, CheckIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
	header: React.ReactNode;
	className?: string;
	width?: string | number;
	accessor?: keyof T | ((row: T, index: number) => React.ReactNode);
	render?: (row: T, index: number) => React.ReactNode;
	filter?: ColumnFilterElement | ColumnFilterControl;
};

export type CustomTableProps<T> = {
	columns: Column<T>[];
	data: T[];
	loading?: boolean;
	total: number;
	page: number; // 1-based
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (size: number) => void;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	enableColumnFilters?: boolean;
	actions?: React.ReactNode;
	emptyText?: string;
	rowKey?: (row: T, index: number) => string;
	className?: string;
};

function buildPages(current: number, total: number): (number | "ellipsis")[] {
	const pages: (number | "ellipsis")[] = [];
	const window = 1; // how many pages around current
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

export function CustomTable<T extends Record<string, any>>({
	columns,
	data,
	loading,
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
	className,
}: CustomTableProps<T>) {
	// no drawer state; filters live in header cells
	const totalPages = Math.max(1, Math.ceil(total / pageSize || 1));
	const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
	const to = Math.min(total, page * pageSize);

	const pages = useMemo(() => buildPages(page, totalPages), [page, totalPages]);

	return (
		<Card className={cn("p-4", className)}>
					<div className="flex flex-col gap-3">
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
									<div className="flex-1 flex items-center gap-2">
										{onSearchChange !== undefined && (
											<div className="relative w-full sm:max-w-md">
												<SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
												<Input
													placeholder="Cari..."
													className="pl-8"
													value={searchValue ?? ""}
													onChange={(e) => onSearchChange(e.target.value)}
												/>
											</div>
										)}
									</div>
									<div className="flex items-center gap-2">
										{actions}
									</div>
								</div>

				<div className="border rounded-md">
								<Table>
									<TableHeader>
										<TableRow>
											{columns.map((col) => (
												<TableHead key={col.key} className={cn("align-middle", col.className)} style={{ width: col.width }}>
													<div className="flex items-center gap-2">
														<div className="truncate">{col.header}</div>
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
																											<DropdownMenuItem key={opt.value} onClick={() => (col.filter as ColumnFilterControl).onChange?.(opt.value)}>
																												{active && <CheckIcon className="mr-2 size-4" />} {opt.label}
																											</DropdownMenuItem>
																										);
																									})}
																									<DropdownMenuItem onClick={() => (col.filter as ColumnFilterControl).onChange?.('')}>Reset</DropdownMenuItem>
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
							{loading ? (
								Array.from({ length: Math.max(3, Math.min(pageSize, 8)) }).map((_, i) => (
									<TableRow key={`sk-${i}`}>
										{columns.map((col) => (
											<TableCell key={col.key}>
												<Skeleton className="h-4 w-[70%]" />
											</TableCell>
										))}
									</TableRow>
								))
							) : data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
										{emptyText}
									</TableCell>
								</TableRow>
							) : (
								data.map((row, idx) => {
									const key = rowKey?.(row, idx) ?? (row.id as string) ?? String(idx);
									return (
										<TableRow key={key}>
											{columns.map((col) => {
												const content = col.render
													? col.render(row, idx)
													: typeof col.accessor === "function"
														? col.accessor(row, idx)
														: col.accessor
															? (row[col.accessor as keyof T] as any)
															: null;
												return <TableCell key={col.key} className={col.className}>{content}</TableCell>;
											})}
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>

				<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
					<div className="text-xs text-muted-foreground">
						Menampilkan {from}-{to} dari {total}
					</div>
					<div className="flex items-center gap-3">
						{onPageSizeChange && (
							<div className="flex items-center gap-2 text-xs">
								<span>Baris:</span>
								<select
									className="border rounded px-2 py-1"
									value={pageSize}
									onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
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
				</div>
			</div>
		</Card>
	);
}

export default CustomTable;

