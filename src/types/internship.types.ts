export interface CompanyItem {
    id: string;
    companyName: string;
    companyAddress: string;
}

export interface EligibleStudentItem {
    id: string;
    user: {
        id: string;
        fullName: string;
        identityNumber: string;
    };
    skscompleted: number;
}

export interface InternshipProposalItem {
    id: string;
    nama: string;
    nim: string;
    koordinatorAtauMember: string;
    namaCompany: string;
    dokumenProposal: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    dokumenSuratPermohonan: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
    status: string;
}
