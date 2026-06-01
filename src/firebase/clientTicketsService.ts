import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import { Ticket } from '../models/types';
import app from './firebaseConfig';

const getMainItemsTotal = (serviceData: any): number => {
  if (!Array.isArray(serviceData?.items) || serviceData.items.length === 0) {
    return Number(serviceData?.price ?? serviceData?.basePrice ?? 0) || 0;
  }

  const total = serviceData.items.reduce((sum: number, item: any) => {
    const itemPrice = Number(item?.price ?? 0);
    return sum + (Number.isFinite(itemPrice) ? itemPrice : 0);
  }, 0);

  return total > 0 ? total : Number(serviceData?.price ?? serviceData?.basePrice ?? 0) || 0;
};

// Fetch all tickets from all users (for client view)
export const fetchAllTickets = async (): Promise<Ticket[]> => {
  const db = getFirestore(app);
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  const allTickets: Ticket[] = [];
  for (const userDoc of usersSnap.docs) {
    const ticketsRef = collection(db, 'users', userDoc.id, 'tickets');
    const ticketsSnap = await getDocs(query(ticketsRef, orderBy('createdAt', 'desc')));
    ticketsSnap.forEach(ticketDoc => {
      allTickets.push({ id: ticketDoc.id, ...ticketDoc.data(), artistId: userDoc.id } as Ticket);
    });
  }
  return allTickets;
};

// Fetch a specific ticket by ID
export const fetchTicketById = async (ticketId: string): Promise<Ticket | null> => {
  const db = getFirestore(app);
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  
  for (const userDoc of usersSnap.docs) {
    const ticketRef = doc(db, 'users', userDoc.id, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (ticketSnap.exists()) {
      return { id: ticketSnap.id, ...ticketSnap.data(), artistId: userDoc.id } as Ticket;
    }
  }
  
  return null;
};

// Fetch all services from all users (for client view)
export const fetchAllServices = async (): Promise<any[]> => {
  const db = getFirestore(app);
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  const allServices: any[] = [];
  for (const userDoc of usersSnap.docs) {
    const servicesRef = collection(db, 'users', userDoc.id, 'services');
    const servicesSnap = await getDocs(query(servicesRef, orderBy('createdAt', 'desc')));
    servicesSnap.forEach(serviceDoc => {
      const data = serviceDoc.data() as any;
      const normalizeExtrasValue = (value: any): any[] => {
        if (Array.isArray(value)) return value.filter(Boolean);
        if (value && typeof value === 'object') return Object.values(value).filter(Boolean);
        return [];
      };
      const resolveServiceExtras = (serviceData: any): any[] => {
        const candidates = [serviceData?.extras, serviceData?.addOns, serviceData?.extraServices, serviceData?.extraServicesList];
        for (const candidate of candidates) {
          const normalized = normalizeExtrasValue(candidate);
          if (normalized.length > 0) return normalized;
        }
        return normalizeExtrasValue(serviceData?.extras ?? serviceData?.addOns ?? serviceData?.extraServices ?? serviceData?.extraServicesList);
      };

      const extras = resolveServiceExtras(data);
      const normalizedMainItemsTotal = getMainItemsTotal(data);

      allServices.push({
        id: serviceDoc.id,
        ...data,
        price: normalizedMainItemsTotal,
        basePrice: normalizedMainItemsTotal,
        extras,
        addOns: Array.isArray(data.addOns) ? data.addOns : extras,
        extraServices: Array.isArray(data.extraServices) ? data.extraServices : extras,
        artistId: userDoc.id,
      });
    });
  }
  return allServices;
};
