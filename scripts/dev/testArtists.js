/**
 * Test Firebase Artists Service
 */

const { fetchArtistsFromFirebase, fetchArtistById } = require('../../src/firebase/artistsService');

async function testArtistsService() {
  console.log('🧪 Testing Firebase Artists Service...');
  
  try {
    // Test fetching all artists
    console.log('\n1. Testing fetchArtistsFromFirebase...');
    const artists = await fetchArtistsFromFirebase();
    
    console.log(`✅ Found ${artists.length} artists:`);
    artists.forEach((artist, index) => {
      console.log(`${index + 1}. ${artist.name} (${artist.email})`);
      console.log(`   - Role: ${artist.role}`);
      console.log(`   - Categories: ${artist.categories.join(', ')}`);
      console.log(`   - Location: ${artist.location}`);
      console.log(`   - Rating: ${artist.rating}/5`);
      console.log(`   - Bio: ${artist.bio.substring(0, 50)}...`);
      console.log('');
    });
    
    if (artists.length > 0) {
      // Test fetching single artist
      console.log(`\n2. Testing fetchArtistById with ID: ${artists[0].id}...`);
      const singleArtist = await fetchArtistById(artists[0].id);
      
      if (singleArtist) {
        console.log(`✅ Successfully fetched single artist: ${singleArtist.name}`);
      } else {
        console.log('❌ Failed to fetch single artist');
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('permission-denied')) {
      console.log('\n🔧 SOLUTION: Update Firestore security rules');
      console.log('Go to: https://console.firebase.google.com/project/inevents-2fe56/firestore/rules');
      console.log('Set rules to: allow read, write: if true;');
    }
  }
}

testArtistsService();
