(async () => {
  try {
    const { fetchAllServices, fetchAllTickets } = require('./src/firebase/clientTicketsService');
    console.log('Fetching services...');
    const services = await fetchAllServices();
    console.log('Services count:', Array.isArray(services) ? services.length : typeof services);
    if (Array.isArray(services) && services.length > 0) {
      console.log('Service[0] keys:', Object.keys(services[0]));
      console.log('Service[0] sample:', JSON.stringify(services[0], null, 2).slice(0, 1000));
    }

    console.log('\nFetching tickets...');
    const tickets = await fetchAllTickets();
    console.log('Tickets count:', Array.isArray(tickets) ? tickets.length : typeof tickets);
    if (Array.isArray(tickets) && tickets.length > 0) {
      console.log('Ticket[0] keys:', Object.keys(tickets[0]));
      console.log('Ticket[0] sample:', JSON.stringify(tickets[0], null, 2).slice(0, 1000));
    }
  } catch (err) {
    console.error('Error debugging fetch:', err);
  }
})();
