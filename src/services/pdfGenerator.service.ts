import { Response } from 'express';
import fs from 'fs';
import PDFDocument from 'pdfkit';

export interface ResumeData {
  personal?: {
    name?: string;
    designation?: string;
    email?: string;
    mobile?: string;
    location?: string;
    gender?: string;
    marital_status?: string;
  };
  professionalSummary?: string[];
  summary?: string;
  skills?: {
    technical?: string[];
  };
  work_experience?: WorkExperience[];
  projects?: Project[];
  education?: Education[];
}

export interface WorkExperience {
  company?: string;
  position?: string;
  period_from?: string; 
  period_to?: string; 
  duration?: string;
  projects?: Project[];
}

export interface Project {
  name?: string;
  description?: string;
  technologies?: string[] | string;
  responsibilities?: string[];
}

export interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  graduation_year?: string;
}

export class PDFGeneratorService {
  private readonly primary = '#2150A2';
  private readonly lightGrey = '#E0E0E0';
  // Returns true if a string has text
  private hasValue(val?: string | null): boolean {
    return !!val && val.trim() !== '';
  }

  // Formats an array of fields and returns only valid ones
  private validFieldList(fields: { label: string; value: string | null | undefined }[]) {
    return fields.filter((f) => this.hasValue(f.value));
  }

  generatePDF(resume: ResumeData, res: Response, logoPath?: string) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, left: 40, right: 40, bottom: 40 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=resume.pdf');

    doc.pipe(res);

    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ---------- HEADER: NAME + LOGO ----------
    const name = resume.personal?.name ?? '';
    doc.font('Helvetica-Bold').fontSize(22).fillColor(this.primary).text(name, {
      align: 'left',
    });

    // company logo top right (like hc_logo.png in Java code)
    if (logoPath && fs.existsSync(logoPath)) {
      const imgWidth = 120;
      const x = doc.page.width - doc.page.margins.right - imgWidth;
      const y = doc.page.margins.top - 10;
      doc.image(logoPath, x, y, { width: imgWidth });
    }

    doc.moveDown(0.3);
    // ---------- CONTACT BLOCK (2-column table style) ----------
    const designation = resume.personal?.designation ?? '';
    const email = resume.personal?.email ?? '';
    const location = resume.personal?.location ?? '';
    const mobile = resume.personal?.mobile ?? '';
    // const linkedin = resume.personal?.linkedin ?? '';

    const leftX = doc.page.margins.left;
    const rowWidth = contentWidth;
    const colWidth = rowWidth / 2;

    doc.fontSize(10).fillColor('black').font('Helvetica-Bold');

    // Row 1: designation | email
    let yRow = doc.y;
    doc.text(designation, leftX, yRow, {
      width: colWidth,
      align: 'left',
    });
    doc.font('Helvetica').text(email, leftX + colWidth, yRow, {
      width: colWidth,
      align: 'right',
    });

    // Row 2: location | mobile
    doc.font('Helvetica');
    yRow = doc.y + 2;
    doc.text(location, leftX, yRow, {
      width: colWidth,
      align: 'left',
    });
    doc.text(mobile, leftX + colWidth, yRow, {
      width: colWidth,
      align: 'right',
    });

    // Row 3: (blank) | linkedin
    // yRow = doc.y + 2;
    // doc.text('', leftX, yRow, {
    //   width: colWidth,
    //   align: 'left',
    // });
    // doc
    //   .fillColor('blue')
    //   .text(linkedin, leftX + colWidth, yRow, {
    //     width: colWidth,
    //     align: 'right',
    //   });

    doc.fillColor('black');
    doc.moveDown(0.3);

    // =====================================================================
    // SECTION HELPERS
    // =====================================================================
    const sectionHeader = (title: string) => {
      const x = doc.page.margins.left;
      const y = doc.y + 3;
      const height = 18;

      doc.save().rect(x, y, contentWidth, height).fill(this.primary).restore();

      doc
        .fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(title, x, y + 4, {
          width: contentWidth,
          align: 'center',
        });

      doc.moveDown(1);
      doc.fillColor('black');
      doc.font('Helvetica').fontSize(10);
    };

    const twoColumnRow = (label: string, value: string | undefined | null) => {
      if (!value || !value.trim()) return;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(label + ': ', {
          continued: true, // keep writing on the same line
        });

      doc.font('Helvetica').fontSize(10).text(value); // continues on same line

      doc.moveDown(0.3);
    };

    const bulletLines = (lines: string[]) => {
      doc.font('Helvetica').fontSize(10);
      lines.forEach((line) => {
        const text = line.trim();
        if (!text) return;
        doc.text(`• ${text}`, {
          width: contentWidth,
          align: 'left',
        });
      });
    };

