# Owo Flow Commerce Engine 🛒

A WhatsApp-first commerce system for the Nigerian market. Built with FastAPI, Supabase, and React Native.

## ✨ Features

- 🛍️ **Inventory Management** - Voice-tag support for product search
- 💬 **AI Sales Chatbot** - Intent recognition with Nigerian English/Pidgin support
- 💳 **Payment Integration** - Naira Ramp for local payments
- 📦 **Order Management** - Track orders with status updates
- 💰 **Expense Tracking** - Monitor business spend
- 📊 **Analytics** - Sales channels, profit/loss reports
- 📱 **Mobile Dashboard** - React Native merchant app

## 🚀 Quick Start

### Local Development

```bash
# Clone and setup
cd owo_flow
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Run server (works without Supabase using mock data)
uvicorn chatbot.main:app --reload
```

API available at `http://localhost:8000` | Docs at `http://localhost:8000/docs`

### Deploy to Render (Free)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete setup including:
- Supabase database setup (free tier)
- Render web service deployment
- Environment configuration

## 📁 Project Structure

```
owo_flow/
├── chatbot/           # FastAPI backend
│   ├── main.py        # API endpoints
│   ├── routers/       # Feature routers (expenses, delivery, etc.)
│   └── services/      # Business logic
├── mobile/            # React Native merchant app
├── landing/           # Marketing landing page
├── supabase/          # Database schema
├── tests/             # Test suite
├── Dockerfile         # Container config
└── render.yaml        # Render deployment config
```

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/message` | Chatbot conversation |
| GET | `/products` | List inventory |
| GET | `/orders` | List orders |
| POST | `/orders` | Create order |
| GET | `/health` | Health check |

Full API docs at `/docs` when server is running.

## 📱 Mobile App

The merchant dashboard is built with Expo/React Native:

```bash
cd mobile
npm install
npx expo start
```

Update `lib/api.ts` with your backend URL.

## 🧪 Testing

```bash
pytest tests/ -v
```

## 📄 License

MIT License - Built for Nigerian commerce 🇳🇬

