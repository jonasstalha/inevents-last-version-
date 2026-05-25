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

function generateHTMLInvoice(
  order: OrderForInvoice,
  artist: ArtistForInvoice,
  images: ResolvedInvoiceImages = {},
): string {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const clientInfo = order.clientInfo || order.personalInfo;
  const items = order.items || order.ticketQuantities || [];

  const itemRows = items
    .map(item => {
      const isTicketItem = 'type' in item;
      const title = isTicketItem ? (item as any).type || 'Item' : (item as any).title || 'Item';
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const total = qty * price;
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${title}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${price.toFixed(2)} MAD</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${total.toFixed(2)} MAD</td>
      </tr>
    `;
    })
    .join('');

  const serviceDetails = order.customization
    ? `
    <div style="margin-top: 30px;">
      <h3 style="color: #6366f1; font-size: 16px; margin-bottom: 12px;">Service Details</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${order.customization.eventDate ? `<p style="margin: 0;"><strong>Event Date:</strong> ${order.customization.eventDate}</p>` : ''}
        ${order.customization.eventTime ? `<p style="margin: 0;"><strong>Event Time:</strong> ${order.customization.eventTime}</p>` : ''}
        ${order.customization.location ? `<p style="margin: 0;"><strong>Location:</strong> ${order.customization.location}</p>` : ''}
        ${order.customization.guestCount ? `<p style="margin: 0;"><strong>Expected Guests:</strong> ${order.customization.guestCount}</p>` : ''}
        ${order.customization.duration ? `<p style="margin: 0;"><strong>Duration:</strong> ${order.customization.duration}</p>` : ''}
      </div>
    </div>
  `
    : '';

  const logoHtml = images.logo ? buildImageTag(images.logo, 'Invoice Logo') : '';
  const coverHtml = images.cover ? `<div style="margin-bottom: 24px;">${buildImageTag(images.cover, 'Cover Image')}</div>` : '';
  const avatarHtml = images.avatar ? `<div style="margin-top: 12px;">${buildImageTag(images.avatar, 'Artist Avatar')}</div>` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1a1a1a;
            background: #fff;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #6366f1;
          }
          .invoice-meta {
            text-align: right;
            color: #6b7280;
          }
          .section-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b7280;
            margin-bottom: 16px;
          }
          .addresses {
            display: flex;
            gap: 40px;
            margin-bottom: 40px;
          }
          .address-block h4 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #374151;
          }
          .address-block p {
            margin: 4px 0;
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            text-align: left;
            padding: 12px;
            background: #f3f4f6;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #374151;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .total-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .total-box {
            width: 250px;
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .grand-total {
            font-size: 20px;
            font-weight: bold;
            color: #6366f1;
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            margin-top: 8px;
          }
          .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${coverHtml}
          <div class="header">
            <div>
              <div class="logo">INVOICE</div>
              <div style="margin-top: 8px; color: #374151; font-size: 14px;">${getInvoiceTitle(order)}</div>
            </div>
            <div class="invoice-meta">
              <p><strong>Invoice #:</strong> ${order.id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Date:</strong> ${orderDate}</p>
              ${logoHtml}
            </div>
          </div>

          <div class="addresses">
            <div class="address-block" style="flex: 1;">
              <h4>Bill To</h4>
              ${clientInfo ? `
                <p><strong>${clientInfo.fullName}</strong></p>
                <p>${clientInfo.email}</p>
                <p>${clientInfo.phone}</p>
                ${clientInfo.address ? `<p>${clientInfo.address}</p>` : ''}
                <p>${[clientInfo.city, clientInfo.country].filter(Boolean).join(', ')}</p>
              ` : '<p>Client information not available</p>'}
            </div>
            <div class="address-block" style="flex: 1; text-align: right;">
              <h4>From</h4>
              <p><strong>${artist.businessName || artist.name || 'Service Provider'}</strong></p>
              ${artist.address ? `<p>${artist.address}</p>` : ''}
              <p>${[artist.city, artist.country].filter(Boolean).join(', ')}</p>
              ${artist.email ? `<p>${artist.email}</p>` : ''}
              ${artist.phone ? `<p>${artist.phone}</p>` : ''}
              ${artist.taxId ? `<p>Tax ID: ${artist.taxId}</p>` : ''}
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
                <span>${order.totalPrice.toFixed(2)} MAD</span>
              </div>
              <div class="total-row grand-total">
                <span>Total:</span>
                <span>${order.totalPrice.toFixed(2)} MAD</span>
              </div>
            </div>
          </div>

          ${serviceDetails}

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Invoice generated on ${new Date().toLocaleDateString()}</p>
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
      artistName: artist.name,
      title: order.serviceName || order.ticketName || order.gigTitle || '',
      amount: order.totalPrice,
      currency: 'MAD',
      status: 'issued',
      downloadURL,
      autoGenerated: true,
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
