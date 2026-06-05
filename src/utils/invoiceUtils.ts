import { 
  collection, 
  doc, 
  getDoc,
  getFirestore, 
  query as firestoreQuery,
  serverTimestamp,
  setDoc, 
  updateDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import * as Print from 'expo-print';

export interface OrderForInvoice {
  id: string;
  clientId: string;
  artistId: string;
  gigTitle?: string;
  ticketName?: string;
  serviceName?: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  clientInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  items?: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  ticketQuantities?: Array<{
    type: string;
    price: number;
    quantity: number;
  }>;
  customization?: {
    eventDate: string;
    eventTime: string;
    duration: string;
    location: string;
    guestCount: string;
    specificRequests: string;
  };
  artistName?: string;
  type?: 'ticket' | 'service';
}

export interface ArtistForInvoice {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  businessName?: string;
  taxId?: string;
}

interface ResolvedInvoiceImages {
  logo?: string;
  cover?: string;
  avatar?: string;
}

async function imageToDataUri(url?: string): Promise<string> {
  if (!url || !url.startsWith('http')) return '';
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

function buildImageTag(src: string, alt = 'Invoice Image'): string {
  if (!src) return '';
  return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; margin-bottom: 24px; border-radius: 12px;" />`;
}

function getInvoiceTitle(order: OrderForInvoice): string {
  return order.serviceName || order.ticketName || order.gigTitle || 'Invoice';
}

function getPotentialImageUrls(order: OrderForInvoice, artist: ArtistForInvoice) {
  return {
    logo: (artist as any).logoUrl || (artist as any).avatarUrl || (artist as any).image || '',
    cover: (order as any).coverUrl || (order as any).serviceCover || (order as any).serviceImage || (order as any).imageUrl || (order as any).image || '',
    avatar: (artist as any).avatarUrl || (artist as any).profileImage || (artist as any).image || '',
  };
}

function safeText(value: unknown): string {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(value: number): string {
  return `${Number(value || 0).toFixed(2)} MAD`;
}

function buildLineItems(order: OrderForInvoice): Array<{ title: string; quantity: number; price: number }> {
  const mappedItems = Array.isArray(order.items)
    ? order.items.map((it) => ({
        title: it.title || getInvoiceTitle(order),
        quantity: Number(it.quantity || 1),
        price: Number(it.price || 0),
      }))
    : [];

  const ticketItems = Array.isArray(order.ticketQuantities)
    ? order.ticketQuantities.map((it) => ({
        title: it.type || 'Ticket',
        quantity: Number(it.quantity || 1),
        price: Number(it.price || 0),
      }))
    : [];

  const lineItems = mappedItems.length ? mappedItems : ticketItems;
  if (lineItems.length) return lineItems;

  return [
    {
      title: getInvoiceTitle(order),
      quantity: 1,
      price: Number(order.totalPrice || 0),
    },
  ];
}

function generateHTMLInvoice(
  order: OrderForInvoice,
  artist: ArtistForInvoice,
  images: ResolvedInvoiceImages = {},
): string {
  const createdDate = new Date(order.createdAt);
  const orderDate = createdDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const orderTime = createdDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const clientInfo = order.clientInfo || order.personalInfo;
  const lineItems = buildLineItems(order);
  const subtotal = lineItems.reduce((sum, it) => sum + it.quantity * it.price, 0) || Number(order.totalPrice || 0);
  const total = Number(order.totalPrice || subtotal);

  const itemRows = lineItems
    .map((item, idx) => {
      const qty = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const lineTotal = qty * price;
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #0f172a;">
          <div style="font-weight: 600;">${safeText(item.title || 'Item')}</div>
          <div style="font-size: 11px; color: #64748b;">Line ${idx + 1}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #0f172a;">${qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #0f172a;">${formatMoney(price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #0f172a;">${formatMoney(lineTotal)}</td>
      </tr>
    `;
    })
    .join('');

  const serviceDetails = order.customization
    ? `
      <div class="panel" style="margin-top: 18px;">
        <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">Service Details</h3>
        <div class="kv-grid">
          ${order.customization.eventDate ? `<div><span class="k">Event Date</span><span class="v">${safeText(order.customization.eventDate)}</span></div>` : ''}
          ${order.customization.eventTime ? `<div><span class="k">Event Time</span><span class="v">${safeText(order.customization.eventTime)}</span></div>` : ''}
          ${order.customization.location ? `<div><span class="k">Location</span><span class="v">${safeText(order.customization.location)}</span></div>` : ''}
          ${order.customization.guestCount ? `<div><span class="k">Guests</span><span class="v">${safeText(order.customization.guestCount)}</span></div>` : ''}
          ${order.customization.duration ? `<div><span class="k">Duration</span><span class="v">${safeText(order.customization.duration)}</span></div>` : ''}
        </div>
        ${order.customization.specificRequests ? `<p style="margin: 10px 0 0 0; color: #334155;"><strong>Specific Requests:</strong> ${safeText(order.customization.specificRequests)}</p>` : ''}
      </div>
    `
    : '';

  const logoBlock = images.logo
    ? `<img src="${images.logo}" alt="Brand Logo" style="width: 52px; height: 52px; object-fit: cover; border-radius: 12px; border: 1px solid #cbd5e1;" />`
    : `<div style="width: 52px; height: 52px; border-radius: 12px; background: #0f172a; color: #ffffff; font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center;">IE</div>`;
  const coverHtml = images.cover ? `<div style="margin-bottom: 20px;">${buildImageTag(images.cover, 'Order Cover')}</div>` : '';
  const avatarHtml = images.avatar
    ? `<img src="${images.avatar}" alt="Artist Avatar" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; margin-top: 8px;" />`
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 28px;
            color: #111827;
            background: #f8fafc;
          }
          .container {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 14px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 22px;
            background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-title {
            font-size: 19px;
            font-weight: 800;
            line-height: 1.2;
          }
          .brand-sub {
            font-size: 12px;
            color: #cbd5e1;
            margin-top: 2px;
          }
          .invoice-pill {
            text-align: right;
            background: #ffffff;
            color: #0f172a;
            padding: 10px 12px;
            border-radius: 10px;
            min-width: 205px;
          }
          .invoice-pill .line {
            font-size: 12px;
            margin: 2px 0;
          }
          .content {
            padding: 20px 22px 24px;
          }
          .order-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 18px;
            margin-bottom: 16px;
          }
          .order-meta .meta {
            font-size: 12px;
            color: #334155;
          }
          .order-meta .meta span {
            color: #64748b;
            margin-right: 6px;
            font-weight: 600;
          }
          .section-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #475569;
            margin-bottom: 10px;
            font-weight: 700;
          }
          .addresses {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
          }
          .panel {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px;
            background: #ffffff;
          }
          .address-block h4 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #0f172a;
          }
          .address-block p {
            margin: 3px 0;
            font-size: 12px;
            color: #475569;
            line-height: 1.55;
          }
          .kv-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 14px;
          }
          .kv-grid .k {
            display: block;
            font-size: 11px;
            color: #64748b;
          }
          .kv-grid .v {
            display: block;
            font-size: 12px;
            color: #0f172a;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
          }
          th {
            text-align: left;
            padding: 12px;
            background: #f1f5f9;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #334155;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
          }
          .total-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 18px;
          }
          .total-box {
            width: 300px;
            background: #f8fafc;
            padding: 14px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
            color: #334155;
          }
          .grand-total {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            border-top: 2px solid #cbd5e1;
            padding-top: 12px;
            margin-top: 8px;
          }
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            margin-top: 26px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">
              ${logoBlock}
              <div>
                <div class="brand-title">INEVENTS INVOICE</div>
                <div class="brand-sub">${safeText(getInvoiceTitle(order))}</div>
              </div>
            </div>
            <div class="invoice-pill">
              <div class="line"><strong>Invoice #:</strong> INV-${safeText(order.id.substring(0, 8).toUpperCase())}</div>
              <div class="line"><strong>Date:</strong> ${safeText(orderDate)}</div>
              <div class="line"><strong>Time:</strong> ${safeText(orderTime)}</div>
            </div>
          </div>

          <div class="content">
            ${coverHtml}

            <div class="order-meta">
              <div class="meta"><span>Order ID:</span>${safeText(order.id)}</div>
              <div class="meta"><span>Status:</span>${safeText((order.status || 'confirmed').toUpperCase())}</div>
              <div class="meta"><span>Order Type:</span>${safeText((order.type || 'service').toUpperCase())}</div>
              <div class="meta"><span>Client Ref:</span>${safeText(order.clientId || '-')}</div>
            </div>

          <div class="addresses">
            <div class="address-block panel" style="flex: 1;">
              <h4>Bill To</h4>
              ${clientInfo ? `
                <p><strong>${safeText(clientInfo.fullName)}</strong></p>
                ${clientInfo.email ? `<p>${safeText(clientInfo.email)}</p>` : ''}
                ${clientInfo.phone ? `<p>${safeText(clientInfo.phone)}</p>` : ''}
                ${clientInfo.address ? `<p>${safeText(clientInfo.address)}</p>` : ''}
                <p>${safeText([clientInfo.city, clientInfo.country].filter(Boolean).join(', '))}</p>
              ` : '<p>Client information not available</p>'}
            </div>
            <div class="address-block panel" style="flex: 1; text-align: right;">
              <h4>From</h4>
              <p><strong>${safeText(artist.businessName || artist.name || 'Service Provider')}</strong></p>
              ${artist.address ? `<p>${safeText(artist.address)}</p>` : ''}
              <p>${safeText([artist.city, artist.country].filter(Boolean).join(', '))}</p>
              ${artist.email ? `<p>${safeText(artist.email)}</p>` : ''}
              ${artist.phone ? `<p>${safeText(artist.phone)}</p>` : ''}
              ${artist.taxId ? `<p>Tax ID: ${safeText(artist.taxId)}</p>` : ''}
              ${avatarHtml}
            </div>
          </div>

          <div class="section-title">Order Summary</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th>Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-box">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatMoney(subtotal)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Total:</span>
                <span>${formatMoney(total)}</span>
              </div>
            </div>
          </div>

          ${serviceDetails}

          <div class="footer">
            <p>Thank you for your business.</p>
            <p>Generated on ${safeText(new Date().toLocaleDateString())} by InEvents Billing.</p>
          </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function buildInvoiceHtml(order: OrderForInvoice, artist: ArtistForInvoice): Promise<string> {
  const urls = getPotentialImageUrls(order, artist);
  const [logo, cover, avatar] = await Promise.all([
    imageToDataUri(urls.logo),
    imageToDataUri(urls.cover),
    imageToDataUri(urls.avatar),
  ]);
  return generateHTMLInvoice(order, artist, { logo, cover, avatar });
}

async function uploadPdfToStorage(pdfUri: string, destPath: string): Promise<string> {
  const response = await fetch(pdfUri);
  const blob = await response.blob();

  const storage = getStorage();
  const ref = storageRef(storage, destPath);

  await uploadBytes(ref, blob, { contentType: 'application/pdf' });

  // @ts-ignore - RN Blob has a close() method to release memory
  if (typeof (blob as any).close === 'function') (blob as any).close();

  return await getDownloadURL(ref);
}

export async function generateInvoice(
  order: OrderForInvoice,
  artist: ArtistForInvoice
): Promise<string> {
  const html = await buildInvoiceHtml(order, artist);

  try {
    const result = await Print.printToFileAsync({
      html,
      base64: true,
    });

    if (!result.base64) {
      throw new Error('Failed to generate PDF base64');
    }
    return result.base64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function saveInvoiceToStorage(
  order: OrderForInvoice,
  artist: ArtistForInvoice,
  userId: string,
  existingInvoiceId?: string,
): Promise<string> {
  const invoiceId = existingInvoiceId || order.id;
  const invoicePath = `invoices/${userId}/${invoiceId}.pdf`;

  try {
    const html = await buildInvoiceHtml(order, artist);
    const result = await Print.printToFileAsync({ html, base64: false });
    const pdfUri = result.uri;

    if (!pdfUri) {
      throw new Error('Failed to generate PDF file URI');
    }

    const downloadURL = await uploadPdfToStorage(pdfUri, invoicePath);

    const db = getFirestore();
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnapshot = await getDoc(invoiceRef);
    const isCreate = !invoiceSnapshot.exists();

    const invoiceDoc: any = {
      orderId: order.id,
      orderType: order.type || 'service',
      userId,
      clientId: userId,
      artistName: artist.name,
      title: order.serviceName || order.ticketName || order.gigTitle || '',
      amount: order.totalPrice,
      currency: 'MAD',
      status: 'issued',
      downloadURL,
      autoGenerated: true,
      templateVersion: 2,
      invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}`,
      updatedAt: serverTimestamp(),
    };

    if (isCreate) {
      invoiceDoc.createdAt = serverTimestamp();
    }

    await setDoc(invoiceRef, invoiceDoc, { merge: true });

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        invoiceGenerated: true,
        invoiceUrl: downloadURL,
        invoiceId,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Keep invoice creation errors visible, but do not fail if order update is secondary.
    }

    return downloadURL;
  } catch (error) {
    console.error('Error saving invoice:', error);
    throw error;
  }
}

export async function getInvoicesForUser(userId: string): Promise<any[]> {
  try {
    const db = getFirestore();
    const invoicesRef = collection(db, 'invoices');
    const q = firestoreQuery(invoicesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}
