import { VertexAI } from '@google-cloud/vertexai';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
// const model = process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash';

const vertexAI = new VertexAI({ project: projectId, location });
    
interface ParsedResume {
  personal: {
    name: string;
    email: string;
    mobile: string;
    location: string;
    designation?: string;
    gender?: string;
    marital_status?: string;
  };
  summary: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    score?: string;
  }>;
  work_experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies?: string;
  }>;
}

/**
 * Quick Parse - Fast extraction using basic prompts
 */
export async function quickParse(resumeText: string): Promise<ParsedResume> {
  const model = vertexAI.getGenerativeModel({ model: `${process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash'}` });

  const prompt = `Extract the following information from this resume text and return ONLY valid JSON:
{
  "personal": {"name": "", "email": "", "mobile": "", "location": "", "designation": ""},
  "summary": "",
  "skills": [],
  "education": [{"degree": "", "institution": "", "year": ""}],
  "work_experience": [{"title": "", "company": "", "duration": "", "description": ""}],
  "projects": [{"name": "", "description": ""}]
}

Resume text:
${resumeText}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) throw new Error('Failed to parse resume');
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Inferred Parse - Deep analysis with context understanding
 */
export async function inferredParse(resumeText: string): Promise<ParsedResume> {
  const model = vertexAI.getGenerativeModel({ model: `${process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash'}` });

  const prompt = `Analyze this resume deeply and extract structured information. Infer missing details from context:
- Extract all contact information
- Identify skills from experience descriptions
- Infer job titles and responsibilities
- Extract education with scores if mentioned
- Parse project details and technologies used

Return ONLY valid JSON in this exact format:
{
  "personal": {"name": "", "email": "", "mobile": "", "location": "", "designation": "", "gender": "", "marital_status": ""},
  "summary": "",
  "skills": [],
  "education": [{"degree": "", "institution": "", "year": "", "score": ""}],
  "work_experience": [{"title": "", "company": "", "duration": "", "description": ""}],
  "projects": [{"name": "", "description": "", "technologies": ""}]
}

Resume:
${resumeText}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) throw new Error('Failed to parse resume');
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Generative Parse - AI-powered content enhancement and restructuring
 */
export async function generativeParse(resumeText: string): Promise<ParsedResume> {
  const model = vertexAI.getGenerativeModel({ model: `${process.env.VERTEX_AI_MODEL || 'gemini-1.5-flash'}` });

  const prompt = `Analyze this resume and enhance it with AI:
1. Extract all information accurately
2. Improve and rewrite the professional summary to be more impactful
3. Enhance work experience descriptions to be achievement-focused
4. Organize skills by category and relevance
5. Improve project descriptions to highlight impact
6. Ensure all content is professional and ATS-friendly

Return ONLY valid JSON in this exact format:
{
  "personal": {"name": "", "email": "", "mobile": "", "location": "", "designation": "", "gender": "", "marital_status": ""},
  "summary": "",
  "skills": [],
  "education": [{"degree": "", "institution": "", "year": "", "score": ""}],
  "work_experience": [{"title": "", "company": "", "duration": "", "description": ""}],
  "projects": [{"name": "", "description": "", "technologies": ""}]
}

Resume:
${resumeText}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) throw new Error('Failed to parse resume');
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Main parse function that routes to appropriate parser
 */
export async function parseResumeWithVertexAI(
  resumeText: string,
  parseType: 'quick' | 'inferred' | 'generative' = 'quick'
): Promise<ParsedResume> {
  switch (parseType) {
    case 'quick':
      return quickParse(resumeText);
    case 'inferred':
      return inferredParse(resumeText);
    case 'generative':
      return generativeParse(resumeText);
    default:
      return quickParse(resumeText);
  }
}
