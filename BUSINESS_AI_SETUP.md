# KOFA Business AI Setup Guide

## 🤖 Smart AI Chatbots

KOFA now has **two AI-powered chatbots**:

1. **Business AI** - For business owners to manage inventory via conversation
2. **Customer AI** - For customers to browse and order products

---

## 🔑 Step 1: Get FREE Groq API Key

1. Go to: https://console.groq.com
2. Sign up for free account
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with `gsk_...`)

**Free Tier Limits**:
- 14,400 requests/day ✅
- 6,000 tokens/minute ✅
- Llama 3.1 70B model ✅

---

## 🛠 Step 2: Add API Key to Your Server

### Option A: Azure VM (Current Setup)

SSH into your Azure VM and add to environment:

```bash
# Connect to VM
ssh your-username@134.112.17.54

# Edit your environment file
cd /path/to/kofa
echo 'GROQ_API_KEY=gsk_your_key_here' >> .env

# Or add to systemd service
sudo systemctl edit kofa-backend
# Add: Environment="GROQ_API_KEY=gsk_your_key_here"

# Restart service
sudo systemctl restart kofa-backend
```

### Option B: Heroku (If using)

```bash
heroku config:set GROQ_API_KEY=gsk_your_key_here --app your-app-name
```

### Option C: Local Development

Create/update `.env` file:

```env
GROQ_API_KEY=gsk_your_key_here
DATABASE_URL=your_database_url
```

---

## 🚀 Step 3: Test the Business AI

### Using curl:

```bash
curl -X POST http://134.112.17.54:8000/business-ai \
  -H "Content-Type: application/json" \
  -d '{"user_id": "owner123", "message": "Show me low stock items"}'
```

### Using Python:

```python
import requests

response = requests.post(
    "http://134.112.17.54:8000/business-ai",
    json={
        "user_id": "owner123",
        "message": "Add 50 peppers at 500 naira each"
    }
)
print(response.json())
```

---

## 💬 Example Conversations

### Business AI Commands:

| Say This | AI Does |
|----------|---------|
| "Add 50 peppers at ₦500 each" | Adds product to inventory |
| "I just sold 2 red shoes" | Decrements stock |
| "Show low stock items" | Lists items below threshold |
| "What's my best seller?" | Shows top products |
| "How many products do I have?" | Shows inventory count |
| "Delete expired milk" | Removes product |

### Customer AI Queries:

| Customer Says | AI Responds |
|---------------|-------------|
| "What shoes you get?" | Shows available shoes |
| "How much be rice?" | Shows rice price |
| "I wan buy 2 canvas" | Creates order |
| "Wetin dey in stock?" | Lists available products |

---

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/business-ai` | POST | Business owner AI assistant |
| `/message` | POST | Customer chatbot (existing) |

---

## ⚠️ Troubleshooting

### "GROQ_API_KEY not configured"
- Make sure you set the environment variable
- Restart the server after adding the key

### "AI Error: 401"
- Your API key is invalid
- Get a new key from https://console.groq.com

### "Connection error"
- Check your internet connection
- Groq might be temporarily down

---

## 💰 Cost

**$0/month** - Groq's free tier is very generous!

- 14,400 requests/day = ~500,000 requests/month
- More than enough for any small business!

---

## 🎉 You're Ready!

Once you add the GROQ_API_KEY, your Business AI is ready to use!

Try saying: **"Show me all my products"** 🚀
