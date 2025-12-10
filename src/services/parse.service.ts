import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/database';

export class ParseService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async parseResume(pdfUrl: string, resId: string | undefined) {
    const prompt = `You are an expert resume parser with 20+ years of experience analyzing professional documents across all industries and seniority levels.

Your task: Read the resume text (or structured JSON) and return ONLY valid JSON following the exact structure below.
Critical Rules:
- Return ONLY the JSON object. No explanations, no markdown, no code blocks — only valid JSON.
- Use empty arrays [] for missing collections.
- Use empty strings "" for missing text fields.
- Normalize dates to ISO YYYY-MM format; if date cannot be determined, keep original or use empty string.
- For all text fields, trim leading/trailing whitespace.
- For list fields (skills, responsibilities, technologies), return arrays of trimmed strings.
- Be conservative: if information is ambiguous or unclear, prefer empty string/array rather than inferring or guessing.
- Extract ALL relevant information present in the resume — do not omit details.

SPECIAL INSTRUCTIONS FOR KEY FIELDS:

**summary field:**
- Extract and synthesize the candidate's professional profile into a comprehensive, first-person summary.
- Write as if the candidate is speaking about themselves directly (use "I", "my", "me").
- The summary MUST be at least 5 well-developed paragraphs (each paragraph 10-20+ words max).
- Paragraph 1: My overall professional identity, years of experience, core expertise, and what drives my career.
- Paragraph 2: My key technical competencies, domain knowledge, and the technologies/methodologies I specialize in.
- Paragraph 3: My notable achievements, measurable impact, and tangible results I've delivered in my roles.
- Paragraph 4: My leadership qualities, collaboration style, soft skills, and professional philosophy that guides my work.
- Paragraph 5: My career vision, unique value proposition, what I bring to organizations, and where I aspire to grow.
- Optional Paragraph 6+: Any additional depth on industry experience, certifications, thought leadership, or specialized expertise.
- Ensure paragraphs flow naturally and highlight my strongest qualifications with conviction.
- Use first-person professional language; avoid generic or passive statements.
- Make it compelling and authentic, reflecting the candidate's voice and impact.

**work_experience[] and projects[] (nested and standalone):**
- Duration fromat must be 1 year 3 months based on period_from and period_to.
- De-duplicate projects that appear in both work_experience and the standalone projects section.

**skills field:**
- Extract all technical skills, programming languages, frameworks, tools.
- Organize by category if evident (e.g., "JavaScript, TypeScript, React" or "AWS, Docker, Kubernetes").
- Return as an array of strings, each skill/skillset clearly labeled.

**education field:**
- graduation_year: Extract as YYYY format (e.g., "2020"). If only season is given (e.g., "Summer 2020"), use just the year. If unknown, leave empty string.
- Include certifications or additional training if listed separately.

**personal field:**
- Extract only non-sensitive contact information (name, email, mobile, location, designation/title).
- gender and marital_status: Only include if explicitly stated; otherwise leave empty.
- designation: Extract the primary professional title or role.
- location: Format as "City, State/Region, Country" (e.g., "San Francisco, CA, USA").

**Validation & Output:**
- Ensure all date fields follow YYYY-MM format consistently (period_from, period_to).
- period_to for current/ongoing roles: use "Present" instead of a date.
- All arrays must be valid JSON (no trailing commas, properly quoted strings).
- Validate JSON before returning — it must be parseable.

Required JSON structure (do not modify):
{
  "personal": {
    "name": "",
    "designation": "",
    "email": "",
    "mobile": "",
    "location": "",
    "gender": "",
    "marital_status": ""
  },
  "summary": "",
  "skills": [],
  "work_experience": [{
    "company": "",
    "position": "",
    "duration": "",
    "period_from": "",
    "period_to": "",
    "projects": [{
      "name": "",
      "description": "",
      "responsibilities": [],
      "technologies": []
    }]
  }],
  "education": [{
    "institution": "",
    "degree": "",
    "graduation_year": ""
  }],
  "projects": [{
    "name": "",
    "description": "",
    "technologies": []
  }]
}`;
    // Fetch PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await this.model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: buffer.toString('base64'),
        },
      },
      prompt,
    ]);

    // console.log(result.response.text())

    const responseText = result.response.text();

    // Clean and parse JSON
    const cleanText = responseText
      .replace(/```(?:json)?\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      throw new Error('Invalid JSON response from AI');
    }

    // Save to database
    const entries = Object.entries(parsed).map(([key, val]) => ({
      resumeId: resId || 'temp-id',
      section: key,
      content: JSON.stringify(val),
    }));

    await prisma.resumeSection.createMany({ data: entries });

    return parsed;
  }
}

export const parseService = new ParseService();
