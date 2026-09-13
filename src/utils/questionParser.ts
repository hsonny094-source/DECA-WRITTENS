import { InstructionalArea, Question } from '../types';
import { INSTRUCTIONAL_AREAS } from '../data/questionPool';

export interface ParsedQuestionDraft {
  idTemp: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: number; // 0, 1, 2, or 3
  instructionalArea: InstructionalArea;
  indicator: string;
  rationale: string;
  year?: number;
  source?: string;
  isAmbiguousAnswer?: boolean;
}

// Keyword mapping for automatic DECA instructional area classification
const AREA_KEYWORDS: { area: InstructionalArea; defaultIndicator: string; keywords: string[] }[] = [
  {
    area: 'Business Law (BL)',
    defaultIndicator: 'BL:001 - Explain foundations of business law',
    keywords: [
      'contract', 'sole proprietorship', 'partnership', 'corporation', 'llc', 'limited liability',
      'patent', 'trademark', 'copyright', 'intellectual property', 'infringement', 'flsa', 'osha',
      'tort', 'negligence', 'zoning', 'ordinance', 'antitrust', 'compliance', 'statute', 'jurisdiction',
      'arbitration', 'fiduciary', 'agent', 'agency', 'board of directors', 'by-laws', 'articles of incorporation'
    ],
  },
  {
    area: 'Financial Analysis (FI)',
    defaultIndicator: 'FI:085 - Explain the nature of financial statements',
    keywords: [
      'cash flow', 'balance sheet', 'income statement', 'current ratio', 'debt-to-equity', 'quick ratio',
      'break-even', 'fixed cost', 'variable cost', 'cogs', 'gross profit', 'net profit', 'margin',
      'roi', 'working capital', 'equity', 'debt', 'seed capital', 'venture capital', 'angel investor',
      'valuation', 'depreciation', 'amortization', 'collateral', 'interest rate', 'credit', 'accounts receivable',
      'accounts payable', 'ledger', 'audit', 'burn rate'
    ],
  },
  {
    area: 'Marketing & Research (MK)',
    defaultIndicator: 'MK:001 - Develop marketing strategies and plans',
    keywords: [
      'target market', 'market segment', 'demographic', 'psychographic', 'geographic', 'swot',
      'marketing mix', '4 ps', 'promotional', 'positioning', 'competitive advantage', 'market share',
      'niche', 'market research', 'focus group', 'survey', 'penetration', 'value proposition'
    ],
  },
  {
    area: 'Emotional Intelligence (EI)',
    defaultIndicator: 'EI:003 - Foster positive interpersonal and customer relationships',
    keywords: [
      'customer', 'client', 'touchpoint', 'complaint', 'service', 'retention', 'loyalty program',
      'satisfaction', 'nps', 'inquiry', 'customer relationship management', 'crm', 'clientele',
      'empathy', 'ethics', 'negotiation', 'conflict resolution', 'emotional intelligence'
    ],
  },
  {
    area: 'Professional Development (PD)',
    defaultIndicator: 'PD:016 - Career planning and business communication',
    keywords: [
      'memo', 'email', 'communication', 'active listening', 'presentation', 'verbal', 'nonverbal',
      'feedback', 'written message', 'proposal', 'pitch deck', 'formal report', 'meeting minutes',
      'resume', 'networking', 'professionalism', 'career'
    ],
  },
  {
    area: 'Economics (EC)',
    defaultIndicator: 'EC:001 - Describe the nature of economics',
    keywords: [
      'supply', 'demand', 'inflation', 'gdp', 'gross domestic product', 'elasticity', 'scarcity',
      'monopoly', 'oligopoly', 'pure competition', 'fiscal policy', 'monetary policy', 'interest rate',
      'opportunity cost', 'equilibrium', 'business cycle', 'recession', 'tariff', 'quota', 'exchange rate'
    ],
  },
  {
    area: 'Human Resources (HR)',
    defaultIndicator: 'HR:001 - Recognize management role in HR',
    keywords: [
      'employee', 'hiring', 'interview', 'job description', 'recruitment', 'training', 'compensation',
      'salary', 'benefits', 'performance review', 'appraisal', 'onboarding', 'turnover', 'staffing',
      'payroll', 'workers compensation', 'harassment', 'eeoc'
    ],
  },
  {
    area: 'Information Management (NF)',
    defaultIndicator: 'NF:001 - Explain the role of information management',
    keywords: [
      'database', 'spreadsheet', 'software', 'cloud', 'cybersecurity', 'data security', 'encryption',
      'backup', 'management information system', 'mis', 'it infrastructure', 'network'
    ],
  },
  {
    area: 'Operations & Logistics (OP)',
    defaultIndicator: 'OP:001 - Explain the nature of operations management',
    keywords: [
      'inventory', 'supply chain', 'vendor', 'supplier', 'logistics', 'purchasing', 'procurement',
      'reorder point', 'just-in-time', 'jit', 'quality control', 'lean', 'facility', 'warehouse', 'shrinkage'
    ],
  },
  {
    area: 'Risk Management (RM)',
    defaultIndicator: 'RM:001 - Explain the nature of risk management',
    keywords: [
      'risk', 'insurance', 'policy', 'premium', 'deductible', 'hazard', 'speculative risk', 'pure risk',
      'mitigation', 'emergency plan', 'contingency', 'internal control', 'fraud prevention', 'liability insurance'
    ],
  },
  {
    area: 'Strategic Management (SM)',
    defaultIndicator: 'SM:001 - Recognize managerial role in business',
    keywords: [
      'strategic', 'vision', 'mission statement', 'goals', 'milestone', 'organizational structure',
      'chain of command', 'span of control', 'governance', 'leadership', 'delegation'
    ],
  },
  {
    area: 'Professional Development (PD)',
    defaultIndicator: 'PD:001 - Foster professional development',
    keywords: [
      'career', 'resume', 'cover letter', 'networking', 'professional association', 'mentor',
      'ethics', 'code of conduct', 'time management', 'prioritization', 'deca'
    ],
  },
];