    const greySeparator = () => {
      const y = doc.y + 2;
      doc
        .moveTo(leftX, y)
        .lineTo(leftX + contentWidth, y)
        .lineWidth(0.5)
        .strokeColor(this.lightGrey)
        .stroke();
      doc.strokeColor('black');
      // doc.moveDown(0.8);
    };

    // =====================================================================
    // PROFESSIONAL SUMMARY
    // =====================================================================
    const summaryBullets: string[] =
      resume.professionalSummary && resume.professionalSummary.length
        ? resume.professionalSummary
        : this.splitSummaryToBullets(resume.summary ?? '');

    if (summaryBullets.length > 0) {
      sectionHeader('Professional Summary');
      bulletLines(summaryBullets);
      doc.moveDown(0.5);
    }

    // =====================================================================
    // SKILL SET
    // =====================================================================
    const s = resume.skills?.technical;

    if (Array.isArray(s) && s.filter((x) => this.hasValue(x)).length > 0) {
      sectionHeader('Skill Set');
      doc.text(s.filter((x) => this.hasValue(x)).join(', '), { width: contentWidth });
      doc.moveDown(0.3);
    }

    // =====================================================================
    // WORK EXPERIENCE
    // =====================================================================

    if (resume.work_experience && resume.work_experience.length > 0) {
      sectionHeader('Work Experience');

      const exps = this.sortAndFilterWork(resume.work_experience);

      exps.forEach((exp, idx) => {
        const line = this.buildExperienceTitle(exp);

        doc.font('Helvetica').fontSize(12).text(line, {
          width: contentWidth,
        });

        doc.moveDown(0.4);

        (exp.projects ?? []).forEach((project) => {
          if (project.name) {
            doc.moveDown(0.6);
            doc.font('Helvetica-Bold').fontSize(12).text(`Project: ${project.name}`, {
              width: contentWidth,
            });
          }

          if (project.description) {
            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').fontSize(10).text('Description:');
            doc.moveDown(0.2);
            doc.font('Helvetica').fontSize(10).text(project.description, { width: contentWidth });
          }

          if (project.responsibilities && project.responsibilities.length) {
            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').fontSize(10).text('Responsibilities:');

            doc.moveDown(0.4);
            doc.font('Helvetica').fontSize(10);
            project.responsibilities.forEach((r) => {
              const t = r.trim();
              if (!t) return;
              doc.text(`• ${t}`, {
                width: contentWidth,
              });
            });
          }

          if (project.technologies) {
            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').fontSize(10).text('Technologies:');
            doc.moveDown(0.2);
            const techStr = Array.isArray(project.technologies)
              ? project.technologies.join(', ')
              : project.technologies;
            doc.font('Helvetica').fontSize(10).text(techStr, {
              width: contentWidth,
            });
            doc.moveDown(0.4);
          }
        });

        greySeparator();

        if (idx < exps.length - 1) {
          doc.moveDown(0.4);
        }
      });

      doc.moveDown(0.5);
    }

    // =====================================================================
    // PROJECTS
    // =====================================================================
    const hasProjects =
      Array.isArray(resume.projects) &&
      resume.projects.some(
        (p) =>
          this.hasValue(p.name) ||
          this.hasValue(p.description) ||
          (Array.isArray(p.responsibilities) && p.responsibilities.some((r) => this.hasValue(r))) ||
          (Array.isArray(p.technologies)
            ? p.technologies.some((t) => this.hasValue(t))
            : this.hasValue(typeof p.technologies === 'string' ? p.technologies : undefined))
      );

    if (hasProjects) {
      sectionHeader('Projects');

      (resume.projects ?? []).forEach((project, idx) => {
        if (this.hasValue(project.name)) {
          doc.font('Helvetica-Bold').fontSize(12).text(`Project: ${project.name}`, {
            width: contentWidth,
          });
          doc.moveDown(0.3);
        }

        if (this.hasValue(project.description)) {
          doc.font('Helvetica-Bold').fontSize(10).text('Description:');
          doc.moveDown(0.2);
          doc.font('Helvetica').fontSize(10).text(project.description ?? '', { width: contentWidth });
          doc.moveDown(0.4);
        }

        if (project.responsibilities && project.responsibilities.length) {
          doc.font('Helvetica-Bold').fontSize(10).text('Responsibilities:');
          doc.moveDown(0.3);
          bulletLines(project.responsibilities);
          doc.moveDown(0.3);
        }

        if (project.technologies) {
          doc.font('Helvetica-Bold').fontSize(10).text('Technologies:');
          doc.moveDown(0.2);
          const techStr = Array.isArray(project.technologies)
            ? project.technologies.filter((t) => this.hasValue(t)).join(', ')
            : project.technologies;
          doc.font('Helvetica').fontSize(10).text(techStr ?? '', { width: contentWidth });
          doc.moveDown(0.4);
        }

        if (idx < (resume.projects?.length ?? 0) - 1) {
          greySeparator();
          doc.moveDown(0.4);
        }
      });

      doc.moveDown(0.5);
    }

