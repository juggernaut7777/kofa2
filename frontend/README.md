# KOFA Commerce Engine - Frontend PWA

Unified Commerce Engine frontend - A Progressive Web App that merges Vendor Sales and Logistics into one platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Features

- **Mobile-First Design**: Optimized for mobile devices with responsive layouts
- **PWA Ready**: Installable as a native app, works offline
- **Unified Dashboard**: Sales & Logistics in one view
- **Auto-Dispatch**: Orders automatically trigger deliveries
- **Real-time Updates**: Connected to live Heroku backend

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with navigation
│   ├── pages/
│   │   ├── Dashboard.jsx       # Unified dashboard
│   │   ├── Products.jsx        # Product management
│   │   ├── Orders.jsx          # Order tracking
│   │   └── Deliveries.jsx      # Delivery dispatch
│   ├── hooks/
│   │   ├── useProducts.js      # Product API hooks
│   │   └── useOrders.js        # Order API hooks
│   ├── config/
│   │   └── api.js              # API configuration
│   ├── App.jsx                 # Main app router
│   └── main.jsx                # Entry point
├── vite.config.js              # Vite + PWA config
└── tailwind.config.js         # Tailwind CSS config
```

## 🔌 API Connection

The app connects to the live Heroku backend:
- **Base URL**: `https://kofa-backend-david-0a6d58175f07.herokuapp.com`
- Configured in `src/config/api.js`

## 📦 Pages

### Dashboard
Unified view showing:
- Sales statistics
- Recent orders
- Active deliveries
- Quick actions

### Products
- Add/edit products
- View inventory
- Stock management

### Orders
- View all orders
- Filter by status (pending, paid, fulfilled)
- Update order status
- Auto-creates deliveries when fulfilled

### Deliveries
- Track all deliveries
- Auto-created from fulfilled orders
- Status tracking (pending → dispatched → in-transit → delivered)

## 🎨 Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **PWA Plugin** - Offline support

## 📱 Mobile Navigation

- **Bottom Navigation Bar** (Mobile): Fixed bottom nav for easy thumb access
- **Sidebar Navigation** (Desktop): Left sidebar for larger screens

## 🔄 The "Merger" Concept

The app demonstrates the unified commerce engine:
1. **Sales Flow**: Products → Orders → Payment
2. **Auto-Trigger**: When order is "fulfilled", delivery is automatically created
3. **Logistics Flow**: Delivery → Dispatch → Tracking → Completion
4. **No Manual Handoff**: Everything happens automatically in one system

## 🚀 Deployment

### Vercel (Free Tier)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

The app is configured for Vercel's free tier with automatic deployments from Git.

## 📝 Environment Variables

Create a `.env` file (optional):

```env
VITE_API_URL=https://kofa-backend-david-0a6d58175f07.herokuapp.com
```

Defaults to the live Heroku backend if not set.
