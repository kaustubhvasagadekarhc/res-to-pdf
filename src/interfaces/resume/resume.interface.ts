export interface ResumeSection {
    id: string;
    jobTitle?: string | null;
    resumeId: string;
    fileName: string;
    fileUrl: string;
    section: string;
    content: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    resume?: {
        id: string;
        fileName: string;
    };
}


export interface ParsedPersonal {
    name: string;
    designation: string;
    email: string;
    mobile: string;
    location: string;
    gender: string;
    marital_status: string;
}

export interface ParsedProjectInExperience {
    name: string;
    description: string;
    responsibilities: string[];
    technologies: string[];
}

export interface ParsedWorkExperience {
    company: string;
    position: string;
    duration: string;
    period_from: string;
    period_to: string;
    responsibilities: string[];
    projects: ParsedProjectInExperience[];
}

export interface ParsedEducation {
    institution: string;
    degree: string;
    graduation_year: string;
}

export interface ParsedProject {
    name: string;
    description: string;
    technologies: string[];
}

export interface ParsedResume {
    personal: ParsedPersonal;
    summary: string;
    skills: Record<string, string[]>;
    work_experience: ParsedWorkExperience[];
    education: ParsedEducation[];
    projects: ParsedProject[];
}

export interface ParseResumeResponse {
    parsed: ParsedResume;
    fileUrl: string;
    fileName: string;
}
