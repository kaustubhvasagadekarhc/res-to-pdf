import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ResumeData, AnalysisResult } from '../interfaces/recommendation/recommendation.interface';

export class RecommendationService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async analyzeResume(resumeJson: ResumeData): Promise<AnalysisResult> {
        const prompt = `You are an expert ATS (Applicant Tracking System) optimizer and career coach with 15+ years of experience.
    Your task: Analyze the provided resume data, calculate an ATS Compatibility Score, provide an overall review, and give section-wise improvements.
    Input: The resume data is provided as a JSON object.
    
    Output Rules:
    - Return ONLY valid JSON following the exact structure below.
    - No markdown formatting (no \`\`\`json blocks).
    - Provide specific, actionable , and constructive feedback. Avoid generic advice.
    - The overallReview must be exactly 2-3 lines (concise but comprehensive).
    - Section improvements should be specific and actionable.
    
    Required JSON Structure:
    {
      "atsScore": 0, // Integer 0-100 reflecting ATS compatibility (keyword optimization, structure, formatting)
      "overallReview": "", // 2-3 lines summarizing the resume's strengths and key areas for improvement
      "sectionImprovements": {
        "summary": "", // Specific feedback and improvements for the professional summary section
        "skills": "", // Feedback on skills section - missing skills, keyword optimization, relevance
        "experience": "", // Feedback on work experience - impact quantification, action verbs, achievements
        "education": "", // Feedback on education section - completeness, relevance, formatting
        "projects": "" // Feedback on projects section - descriptions, technologies, impact (if applicable)
      }
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
