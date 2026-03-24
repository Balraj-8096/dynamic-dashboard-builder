// Auto-converted from accounting-config.json
export const ACCOUNTING_SCHEMA_CONFIG = {
  "product": {
    "slug": "accounting",
    "display_name": "Accounting",
    "version": "1.0.0"
  },
  "connection": {
    "type": "",
    "host": "",
    "database": "",
    "username": "",
    "password": ""
  },

  "global_filter_dimensions": [
    { "type": "site", "entity": "invoice",  "field": "site_id",      "label": "Site"          },
    { "type": "date", "entity": "invoice",  "field": "invoice_date", "label": "Invoice Date"  },
    { "type": "date", "entity": "payment",  "field": "payment_date", "label": "Payment Date"  }
  ],

  "joins": [
    {
      "name": "invoice_to_invoice_line",
      "from": { "entity": "invoice",            "column": "id"           },
      "to":   { "entity": "invoice_line",       "column": "invoiceid"    },
      "type": "INNER"
    },
    {
      "name": "invoice_to_payment_allocation",
      "from": { "entity": "invoice",            "column": "id"           },
      "to":   { "entity": "payment_allocation", "column": "invoiceid"    },
      "type": "LEFT"
    },
    {
      "name": "payment_allocation_to_payment",
      "from": { "entity": "payment_allocation", "column": "paymentid"    },
      "to":   { "entity": "payment",            "column": "id"           },
      "type": "INNER"
    },
    {
      "name": "invoice_to_claim",
      "from": { "entity": "invoice",            "column": "id"           },
      "to":   { "entity": "claim",              "column": "invoiceid"    },
      "type": "LEFT"
    },
    {
      "name": "claim_to_payer",
      "from": { "entity": "claim",              "column": "payerid"      },
      "to":   { "entity": "payer",              "column": "id"           },
      "type": "INNER"
    }
  ],

  "entities": [
    {
      "name": "invoice",
      "schema": "accounting",
      "table": "invoice",
      "is_view": false,
      "display_field": "invoice_number",
      "default_date_field": "invoice_date",
      "fields": [
        {
          "name": "id",
          "column": "id",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "is_primary_key": true
        },
        {
          "name": "invoice_number",
          "column": "invoicenumber",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "description": "Human-readable invoice reference (e.g. INV-2026-001)"
        },
        {
          "name": "invoice_date",
          "column": "invoicedate",
          "type": "datetime",
          "filterable": true,
          "aggregatable": true,
          "description": "Date the invoice was raised — primary axis for invoicing-activity charts"
        },
        {
          "name": "due_date",
          "column": "duedate",
          "type": "datetime",
          "filterable": true,
          "aggregatable": false,
          "description": "Payment due date — use to identify overdue invoices"
        },
        {
          "name": "status",
          "column": "status",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "status_values": [
            { "value": "draft",    "label": "Draft",    "color": "#6b7280" },
            { "value": "sent",     "label": "Sent",     "color": "#3b82f6" },
            { "value": "paid",     "label": "Paid",     "color": "#22c55e" },
            { "value": "overdue",  "label": "Overdue",  "color": "#ef4444" },
            { "value": "partial",  "label": "Partial",  "color": "#f59e0b" },
            { "value": "void",     "label": "Void",     "color": "#374151" }
          ]
        },
        {
          "name": "total_amount",
          "column": "totalamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Gross invoice total — WARNING: joining through payment_allocation causes fan-out; SUM(total_amount) will be over-counted. Use SUM(payment_allocation.allocated_amount) for payment totals instead"
        },
        {
          "name": "tax_amount",
          "column": "taxamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Tax portion of the total amount"
        },
        {
          "name": "discount_amount",
          "column": "discountamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Discount applied before tax calculation"
        },
        {
          "name": "net_amount",
          "column": "netamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Invoice total minus tax and discount (net_amount = total_amount − tax_amount − discount_amount)"
        },
        {
          "name": "currency_code",
          "column": "currencycode",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "description": "ISO 4217 currency code (e.g. GBP, USD, EUR)"
        },
        {
          "name": "site_id",
          "column": "siteid",
          "type": "string",
          "filterable": true,
          "aggregatable": false
        },
        {
          "name": "invoice_type",
          "column": "invoicetype",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "description": "Category of service billed — use for groupBy and IN/NOT_IN filters",
          "status_values": [
            { "value": "consultation",    "label": "Consultation",     "color": "#3b82f6" },
            { "value": "procedure",       "label": "Procedure",        "color": "#a78bfa" },
            { "value": "package",         "label": "Package",          "color": "#f59e0b" },
            { "value": "nhs",             "label": "NHS",              "color": "#06b6d4" },
            { "value": "insurance_auth",  "label": "Insurance Auth",   "color": "#22c55e" }
          ]
        },
        {
          "name": "write_off_amount",
          "column": "writeoffamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Amount written off as bad debt — NULL for most invoices; only populated when the invoice is partially or fully written off. Use IS_NULL/IS_NOT_NULL to distinguish written-off from normal invoices"
        },
        {
          "name": "is_void",
          "column": "isvoid",
          "type": "boolean",
          "filterable": true,
          "aggregatable": false,
          "description": "True if the invoice has been voided — is_void=true overrides the status field"
        },
        {
          "name": "notes",
          "column": "notes",
          "type": "string",
          "filterable": false,
          "aggregatable": false
        },
        {
          "name": "created_on",
          "column": "createdon",
          "type": "datetime",
          "filterable": true,
          "aggregatable": false
        },
        {
          "name": "last_updated_on",
          "column": "lastupdatedon",
          "type": "datetime",
          "filterable": true,
          "aggregatable": false
        }
      ]
    },

    {
      "name": "invoice_line",
      "schema": "accounting",
      "table": "invoice_line",
      "is_view": false,
      "display_field": "service_code",
      "default_date_field": "service_date",
      "fields": [
        {
          "name": "id",
          "column": "id",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "is_primary_key": true
        },
        {
          "name": "invoice_id",
          "column": "invoiceid",
          "type": "string",
          "filterable": true,
          "aggregatable": true
        },
        {
          "name": "service_code",
          "column": "servicecode",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "description": "Service or procedure code billed on this line item"
        },
        {
          "name": "description",
          "column": "description",
          "type": "string",
          "filterable": false,
          "aggregatable": false
        },
        {
          "name": "quantity",
          "column": "quantity",
          "type": "number",
          "filterable": true,
          "aggregatable": true
        },
        {
          "name": "unit_price",
          "column": "unitprice",
          "type": "number",
          "filterable": true,
          "aggregatable": true
        },
        {
          "name": "line_amount",
          "column": "lineamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Calculated as quantity × unit_price — safe to SUM as it is at line level"
        },
        {
          "name": "tax_rate",
          "column": "taxrate",
          "type": "number",
          "filterable": true,
          "aggregatable": true
        },
        {
          "name": "service_date",
          "column": "servicedate",
          "type": "datetime",
          "filterable": true,
          "aggregatable": true,
          "description": "Date the service was delivered — may differ from invoice.invoice_date when billing is delayed"
        },
        {
          "name": "is_taxable",
          "column": "istaxable",
          "type": "boolean",
          "filterable": true,
          "aggregatable": false,
          "description": "True if this line item is subject to tax"
        },
        {
          "name": "created_on",
          "column": "createdon",
          "type": "datetime",
          "filterable": true,
          "aggregatable": false
        }
      ]
    },

    {
      "name": "payment",
      "schema": "accounting",
      "table": "payment",
      "is_view": false,
      "display_field": "reference",
      "default_date_field": "payment_date",
      "fields": [
        {
          "name": "id",
          "column": "id",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "is_primary_key": true
        },
        {
          "name": "payment_date",
          "column": "paymentdate",
          "type": "datetime",
          "filterable": true,
          "aggregatable": true,
          "description": "Date payment was received — use for cash-flow charts (differs from invoice_date)"
        },
        {
          "name": "payment_method",
          "column": "paymentmethod",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "status_values": [
            { "value": "cash",           "label": "Cash",          "color": "#22c55e" },
            { "value": "card",           "label": "Card",          "color": "#3b82f6" },
            { "value": "bank_transfer",  "label": "Bank Transfer", "color": "#06b6d4" },
            { "value": "insurance",      "label": "Insurance",     "color": "#a78bfa" },
            { "value": "direct_debit",   "label": "Direct Debit",  "color": "#8b5cf6" }
          ]
        },
        {
          "name": "amount",
          "column": "amount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Total payment amount received"
        },
        {
          "name": "status",
          "column": "status",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "status_values": [
            { "value": "pending",  "label": "Pending",  "color": "#f59e0b" },
            { "value": "cleared",  "label": "Cleared",  "color": "#22c55e" },
            { "value": "reversed", "label": "Reversed", "color": "#f97316" },
            { "value": "failed",   "label": "Failed",   "color": "#ef4444" }
          ]
        },
        {
          "name": "reference",
          "column": "reference",
          "type": "string",
          "filterable": false,
          "aggregatable": false,
          "description": "External payment reference or bank transaction ID"
        },
        {
          "name": "site_id",
          "column": "siteid",
          "type": "string",
          "filterable": true,
          "aggregatable": false
        },
        {
          "name": "created_on",
          "column": "createdon",
          "type": "datetime",
          "filterable": true,
          "aggregatable": false
        }
      ]
    },

    {
      "name": "payment_allocation",
      "schema": "accounting",
      "table": "payment_allocation",
      "is_view": false,
      "fields": [
        {
          "name": "payment_id",
          "column": "paymentid",
          "type": "string",
          "filterable": true,
          "aggregatable": true
        },
        {
          "name": "invoice_id",
          "column": "invoiceid",
          "type": "string",
          "filterable": true,
          "aggregatable": true
        },
        {
          "name": "allocated_amount",
          "column": "allocatedamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Portion of the payment applied to this specific invoice — use this for 'amount received per invoice' instead of invoice.total_amount when payment_allocation is joined"
        },
        {
          "name": "allocated_on",
          "column": "allocatedon",
          "type": "datetime",
          "filterable": true,
          "aggregatable": false,
          "description": "Date this portion of the payment was allocated to the invoice"
        }
      ]
    },

    {
      "name": "claim",
      "schema": "accounting",
      "table": "claim",
      "is_view": false,
      "display_field": "claim_number",
      "default_date_field": "submitted_date",
      "fields": [
        {
          "name": "id",
          "column": "id",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "is_primary_key": true
        },
        {
          "name": "invoice_id",
          "column": "invoiceid",
          "type": "string",
          "filterable": true,
          "aggregatable": false
        },
        {
          "name": "claim_number",
          "column": "claimnumber",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "description": "Insurer's claim reference number"
        },
        {
          "name": "payer_id",
          "column": "payerid",
          "type": "string",
          "filterable": true,
          "aggregatable": false
        },
        {
          "name": "submitted_date",
          "column": "submitteddate",
          "type": "datetime",
          "filterable": true,
          "aggregatable": true,
          "description": "Date the claim was submitted to the insurer"
        },
        {
          "name": "status",
          "column": "status",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "status_values": [
            { "value": "submitted", "label": "Submitted", "color": "#3b82f6" },
            { "value": "accepted",  "label": "Accepted",  "color": "#22c55e" },
            { "value": "rejected",  "label": "Rejected",  "color": "#ef4444" },
            { "value": "partial",   "label": "Partial",   "color": "#f59e0b" },
            { "value": "paid",      "label": "Paid",      "color": "#10b981" }
          ]
        },
        {
          "name": "claimed_amount",
          "column": "claimedamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Total amount submitted to the insurer"
        },
        {
          "name": "approved_amount",
          "column": "approvedamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Amount approved by the insurer — approved + rejected should not exceed claimed"
        },
        {
          "name": "rejected_amount",
          "column": "rejectedamount",
          "type": "number",
          "filterable": true,
          "aggregatable": true,
          "description": "Amount rejected by the insurer (claimed_amount − approved_amount)"
        },
        {
          "name": "rejection_reason",
          "column": "rejectionreason",
          "type": "string",
          "filterable": false,
          "aggregatable": false,
          "description": "Insurer's free-text reason for rejection or partial approval"
        },
        {
          "name": "created_on",
          "column": "createdon",
          "type": "datetime",
          "filterable": true,
          "aggregatable": false
        }
      ]
    },

    {
      "name": "payer",
      "schema": "accounting",
      "table": "payer",
      "is_view": false,
      "display_field": "name",
      "fields": [
        {
          "name": "id",
          "column": "id",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "is_primary_key": true
        },
        {
          "name": "name",
          "column": "name",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "description": "Insurance company or organisation name"
        },
        {
          "name": "payer_type",
          "column": "payertype",
          "type": "string",
          "filterable": true,
          "aggregatable": false,
          "status_values": [
            { "value": "insurance",  "label": "Insurance",   "color": "#a78bfa" },
            { "value": "self_pay",   "label": "Self Pay",    "color": "#3b82f6" },
            { "value": "government", "label": "Government",  "color": "#06b6d4" },
            { "value": "corporate",  "label": "Corporate",   "color": "#f59e0b" }
          ]
        },
        {
          "name": "is_active",
          "column": "isactive",
          "type": "boolean",
          "filterable": true,
          "aggregatable": false,
          "description": "True if this payer is currently active and accepted by the practice"
        },
        {
          "name": "created_on",
          "column": "createdon",
          "type": "datetime",
          "filterable": true,
          "aggregatable": false
        }
      ]
    }
  ]
} as const;
