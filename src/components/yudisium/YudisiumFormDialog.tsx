import { useEffect, useMemo, useState, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { FileUp, X } from 'lucide-react';
import { getExitSurveyForms } from '@/services/yudisium/exit-survey.service';
import { getYudisiumRequirements } from '@/services/yudisium/requirement.service';
import { toast } from 'sonner';
import type { ExitSurveyForm } from '@/types/exit-survey.types';
import type { YudisiumRequirement } from '@/services/yudisium/requirement.service';
import type {
	CreateYudisiumPayload,
	UpdateYudisiumPayload,
	YudisiumEvent,
} from '@/services/yudisium/core.service';
import { apiRequest } from '@/services/auth.service';
import { API_CONFIG, getApiUrl } from '@/config/api';

interface Room {
	id: string;
	name: string;
}

interface YudisiumFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editData?: YudisiumEvent | null;
	onSubmit:
		| ((payload: CreateYudisiumPayload) => Promise<unknown>)
		| ((id: string, payload: UpdateYudisiumPayload) => Promise<unknown>);
}

/** Calendar day in local timezone as YYYY-MM-DD */
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

function formatDateForInput(dateStr: string | null | undefined): string {
	if (!dateStr) return '';
	return dateStr.split('T')[0];
}

/** Convert date-only YYYY-MM-DD to ISO (midnight UTC) */
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
	const [eventDate, setEventDate] = useState<Date | null>(null);
	const [registrationOpenDate, setRegistrationOpenDate] = useState('');
	const [registrationCloseDate, setRegistrationCloseDate] = useState('');
	const [notes, setNotes] = useState('');
	const [exitSurveyFormId, setExitSurveyFormId] = useState<string>('none');
	const [roomId, setRoomId] = useState<string>('none');
	const [selectedRequirementIds, setSelectedRequirementIds] = useState<string[]>([]);
	const [decreeFile, setDecreeFile] = useState<File | null>(null);

	const [forms, setForms] = useState<ExitSurveyForm[]>([]);
	const [rooms, setRooms] = useState<Room[]>([]);
	const [requirements, setRequirements] = useState<YudisiumRequirement[]>([]);
	const [isLoadingOptions, setIsLoadingOptions] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const isEdit = !!editData;

	// Load rooms, forms, requirements on open
	useEffect(() => {
		let isMounted = true;
		if (!open) return;

		const load = async () => {
			setIsLoadingOptions(true);
			try {
				const roomsUrl = getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.OPTIONS_ROOMS);
				const [formsRes, reqsRes, roomsRes] = await Promise.all([
					getExitSurveyForms(),
					getYudisiumRequirements(),
					apiRequest(roomsUrl).then((r) => r.json()),
				]);
				if (isMounted) {
					setForms(formsRes.filter((f) => f.isActive));
					setRequirements(reqsRes);
					// Ensure roomsRes.data is an array. Some endpoints might return it directly.
					const roomsData = Array.isArray(roomsRes) ? roomsRes : (roomsRes.data ?? []);
					setRooms(roomsData);
				}
			} catch (err) {
				console.error('Failed to load yudisium form options:', err);
				toast.error('Gagal memuat beberapa pilihan data');
			} finally {
				if (isMounted) setIsLoadingOptions(false);
			}
		};

		load();
		return () => { isMounted = false; };
	}, [open]);

	// Populate form when editing
	useEffect(() => {
		if (editData) {
			setName(editData.name ?? '');
			setEventDate(editData.eventDate ? new Date(editData.eventDate) : null);
			setRegistrationOpenDate(formatDateForInput(editData.registrationOpenDate));
			setRegistrationCloseDate(formatDateForInput(editData.registrationCloseDate));
			setNotes(editData.notes ?? '');
			setExitSurveyFormId(editData.exitSurveyForm?.id ?? 'none');
			setRoomId(editData.room?.id ?? 'none');
			setSelectedRequirementIds(editData.requirementItems?.map((ri) => ri.requirement.id) ?? []);
			setDecreeFile(null);
		} else {
			setName('');
			setEventDate(null);
			setRegistrationOpenDate('');
			setRegistrationCloseDate('');
			setNotes('');
			setExitSurveyFormId('none');
			setRoomId('none');
			setSelectedRequirementIds([]);
			setDecreeFile(null);
		}
	}, [editData, open]);

	const hasRegParticipants = !!editData?.hasRegisteredParticipants;
	const isRegistrationStarted = useMemo(() => {
		if (!editData?.registrationOpenDate) return false;
		return new Date(editData.registrationOpenDate) <= new Date();
	}, [editData]);

	const isLocked = isRegistrationStarted || hasRegParticipants;

	const today = useMemo(() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}, []);

	const openDateObj = registrationOpenDate ? parseDateOnlyLocal(registrationOpenDate) : null;
	const closeDateObj = registrationCloseDate ? parseDateOnlyLocal(registrationCloseDate) : null;

	const hasRegDates = !!(registrationOpenDate || registrationCloseDate);

	// Validation errors
	const openDateError =
		openDateObj && openDateObj < today
			? 'Tanggal pembukaan pendaftaran tidak boleh sebelum hari ini'
			: null;

	const closeDateError = closeDateObj
		? closeDateObj < today
			? 'Tanggal penutupan pendaftaran tidak boleh sebelum hari ini'
			: openDateObj && closeDateObj < openDateObj
			? 'Tanggal penutupan tidak boleh lebih awal dari tanggal pembukaan'
			: null
		: null;

	const eventDateError = eventDate && hasRegDates && closeDateObj && eventDate < closeDateObj
			? 'Tanggal pelaksanaan tidak boleh sebelum tanggal penutupan pendaftaran'
			: null;

	const isValid =
		name.trim().length > 0 &&
		eventDate !== null &&
		!openDateError &&
		!closeDateError &&
		!eventDateError;

	const toggleRequirement = (id: string) => {
		setSelectedRequirementIds((prev) =>
			prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
		);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			if (file.type !== 'application/pdf') {
				toast.error('File harus berformat PDF');
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				toast.error('Ukuran file maksimal 5MB');
				return;
			}
			setDecreeFile(file);
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!isValid) {
			const err = openDateError || closeDateError || eventDateError;
			if (err) toast.error(err);
			else toast.error('Harap lengkapi data yang wajib diisi');
			return;
		}

		setIsSubmitting(true);
		try {
			const base: CreateYudisiumPayload = {
				name: name.trim(),
				eventDate: eventDate!.toISOString(),
				registrationOpenDate: registrationOpenDate ? dateInputToISO(registrationOpenDate) : null,
				registrationCloseDate: registrationCloseDate ? dateInputToISO(registrationCloseDate) : null,
				notes: notes.trim() || null,
				exitSurveyFormId: exitSurveyFormId === 'none' ? null : exitSurveyFormId,
				roomId: roomId === 'none' ? null : roomId,
				requirementIds: selectedRequirementIds,
				decreeFile: decreeFile,
			};

			if (isEdit && editData) {
				await (onSubmit as (id: string, p: UpdateYudisiumPayload) => Promise<unknown>)(
					editData.id,
					base,
				);
			} else {
				await (onSubmit as (p: CreateYudisiumPayload) => Promise<unknown>)(base);
			}

			onOpenChange(false);
		} catch (err: any) {
			toast.error(err.message || 'Terjadi kesalahan saat menyimpan data');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? 'Edit Data Yudisium' : 'Tambah Data Yudisium'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-5">

					{/* Name */}
					<div className="space-y-2">
						<Label htmlFor="yud-name">
							Nama Yudisium <span className="text-red-500">*</span>
						</Label>
						<Input
							id="yud-name"
							placeholder="Contoh: Yudisium Periode 1 2026"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					{/* Event Date + Time */}
					<div className="space-y-2">
						<Label htmlFor="yud-eventDate">
							Tanggal & Waktu Pelaksanaan <span className="text-red-500">*</span>
						</Label>
						<DateTimePicker
							value={eventDate}
							onChange={setEventDate}
							placeholder="Pilih tanggal & waktu pelaksanaan"
						/>
						{eventDateError && (
							<p className="text-xs text-red-500">{eventDateError}</p>
						)}
					</div>

					{/* Registration dates */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Pembukaan Pendaftaran</Label>
							<DatePicker
								value={parseDateOnlyLocal(registrationOpenDate)}
								onChange={(date) => setRegistrationOpenDate(date ? toDateOnlyLocalString(date) : '')}
								showPastDates={false}
								disabled={isLocked}
							/>
							{openDateError && (
								<p className="text-xs text-red-500">{openDateError}</p>
							)}
							{hasRegParticipants && (
								<p className="text-[10px] text-amber-600 font-medium">Sudah ada peserta terdaftar</p>
							)}
						</div>
						<div className="space-y-2">
							<Label>Penutupan Pendaftaran</Label>
							<DatePicker
								value={parseDateOnlyLocal(registrationCloseDate)}
								onChange={(date) => setRegistrationCloseDate(date ? toDateOnlyLocalString(date) : '')}
								showPastDates={true}
							/>
							{closeDateError && (
								<p className="text-xs text-red-500">{closeDateError}</p>
							)}
						</div>
					</div>

					{/* Room */}
					<div className="space-y-2">
						<Label>Ruangan</Label>
						<Select value={roomId} onValueChange={setRoomId} disabled={isLoadingOptions}>
							<SelectTrigger id="yud-room">
								<SelectValue placeholder="Pilih ruangan" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Tidak ada / Belum ditentukan</SelectItem>
								{rooms.map((room) => (
									<SelectItem key={room.id} value={room.id}>
										{room.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Exit Survey Form */}
					<div className="space-y-2">
						<Label>Template Exit Survey</Label>
						<Select
							value={exitSurveyFormId}
							onValueChange={setExitSurveyFormId}
							disabled={isLoadingOptions || isLocked}
						>
							<SelectTrigger id="yud-survey">
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
						{isLocked && (
							<p className="text-[10px] text-amber-600 font-medium">
								{isRegistrationStarted ? 'Pendaftaran sedang dibuka' : 'Sudah ada peserta terdaftar'}
							</p>
						)}
					</div>

					{/* Requirements */}
					<div className="space-y-2">
						<Label>Persyaratan Yudisium</Label>
						{isLoadingOptions ? (
							<p className="text-xs text-muted-foreground">Memuat persyaratan...</p>
						) : requirements.length === 0 ? (
							<p className="text-xs text-muted-foreground">Belum ada persyaratan yang tersedia.</p>
						) : (
							<div className="border rounded-md divide-y max-h-48 overflow-y-auto">
								{requirements
									.filter(req => req.isActive || selectedRequirementIds.includes(req.id))
									.map((req) => (
									<label
										key={req.id}
										className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
									>
										<Checkbox
											id={`req-${req.id}`}
											checked={selectedRequirementIds.includes(req.id)}
											onCheckedChange={() => toggleRequirement(req.id)}
											className="mt-0.5"
											disabled={isLocked}
										/>
										<div className="space-y-0.5">
											<p className="text-sm font-medium leading-none">{req.name}</p>
											{req.description && (
												<p className="text-xs text-muted-foreground">{req.description}</p>
											)}
										</div>
									</label>
								))}
							</div>
						)}
						{isLocked && (
							<p className="text-[10px] text-amber-600 font-medium">
								{isRegistrationStarted ? 'Pendaftaran sedang dibuka' : 'Sudah ada peserta terdaftar'}
							</p>
						)}
						{selectedRequirementIds.length > 0 && (
							<p className="text-xs text-muted-foreground">
								{selectedRequirementIds.length} persyaratan dipilih
							</p>
						)}
					</div>

					{/* Upload SK (Decree) */}
					<div className="space-y-2">
						<Label>Unggah SK Yudisium</Label>
						<div className="flex items-center gap-2">
							<Input
								type="file"
								accept=".pdf"
								className="hidden"
								ref={fileInputRef}
								onChange={handleFileChange}
							/>
							<Button
								type="button"
								variant="outline"
								className="w-full justify-start text-muted-foreground font-normal"
								onClick={() => fileInputRef.current?.click()}
							>
								<FileUp className="mr-2 h-4 w-4" />
								{decreeFile ? decreeFile.name : 'Pilih file SK (PDF, max 5MB)'}
							</Button>
							{decreeFile && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => setDecreeFile(null)}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
						<p className="text-[10px] text-muted-foreground">
							Mengunggah SK akan memfinalisasi status pendaftaran dan nilai CPL seluruh peserta.
						</p>
					</div>

					{/* Notes */}
					<div className="space-y-2">
						<Label htmlFor="yud-notes">Catatan</Label>
						<Textarea
							id="yud-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Catatan tambahan (opsional)"
							rows={3}
						/>
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
