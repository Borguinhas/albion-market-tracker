# Albion Market Tracker - Project TODO

## Core Features

- [x] API integration for current prices endpoint
- [x] API integration for historical prices endpoint
- [x] Local data storage with AsyncStorage
- [x] Item tracking system (add/remove items)
- [x] Home screen with item list and price display
- [x] Item detail screen with city comparison
- [ ] Price history screen with date range picker
- [ ] Manual price update functionality
- [x] Refresh mechanism (pull-to-refresh and button)
- [x] Search/filter functionality for items
- [x] Add new item screen with catalog
- [x] Update items catalog with 6249 complete Albion items
- [x] Implement Black Market sell price highlighting
- [x] Add Black Market constraint to API service

## UI/UX Features

- [ ] Tab navigation setup (Home, History, Settings)
- [ ] Price comparison chart visualization
- [ ] Price trend indicators (up/down arrows)
- [ ] City comparison table
- [ ] Loading states and spinners
- [ ] Error handling and user feedback
- [ ] Empty state screens
- [ ] Responsive design for various screen sizes

## Settings & Configuration

- [ ] Settings screen implementation
- [ ] Region/server selection (Europe, US, etc.)
- [ ] Auto-refresh interval configuration
- [ ] Theme toggle (light/dark mode)
- [ ] Data persistence for user preferences

## Advanced Features

- [ ] Price alerts/notifications
- [ ] Profit calculator (buy/sell spread)
- [ ] Favorites/watchlist system
- [ ] Historical data export (CSV/JSON)
- [ ] Offline mode with cached data
- [ ] Bulk add items functionality
- [ ] Quality level filtering (1-5)
- [ ] Price prediction/trend analysis

## Testing & Polish

- [ ] Unit tests for API calls
- [ ] Integration tests for data flow
- [ ] UI/UX testing on device
- [ ] Performance optimization
- [ ] Error boundary implementation
- [ ] Accessibility audit

## Branding & Deployment

- [ ] Generate custom app logo
- [ ] Update app.config.ts with branding
- [ ] Create app icon variants (iOS, Android)
- [ ] Test on Android device/emulator
- [ ] Final polish and bug fixes


## Marketplace Mechanics Implementation

- [x] Implement 8% transaction tax calculation (4% with Premium)
- [x] Implement 2.5% setup fee for buy/sell orders
- [x] Create profit calculator: buy from city → sell to Black Market
- [x] Show net profit after taxes and fees
- [x] Implement city-to-Black Market trading routes
- [x] Filter out Black Market from buy prices (only show city prices)
- [x] Highlight best buy cities (lowest prices to buy from)
- [x] Show profit margin on home screen
- [x] Add quality filtering for items
- [ ] Display market history with time scale selection (24h, 7d, 30d)
- [ ] Add trading route suggestions (most profitable routes)
- [ ] Implement price trend analysis
- [ ] Update home screen to show profit calculations
- [ ] Create detailed trading routes screen
- [ ] Add Premium toggle in settings
