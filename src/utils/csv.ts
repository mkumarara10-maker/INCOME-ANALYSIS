import { Transaction, TransactionType } from '../types/finance';
import { toISODate } from './formatters';

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = [
    'Name',
    'Amount',
    'Type',
    'Category',
    'Date',
    'Payment Method',
    'Description',
  ];

  const rows = transactions.map((tx) => [
    escapeCSVField(tx.name),
    String(tx.amount),
    tx.type,
    escapeCSVField(tx.category),
    tx.date,
    escapeCSVField(tx.paymentMethod),
    escapeCSVField(tx.description || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadCSVFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : trimmed;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toISODate(parsed);
  }
  return null;
}

export interface CSVImportResult {
  transactions: Omit<Transaction, 'id' | 'createdAt'>[];
  errors: string[];
}

export function parseTransactionsFromCSV(csvText: string): CSVImportResult {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      transactions: [],
      errors: ['CSV file must contain a header row and at least one transaction row.'],
    };
  }

  const rawHeaders = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  const findIndex = (candidates: string[]) =>
    rawHeaders.findIndex((h) => candidates.some((c) => h.includes(c)));

  const nameIdx = findIndex(['name', 'title', 'transaction', 'merchant']);
  const amountIdx = findIndex(['amount', 'value', 'price']);
  const typeIdx = findIndex(['type', 'kind']);
  const categoryIdx = findIndex(['category']);
  const dateIdx = findIndex(['date']);
  const paymentIdx = findIndex(['payment', 'method']);
  const descIdx = findIndex(['description', 'note', 'memo']);

  if (nameIdx === -1 || amountIdx === -1) {
    return {
      transactions: [],
      errors: ['CSV header must include at least "Name" and "Amount" columns.'],
    };
  }

  const imported: Omit<Transaction, 'id' | 'createdAt'>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const rowNum = i + 1;

    const name = (cols[nameIdx] || '').trim();
    const rawAmount = (cols[amountIdx] || '').replace(/[^0-9.-]/g, '');
    const amount = Number.parseFloat(rawAmount);

    if (!name) {
      errors.push(`Row ${rowNum}: Missing transaction name.`);
      continue;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`Row ${rowNum}: Invalid amount "${cols[amountIdx] || ''}".`);
      continue;
    }

    const rawType = (typeIdx !== -1 ? cols[typeIdx] : 'expense').toLowerCase().trim();
    const type: TransactionType = rawType === 'income' ? 'income' : 'expense';

    const category =
      (categoryIdx !== -1 && cols[categoryIdx]?.trim()) || 'Other';

    const rawDate = dateIdx !== -1 ? cols[dateIdx] : '';
    const date = rawDate ? normalizeDate(rawDate) : toISODate(new Date());
    if (!date) {
      errors.push(`Row ${rowNum}: Invalid date "${rawDate}".`);
      continue;
    }

    const paymentMethod =
      (paymentIdx !== -1 && cols[paymentIdx]?.trim()) || 'UPI';
    const description =
      descIdx !== -1 && cols[descIdx]?.trim() ? cols[descIdx].trim() : undefined;

    imported.push({
      name,
      amount: Math.round(amount * 100) / 100,
      type,
      category,
      date,
      paymentMethod,
      description,
      isDemo: false,
    });
  }

  return { transactions: imported, errors };
}
