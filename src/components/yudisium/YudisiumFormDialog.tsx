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
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { getExitSurveyForms } from '@/services/yudisium/yudisium-exit-survey.service';
import { toast } from 'sonner';
import type { ExitSurveyForm } from '@/types/exit-survey.types';
import type {
	CreateYudisiumPayload,
	UpdateYudisiumPayload,
	YudisiumEvent,
} from '@/services/yudisium/yudisium.service';

/** Calendar day in local timezone as YYYY-MM-DD (avoids UTC shift from toISOString()). */
function toDateOnlyLocalString(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD for DatePicker display at local noon (stable across DST). */
function parseDateOnlyLocal(ymd: string): Date | undefined {
	if (!ymd) return undefined;
	const base = ymd.split('T')[0];
	const [y, m, d] = base.split('-').map(Number);
	if (!y || !m || !d) return undefined;
	return new Date(y, m - 1, d, 12, 0, 0, 0);
}

interface YudisiumFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editData?: YudisiumEvent | null;
	onSubmit:
		| ((payload: CreateYudisiumPayload) => Promise<unknown>)
		| ((id: string, payload: UpdateYudisiumPayload) => Promise<unknown>);
}

function formatDateForInput(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
}

function dateInputToISO(value: string): string {
    if (!value) return '';
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
	const derivedStatus = editData?.status ?? 'draft'; // derived display status from API
	const hasParticipants = (editData?.participantCount ?? 0) > 0;
	const hasResponse = (editData?.responseCount ?? 0) > 0;

	// === Field lock rules ===
	// scheduled / completed / ongoing: only name
	const isFullyLocked = isEdit && (derivedStatus === 'scheduled' || derivedStatus === 'completed' || derivedStatus === 'ongoing');
	
	// open / closed (with participants): open date and survey are locked
	// Basically, once it's no longer in the "draft" time-window, we lock the start date and survey
	const isPostDraft = isEdit && derivedStatus !== 'draft';
	
	const openDateLocked  = isFullyLocked || isPostDraft;
	const surveyLocked    = isFullyLocked || isPostDraft || hasResponse;

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
			setRegistrationOpenDate(formatDateForInput(editData.registrationOpenDate));
			setRegistrationCloseDate(formatDateForInput(editData.registrationCloseDate));
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

	const openDateObj  = registrationOpenDate  ? parseDateOnlyLocal(registrationOpenDate)  : null;
	const closeDateObj = registrationCloseDate ? parseDateOnlyLocal(registrationCloseDate) : null;

	// Validate open date: can't be before today (only matters when field is editable)
	const openDateError = !openDateLocked && openDateObj && openDateObj < today
		? 'Tanggal pembukaan pendaftaran tidak boleh sebelum hari ini'
		: null;

	// Validate close date: can't be before today (if editable), and can't be before open date
	const closeDateBeforeToday = !isFullyLocked && closeDateObj && closeDateObj < today
		? 'Tanggal penutupan pendaftaran tidak boleh sebelum hari ini'
		: null;
	const closeDateBeforeOpen  = openDateObj && closeDateObj && closeDateObj < openDateObj
		? 'Tanggal penutupan tidak boleh lebih awal dari tanggal pembukaan'
		: null;
	const closeDateError = closeDateBeforeToday ?? closeDateBeforeOpen;
	const dateRangeError = closeDateError; // alias for template

	const isValid =
		name.trim().length > 0 &&
		(isFullyLocked || (registrationOpenDate.length > 0 && registrationCloseDate.length > 0)) &&
		!openDateError &&
		!closeDateError;

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!isValid) {
			if (openDateError || closeDateError) {
				toast.error(openDateError || closeDateError);
			} else if (name.trim().length === 0) {
				toast.error('Nama yudisium wajib diisi');
			}
			return;
		}

		setIsSubmitting(true);
		try {
			if (isEdit && editData) {
				const updatePayload: UpdateYudisiumPayload = {
					name: name.trim(),
				};

				// Only include fields that are NOT locked and have CHANGED
				if (!isFullyLocked) {
					const isoClose = dateInputToISO(registrationCloseDate);
					if (isoClose !== editData.registrationCloseDate) {
						updatePayload.registrationCloseDate = isoClose;
					}
					
					if (!openDateLocked) {
						const isoOpen = dateInputToISO(registrationOpenDate);
						if (isoOpen !== editData.registrationOpenDate) {
							updatePayload.registrationOpenDate = isoOpen;
						}
					}

					if (!surveyLocked) {
						const nextSurveyId = exitSurveyFormId === 'none' ? null : exitSurveyFormId;
						if (nextSurveyId !== (editData.exitSurveyForm?.id ?? null)) {
							updatePayload.exitSurveyFormId = nextSurveyId;
						}
					}
				}

				await (onSubmit as (id: string, p: UpdateYudisiumPayload) => Promise<unknown>)(
					editData.id,
					updatePayload,
				);
			} else {
				const createPayload: CreateYudisiumPayload = {
					name: name.trim(),
					registrationOpenDate: dateInputToISO(registrationOpenDate),
					registrationCloseDate: dateInputToISO(registrationCloseDate),
					exitSurveyFormId: exitSurveyFormId === 'none' ? null : exitSurveyFormId,
				};
				await (onSubmit as (p: CreateYudisiumPayload) => Promise<unknown>)(createPayload);
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
					{isEdit && (isFullyLocked || isPostDraft || hasResponse) && (
						<Alert variant="warning" className="bg-amber-50/50 border-amber-200/50">
							<Info className="h-4 w-4 text-amber-600" />
							<AlertDescription className="text-amber-700 text-xs leading-relaxed">
								{isFullyLocked ? (
									'Data yudisium ini sudah dijadwalkan atau selesai. Hanya nama yang dapat diubah.'
								) : (isPostDraft && hasParticipants) ? (
									'Pendaftaran sudah berjalan/berakhir. Hanya nama dan tanggal penutupan yang dapat diubah.'
								) : hasResponse ? (
									'Sudah ada mahasiswa yang mengisi exit survey. Template tidak dapat diubah.'
								) : 'Beberapa kolom dikunci karena status pendaftaran sudah melewati masa persiapan.'}
							</AlertDescription>
						</Alert>
					)}

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
							<DatePicker
								value={parseDateOnlyLocal(registrationOpenDate)}
								onChange={(date) => setRegistrationOpenDate(date ? toDateOnlyLocalString(date) : '')}
								showPastDates={isEdit}
								disabled={openDateLocked}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="registrationCloseDate">Penutupan Pendaftaran</Label>
							<DatePicker
								value={parseDateOnlyLocal(registrationCloseDate)}
								onChange={(date) => setRegistrationCloseDate(date ? toDateOnlyLocalString(date) : '')}
								showPastDates={true}
								disabled={isFullyLocked}
							/>
						</div>
					</div>


					<div className="space-y-2">
						<Label>Template Exit Survey</Label>
						<Select
							value={exitSurveyFormId}
							onValueChange={setExitSurveyFormId}
							disabled={isLoadingForms || surveyLocked}
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
					</div>


					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isSubmitting}>
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
