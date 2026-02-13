export type SopType = "SOP_TA" | "SOP_KP" | "SOP_UMUM" | "TEMPLATE_TA" | "TEMPLATE_KP" | "TEMPLATE_UMUM";

export interface SopFile {
  id: string;
  title: string;
  type: SopType;
  typeName: string;
  fileName: string;
  url: string;
  size: number;
  updatedAt: string;
  uploadedBy?: string;
}
