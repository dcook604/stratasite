import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let cachedSections = null;

// Words to ignore when matching — includes common strata document boilerplate
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'shall', 'not', 'no', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'we', 'you', 'he', 'she', 'they', 'my', 'our', 'your', 'his', 'her',
  'their', 'which', 'who', 'what', 'when', 'where', 'how', 'if', 'as', 'so',
  'up', 'out', 'about', 'into', 'than', 'then', 'there', 'any', 'all', 'each',
  'other', 'such', 'must', 'strata', 'owner', 'person', 'lot', 'council',
  'corporation', 'owners', 'persons', 'lots', 'without', 'prior', 'written',
  'approval', 'section', 'bylaw', 'bylaws', 'unless', 'pursuant',
  'resident', 'residents', 'common', 'area', 'areas', 'building', 'buildings',
  'property', 'properties', 'tenant', 'tenants', 'occupant', 'occupants',
  'visitor', 'visitors', 'unit', 'units',
  // Generic verbs/adverbs/prepositions that appear in many different bylaw contexts
  'outside', 'inside', 'left', 'right', 'day', 'days', 'time', 'times',
  'make', 'made', 'take', 'taken', 'use', 'used', 'get', 'keep',
  'new', 'old', 'set', 'put', 'way', 'work', 'place', 'part',
]);

function stem(word) {
  // Basic suffix stripping for plural/gerund forms
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 5 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .map(stem);
}

/**
 * Parse extracted PDF text into logical bylaw sections.
 * Handles patterns like "1", "1.1", "1.1.1", "Part X", "Division X", "Schedule X".
 */
function parseSections(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = [];
  let current = null;

  const sectionRe = /^(\d+(?:\.\d+)*)\s+\S/;
  const partRe = /^(part|division|schedule|section)\s+/i;

  for (const line of lines) {
    if (sectionRe.test(line) || partRe.test(line)) {
      if (current) sections.push(current);
      current = { header: line, body: line };
    } else if (current) {
      current.body += ' ' + line;
    } else {
      // Pre-section preamble — group into a single block
      if (!current) current = { header: 'Preamble', body: line };
      else current.body += ' ' + line;
    }
  }
  if (current) sections.push(current);

  // Discard sections too short to be meaningful (fewer than 15 words)
  return sections.filter(s => s.body.split(/\s+/).length > 15);
}

async function loadSections() {
  if (cachedSections !== null) return cachedSections;

  const pdfPath = path.join(__dirname, '../../public/documents/bylaws_2025.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.warn('[bylawMatcher] Bylaws PDF not found:', pdfPath);
    cachedSections = [];
    return cachedSections;
  }

  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(pdfPath);
    const { text } = await pdfParse(buffer);
    cachedSections = parseSections(text);
    console.log(`[bylawMatcher] Loaded ${cachedSections.length} bylaw sections from PDF`);
    return cachedSections;
  } catch (err) {
    console.error('[bylawMatcher] PDF extraction failed:', err.message);
    cachedSections = [];
    return cachedSections;
  }
}

/**
 * Build an IDF map: words that appear in fewer sections get higher weight.
 * IDF(word) = log(N / df) where N = total sections, df = sections containing word.
 */
function buildIdf(sections) {
  const df = new Map();
  for (const section of sections) {
    const words = new Set(tokenize(section.body));
    for (const w of words) {
      df.set(w, (df.get(w) || 0) + 1);
    }
  }
  const N = sections.length;
  const idf = new Map();
  for (const [word, count] of df) {
    idf.set(word, Math.log(N / count));
  }
  return idf;
}

let cachedIdf = null;

/**
 * Find bylaw sections relevant to an incident using TF-IDF keyword matching.
 * Rare/topic-specific words (e.g. "smoking", "parking") are weighted more heavily
 * than common location words (e.g. "elevator", "hallway").
 *
 * @param {string} incidentTitle
 * @param {string} incidentDescription
 * @returns {Promise<string|null>} Formatted excerpt(s) of matching bylaw text, or null if no match.
 */
export async function findRelevantBylaws(incidentTitle, incidentDescription) {
  const sections = await loadSections();
  if (!sections.length) return null;

  // Build IDF once and cache alongside the sections
  if (!cachedIdf) cachedIdf = buildIdf(sections);
  const idf = cachedIdf;

  // Extract all incident keywords then keep only the most specific (highest IDF) ones.
  // This prevents generic words like "outside", "day", "leaving" from matching irrelevant sections.
  const allIncidentKeywords = tokenize(`${incidentTitle} ${incidentDescription}`);
  if (allIncidentKeywords.length < 2) return null;

  const uniqueIncidentKeywords = [...new Set(allIncidentKeywords)];
  // Sort by IDF descending and take top 5 most specific keywords
  const incidentKeywords = new Set(
    uniqueIncidentKeywords
      .sort((a, b) => (idf.get(b) || 0) - (idf.get(a) || 0))
      .slice(0, 5)
  );

  const scored = sections
    .map(section => {
      const sectionTokens = new Set(tokenize(section.body));
      let tfidfScore = 0;
      let uniqueMatches = 0;
      for (const kw of incidentKeywords) {
        if (sectionTokens.has(kw)) {
          const w = idf.get(kw) || 0;
          tfidfScore += w * w; // Squared IDF: rare/specific words count exponentially more
          uniqueMatches++;
        }
      }
      // Normalize by number of incident keywords so shorter queries aren't penalized
      const score = tfidfScore / incidentKeywords.size;
      return { ...section, score, uniqueMatches };
    })
    .filter(s => s.uniqueMatches >= 1 && s.score >= 1.0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (!scored.length) return null;

  return scored
    .map(s => {
      // Truncate long sections to a readable excerpt
      const excerpt = s.body.length > 650
        ? s.body.substring(0, 650).replace(/\s+\S+$/, '') + '…'
        : s.body;
      return excerpt.trim();
    })
    .join('\n\n─────\n\n');
}
