# Winnipen Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] MongoDB Atlas cluster created and configured
- [ ] Firebase project set up with Authentication and Storage
- [ ] Environment variables configured for production
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] Domain name registered and DNS configured

### 2. Security Configuration
- [ ] JWT_SECRET set to a strong, random value
- [ ] Firebase Admin SDK credentials configured
- [ ] CORS settings updated for production domain
- [ ] Rate limiting configured appropriately
- [ ] Security headers configured (Helmet)

### 3. Database Setup
- [ ] MongoDB indexes created for optimal performance
- [ ] Database backup strategy implemented
- [ ] Connection pooling configured
- [ ] Database monitoring set up

### 4. Application Configuration
- [ ] Production build created
- [ ] Environment variables validated
- [ ] Logging configured for production
- [ ] Error tracking service configured (Sentry)
- [ ] Health checks implemented

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- Domain name pointing to your server
- SSL certificates

#### Steps
1. Clone the repository
2. Configure environment variables in `.env`
3. Run deployment:
   ```bash
   docker-compose up -d
   ```

### Option 2: Manual Deployment

#### Backend Deployment
1. Set up Ubuntu/CentOS server
2. Install Node.js 18+
3. Install PM2 for process management
4. Clone repository and install dependencies
5. Configure environment variables
6. Start with PM2:
   ```bash
   pm2 start server.js --name winnipen-backend
   pm2 startup
   pm2 save
   ```

#### Frontend Deployment
1. Build the app:
   ```bash
   expo build:android
   expo build:ios
   ```
2. Upload to app stores
3. Configure push notifications

### Option 3: Cloud Platform Deployment

#### Backend (Render/Railway/Heroku)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

#### Frontend (Expo EAS Build)
1. Install EAS CLI:
   ```bash
   npm install -g @expo/eas-cli
   ```
2. Configure build:
   ```bash
   eas build:configure
   ```
3. Build and submit:
   ```bash
   eas build --platform all
   eas submit --platform all
   ```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/winnipen
JWT_SECRET=your-super-secure-jwt-secret
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FRONTEND_URL=https://yourdomain.com
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Database Setup

### MongoDB Atlas Configuration
1. Create cluster
2. Configure network access (whitelist your server IP)
3. Create database user
4. Set up indexes:
   ```javascript
   // Posts collection
   db.posts.createIndex({ "coordinates": "2dsphere" })
   db.posts.createIndex({ "author": 1, "createdAt": -1 })
   db.posts.createIndex({ "createdAt": -1 })
   
   // Users collection
   db.users.createIndex({ "firebaseUid": 1 })
   db.users.createIndex({ "email": 1 })
   
   // Comments collection
   db.comments.createIndex({ "post": 1, "createdAt": -1 })
   ```

## Monitoring and Maintenance

### Health Checks
- Backend: `GET /api/health`
- Database connection monitoring
- Disk space monitoring
- Memory usage monitoring

### Logging
- Application logs: `/app/logs/`
- Error tracking: Sentry integration
- Performance monitoring: New Relic or similar

### Backup Strategy
- Daily MongoDB backups
- Firebase Storage backups
- Configuration backups
- Test restore procedures

## Security Considerations

### SSL/TLS
- Use Let's Encrypt for free SSL certificates
- Configure HTTPS redirect
- Set up HSTS headers

### Firewall
- Only open necessary ports (80, 443, 22)
- Use fail2ban for SSH protection
- Configure rate limiting

### Updates
- Regular security updates
- Dependency updates
- Monitor security advisories

## Performance Optimization

### Backend
- Enable gzip compression
- Configure Redis caching
- Optimize database queries
- Use CDN for static assets

### Frontend
- Image optimization
- Lazy loading
- Code splitting
- Offline support

## Troubleshooting

### Common Issues
1. **Database connection errors**: Check MongoDB URI and network access
2. **Authentication failures**: Verify Firebase configuration
3. **CORS errors**: Update CORS settings for production domain
4. **Memory leaks**: Monitor with PM2 or similar tools

### Logs Location
- Backend logs: `/app/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

## Post-Deployment

### Testing
- [ ] API endpoints working
- [ ] Authentication flow
- [ ] Real-time features
- [ ] File uploads
- [ ] Push notifications

### Monitoring Setup
- [ ] Uptime monitoring
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] User analytics

### Launch Preparation
- [ ] App store submissions
- [ ] Marketing materials
- [ ] User documentation
- [ ] Support channels

## Maintenance Schedule

### Daily
- Monitor system health
- Check error logs
- Review user reports

### Weekly
- Security updates
- Performance review
- Backup verification

### Monthly
- Dependency updates
- Security audit
- Performance optimization
- User feedback review





