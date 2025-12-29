export interface ResumeVersion {
    id: string;
    jobTitle?: string | null;
    resumeurl: string;
    section: string;
    content: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ResumeVersionResponse {
    id: string;
    jobTitle: string;
    resumeurl: string;
    section: string;
    content: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
