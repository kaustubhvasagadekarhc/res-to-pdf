export interface ResumeData {
    personal?: {
        name?: string;
        email?: string;
        [key: string]: unknown;
    };
    summary?: string;
    skills?: string[];
    work_experience?: unknown[];
    education?: unknown[];
    projects?: unknown[];
    [key: string]: unknown;
}

export interface SummaryFeedback {
    status: string;
    feedback: string;
}

export interface SkillsFeedback {
    missingCriticalSkills: string[];
    feedback: string;
}

export interface ExperienceFeedback {
    impactAnalysis: string;
    actionVerbs: string;
}

export interface AnalysisResult {
    atsScore: number;
    summaryFeedback: SummaryFeedback;
    skillsFeedback: SkillsFeedback;
    experienceFeedback: ExperienceFeedback;
    formattingIssues: string[];
    generalImprovements: string[];
}
