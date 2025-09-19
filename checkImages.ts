// Create test script for debug
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import app from './src/firebase/firebaseConfig.ts';

async function checkServicesImages() {
  console.log('🔄 Starting service image check...');
  
  try {
    const db = getFirestore(app);
    console.log('✅ Firebase initialized');
    
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    console.log(`👥 Found ${usersSnap.docs.length} users`);
    
    // Tracking variables
    const services: any[] = [];
    let servicesWithImages = 0;
    let servicesWithValidImages = 0;
    
    // Process each user
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const servicesRef = collection(db, 'users', userId, 'services');
      const servicesSnap = await getDocs(servicesRef);
      
      console.log(`\n👤 User ${userId}: ${servicesSnap.docs.length} services`);
      
      // Process each service
      servicesSnap.docs.forEach(serviceDoc => {
        const serviceData = serviceDoc.data();
        const serviceId = serviceDoc.id;
        
        console.log(`\n📋 Service: ${serviceData.title || 'Untitled'} (ID: ${serviceId})`);
        
        // Check for images array
        if (serviceData.images && Array.isArray(serviceData.images) && serviceData.images.length > 0) {
          servicesWithImages++;
          console.log(`  📷 Images array (${serviceData.images.length}):`);
          
          // Check each image
          const validImages: string[] = [];
          
          serviceData.images.forEach((img: any, idx: number) => {
            if (typeof img === 'string') {
              console.log(`    [${idx}] ${img}`);
              
              // Check if it's a valid web URL
              if (img.startsWith('http://') || img.startsWith('https://')) {
                validImages.push(img);
              }
              // Check if it's a Firebase Storage URL without protocol
              else if (img.includes('firebasestorage.googleapis.com')) {
                validImages.push(`https://${img}`);
                console.log(`      ⚠️ Fixed Firebase URL: https://${img}`);
              }
              // Flag local paths that won't work
              else if (img.startsWith('file://') || img.startsWith('/') || img.includes('ExperienceData')) {
                console.log(`      ❌ Local file path - won't work on web`);
              }
              else {
                console.log(`      ❓ Unknown format`);
              }
            } else {
              console.log(`    [${idx}] Invalid type: ${typeof img}`);
            }
          });
          
          if (validImages.length > 0) {
            servicesWithValidImages++;
            console.log(`  ✅ Found ${validImages.length} valid web images`);
          } else {
            console.log(`  ❌ No valid web images in the array`);
          }
          
        } else {
          console.log(`  ❌ No images array found`);
        }
        
        // Check single image field
        if (serviceData.image) {
          console.log(`  🖼️ Single image field: ${serviceData.image}`);
          
          if (typeof serviceData.image === 'string') {
            if (serviceData.image.startsWith('http')) {
              console.log(`    ✅ Valid web URL`);
              if (!serviceData.images || !serviceData.images.length) {
                servicesWithValidImages++;
              }
            } else if (serviceData.image.includes('firebasestorage.googleapis.com')) {
              console.log(`    ⚠️ Firebase URL without protocol - should be fixed`);
              if (!serviceData.images || !serviceData.images.length) {
                servicesWithValidImages++;
              }
            } else {
              console.log(`    ❌ Not a valid web URL`);
            }
          } else {
            console.log(`    ❌ Not a string: ${typeof serviceData.image}`);
          }
        }
        
        // Add to our services array
        services.push({
          id: serviceId,
          userId,
          title: serviceData.title,
          hasImagesArray: !!(serviceData.images && Array.isArray(serviceData.images) && serviceData.images.length > 0),
          hasSingleImage: !!serviceData.image
        });
      });
    }
    
    // Print summary
    console.log('\n==================================');
    console.log(`📊 Total services: ${services.length}`);
    console.log(`📷 Services with images array: ${servicesWithImages} (${Math.round(servicesWithImages/services.length*100)}%)`);
    console.log(`✅ Services with valid web images: ${servicesWithValidImages} (${Math.round(servicesWithValidImages/services.length*100)}%)`);
    
  } catch (error) {
    console.error('❌ Error checking services:', error);
  }
}

// Run the check
checkServicesImages().catch(console.error);
