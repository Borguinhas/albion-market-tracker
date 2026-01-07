# Albion Market Tracker - Mobile App Design

## Overview
A mobile application for tracking and comparing Albion Online market data across multiple cities. Users can monitor item prices, view historical trends, and make informed trading decisions.

---

## Screen List

### 1. **Home Screen (Market Overview)**
- Displays a list of tracked items with current prices
- Shows the best buying and selling cities for each item
- Quick access to add new items
- Filter/sort options (by price change, item tier, city)

### 2. **Item Detail Screen**
- Current prices across all available cities
- Price comparison chart (historical trend)
- Buy/Sell price ranges
- Quality levels (1-5) with separate pricing
- Manual price update option
- Refresh button to fetch latest API data

### 3. **City Comparison Screen**
- Compare the same item across multiple cities
- Visual price difference indicators
- Profit opportunity highlights
- Sortable by price, buy/sell ratio, or availability

### 4. **Add Item Screen**
- Search/select items from available catalog (T4_BAG, T5_BAG, etc.)
- Quick add button for frequently tracked items
- Bulk add option (add multiple items at once)

### 5. **Price History Screen**
- Line chart showing price trends over selected date range
- Date range picker (default: last 7 days)
- Toggle between average price, buy price, sell price
- Export/share historical data

### 6. **Settings Screen**
- Preferred currency/region selection
- Notification preferences (price alerts)
- Data refresh interval settings
- About & version info

---

## Primary Content and Functionality

### Home Screen
**Content:**
- Item list cards showing:
  - Item name and tier
  - Current average price
  - Best buy city and price
  - Best sell city and price
  - Price change indicator (↑/↓ with percentage)
  - Last updated timestamp

**Functionality:**
- Tap item → Navigate to Item Detail Screen
- Pull-to-refresh → Fetch latest prices
- Swipe left → Delete item from tracking
- Floating action button → Add new item

### Item Detail Screen
**Content:**
- Item header (name, tier, quality selector)
- Current price summary card (buy min/max, sell min/max)
- Price by city list (sortable)
- Historical chart (last 30 days)
- Manual edit fields for local price updates

**Functionality:**
- Tap city → Show city details
- Refresh button → Fetch latest data
- Edit price → Update local cache
- Date range picker → Change chart timeframe
- Share button → Share item data

### City Comparison Screen
**Content:**
- Item selector at top
- City comparison table:
  - City name
  - Buy price (min/max)
  - Sell price (min/max)
  - Profit margin (sell - buy)
  - Last updated

**Functionality:**
- Select different items to compare
- Sort by any column
- Highlight best deal (green) / worst deal (red)
- Tap city → Show detailed city info

### Add Item Screen
**Content:**
- Search bar (filter by item name/tier)
- Popular items quick-add buttons
- Full item catalog (scrollable list)
- Recently added items

**Functionality:**
- Type to search items
- Tap to add item to tracking
- Bulk select multiple items
- Confirm and return to home

### Price History Screen
**Content:**
- Date range picker (from/to dates)
- Chart type selector (line/bar)
- Price type toggle (average/buy/sell)
- Interactive chart with tooltips
- Data table below chart

**Functionality:**
- Change date range → Update chart
- Toggle price type → Redraw chart
- Tap data point → Show exact value
- Export as CSV/image

### Settings Screen
**Content:**
- Region selector (Europe, US, etc.)
- Auto-refresh toggle + interval picker
- Price alert settings
- Theme selector (light/dark)
- App version and build info

**Functionality:**
- Change settings → Save to local storage
- Enable alerts → Set price thresholds
- Export data → Download JSON/CSV

---

## Key User Flows

### Flow 1: Track a New Item
1. User taps "+" button on Home Screen
2. Add Item Screen opens
3. User searches for "T5_BAG"
4. User taps item to add
5. Item appears on Home Screen with current prices
6. User can now view details and historical data

### Flow 2: Compare Item Prices Across Cities
1. User taps item on Home Screen
2. Item Detail Screen opens
3. User sees all cities listed with prices
4. User can sort by best buy/sell
5. User identifies best trading opportunity
6. User can manually note the price or set an alert

### Flow 3: Update Price Manually
1. User taps item on Home Screen
2. Item Detail Screen opens
3. User taps "Edit Price" button
4. Edit dialog appears with current prices
5. User updates prices based on local market
6. User saves changes (stored locally)
7. Changes persist until next API refresh

### Flow 4: View Historical Trends
1. User taps item on Home Screen
2. Item Detail Screen opens
3. User taps "History" tab
4. Price History Screen opens
5. User adjusts date range (e.g., last 30 days)
6. Chart updates showing price trends
7. User can identify seasonal patterns

### Flow 5: Refresh Market Data
1. User on Home Screen or Item Detail Screen
2. User pulls down to refresh (or taps refresh button)
3. App fetches latest prices from API
4. Prices update in real-time
5. Last updated timestamp refreshes
6. User sees visual feedback (loading spinner)

---

## Color Choices

### Brand Colors
- **Primary (Accent):** `#1F2937` (Dark slate - Albion theme)
- **Secondary:** `#F59E0B` (Amber - for profit/gains)
- **Danger:** `#EF4444` (Red - for losses/alerts)
- **Success:** `#10B981` (Green - for positive trends)
- **Background:** `#FFFFFF` (Light) / `#111827` (Dark)
- **Surface:** `#F3F4F6` (Light) / `#1F2937` (Dark)
- **Text Primary:** `#111827` (Light) / `#F9FAFB` (Dark)
- **Text Secondary:** `#6B7280` (Muted gray)
- **Border:** `#E5E7EB` (Light) / `#374151` (Dark)

### Data Visualization
- **Price Up (Bullish):** `#10B981` (Green)
- **Price Down (Bearish):** `#EF4444` (Red)
- **Neutral:** `#6B7280` (Gray)
- **Profit Opportunity:** `#F59E0B` (Amber highlight)

---

## Technical Considerations

### API Integration
- **Prices Endpoint:** Fetch current prices for tracked items
- **History Endpoint:** Fetch historical price data for charts
- **Update Frequency:** Configurable (default: 5 minutes)
- **Caching:** Store prices locally to reduce API calls

### Data Storage
- **Local Storage:** AsyncStorage for tracked items, user preferences, manual price edits
- **Cache Strategy:** Store last API response + timestamp to minimize network requests

### Performance
- Use FlatList for long item lists
- Lazy-load charts and historical data
- Debounce search input
- Memoize expensive calculations (price comparisons)

---

## Suggested Improvements

1. **Price Alerts:** Notify user when item price hits target threshold
2. **Profit Calculator:** Show potential profit when buying in one city and selling in another (accounting for taxes/fees)
3. **Favorites/Watchlist:** Star items for quick access
4. **Trading Journal:** Log trades made to track actual P&L
5. **Offline Mode:** Cache data for offline browsing
6. **Export Reports:** Generate PDF reports of price trends
7. **Dark Mode:** Full dark mode support (already in design)
8. **Multi-Region Support:** Track prices across different regions (Europe, US, etc.)
9. **Item Recommendations:** Suggest profitable items to trade based on price spreads
10. **Push Notifications:** Alert user of significant price changes or opportunities
11. **Quality Filter:** Filter items by quality level (1-5)
12. **Bulk Operations:** Add/remove multiple items at once
13. **Price Prediction:** Simple trend analysis to predict future prices
14. **Community Insights:** Share trading tips or price observations with other players
