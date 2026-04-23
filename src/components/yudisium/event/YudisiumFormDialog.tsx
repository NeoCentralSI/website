import { useEffect, useMemo, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { getExitSurveyForms } from '@/services/exitSurvey.service';
import type { ExitSurveyForm } from '@/types/exit-survey.types';
import type {
	CreateYudisiumPayload,
	UpdateYudisiumPayload,
	YudisiumEvent,
} from '@/services/yudisium.service';

interface YudisiumFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editData?: YudisiumEvent | null;
	onSubmit:
		| ((payload: CreateYudisiumPayload) => Promise<unknown>)
		| ((id: string, payload: UpdateYudisiumPayload) => Promise<unknown>);
}

function toDateInputValue(dateStr: string | null | undefined): string {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return '';
	return d.toISOString().split('T')[0];
}

function dateInputToISO(value: string): string {
	return new Date(value + 'T00:00:00.000Z').toISOString();
}

export function YudisiumFormDialog({
	open,
	onOpenChange,
	editData,
	onSubmit,
}: YudisiumFormDialogProps) {
	const [name, setName] = useState('');
	const [registrationOpenDate, setRegistrationOpenDate] = useState('');
	const [registrationCloseDate, setRegistrationCloseDate] = useState('');
	const [exitSurveyFormId, setExitSurveyFormId] = useState<string>('none');
	const [forms, setForms] = useState<ExitSurveyForm[]>([]);
	const [isLoadingForms, setIsLoadingForms] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEdit = !!editData;
	const hasResponse = (editData?.responseCount ?? 0) > 0;

	useEffect(() => {
		let isMounted = true;

		const loadForms = async () => {
			setIsLoadingForms(true);
			try {
				const result = await getExitSurveyForms();
				if (isMounted) {
					setForms(result.filter((form) => form.isActive));
				}
			} catch {
				if (isMounted) {
					setForms([]);
				}
			} finally {
				if (isMounted) {
					setIsLoadingForms(false);
				}
			}
		};

		if (open) {
			loadForms();
		}

		return () => {
			isMounted = false;
		};
	}, [open]);

	useEffect(() => {
		if (editData) {
			setName(editData.name ?? '');
			setRegistrationOpenDate(toDateInputValue(editData.registrationOpenDate));
			setRegistrationCloseDate(toDateInputValue(editData.registrationCloseDate));
			setExitSurveyFormId(editData.exitSurveyForm?.id ?? 'none');
		} else {
			setName('');
			setRegistrationOpenDate('');
			setRegistrationCloseDate('');
			setExitSurveyFormId('none');
		}
	}, [editData, open]);

	const today = useMemo(() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}, []);

	const openDateObj = registrationOpenDate ? new Date(registrationOpenDate) : null;
	const closeDateObj = registrationCloseDate ? new Date(registrationCloseDate) : null;

	const openDateError =
		openDateObj && openDateObj < today
			? 'Tanggal pembukaan pendaftaran tidak boleh sebelum hari ini'
			: null;

	const dateRangeError =
		openDateObj && closeDateObj && openDateObj > closeDateObj
			? 'Tanggal pembukaan pendaftaran tidak boleh melebihi tanggal penutupan'
			: null;

	const isValid =
		name.trim().length > 0 &&
		registrationOpenDate.length > 0 &&
		registrationCloseDate.length > 0 &&
		!openDateError &&
		!dateRangeError;

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!isValid) return;

		setIsSubmitting(true);
		try {
			const payload: CreateYudisiumPayload = {
				name: name.trim(),
				registrationOpenDate: dateInputToISO(registrationOpenDate),
				registrationCloseDate: dateInputToISO(registrationCloseDate),
				exitSurveyFormId: exitSurveyFormId === 'none' ? null : exitSurveyFormId,
			};

			if (isEdit && editData) {
				await (onSubmit as (id: string, p: UpdateYudisiumPayload) => Promise<unknown>)(
					editData.id,
					payload,
				);
			} else {
				await (onSubmit as (p: CreateYudisiumPayload) => Promise<unknown>)(payload);
			}

			onOpenChange(false);
		} catch {
			// error handled in hook toast
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? 'Edit Data Yudisium' : 'Tambah Data Yudisium'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Nama Yudisium</Label>
						<Input
							id="name"
							placeholder="Contoh: Yudisium Periode 1 2026"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="registrationOpenDate">Pembukaan Pendaftaran</Label>
							<Input
								id="registrationOpenDate"
								type="date"
								value={registrationOpenDate}
								onChange={(e) => setRegistrationOpenDate(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="registrationCloseDate">Penutupan Pendaftaran</Label>
							<Input
								id="registrationCloseDate"
								type="date"
								value={registrationCloseDate}
								onChange={(e) => setRegistrationCloseDate(e.target.value)}
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Template Exit Survey</Label>
						<Select
							value={exitSurveyFormId}
							onValueChange={setExitSurveyFormId}
							disabled={isLoadingForms || (isEdit && hasResponse)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih template exit survey" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Tidak ada template</SelectItem>
								{forms.map((form) => (
									<SelectItem key={form.id} value={form.id}>
										{form.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{isEdit && hasResponse && (
							<p className="text-xs text-muted-foreground">
								Template tidak dapat diubah karena sudah ada mahasiswa yang mengisi exit survey.
							</p>
						)}
					</div>

					{openDateError && (
						<p className="text-sm text-destructive">{openDateError}</p>
					)}
					{dateRangeError && (
						<p className="text-sm text-destructive">{dateRangeError}</p>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isSubmitting || !isValid}>
							{isSubmitting ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									{isEdit ? 'Menyimpan...' : 'Menambahkan...'}
								</>
							) : (
								isEdit ? 'Simpan Perubahan' : 'Tambah'
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