    // =====================================================================
    // EDUCATION
    // =====================================================================

    if (
      resume.education &&
      resume.education.filter(
        (e) =>
          this.hasValue(e.degree) ||
          this.hasValue(e.field) ||
          this.hasValue(e.institution) ||
          this.hasValue(e.graduation_year)
      ).length > 0
    ) {
      sectionHeader('Education');
      doc.font('Helvetica').fontSize(10);

      resume.education.forEach((edu) => {
        if (
          !(
            this.hasValue(edu.degree) ||
            this.hasValue(edu.field) ||
            this.hasValue(edu.institution) ||
            this.hasValue(edu.graduation_year)
          )
        )
          return;

        const parts = [];
        if (this.hasValue(edu.degree)) parts.push(edu.degree);
        if (this.hasValue(edu.field)) parts.push('in ' + edu.field);
        if (this.hasValue(edu.institution)) parts.push('from ' + edu.institution);
        if (this.hasValue(edu.graduation_year)) parts.push('(' + edu.graduation_year + ')');

        doc.text(parts.join(' '), { width: contentWidth });
        doc.moveDown(0.5);
      });

      doc.moveDown(0.5);
    }

    // =====================================================================
    // PERSONAL DETAILS
    // =====================================================================

    const p = resume.personal;
    if (
      (p?.name && p.name.trim()) ||
      (p?.gender && p.gender.trim()) ||
      (p?.marital_status && p.marital_status.trim())
    ) {
      sectionHeader('Personal Details');
      twoColumnRow('Name', p.name ?? '');
      if (p.gender) twoColumnRow('Gender', p.gender);
      if (p.marital_status) {
        twoColumnRow('Marital Status', p.marital_status);
      }
      doc.moveDown(0.5);
    }

    // =====================================================================
    // DECLARATION
    // =====================================================================
    sectionHeader('Declaration');

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(
        'I hereby declare that the above-furnished details are true to the best of my knowledge.',
        {
          width: contentWidth,
        }
      );

    doc.moveDown(1.2);

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    doc
      .font('Helvetica')
      .fontSize(10)
      .text('Name:  ' + (resume.personal?.name ?? ''), {
        width: contentWidth,
      });
    doc.text('Date:  ' + dateStr, {
      width: contentWidth,
    });

    doc.end();
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private splitSummaryToBullets(summary: string): string[] {
    if (!summary) return [];
    // Split by newline or bullet char, filter empties
    const parts = summary
      .split(/\n|•/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts;
  }

  private sortAndFilterWork(exps: WorkExperience[]): WorkExperience[] {
    const currentDate = new Date();

    // Filter out future experiences
    const filtered = exps.filter((e) => {
      const from = this.parseYm(e.period_from);
      const to = e.period_to === 'Present' ? new Date() : this.parseYm(e.period_to);

      if (!from) return false;

      // Include only if start date is in the past
      // and end date is in the past or Present
      return from <= currentDate && (!to || to <= currentDate || e.period_to === 'Present');
    });

    // Sort by start date (most recent first)
    filtered.sort((a, b) => {
      const fromA = this.parseYm(a.period_from);
      const fromB = this.parseYm(b.period_from);

      if (!fromA || !fromB) return 0;
      return fromB.getTime() - fromA.getTime();
    });

    return filtered;
  }

  private parseYm(ym?: string): Date | null {
    if (!ym) return null;
    if (ym === 'Present') return new Date();
    const [year, month] = ym.split('-').map((n) => parseInt(n, 10));
    if (!year || !month) return null;
    return new Date(year, month - 1, 1);
  }

  private buildExperienceTitle(exp: WorkExperience): string {
    const role = exp.position ?? '';
    const company = exp.company ?? '';
    const from = exp.period_from ?? '';
    const to = exp.period_to ?? '';
    let fromOut = from;
    let toOut = to;

    const formatYm = (ym?: string): string => {
      if (!ym) return '';
      if (ym === 'Present') return 'Present';
      const [y, m] = ym.split('-');
      if (!y || !m) return ym;
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return date.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    };

    if (from) fromOut = formatYm(from);
    if (to) toOut = formatYm(to);

    const durationStr = fromOut && toOut ? `${fromOut} - ${toOut}` : (exp.duration ?? '');

    return `${role} at ${company} (${durationStr})`.trim();
  }
}

export const pdfGeneratorService = new PDFGeneratorService();
