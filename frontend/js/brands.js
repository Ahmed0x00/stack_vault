/**
 * brands.js
 * Helper utility to map product names to brand logos using high-quality favicons
 */

const BRAND_DOMAINS = [
  { keywords: ['canva'], domain: 'canva.com' },
  { keywords: ['capcut'], domain: 'capcut.com' },
  { keywords: ['netflix'], domain: 'netflix.com' },
  { keywords: ['spotify'], domain: 'spotify.com' },
  { keywords: ['office 365', 'microsoft office'], domain: 'office.com' },
  { keywords: ['outlook', 'hotmail'], domain: 'outlook.com' },
  { keywords: ['gemini'], domain: 'gemini.google.com' },
  { keywords: ['coursera'], domain: 'coursera.org' },
  { keywords: ['notion'], domain: 'notion.so' },
  { keywords: ['icloud'], domain: 'icloud.com' },
  { keywords: ['adobe'], domain: 'adobe.com' },
  { keywords: ['gmail', 'gmails'], domain: 'mail.google.com' },
  { keywords: ['ilovepdf'], domain: 'ilovepdf.com' }
];

function getBrandLogoUrl(productName) {
  if (!productName) return null;
  const nameLower = productName.toLowerCase();
  
  for (const brand of BRAND_DOMAINS) {
    for (const keyword of brand.keywords) {
      if (nameLower.includes(keyword)) {
        return `https://icons.duckduckgo.com/ip3/${brand.domain}.ico`;
      }
    }
  }
  return null;
}

function getProductImageHtml(productName, fallbackCategory, existingThumbHtml) {
  const logoUrl = getBrandLogoUrl(productName);
  
  if (logoUrl) {
    // Return a customized product thumb with the brand image
    return `
      <div class="product-thumb" style="background: #ffffff; display: flex; align-items: center; justify-content: center; padding: 6px;">
        <img src="${logoUrl}" alt="${productName}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;">
      </div>
    `;
  }
  
  // If no brand matches, return the original fallback thumbnail HTML
  return existingThumbHtml;
}
