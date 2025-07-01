# Tennis Court Booking Aggregator

A comprehensive tennis court availability aggregator that scrapes real-time booking data from multiple providers across London and presents it in a user-friendly web interface.

## 🎾 Features

- **Multi-Provider Support**: Scrapes from ClubSpark and ParkSports booking systems
- **Real-Time Data**: Updates availability every scrape cycle
- **Concurrent Scraping**: Efficient parallel processing with rate limiting
- **Modern UI**: Next.js frontend with responsive design
- **Location Filtering**: Filter by specific tennis courts
- **Weekly Calendar View**: Easy-to-use booking interface

## 🏟️ Supported Locations

### ClubSpark
- Battersea Park
- Archbishops Park

### ParkSports  
- Regents Park
- Hyde Park

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tennis-court-booking-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install chromium
   ```

4. **Run the scraper**
   ```bash
   npm run scrape
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
tennis-court-booking-app/
├── scrapers/           # Web scraping modules
│   ├── clubspark.js   # ClubSpark scraper
│   └── parksports.js  # ParkSports scraper
├── runner/            # Scraping orchestration
│   └── scrape-multiple-dates.js
├── locations/         # Location configurations
│   ├── clubspark.js
│   └── parksports.js
├── data/             # Scraped data storage
├── src/              # Next.js frontend
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Utility functions
│   └── pages/        # Next.js pages
└── config.js         # Configuration file
```

## 🔧 Configuration

Edit `config.js` to customize:
- Scraping parameters (days ahead, concurrency limits)
- Rate limiting settings
- Data paths
- Logging levels

## 📊 Data Flow

1. **Scraping**: Individual scrapers fetch availability from booking sites
2. **Aggregation**: Daily files are combined into location-based summaries
3. **Transformation**: Data is formatted for frontend consumption
4. **Display**: React components render the calendar interface

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run scrape` - Run the scraper
- `npm run aggregate` - Aggregate daily data to locations
- `npm run lint` - Run ESLint

## 🔍 Adding New Locations

1. **Add location to provider config**:
   ```javascript
   // locations/clubspark.js
   {
     name: "New Location",
     url: "https://booking-url.com"
   }
   ```

2. **Test the scraper**:
   ```bash
   node scrapers/clubspark.js
   ```

3. **Update frontend filters** if needed

## 🚨 Rate Limiting

The scraper implements intelligent rate limiting:
- **ParkSports**: 2 concurrent requests (strict)
- **ClubSpark**: 3 concurrent requests (lenient)
- **Overall**: 5 concurrent requests maximum
- **Delays**: 5-8 second randomized delays for ParkSports

## 📈 Monitoring

The scraper provides detailed statistics:
- Total tasks executed
- Success/failure rates
- Total slots found
- Error logging
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Legal Notice

This tool is for educational and personal use. Please respect the terms of service of the booking websites you're scraping. Consider implementing appropriate delays and not overwhelming their servers.

## 🆘 Troubleshooting

### Common Issues

1. **Playwright browser not found**
   ```bash
   npx playwright install chromium
   ```

2. **Rate limiting errors**
   - Increase delays in `config.js`
   - Reduce concurrency limits

3. **Scraping failures**
   - Check debug HTML files in `data/`
   - Verify booking URLs are still valid
   - Check for website changes

### Debug Mode

Enable debug logging in `config.js`:
```javascript
logging: {
  level: 'debug',
  saveDebugHtml: true
}
```

<!-- Last updated for Vercel deployment -->
