import * as Print from 'expo-print';
import { Order, Invoice } from '../models/types';

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildInvoiceHtml(order: Order, invoice: Invoice): string {
  const dueDate = formatDate(invoice.createdAt);
  const orderDate = formatDate(order.createdAt);
  const clientName = order.clientName || 'Client';
  const artistName = order.artistName || 'Artist';
  const serviceTitle = order.serviceTitle || 'Service Booking';
  const notes = order.notes || 'No additional notes provided.';
  const attachmentsText = order.attachments?.length
    ? order.attachments.map((item) => `<li>${item}</li>`).join('')
    : '<li>None</li>';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; margin: 0; padding: 32px; background: #f8fafc; }
      .container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 24px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08); overflow: hidden; }
      .header { padding: 32px; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; }
      .brand { font-size: 28px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; }
      .meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
      .meta-block { min-width: 180px; }
      .meta-block h4 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.85); }
      .meta-block p { margin: 0; font-size: 16px; color: rgba(255,255,255,0.95); }
      .section { padding: 32px; }
      .section-title { font-size: 14px; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
      .grid { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .card { flex: 1 1 240px; background: #eef2ff; border-radius: 16px; padding: 20px; }
      .card h4 { margin: 0 0 8px 0; font-size: 12px; color: #4338ca; text-transform: uppercase; letter-spacing: 1px; }
      .card p { margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6; }
      table { width: 100%; border-spacing: 0; margin-top: 24px; }
      th, td { padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
      th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; }
      .total-row td { font-weight: 700; }
      .total-label { color: #374151; }
      .footer { padding: 24px 32px; background: #f8fafc; color: #6b7280; font-size: 12px; line-height: 1.7; }
      .footer strong { color: #111827; }
      .notes { margin-top: 24px; font-size: 14px; color: #374151; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="brand">InEvents</div>
        <div class="meta">
          <div class="meta-block">
            <h4>Invoice</h4>
            <p>${invoice.invoiceNumber}</p>
          </div>
          <div class="meta-block">
            <h4>Issue date</h4>
            <p>${orderDate}</p>
          </div>
          <div class="meta-block">
            <h4>Due date</h4>
            <p>${dueDate}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="grid">
          <div class="card">
            <h4>Bill to</h4>
            <p><strong>${clientName}</strong></p>
            <p>${order.clientPhoto || 'Client'}</p>
          </div>
          <div class="card">
            <h4>From</h4>
            <p><strong>${artistName}</strong></p>
            <p>InEvents</p>
          </div>
          <div class="card">
            <h4>Service</h4>
            <p>${serviceTitle}</p>
            <p>${order.serviceCategory || 'Event Service'}</p>
          </div>
        </div>

        <div class="section-title">Details</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${serviceTitle}</td>
              <td>1</td>
              <td>${invoice.currency}</td>
              <td>${invoice.subtotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="grid" style="margin-top: 18px; gap: 12px;">
          <div class="card" style="flex: 2 1 320px;">
            <h4>Remarks</h4>
            <p>${notes}</p>
          </div>
          <div class="card" style="flex: 1 1 240px;">
            <h4>Amount summary</h4>
            <p class="total-row"><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)} ${invoice.currency}</span></p>
            <p class="total-row"><span>Taxes</span><span>${invoice.taxes.toFixed(2)} ${invoice.currency}</span></p>
            <p class="total-row" style="margin-top: 12px;"><span class="total-label">Total</span><span>${invoice.total.toFixed(2)} ${invoice.currency}</span></p>
          </div>
        </div>
      </div>

      <div class="footer">
        <strong>Payment status:</strong> ${order.paymentStatus?.toUpperCase() || 'UNPAID'}<br />
        <strong>Reference:</strong> ${order.id.slice(0, 8).toUpperCase()}<br />
        <strong>QR / Reference:</strong> ${invoice.invoiceNumber}
      </div>
    </div>
  </body>
</html>`;
}

export async function createInvoicePdf(order: Order, invoice: Invoice): Promise<string> {
  const html = buildInvoiceHtml(order, invoice);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}
