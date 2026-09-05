/**
 * CSV Parsing, Schema Validation & Column Remapping Utility for 3-Way Reconciliation.
 */

export const STREAM_SCHEMAS = {
  invoices: {
    key: "invoices",
    title: "Invoices CSV",
    description: "Internal billing & sales invoices issued to customers",
    requiredFields: [
      {
        key: "invoice_id",
        label: "Invoice ID",
        desc: "Unique invoice identifier",
        examples: "INV0001, INV-1002",
        synonyms: ["invoice_id", "invoice_no", "invoiceno", "inv_id", "inv_no", "invoicenumber", "bill_no", "bill_id", "id", "doc_number"]
      },
      {
        key: "invoice_date",
        label: "Invoice Date",
        desc: "Date the invoice was raised",
        examples: "2026-08-08, 08/08/2026",
        synonyms: ["invoice_date", "invoicedate", "date", "inv_date", "issue_date", "created_at", "bill_date", "txn_date"]
      },
      {
        key: "customer",
        label: "Customer / Entity Name",
        desc: "Purchasing entity or merchant name",
        examples: "Acme Corp Pvt Ltd, XYZ Tech",
        synonyms: ["customer", "customer_name", "customername", "client", "client_name", "buyer", "party", "party_name", "merchant", "name", "account_name"]
      },
      {
        key: "amount",
        label: "Invoice Amount (₹)",
        desc: "Gross invoice billing amount in ₹",
        examples: "28227.90, ₹50,000",
        synonyms: ["amount", "invoice_amount", "gross_amount", "total", "total_amount", "value", "bill_amount", "net_amount", "sum"]
      },
      {
        key: "reference",
        label: "Reference Identifier",
        desc: "Order ID or transaction reference string",
        examples: "REF0001, ORD-99201",
        synonyms: ["reference", "reference_no", "referenceno", "ref", "ref_no", "order_id", "order_no", "po_number", "ponumber", "transaction_ref", "ref_id"]
      }
    ]
  },
  payments: {
    key: "payments",
    title: "Payment Gateway CSV",
    description: "Payment gateway transaction captures and auth logs",
    requiredFields: [
      {
        key: "payment_id",
        label: "Payment ID",
        desc: "Unique gateway payment transaction ID",
        examples: "PAY0001, pay_12345",
        synonyms: ["payment_id", "paymentid", "pay_id", "id", "transaction_id", "txn_id", "gateway_id", "razorpay_payment_id"]
      },
      {
        key: "date",
        label: "Payment Date",
        desc: "Payment capture or authorization date",
        examples: "2026-08-08",
        synonyms: ["date", "payment_date", "paymentdate", "paid_at", "captured_at", "created_at", "txn_date", "auth_date"]
      },
      {
        key: "customer",
        label: "Customer Name",
        desc: "Payer or customer name on gateway",
        examples: "Acme Corp, XYZ Tech",
        synonyms: ["customer", "customer_name", "customername", "payer_name", "payer", "client", "name", "party"]
      },
      {
        key: "amount",
        label: "Payment Amount (₹)",
        desc: "Payment amount captured in ₹",
        examples: "28227.90, ₹50,000",
        synonyms: ["amount", "payment_amount", "paid_amount", "captured_amount", "value", "total", "gross_amount"]
      },
      {
        key: "reference",
        label: "Reference Identifier",
        desc: "Order ID or merchant reference code",
        examples: "REF0001, ORD-99201",
        synonyms: ["reference", "reference_no", "referenceno", "ref", "ref_no", "order_id", "merchant_reference", "ref_id", "order_no"]
      },
      {
        key: "status",
        label: "Payment Status",
        desc: "Payment state (captured, success, etc.)",
        examples: "captured, success, settled",
        synonyms: ["status", "payment_status", "paymentstatus", "state", "txn_status"]
      }
    ]
  },
  bank_transactions: {
    key: "bank_transactions",
    title: "Bank Transactions CSV",
    description: "Bank settlement account statement credits",
    requiredFields: [
      {
        key: "transaction_id",
        label: "Transaction ID / UTR",
        desc: "Unique bank reference or UTR number",
        examples: "TXN0001, UTR99201",
        synonyms: ["transaction_id", "transactionid", "txn_id", "utr", "bank_ref", "id", "trans_id", "reference_no", "bank_reference"]
      },
      {
        key: "date",
        label: "Settlement Date",
        desc: "Bank credit settlement date",
        examples: "2026-08-09",
        synonyms: ["date", "settlement_date", "value_date", "posting_date", "txn_date", "credit_date", "bank_date"]
      },
      {
        key: "description",
        label: "Narration / Description",
        desc: "Bank transaction narration / customer note",
        examples: "Settlement Acme Corp, NEFT Credit",
        synonyms: ["description", "narration", "particulars", "remarks", "memo", "details", "transaction_description"]
      },
      {
        key: "amount",
        label: "Settlement Amount (₹)",
        desc: "Net bank deposit amount in ₹",
        examples: "27560.43, ₹48,820",
        synonyms: ["amount", "credit_amount", "deposit_amount", "net_amount", "value", "total", "credit", "amount_inr"]
      },
      {
        key: "reference",
        label: "Reference Identifier",
        desc: "Reference tag extracted from narration or column",
        examples: "REF0001, ORD-99201",
        synonyms: ["reference", "reference_no", "referenceno", "ref", "ref_no", "order_id", "utr_ref", "reference_id"]
      }
    ]
  }
};

