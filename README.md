# 🤖 AI Chat — Netlify + Groq

## ساختار پرۆژە
```
ai-chat-netlify/
├── netlify/functions/
│   ├── chat.js       ← AI Streaming
│   └── models.js     ← لیستی مۆدێل
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── chat.js
├── netlify.toml
└── package.json
```

---

## هەنگاوی دامەزراندن

### ١. Groq API Key بگرە (بەخۆڕایی)
1. بچۆ → [console.groq.com](https://console.groq.com)
2. حیساب دروست بکە
3. **API Keys** → **Create API Key**
4. کۆپی بکە

### ٢. GitHub بکە
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/USERNAME/ai-chat.git
git push -u origin main
```

### ٣. Netlify دامەزراندن
1. [netlify.com](https://netlify.com) → Sign Up
2. **Add new site** → **Import from Git**
3. GitHub کارەکەت هەڵبژێرە
4. **Deploy**

### ٤. GROQ_API_KEY زیاد بکە
1. Netlify → Site → **Environment Variables**
2. **Add variable**
3. Key: `GROQ_API_KEY`
4. Value: `gsk_xxxxxxxxxx` (ئەوەی لە Groq گرتیت)
5. **Save** → **Redeploy**

---

## مۆدێلەکانی بەخۆڕایی

| مۆدێل | خێرایی | تواناکان |
|-------|--------|---------|
| llama-3.1-70b-versatile | ⚡⚡⚡ | ئەزموونییەترین |
| llama-3.1-8b-instant | ⚡⚡⚡⚡ | خێراترین |
| mixtral-8x7b-32768 | ⚡⚡⚡ | کریاتیڤتر |
| gemma2-9b-it | ⚡⚡⚡ | Google AI |
