```html
<div class="crm-banner">
  <pre class="ascii">
 ██████╗██████╗ ███╗   ███╗   █████╗
██╔════╝██╔══██╗████╗ ████║  ██╔══██╗
██║     ██████╔╝██╔████╔██║  ███████║
██║     ██╔══██╗██║╚██╔╝██║  ██╔══██║
╚██████╗██║  ██║██║ ╚═╝ ██║  ██║  ██║
 ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝  ╚═╝
  </pre>

  <div class="meta">
    <p><b>Intelligent Client & Project Management</b></p>
    <p>Employee ID: 005 • Author: DropOutBrain AK005</p>
    <p>Version: 1.0.0 • Powered by Entrogic</p>
  </div>
</div>

<style>
.crm-banner{
  text-align:center;
  padding:20px 10px;
  font-family: monospace;
}

.ascii{
  font-size: clamp(8px, 2vw, 14px);
  line-height: 1.1;
  margin: 0;
  overflow-x: auto;
}

.meta{
  margin-top: 10px;
  font-size: clamp(12px, 2vw, 14px);
  line-height: 1.4;
}
</style>
```

```

# CRM-AI — Your Intelligent Business Assistant

**CRM-AI** is an all-in-one platform that helps you manage clients, track projects, and communicate effortlessly — powered by artificial intelligence.

Think of it as a smart assistant that never sleeps. It remembers every conversation, spots deadlines before they're missed, understands what your clients need, and keeps your team on the same page.

---

## What It Does

### 📋 Client Management
Keep all your clients in one place. Track their contact details, ongoing projects, and conversation history.

### 📊 Project Tracking
Every project has its own dashboard. See requirements, tasks, deadlines, budget, and who's working on what — all at a glance.

### 🤖 AI-Powered Conversations
Your built-in AI assistant chats with clients, figures out what they want, creates requirements automatically, and answers questions about progress, budget, or deadlines — 24/7.

### 🧠 Project Memory
The AI remembers everything about each project. It builds a smart summary, warns you about risks, and suggests what to do next. No more digging through old emails.

### ⏰ Smart Reminders
Never miss a deadline. The system watches upcoming dates and sends alerts before things slip through the cracks.

### 📬 Multi-Channel Messaging
Connect with clients through email, WhatsApp, or the built-in chat. All messages are stored in one place.

### 👥 Team Assignment
Assign developers to projects, set their roles, and track who's doing what. See availability at a glance.

### 🔒 Secure Access
You and your team log in with your own accounts. Sensitive data stays protected behind JWT security.

---

## How It Works

```
  ┌──────────┐       ┌──────────┐       ┌──────────┐
  │  Client   │       │  Email   │       │ WhatsApp │
  │ Dashboard │       │  (Gmail) │       │ (Twilio) │
  └─────┬─────┘       └────┬─────┘       └────┬─────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Fastify   │
                    │  API Server │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────────┐
   │PostgreSQL│    │  Redis   │    │  AI Agents   │
   │ Database │    │ (Queues) │    │ (DeepSeek AI)│
   └──────────┘    └──────────┘    └──────────────┘
```

1. **Clients reach out** through email, WhatsApp, or the built-in chat
2. **The AI assistant** reads the message, detects the intent, creates tasks or requirements automatically
3. **Your team** sees everything on their dashboard — projects, tasks, deadlines, assignments
4. **Smart memory** tracks context across every conversation, so the AI always knows what's going on
5. **Alerts and reminders** keep everyone on track without manual follow-ups

---

## Features in This Version

| Feature | Description |
|---------|-------------|
| Client Directory | Store and manage all client details |
| Project Workspace | One dashboard per project with all info |
| AI Chat Assistant | Handles inquiries, creates requirements, answers questions |
| Project Memory | Auto-generated summaries, risk alerts, next-step suggestions |
| Task Tracker | Create, assign, and track tasks with status updates |
| Requirement Board | Client requests organized and prioritized |
| Deadline Alerts | Automatic reminders before due dates |
| Team Roster | Know who's working on what, who's available |
| Email & WhatsApp | Send and receive messages on multiple channels |
| Admin Settings | Configure integrations from one panel |

---

## Quick Start

### What You Need
- A computer with **Node.js** (version 20 or higher)
- **PostgreSQL** database (version 16)
- **Redis** (version 7) — for background jobs
- **pnpm** package manager (`npm install -g pnpm`)

### 5-Minute Setup

```bash
# 1. Go to the project folder
cd crm-ai

# 2. Install everything
pnpm install

# 3. Create your settings file
cp .env.example .env

# 4. Fill in your database and service keys in .env
nano .env

# 5. Set up the database
pnpm db:push

# 6. Start the system
pnpm dev
```

Now open **http://localhost:5173** in your browser.

### Using Docker

```bash
docker-compose up -d
```

The API runs on port **4000**, the dashboard on port **3000**.

---

## Screen Overview

| Page | What You Can Do |
|------|----------------|
| **Dashboard** | View stats, recent activity, quick overview |
| **Clients** | Add and manage your client list |
| **Projects** | Open any project to see tasks, requirements, chat, and memory |
| **Developers** | Manage your team members and availability |
| **Conversations** | Chat with the AI about any project |
| **Settings** | Check connection status and configure services |

---

## Environment Variables

All settings go into a `.env` file (copy from `.env.example`). Here are the important ones:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/crm_ai
PORT=4000
JWT_SECRET=your-secret-key
DEEPSEEK_API_KEY=sk-your-ai-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Services gracefully handle missing credentials — they simply skip features that aren't configured yet.

---

## What's Next (v2 Preview)

- **Dashboard analytics** — charts, trends, and reports
- **Mobile-friendly** — work from your phone
- **Custom AI agents** — specialized assistants for budgeting, quality checks, and scheduling
- **Meeting scheduler** — auto-schedule calls with clients
- **File attachments** — share documents in conversations

---

## Credits

```
          Built by DropOutBrain AK005
          Employee ID : 005
          CRM-AI v1.0.0

          "Intelligence at work, for work."
```

---

**Questions?** Check `REPORT.MD` for technical details or open an issue on the project repository.