/**
 * Robust CSV line splitter that handles quotes with commas.
 */
export function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses raw CSV file text into headers and preview data rows.
 */
export async function parseCsvFileHeaderAndRows(file, maxRows = 5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result || '';
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length === 0) {
          return resolve({ headers: [], rows: [], rawText: text, totalRows: 0 });
        }

        const headers = splitCsvLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
        const rows = [];
        for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
          const vals = splitCsvLine(lines[i]).map(v => v.replace(/^["']|["']$/g, '').trim());
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = vals[idx] !== undefined ? vals[idx] : '';
          });
          rows.push(rowObj);
        }

        resolve({
          headers,
          rows,
          rawText: text,
          totalRows: lines.length - 1
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Automatically computes best-guess column mapping for a stream type.
 */
export function computeAutoMapping(detectedHeaders, streamType) {
  const schema = STREAM_SCHEMAS[streamType];
  if (!schema) return {};

  const normalizedDetected = detectedHeaders.map(h => ({
    original: h,
    cleaned: h.toLowerCase().replace(/[^a-z0-9]/g, '')
  }));

  const mapping = {};

  schema.requiredFields.forEach(field => {
    // 1. Check exact match
    const exact = detectedHeaders.find(h => h.toLowerCase() === field.key.toLowerCase());
    if (exact) {
      mapping[field.key] = exact;
      return;
    }

    // 2. Check synonyms
    const cleanSynonyms = field.synonyms.map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const matched = normalizedDetected.find(d => cleanSynonyms.includes(d.cleaned));
    if (matched) {
      mapping[field.key] = matched.original;
      return;
    }

    // 3. Check partial substring
    const partial = normalizedDetected.find(d => 
      cleanSynonyms.some(s => d.cleaned.includes(s) || s.includes(d.cleaned))
    );
    if (partial) {
      mapping[field.key] = partial.original;
      return;
    }

    // Fallback: unmapped
    mapping[field.key] = '';
  });

  return mapping;
}

/**
 * Validates whether all required schema fields are mapped to valid CSV headers.
 */
export function validateMapping(streamType, mapping, detectedHeaders) {
  const schema = STREAM_SCHEMAS[streamType];
  if (!schema) return { isValid: true, missingFields: [], isExactMatch: true, hasCustomHeaders: false };

  const missingFields = [];
  let exactMatchCount = 0;

  schema.requiredFields.forEach(field => {
    const mappedHeader = mapping[field.key];
    if (!mappedHeader || !detectedHeaders.includes(mappedHeader)) {
      missingFields.push(field);
    } else if (mappedHeader.toLowerCase() === field.key.toLowerCase()) {
      exactMatchCount++;
    }
  });

  const isExactMatch = exactMatchCount === schema.requiredFields.length;
  const hasCustomHeaders = !isExactMatch && missingFields.length === 0;

  return {
    isValid: missingFields.length === 0,
    missingFields,
    totalRequired: schema.requiredFields.length,
    mappedCount: schema.requiredFields.length - missingFields.length,
    isExactMatch,
    hasCustomHeaders
  };
}

/**
 * Transforms raw CSV file text client-side according to the chosen mapping,
 * creating a new standard File object ready for backend ingestion.
 */
export function transformCsvWithMapping(rawCsvText, mapping, originalFileName) {
  if (!rawCsvText) return null;
  const lines = rawCsvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return null;

  const originalHeaders = splitCsvLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
  const headerIndices = {};
  originalHeaders.forEach((h, idx) => {
    headerIndices[h] = idx;
    headerIndices[h.toLowerCase()] = idx;
  });

  // Standard target headers (e.g. invoice_id, invoice_date, customer, amount, reference)
  const targetFields = Object.keys(mapping).filter(k => mapping[k]);
  const newHeaderLine = targetFields.join(',');

  const newLines = [newHeaderLine];

  for (let i = 1; i < lines.length; i++) {
    const rawVals = splitCsvLine(lines[i]);
    const rowVals = targetFields.map(targetField => {
      const sourceHeader = mapping[targetField];
      let colIdx = headerIndices[sourceHeader];
      if (colIdx === undefined && sourceHeader) {
        colIdx = headerIndices[sourceHeader.toLowerCase()];
      }
      let val = (colIdx !== undefined && rawVals[colIdx] !== undefined) ? rawVals[colIdx] : '';
      
      // Default fallback for status if not present
      if (targetField === 'status' && !val) {
        val = 'captured';
      }

      // Escape quotes if needed
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });

    newLines.push(rowVals.join(','));
  }

  const transformedContent = newLines.join('\n');
  const blob = new Blob([transformedContent], { type: 'text/csv;charset=utf-8;' });
  return new File([blob], originalFileName, { type: 'text/csv' });
}
