import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/database';
import { ParsedResume } from '../interfaces/resume/resume.interface';

export class ParseService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async parseResume(pdfUrl: string, resId: string | undefined): Promise<ParsedResume> {
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
- Extract and synthesize the candidate's professional profile into a single, comprehensive paragraph.
- Write as if the candidate is speaking about themselves directly (use "I", "my", "me").
- The summary MUST be a single continuous paragraph (NO line breaks, NO multiple paragraphs).
- The paragraph should be 80-150 words covering: professional identity, years of experience, core expertise, key technical competencies, notable achievements, and career vision.
- Use first-person professional language; avoid generic or passive statements.
- Make it compelling and authentic, reflecting the candidate's voice and impact.
- Do NOT split into multiple paragraphs or use newline characters.

**work_experience[] and projects[] (nested and standalone):**
- Duration format must be 1 year 3 months based on period_from and period_to.
- De-duplicate projects that appear in both work_experience and the standalone projects section.
- The "responsibilities" array in each work_experience entry MUST NEVER be empty. Every role must have at least 3 responsibilities.
- If responsibilities are not explicitly listed in the resume, infer them from the job title, company context, and any project descriptions associated with that role.
- The "technologies" array in each standalone project MUST NEVER be empty. Extract technologies from the project description, or infer relevant technologies based on the project context. Each project must have at least 2 technologies.

**skills field:**
- Extract all technical skills, programming languages, frameworks, tools, databases, operating systems, IDEs, and servers.
- Return as an object with EXACTLY these 7 category keys: "Technologies", "Languages", "Tools", "Databases", "Operating Systems", "IDE's", "Application/Web Server's".
- ALL 7 categories MUST always be present in the output.
- Each category MUST have at least 3 relevant skills. If the resume does not explicitly list enough skills for a category, infer relevant skills from the candidate's work experience, projects, technologies used, and job context.
- "Technologies": Frameworks, libraries, platforms (e.g., React, Node.js, Spring Boot, Angular, .NET).
- "Languages": Programming and scripting languages (e.g., JavaScript, Python, Java, C++, TypeScript).
- "Tools": Development tools, CI/CD, version control, testing tools (e.g., Git, Docker, Jenkins, Webpack, Postman).
- "Databases": Database systems (e.g., PostgreSQL, MongoDB, MySQL, Redis, Oracle).
- "Operating Systems": OS platforms (e.g., Linux, Windows, macOS, Ubuntu).
- "IDE's": Integrated development environments and code editors (e.g., VS Code, IntelliJ IDEA, Eclipse).
- "Application/Web Server's": Application and web servers (e.g., Apache, Nginx, Tomcat, IIS).
- Do NOT create any additional category names beyond these 7.
- Example: {"Technologies": ["React", "Node.js"], "Languages": ["JavaScript", "Python"], "Tools": ["Git", "Docker"], "Databases": ["PostgreSQL", "MongoDB"], "Operating Systems": ["Linux"], "IDE's": ["VS Code"], "Application/Web Server's": ["Nginx"]}

**education field:**
- graduation_year: Extract as YYYY format (e.g., "2020"). If only season is given (e.g., "Summer 2020"), use just the year. If unknown, leave empty string.
- Do NOT include certifications, courses, training programs, or online certificates in this section. Only include formal academic degrees (e.g., B.Tech, M.Sc, MBA, PhD).

**personal field:**
- Extract only non-sensitive contact information (name, email, mobile, location, designation/title).
- name: Extract the full name of the candidate with first letter capital follow with in lowercase. (e.g., "JOHN DOE" -> "John doe" or "john doe" -> "John doe").
- phone number: Extract the phone number of the candidate with country code. (e.g., "+91 9876543210" -> "+919876543210").
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
  "skills": {},
  "work_experience": [{
    "company": "",
    "position": "",
    "duration": "",
    "period_from": "",
    "period_to": "",
    "responsibilities": [],
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

    const responseText = result.response.text();

    // Clean and parse JSON
    const cleanText = responseText
      .replace(/```(?:json)?\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    let parsed: ParsedResume;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      throw new Error('Invalid JSON response from AI');
    }


    if (resId) {

      const resumeExists = await prisma.resume.findUnique({ where: { id: resId } });

      if (!resumeExists) {
        throw new Error(`Resume with ID ${resId} not found`);
      }

    }

    return parsed;
  }
}

export const parseService = new ParseService();