export function autoClassifyArea(questionText: string, optionsText: string): { area: InstructionalArea; indicator: string } {
  const combined = (questionText + ' ' + optionsText).toLowerCase();

  let bestArea: InstructionalArea = 'Entrepreneurship Concepts (EN)';
  let bestIndicator = 'EN:114 - Explain nature of entrepreneurship';
  let maxMatches = 0;

  for (const item of AREA_KEYWORDS) {
    let matches = 0;
    for (const kw of item.keywords) {
      if (combined.includes(kw)) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestArea = item.area;
      bestIndicator = item.defaultIndicator;
    }
  }

  // Look for direct indicator pattern like EN:044, BL:112, etc.
  const indicatorMatch = combined.match(/\b([A-Z]{2}:\d{3})\b/i);
  if (indicatorMatch) {
    const code = indicatorMatch[1].toUpperCase();
    const prefix = code.split(':')[0];
    const matchedByPrefix = AREA_KEYWORDS.find(a => a.area.includes(`(${prefix})`));
    if (matchedByPrefix) {
      bestArea = matchedByPrefix.area;
      bestIndicator = `${code} - Competency Indicator`;
    }
  }

  return { area: bestArea, indicator: bestIndicator };
}

/**
 * Parses raw unformatted text, JSON, or CSV into structured Question drafts.
 * Handles diverse formats copied from PDFs, Word docs, DECA test banks, etc.
 */
