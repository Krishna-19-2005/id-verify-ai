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
  const inputDigits = extractDigits(dateInput);
  
  // Common date patterns in Indian documents
  const datePatterns = [
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, // DD/MM/YYYY or DD-MM-YYYY
    /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4}\b/gi, // DD Month YYYY
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{2,4}\b/gi, // Month DD, YYYY
    /(?:dob|date\s*of\s*birth|birth\s*date)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
    /year\s*of\s*birth[\s:]*(\d{4})/gi, // Year of birth
  ];
  
  for (const pattern of datePatterns) {
    const matches = [...documentText.matchAll(pattern)];
    for (const match of matches) {
      const dateText = match[1] || match[0];
      const matchDigits = extractDigits(dateText);
      
      // Direct match
      if (matchDigits === inputDigits) {
        return { found: true, confidence: 1.0, extractedDate: dateText };
      }
      
      // For year-only matches, check if year matches
      if (matchDigits.length === 4 && inputDigits.includes(matchDigits)) {
        return { found: true, confidence: 0.8, extractedDate: dateText };
      }
      
      // Partial date match (at least day and month or year)
      const similarity = getSimilarity(inputDigits, matchDigits);
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