const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winnipen', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkPushTokens() {
  try {
    console.log('🔍 Checking push tokens in database...\n');
    
    const users = await User.find({ 'pushTokens.0': { $exists: true } })
      .select('username email pushTokens')
      .lean();
    
    if (users.length === 0) {
      console.log('❌ No users with push tokens found');
      console.log('💡 Make sure to log in to the app to register push tokens');
    } else {
      console.log(`✅ Found ${users.length} users with push tokens:\n`);
      
      users.forEach(user => {
        console.log(`👤 ${user.username} (${user.email})`);
        user.pushTokens.forEach((token, index) => {
          console.log(`   📱 Token ${index + 1}: ${token.token.substring(0, 20)}... (${token.platform})`);
        });
        console.log('');
      });
    }
    
    // Check total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);
    console.log(`📊 Users with push tokens: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error checking push tokens:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkPushTokens();