export function siftAndOrganizeQuestions(rawInput: string): ParsedQuestionDraft[] {
  const text = rawInput.trim();
  if (!text) return [];

  // 1. Check if input is a JSON string
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const drafts: ParsedQuestionDraft[] = [];

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item || typeof item !== 'object') continue;
        const qText = String(item.question || item.q || '').trim();
        const opts = item.options || item.opts || [];
        if (qText && Array.isArray(opts) && opts.length >= 2) {
          const paddedOpts: [string, string, string, string] = [
            String(opts[0] || 'Option A').trim(),
            String(opts[1] || 'Option B').trim(),
            String(opts[2] || 'Option C').trim(),
            String(opts[3] || 'Option D').trim(),
          ];
          let correctIdx = 0;
          if (typeof item.correctAnswer === 'number') {
            correctIdx = item.correctAnswer;
          } else if (typeof item.answer === 'string') {
            const letter = item.answer.trim().toUpperCase().charAt(0);
            correctIdx = ['A', 'B', 'C', 'D'].indexOf(letter);
            if (correctIdx === -1) correctIdx = 0;
          }

          const classification = autoClassifyArea(qText, paddedOpts.join(' '));

          drafts.push({
            idTemp: `draft_${Date.now()}_${i}`,
            question: qText,
            options: paddedOpts,
            correctAnswer: Math.max(0, Math.min(3, correctIdx)),
            instructionalArea: item.instructionalArea || classification.area,
            indicator: item.indicator || classification.indicator,
            rationale: item.rationale || item.explanation || 'Authentic DECA answer rationale.',
            year: item.year || 2024,
            source: item.source || 'Imported Question',
          });
        }
      }

      if (drafts.length > 0) return drafts;
    } catch {
      // Fall through to text sifter
    }
  }

  // 2. Intelligent Multi-Question Text Sifter
  // Split raw text into prospective question blocks
  // Common question boundaries:
  // - "1. ", "2. ", "100. "
  // - "Question 1", "Question 1:", "Q1.", "Q1:"
  // - "1) ", "2) "
  // - Blank lines separating questions
  const drafts: ParsedQuestionDraft[] = [];

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Let's split by question numbering regex
  // Match lines starting with optional Q/Question followed by a number and delimiter (. or ) or :)
  const questionSplitRegex = /(?:^|\n)(?:(?:Q(?:uestion)?\s*)?(\d{1,3})[\.\)\:]\s+)/gi;

  const matches: { index: number; qNum: string; header: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = questionSplitRegex.exec(normalized)) !== null) {
    matches.push({
      index: match.index,
      qNum: match[1],
      header: match[0],
    });
  }

  const rawBlocks: string[] = [];

  if (matches.length >= 2) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
      rawBlocks.push(normalized.substring(start, end).trim());
    }
  } else {
    // If no numbered headers matched, try splitting by double blank lines
    const doubleLineBlocks = normalized.split(/\n\s*\n\s*\n|\n\s*\n/);
    if (doubleLineBlocks.length > 1) {
      rawBlocks.push(...doubleLineBlocks.map(b => b.trim()).filter(Boolean));
    } else {
      // Single block
      rawBlocks.push(normalized);
    }
  }

  // Process each block
  rawBlocks.forEach((block, blockIdx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    let questionStem = '';
    const extractedOptions: { letter: string; text: string; isMarkedCorrect?: boolean }[] = [];
    let detectedAnswerLetter: string | null = null;
    let explicitRationale = '';
    let explicitArea: InstructionalArea | null = null;
    let explicitIndicator = '';

    // Regex to match option starters: A., B., C., D. or A), B), C), D) or (A), (B), (C), (D) or *A. etc.
    const optionRegex = /^[\*\(]?([A-Da-d])[.\)\:\-\]]\s*(.*)$/;
    const answerLineRegex = /^(?:Correct\s*)?(?:Answer|Ans|Key)[\s\:\-\=]+[\*\(]?([A-Da-d])[\*\)]?/i;
    const rationaleLineRegex = /^(?:Rationale|Explanation|Reason|Why)[\s\:\-]+(.*)$/i;
    const areaLineRegex = /^(?:Instructional\s*Area|Area|Category)[\s\:\-]+(.*)$/i;
    const indicatorLineRegex = /^(?:Indicator|PI|Performance\s*Indicator)[\s\:\-]+(.*)$/i;

    let readingStem = true;

    for (let line of lines) {
      // Clean leading question numbering if in first line
      if (readingStem && questionStem === '') {
        line = line.replace(/^(?:(?:Q(?:uestion)?\s*)?\d{1,3}[\.\)\:]\s*)/i, '').trim();
      }

      // Check if line is explicit Answer
      const ansMatch = line.match(answerLineRegex);
      if (ansMatch) {
        detectedAnswerLetter = ansMatch[1].toUpperCase();
        readingStem = false;
        continue;
      }

      // Check if line is Rationale
      const ratMatch = line.match(rationaleLineRegex);
      if (ratMatch) {
        explicitRationale = ratMatch[1].trim();
        readingStem = false;
        continue;
      }

      // Check if line is Area
      const areaMatch = line.match(areaLineRegex);
      if (areaMatch) {
        const areaStr = areaMatch[1].trim();
        const matched = INSTRUCTIONAL_AREAS.find(a =>
          a.toLowerCase().includes(areaStr.toLowerCase())
        );
        if (matched) explicitArea = matched;
        readingStem = false;
        continue;
      }

      // Check if line is Indicator
      const indMatch = line.match(indicatorLineRegex);
      if (indMatch) {
        explicitIndicator = indMatch[1].trim();
        readingStem = false;
        continue;
      }

      // Check if line is an Option A, B, C, D
      const optMatch = line.match(optionRegex);
      if (optMatch) {
        readingStem = false;
        const letter = optMatch[1].toUpperCase();
        let optText = optMatch[2].trim();

        // Check if marked with asterisk or (correct)
        let isMarkedCorrect = false;
        if (line.startsWith('*') || optText.includes('*') || optText.toLowerCase().includes('(correct)')) {
          isMarkedCorrect = true;
          optText = optText.replace(/\*/g, '').replace(/\(correct\)/gi, '').trim();
        }

        extractedOptions.push({
          letter,
          text: optText,
          isMarkedCorrect,
        });
        continue;
      }

      // If still in stem
      if (readingStem) {
        questionStem = questionStem ? `${questionStem} ${line}` : line;
      } else {
        // If we already saw options and this is a trailing explanation line
        if (!explicitRationale && !line.match(optionRegex)) {
          explicitRationale = explicitRationale ? `${explicitRationale} ${line}` : line;
        }
      }
    }

    // Fallback if options were inline: e.g. "A. Option 1 B. Option 2 C. Option 3 D. Option 4"
    if (extractedOptions.length < 2 && questionStem) {
      const inlineOptRegex = /(?:^|\s)(?:[\*\(]?([A-D])[.\)\:\-\]]\s*)([^\nA-D]*?)(?=(?:\s[\*\(]?[A-D][.\)\:\-\]]|$))/gi;
      let inlineMatch: RegExpExecArray | null;
      while ((inlineMatch = inlineOptRegex.exec(questionStem)) !== null) {
        extractedOptions.push({
          letter: inlineMatch[1].toUpperCase(),
          text: inlineMatch[2].trim(),
        });
      }
      if (extractedOptions.length >= 2) {
        // Remove options from stem
        questionStem = questionStem.split(/(?:^|\s)[A-D][.\)\:\-\]]/)[0].trim();
      }
    }

    // Ensure we have at least 2 options
    if (extractedOptions.length >= 2 && questionStem) {
      // Sort options by A, B, C, D
      const finalOptions: [string, string, string, string] = [
        extractedOptions.find(o => o.letter === 'A')?.text || 'Option A',
        extractedOptions.find(o => o.letter === 'B')?.text || 'Option B',
        extractedOptions.find(o => o.letter === 'C')?.text || 'Option C',
        extractedOptions.find(o => o.letter === 'D')?.text || 'Option D',
      ];

      // Determine correct answer
      let correctIdx = 0;
      let isAmbiguous = false;

      if (detectedAnswerLetter) {
        const mapped = ['A', 'B', 'C', 'D'].indexOf(detectedAnswerLetter);
        if (mapped !== -1) correctIdx = mapped;
      } else {
        const marked = extractedOptions.find(o => o.isMarkedCorrect);
        if (marked) {
          const mapped = ['A', 'B', 'C', 'D'].indexOf(marked.letter);
          if (mapped !== -1) correctIdx = mapped;
        } else {
          isAmbiguous = true;
          correctIdx = 0; // default to A but flag as ambiguous
        }
      }

      // Auto-classify instructional area and indicator
      const classification = autoClassifyArea(questionStem, finalOptions.join(' '));

      drafts.push({
        idTemp: `draft_${Date.now()}_${blockIdx}`,
        question: questionStem,
        options: finalOptions,
        correctAnswer: correctIdx,
        instructionalArea: explicitArea || classification.area,
        indicator: explicitIndicator || classification.indicator,
        rationale: explicitRationale || `The correct answer is (${['A', 'B', 'C', 'D'][correctIdx]}) based on DECA Entrepreneurship curriculum standards.`,
        year: 2024,
        source: 'Smart Import',
        isAmbiguousAnswer: isAmbiguous,
      });
    }
  });

  return drafts;
}
