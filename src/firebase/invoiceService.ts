import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebaseConfig';
import { createInvoicePdf } from './pdfService';
import { Order, Invoice } from '../models/types';
import { getOrderById } from './orderService';

const TAX_RATE = 0.20;
const CURRENCY = 'MAD';

const formatCurrency = (value: number) => Number(value.toFixed(2));

const generateInvoiceNumber = (): string => {
  const prefix = 'INV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export async function getInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
  const invoiceRef = doc(db, 'invoices', orderId);
  const invoiceSnap = await getDoc(invoiceRef);
  if (!invoiceSnap.exists()) return null;
  return { id: invoiceSnap.id, ...(invoiceSnap.data() as Invoice) };
}

export async function uploadInvoicePdfFile(invoiceId: string, localUri: string): Promise<string> {
  const fileResponse = await fetch(localUri);
  const fileBlob = await fileResponse.blob();
  const storageRef = ref(storage, `invoices/${invoiceId}.pdf`);
  await uploadBytes(storageRef, fileBlob, { contentType: 'application/pdf' });
  return getDownloadURL(storageRef);
}

export async function createInvoiceForOrder(order: Order): Promise<Invoice> {
  const existing = await getInvoiceByOrderId(order.id);
  if (existing) {
    return existing;
  }

  const subtotal = formatCurrency(order.totalPrice || 0);
  const taxes = formatCurrency(subtotal * TAX_RATE);
  const total = formatCurrency(subtotal + taxes);
  const invoiceNumber = generateInvoiceNumber();

  const invoiceRef = doc(db, 'invoices', order.id);
  const invoice: Invoice = {
    id: invoiceRef.id,
    orderId: order.id,
    clientId: order.clientId,
    artistId: order.artistId,
    invoiceNumber,
    subtotal,
    taxes,
    total,
    currency: CURRENCY,
    pdfUrl: '',
    createdAt: new Date().toISOString(),
  };

  await setDoc(invoiceRef, {
    ...invoice,
    pdfUrl: '',
    createdAt: serverTimestamp(),
  });

  const htmlFileUri = await createInvoicePdf(order, invoice);
  const pdfUrl = await uploadInvoicePdfFile(invoiceRef.id, htmlFileUri);

  await updateDoc(invoiceRef, {
    pdfUrl,
    updatedAt: serverTimestamp(),
  });

  await updateOrderInvoiceReference(order.id, invoiceRef.id);

  return { ...invoice, pdfUrl };
}

async function updateOrderInvoiceReference(orderId: string, invoiceId: string) {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    invoiceId,
    updatedAt: serverTimestamp(),
  });
}
