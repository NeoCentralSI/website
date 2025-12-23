export type SopType = "tugas-akhir" | "kerja-praktik";

export interface SopFile {
  type: SopType;
  fileName: string;
  url: string;
  size: number;
  updatedAt: string;
}
