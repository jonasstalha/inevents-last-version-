import { collection, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import { Ticket } from '../models/types';
import app from './firebaseConfig';

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
      allServices.push({ id: serviceDoc.id, ...serviceDoc.data(), artistId: userDoc.id });
    });
  }
  return allServices;
};
