import fs from 'fs';

const html = fs.readFileSync('ddg.html', 'utf8');

// Strip out all script and style tags to minimize size
let cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' '); // Strip all remaining tags

// Decode HTML entities roughly
cleanText = cleanText.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

// Just take the first 3000 characters which contains the top search results
const snippetTemplate = cleanText.replace(/\s+/g, ' ').substring(0, 3000);

console.log(snippetTemplate);
