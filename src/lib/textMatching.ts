import stringSimilarity from 'string-similarity';

/**
 * Advanced text matching utilities for document validation
 * Handles OCR inaccuracies and various text formats
 */

// Normalize text for comparison
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Extract digits only
export const extractDigits = (text: string): string => {
  return text.replace(/\D/g, '');
};

// Calculate similarity between two strings
export const getSimilarity = (str1: string, str2: string): number => {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  return stringSimilarity.compareTwoStrings(normalized1, normalized2);
};

// Check if name appears in document text with fuzzy matching
export const findNameInText = (name: string, documentText: string, threshold = 0.7): {
  found: boolean;
  confidence: number;
  extractedName?: string;
} => {
  const normalizedName = normalizeText(name);
  const normalizedText = normalizeText(documentText);
  
  // Split name into parts for better matching
  const nameParts = normalizedName.split(' ').filter(part => part.length > 1);
  
  if (nameParts.length === 0) {
    return { found: false, confidence: 0 };
  }
  
  // Check direct substring match first
  if (normalizedText.includes(normalizedName)) {
    return { found: true, confidence: 1.0, extractedName: name };
  }
  
  // Check individual name parts
  const foundParts = nameParts.filter(part => normalizedText.includes(part));
  const partialConfidence = foundParts.length / nameParts.length;
  
  if (partialConfidence >= 0.6) {
    return { found: true, confidence: partialConfidence, extractedName: foundParts.join(' ') };
  }
  
  // Use fuzzy matching for OCR errors
  const words = normalizedText.split(' ');
  let bestMatch = 0;
  let bestMatchText = '';
  
  // Check sliding window of words
  for (let i = 0; i < words.length - nameParts.length + 1; i++) {
    const window = words.slice(i, i + nameParts.length).join(' ');
    const similarity = getSimilarity(normalizedName, window);
    if (similarity > bestMatch) {
      bestMatch = similarity;
      bestMatchText = window;
    }
  }
  
  return {
    found: bestMatch >= threshold,
    confidence: bestMatch,
    extractedName: bestMatch >= threshold ? bestMatchText : undefined
  };
};

// Extract and validate phone numbers with flexible patterns
export const findPhoneInText = (phoneInput: string, documentText: string): {
  found: boolean;
  confidence: number;
  extractedPhone?: string;
} => {
  const inputDigits = extractDigits(phoneInput);
  const last10Digits = inputDigits.slice(-10); // Get last 10 digits for Indian numbers
  
  // Multiple phone patterns to handle various formats
  const phonePatterns = [
    /\b[6-9]\d{9}\b/g, // Standard Indian mobile
    /\b\d{10}\b/g, // Any 10-digit number
    /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, // Formatted numbers
    /\b\+91[\s-]?\d{10}\b/g, // With country code
  ];
  
  for (const pattern of phonePatterns) {
    const matches = documentText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const matchDigits = extractDigits(match);
        const matchLast10 = matchDigits.slice(-10);
        
        if (matchLast10 === last10Digits) {
          return { found: true, confidence: 1.0, extractedPhone: match };
        }
        
        // Check partial match (at least 8 digits match)
        const similarity = getSimilarity(last10Digits, matchLast10);
        if (similarity >= 0.8) {
          return { found: true, confidence: similarity, extractedPhone: match };
        }
      }
    }
  }
  
  return { found: false, confidence: 0 };
};

