/**
 * Fix User Statistics and Points
 * This script will retroactively fix your points and statistics based on existing orders
 */

import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import app from './src/firebase/firebaseConfig';
import { awardOrderPoints, awardTicketPoints } from './src/firebase/rewardsService';
import { recalculateUserStatistics } from './src/firebase/userStatsService';

const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Fix user statistics and award missing points for existing orders
 */
export const fixUserStatisticsAndPoints = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently authenticated');
    return;
  }

  const userId = currentUser.uid;
  console.log(`🔧 Fixing statistics and points for user: ${currentUser.email} (${userId})`);
  console.log('');

  try {
    // 1. Get all user's orders
    console.log('📦 Scanning existing orders...');
    const userOrdersRef = collection(db, 'users', userId, 'orders');
    const userOrdersSnapshot = await getDocs(userOrdersRef);
    const orders = userOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    console.log(`Found ${orders.length} total orders`);
    
    // 2. Get all user's tickets
    console.log('🎫 Scanning existing tickets...');
    const userTicketsRef = collection(db, 'users', userId, 'tickets');
    const userTicketsSnapshot = await getDocs(userTicketsRef);
    const tickets = userTicketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    console.log(`Found ${tickets.length} total tickets`);
    console.log('');

    // 3. Award points for existing orders
    console.log('💰 Awarding points for existing orders...');
    let totalPointsAwarded = 0;
    
    for (const order of orders) {
      if (order.status === 'confirmed' || order.status === 'completed') {
        try {
          const orderAmount = parseFloat(order.totalPrice || order.total || '0') || 0;
          
          // Award points for the order using proper rewards service
          await awardOrderPoints(
            userId, 
            order.id, 
            orderAmount
          );
          
          console.log(`   ✅ Awarded points for order: ${order.ticketName} (${orderAmount} MAD)`);
          totalPointsAwarded += 50; // Standard order points
          
        } catch (error) {
          console.error(`   ❌ Failed to award points for order ${order.id}:`, error);
        }
      }
    }

    // 4. Award points for existing tickets
    console.log('🎫 Awarding points for existing tickets...');
    
    for (const ticket of tickets) {
      try {
        const ticketPrice = parseFloat(ticket.price || '0') || 0;
        
        // Award points for the ticket using proper rewards service
        await awardTicketPoints(
          userId, 
          ticket.id, 
          ticketPrice,
          ticket.eventName || ticket.ticketName || 'Event Ticket'
        );
        
        console.log(`   ✅ Awarded points for ticket: ${ticket.eventName || ticket.ticketName}`);
        totalPointsAwarded += 25; // Standard ticket points
        
      } catch (error) {
        console.error(`   ❌ Failed to award points for ticket ${ticket.id}:`, error);
      }
    }

    console.log('');
    console.log(`💎 Total points awarded: ${totalPointsAwarded}`);
    console.log('');

    // 5. Recalculate statistics
    console.log('📊 Recalculating user statistics...');
    const updatedStats = await recalculateUserStatistics(userId);
    
    console.log('✅ Statistics fixed successfully!');
    console.log('');
    console.log('📈 Updated Statistics:');
    console.log(`   📦 Orders: ${updatedStats.orders}`);
    console.log(`   🎫 Tickets: ${updatedStats.tickets}`);
    console.log(`   ⭐ Points: ${updatedStats.points}`);
    console.log(`   💰 Total Spent: ${updatedStats.totalSpent} MAD`);
    console.log(`   🏆 Level: ${updatedStats.level} - ${updatedStats.levelName}`);
    console.log('');
    
    return {
      ordersProcessed: orders.length,
      ticketsProcessed: tickets.length,
      pointsAwarded: totalPointsAwarded,
      finalStats: updatedStats
    };
    
  } catch (error) {
    console.error('❌ Error fixing user statistics:', error);
    throw error;
  }
};

// Usage example:
console.log('🚀 To fix your user statistics and points, run this in your app:');
console.log('');
console.log('import { fixUserStatisticsAndPoints } from "./fixUserStats";');
console.log('');
console.log('// In your component or when the app loads:');
console.log('fixUserStatisticsAndPoints().then(result => {');
console.log('  console.log("Fix completed!", result);');
console.log('  // Refresh your profile screen to see updated stats');
console.log('});');