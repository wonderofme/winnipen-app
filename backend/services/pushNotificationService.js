const { Expo } = require('expo-server-sdk');

class PushNotificationService {
  constructor() {
    this.expo = new Expo();
  }

  async sendPushNotification(tokens, title, body, data = {}) {
    if (!tokens || tokens.length === 0) {
      console.log('No push tokens provided');
      return;
    }

    // Filter out invalid tokens
    const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
    
    if (validTokens.length === 0) {
      console.log('No valid push tokens found');
      return;
    }

    // Create messages
    const messages = validTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default'
    }));

    try {
      // Send notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      console.log(`Sent ${tickets.length} push notifications`);
      return tickets;
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw error;
    }
  }

  async sendNewPostNotification(followers, authorName, postId) {
    const tokens = followers.flatMap(user => 
      user.pushTokens ? user.pushTokens.map(pt => pt.token) : []
    );

    if (tokens.length === 0) {
      console.log('No push tokens found for followers');
      return;
    }

    const title = 'New Post from ' + authorName;
    const body = `${authorName} posted something new`;
    const data = {
      type: 'new_post',
      postId: postId,
      authorName: authorName
    };

    return await this.sendPushNotification(tokens, title, body, data);
  }

  async sendNewFollowerNotification(userTokens, followerName) {
    if (!userTokens || userTokens.length === 0) {
      console.log('No push tokens found for user');
      return;
    }

    const title = 'New Follower';
    const body = `${followerName} started following you`;
    const data = {
      type: 'new_follower',
      followerName: followerName
    };

    return await this.sendPushNotification(userTokens, title, body, data);
  }
}

module.exports = new PushNotificationService();

