/**
 * TF-IDF based spam detection for Cloudflare Workers
 * Replaces: backend/app/services/ai_service.py
 * 
 * Simplified TF-IDF + cosine similarity implementation in pure JS
 * (no scikit-learn / numpy needed)
 */

let vocabulary = {};    // word -> index
let idfValues = {};     // word -> IDF value
let tfidfMatrix = [];   // array of sparse vectors [{word: tfidf_value}, ...]
let postsData = [];     // stored raw texts

/**
 * Tokenize text into words
 */
function tokenize(text) {
  return (text || '').toLowerCase().match(/\w+/gu) || [];
}

/**
 * Compute term frequency for a document
 */
function computeTF(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  // Normalize by document length
  const len = tokens.length || 1;
  for (const t in tf) {
    tf[t] /= len;
  }
  return tf;
}

/**
 * Fit TF-IDF model with existing posts
 * @param {string[]} posts - Array of post texts
 */
export function fitData(posts) {
  postsData = posts;
  if (!posts || posts.length === 0) {
    tfidfMatrix = [];
    vocabulary = {};
    idfValues = {};
    return;
  }

  // Tokenize all documents
  const docs = posts.map(p => tokenize(p));
  const N = docs.length;

  // Build vocabulary and document frequency
  const df = {};
  const allWords = new Set();

  for (const doc of docs) {
    const uniqueWords = new Set(doc);
    for (const word of uniqueWords) {
      df[word] = (df[word] || 0) + 1;
      allWords.add(word);
    }
  }

  // Compute IDF
  vocabulary = {};
  idfValues = {};
  let idx = 0;
  for (const word of allWords) {
    vocabulary[word] = idx++;
    idfValues[word] = Math.log((N + 1) / (df[word] + 1)) + 1; // smooth IDF
  }

  // Compute TF-IDF matrix
  tfidfMatrix = docs.map(doc => {
    const tf = computeTF(doc);
    const tfidf = {};
    for (const word in tf) {
      tfidf[word] = tf[word] * (idfValues[word] || 0);
    }
    return tfidf;
  });
}

/**
 * Compute cosine similarity between two sparse vectors
 */
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const word in a) {
    normA += a[word] * a[word];
    if (b[word]) {
      dotProduct += a[word] * b[word];
    }
  }
  for (const word in b) {
    normB += b[word] * b[word];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Check if a new post is spam (too similar to existing posts)
 * @param {string} newPostText
 * @param {number} threshold - Similarity threshold (default 0.85)
 * @returns {[boolean, number]} - [is_spam, max_similarity_score]
 */
export function isSpam(newPostText, threshold = 0.85) {
  if (tfidfMatrix.length === 0 || postsData.length === 0) {
    return [false, 0.0];
  }

  try {
    const tokens = tokenize(newPostText);
    const tf = computeTF(tokens);
    const newVec = {};
    for (const word in tf) {
      newVec[word] = tf[word] * (idfValues[word] || 0);
    }

    let maxSim = 0;
    for (const existingVec of tfidfMatrix) {
      const sim = cosineSimilarity(newVec, existingVec);
      if (sim > maxSim) maxSim = sim;
    }

    return [maxSim > threshold, maxSim];
  } catch (e) {
    console.error('Error in AI check:', e);
    return [false, 0.0];
  }
}
