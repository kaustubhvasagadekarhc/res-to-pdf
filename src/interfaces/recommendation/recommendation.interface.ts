export interface ResumeData {
    personal?: {
        name?: string;
        email?: string;
        [key: string]: unknown;
    };
    summary?: string;
    skills?: Record<string, string[]> | string[];
    work_experience?: unknown[];
    education?: unknown[];
    projects?: unknown[];
    [key: string]: unknown;
}

export interface SectionImprovements {
    summary: string;
    skills: string;
    experience: string;
    education: string;
    projects: string;
}

export interface AnalysisResult {
    atsScore: number;
    overallReview: string;
    sectionImprovements: SectionImprovements;
}