// Extract and validate dates with multiple formats
export const findDateInText = (dateInput: string, documentText: string): {
  found: boolean;
  confidence: number;
  extractedDate?: string;
} => {
  // Normalize input date into components regardless of format (YYYY-MM-DD, DD/MM/YYYY, etc.)
  const parseInput = (input: string) => {
    const digits = extractDigits(input);
    // Try YYYYMMDD
    if (/^\d{8}$/.test(digits)) {
      // Heuristic: if original contains '-' and starts with 19/20 treat as YYYYMMDD
      const yearFirst = /^\d{4}/.test(digits);
      if (yearFirst) {
        return { d: parseInt(digits.slice(6, 8)), m: parseInt(digits.slice(4, 6)), y: parseInt(digits.slice(0, 4)) };
      }
    }
    // Try to detect standard input from <input type="date"> which is YYYY-MM-DD
    const ymd = input.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    if (ymd) {
      return { d: parseInt(ymd[3]), m: parseInt(ymd[2]), y: parseInt(ymd[1]) };
    }
    // Fallback: try DD/MM/YYYY
    const dmy = input.match(/(\d{1,2})[\/-\.](\d{1,2})[\/-\.](\d{2,4})/);
    if (dmy) {
      const y = parseInt(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
      return { d: parseInt(dmy[1]), m: parseInt(dmy[2]), y };
    }
    // If only year is present
    const yOnly = input.match(/\b(19|20)\d{2}\b/);
    if (yOnly) {
      return { d: NaN, m: NaN, y: parseInt(yOnly[0]) };
    }
    return { d: NaN, m: NaN, y: NaN };
  };

  const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  };

  const parseMatch = (text: string) => {
    const lower = text.toLowerCase();

    // Month name formats
    let m = lower.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*\s+(\d{2,4})\b/i);
    if (m) {
      const month = monthMap[m[2].slice(0, 3)];
      const year = parseInt(m[3].length === 2 ? `20${m[3]}` : m[3]);
      return { d: parseInt(m[1]), m: month, y: year };
    }
    m = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*\s+(\d{1,2}),?\s+(\d{2,4})\b/i);
    if (m) {
      const month = monthMap[m[1].slice(0, 3)];
      const year = parseInt(m[3].length === 2 ? `20${m[3]}` : m[3]);
      return { d: parseInt(m[2]), m: month, y: year };
    }

    // Numeric formats
    m = lower.match(/\b(\d{1,2})[\/-\.](\d{1,2})[\/-\.](\d{2,4})\b/);
    if (m) {
      const day = parseInt(m[1]);
      const month = parseInt(m[2]);
      const year = parseInt(m[3].length === 2 ? `20${m[3]}` : m[3]);
      return { d: day, m: month, y: year };
    }
    m = lower.match(/\b(\d{4})[\/-\.](\d{1,2})[\/-\.](\d{1,2})\b/);
    if (m) {
      return { d: parseInt(m[3]), m: parseInt(m[2]), y: parseInt(m[1]) };
    }

    // Year of birth only
    m = lower.match(/(?:dob|date\s*of\s*birth|birth\s*date)[\s:]*((\d{1,2})[\/-\.](\d{1,2})[\/-\.](\d{2,4}))/i);
    if (m) {
      const d = parseInt(m[2]);
      const mo = parseInt(m[3]);
      const y = parseInt(m[4].length === 2 ? `20${m[4]}` : m[4]);
      return { d, m: mo, y };
    }
    m = lower.match(/year\s*of\s*birth[\s:]*(\d{4})/i);
    if (m) {
      return { d: NaN, m: NaN, y: parseInt(m[1]) };
    }

    // Fallback: extract digits and try to infer
    const digits = extractDigits(lower);
    if (digits.length === 8) {
      const asYmd = { d: parseInt(digits.slice(6, 8)), m: parseInt(digits.slice(4, 6)), y: parseInt(digits.slice(0, 4)) };
      const asDmy = { d: parseInt(digits.slice(0, 2)), m: parseInt(digits.slice(2, 4)), y: parseInt(digits.slice(4, 8)) };
      return Number.isNaN(asYmd.y) ? asDmy : asYmd;
    }
    if (digits.length === 4) {
      return { d: NaN, m: NaN, y: parseInt(digits) };
    }
    return { d: NaN, m: NaN, y: NaN };
  };

  const input = parseInput(dateInput);

  // Scan document for date-like strings and compare by components
  const patterns = [
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,
    /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,
    /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*\s+\d{2,4}\b/gi,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{2,4}\b/gi,
    /(?:dob|date\s*of\s*birth|birth\s*date)[\s:]*(\d{1,2}[\/-\.]\d{1,2}[\/-\.]\d{2,4})/gi,
    /year\s*of\s*birth[\s:]*(\d{4})/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...documentText.matchAll(pattern)];
    for (const match of matches) {
      const dateText = match[1] || match[0];
      const m = parseMatch(dateText);

      // If only year matched
      if (!Number.isNaN(input.y) && Number.isNaN(m.d) && Number.isNaN(m.m) && m.y === input.y) {
        return { found: true, confidence: 0.85, extractedDate: dateText };
      }

      // Compare components allowing different orders
      let score = 0;
      if (!Number.isNaN(input.d) && !Number.isNaN(m.d) && input.d === m.d) score += 0.34;
      if (!Number.isNaN(input.m) && !Number.isNaN(m.m) && input.m === m.m) score += 0.33;
      if (!Number.isNaN(input.y) && !Number.isNaN(m.y) && input.y === m.y) score += 0.33;

      if (score >= 0.66) {
        return { found: true, confidence: Math.min(1, score + 0.2), extractedDate: dateText };
      }
      if (score >= 0.34) {
        // Partial match
        return { found: true, confidence: score, extractedDate: dateText };
      }

      // Fallback similarity on digits
      const similarity = getSimilarity(extractDigits(dateInput), extractDigits(dateText));
      if (similarity >= 0.6) {
        return { found: true, confidence: similarity, extractedDate: dateText };
      }
    }
  }

  return { found: false, confidence: 0 };
};

// Extract Aadhaar number with validation
export const findAadhaarInText = (aadhaarInput: string, documentText: string): {
  found: boolean;
  confidence: number;
  extractedAadhaar?: string;
} => {
  const inputDigits = extractDigits(aadhaarInput);
  
  // Aadhaar patterns
  const aadhaarPatterns = [
    /\b\d{4}\s?\d{4}\s?\d{4}\b/g, // 12 digits with optional spaces
    /\b\d{12}\b/g, // 12 consecutive digits
  ];
  
  for (const pattern of aadhaarPatterns) {
    const matches = documentText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const matchDigits = extractDigits(match);
        
        if (matchDigits === inputDigits) {
          return { found: true, confidence: 1.0, extractedAadhaar: match };
        }
        
        // Check similarity for OCR errors
        const similarity = getSimilarity(inputDigits, matchDigits);
        if (similarity >= 0.9) { // High threshold for ID numbers
          return { found: true, confidence: similarity, extractedAadhaar: match };
        }
      }
    }
  }
  
  return { found: false, confidence: 0 };
};

// Check if document is likely an Aadhaar card
export const isAadhaarDocument = (documentText: string): {
  isAadhaar: boolean;
  confidence: number;
} => {
  const aadhaarKeywords = [
    'aadhaar', 'aadhar', 'uidai', 'unique identification',
    'government of india', 'भारत सरकार', 'आधार',
  ];
  
  const normalizedText = normalizeText(documentText);
  let keywordMatches = 0;
  
  for (const keyword of aadhaarKeywords) {
    if (normalizedText.includes(normalizeText(keyword))) {
      keywordMatches++;
    }
  }
  
  // Check for Aadhaar number pattern
  const hasAadhaarNumber = /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(documentText);
  
  const confidence = (keywordMatches / aadhaarKeywords.length) + (hasAadhaarNumber ? 0.3 : 0);
  
  return {
    isAadhaar: confidence > 0.3,
    confidence: Math.min(confidence, 1.0)
  };
};