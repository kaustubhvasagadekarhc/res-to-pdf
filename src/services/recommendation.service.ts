import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

interface ResumeData {
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

export class RecommendationService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async analyzeResume(resumeJson: ResumeData) {
        const prompt = `You are an expert ATS (Applicant Tracking System) optimizer and career coach with 20+ years of experience.
    
    Your task: specific, actionable improvements for the provided resume data and calculate an ATS Compatibility Score.
    
    Input: The resume data is provided as a JSON object.
    
    Output Rules:
    - Return ONLY valid JSON following the exact structure below.
    - No markdown formatting (no \`\`\`json blocks).
    - Provide specific, constructive feedback. Avoid generic advice like "Add more keywords." Instead, suggest *which* keywords regarding the candidate profile.
    
    Required JSON Structure:
    {
      "atsScore": 0, // Integer 0-100 reflecting how well parsed and keyword-rich the resume is.
      "summaryFeedback": {
        "status": "", // "Strength" or "Needs Improvement"
        "feedback": "" // Specific advice on the summary section
      },
      "skillsFeedback": {
        "missingCriticalSkills": [], // List specific skills likely missing for their role/level
        "feedback": ""
      },
      "experienceFeedback": {
        "impactAnalysis": "", // effectively quantifying impact strategies
        "actionVerbs": "" // Feedback on usage of strong action verbs
      },
      "formattingIssues": [], // List of likely formatting or structure issues based not on visual but on content structure (e.g. missing dates, unclear titles)
      "generalImprovements": [] // List of 3-5 high-impact overall improvements
    }
    
    Resume Data:
    ${JSON.stringify(resumeJson, null, 2)}
    `;

        const result = await this.model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanText = responseText
            .replace(/```(?:json)?\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        try {
            return JSON.parse(cleanText);
        } catch (e) {
            console.error('Failed to parse AI response:', responseText);
            throw new Error('Invalid JSON response from AI');
        }
    }
}

export const recommendationService = new RecommendationService();
