/**
 * Vietnamese synonym dictionary for search expansion.
 * Replaces: backend/app/search/synonyms.py
 */

const SYNONYM_GROUPS = [
  // Wallet / Purse
  ['ví', 'bóp', 'ví nam', 'ví nữ', 'ví da', 'bóp da', 'bóp nam', 'bóp nữ'],
  // Student card
  ['thẻ sv', 'thẻ sinh viên', 'student card', 'thẻ svien', 'thẻ s.v'],
  // Phone
  ['điện thoại', 'dt', 'phone', 'dien thoai', 'iphone', 'samsung', 'oppo', 'xiaomi'],
  // Keys
  ['chìa khóa', 'chìa khoá', 'chia khoa', 'chìa', 'key', 'móc khóa', 'móc chìa'],
  // Laptop / Computer
  ['laptop', 'máy tính', 'may tinh', 'máy tính xách tay', 'notebook', 'macbook'],
  // Charger / Cable
  ['sạc', 'cáp sạc', 'sac', 'dây sạc', 'adapter', 'củ sạc', 'cục sạc'],
  // Backpack / Bag
  ['balo', 'ba lô', 'túi', 'cặp', 'túi xách', 'cặp sách', 'ba-lô'],
  // Headphones
  ['tai nghe', 'headphone', 'earphone', 'airpods', 'earbuds', 'tay nghe'],
  // Glasses
  ['kính', 'kính mắt', 'kinh mat', 'mắt kính', 'glasses'],
  // Umbrella
  ['ô', 'dù', 'ô dù', 'umbrella'],
  // Bottle
  ['bình nước', 'chai nước', 'binh nuoc', 'chai', 'bình giữ nhiệt'],
  // Card / ID
  ['thẻ', 'thẻ ngân hàng', 'thẻ atm', 'cmnd', 'cccd', 'căn cước', 'chứng minh'],
  // USB / Flash drive
  ['usb', 'flash drive', 'ổ cứng', 'ổ đĩa', 'thẻ nhớ', 'memory card'],
  // Motorcycle helmet
  ['mũ bảo hiểm', 'nón bảo hiểm', 'mu bao hiem', 'mũ', 'nón'],
  // Money
  ['tiền', 'tiền mặt', 'tien', 'cash'],
  // Clothing
  ['áo', 'quần', 'ao', 'quan', 'áo khoác', 'jacket'],
  // Watch
  ['đồng hồ', 'dong ho', 'watch', 'smartwatch'],
  // Vehicle card / Parking card
  ['thẻ xe', 'the xe', 'thẻ gửi xe', 'vé xe'],
];

// Build reverse lookup
const LOOKUP = {};
for (const group of SYNONYM_GROUPS) {
  const termsSet = new Set(group.map(t => t.toLowerCase()));
  for (const term of termsSet) {
    LOOKUP[term] = termsSet;
  }
}

/**
 * Expand a search query with synonyms
 * @param {string} query
 * @returns {string[]}
 */
export function expandQuery(query) {
  const queryLower = query.toLowerCase().trim();
  const expanded = new Set([queryLower]);

  // Check if the whole query matches a synonym
  if (LOOKUP[queryLower]) {
    for (const term of LOOKUP[queryLower]) {
      expanded.add(term);
    }
  }

  // Check individual words
  const words = queryLower.split(/\s+/);
  for (const word of words) {
    if (LOOKUP[word]) {
      for (const term of LOOKUP[word]) {
        expanded.add(term);
      }
    }
  }

  // Check pairs of consecutive words
  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`;
    if (LOOKUP[pair]) {
      for (const term of LOOKUP[pair]) {
        expanded.add(term);
      }
    }
  }

  return [...expanded];
}
