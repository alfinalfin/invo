import { Readable } from 'stream';
import csv from 'csv-parser';
import * as xlsx from 'xlsx';

/**
 * Parses CSV buffer into JSON array
 */
export async function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

/**
 * Parses Excel buffer into JSON array (first sheet)
 */
export async function parseExcel(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
}

/**
 * Standardizes raw row data into Lead object
 */
export function mapImportedLead(row) {
  // Normalize keys (case-insensitive and whitespace-stripped)
  const normalized = {};
  Object.keys(row).forEach(key => {
    normalized[key.toLowerCase().trim()] = row[key];
  });

  // Find Company Name
  const company = normalized['company name'] || normalized['company'] || normalized['business'] || normalized['name'] || 'Unknown';
  
  // Find Email
  const email = normalized['email'] || normalized['e-mail'] || normalized['email address'] || '';
  
  // Find Phone
  const phone = normalized['phone'] || normalized['telephone'] || normalized['mobile'] || normalized['phone number'] || '';

  return {
    company: company,
    name: company, // Use company as name if separate name not found
    email: email,
    phone: phone,
    source: 'Import',
    status: 'New',
    priority: 'Warm',
    createdAt: new Date().toISOString(),
    pickupAddress: normalized['address'] || normalized['location'] || 'Imported',
    deliveryAddress: 'Pending',
    notes: 'Imported from file'
  };
}
