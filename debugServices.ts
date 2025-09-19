// Check services and their images
import { fetchAllServicesFromFirebase } from './src/firebase/fetchAllServices.ts';

async function debugServices() {
  console.log('🔄 Debugging services and images...');
  
  try {
    const services = await fetchAllServicesFromFirebase();
    
    console.log(`📊 Total services: ${services.length}`);
    
    if (services.length > 0) {
      // Show sample of services
      console.log('\n📋 First 3 services:');
      services.slice(0, 3).forEach((service, index) => {
        console.log(`\n[${index + 1}] Service: ${service.title || 'Untitled'} (ID: ${service.id})`);
        
        // Check images array
        if (service.images && Array.isArray(service.images)) {
          console.log(`  📷 Images array (${service.images.length}):`);
          service.images.slice(0, 3).forEach((img: string, i: number) => {
            console.log(`    - ${i}: ${img}`);
          });
          if (service.images.length > 3) {
            console.log(`    - ... and ${service.images.length - 3} more`);
          }
        } else {
          console.log('  ❌ No images array');
        }
        
        // Check single image
        if (service.image) {
          console.log(`  🖼️ Single image: ${service.image}`);
        }
      });
      
      // Stats on image presence
      const withImages = services.filter(s => s.images && Array.isArray(s.images) && s.images.length > 0);
      console.log(`\n✅ Services with images array: ${withImages.length} (${Math.round(withImages.length/services.length*100)}%)`);
      
      const withValidImages = services.filter(s => 
        s.images && 
        Array.isArray(s.images) && 
        s.images.length > 0 && 
        s.images.some((img: any) => 
          typeof img === 'string' && 
          (img.startsWith('http') || img.includes('firebasestorage.googleapis.com') || img.includes('via.placeholder.com'))
        )
      );
      console.log(`✅ Services with valid web URLs: ${withValidImages.length} (${Math.round(withValidImages.length/services.length*100)}%)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug function
debugServices().catch(console.error);
