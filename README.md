# 🚀 SplitKar — Group Expense Management Platform

A full-stack MERN application for splitting expenses fairly within groups.  
Built with MongoDB + MySQL, React, Node.js, Socket.io, and Razorpay.

---

## 📁 Project Structure

```
splitkar/
├── backend/                  # Node.js + Express API
│   ├── config/               # MySQL, MongoDB, Passport configs
│   ├── controllers/          # Business logic
│   ├── middleware/           # Auth (JWT), error handling
│   ├── models/
│   │   ├── mysql/            # Sequelize models (financial data)
│   │   └── mongo/            # Mongoose models (profiles, logs, notifications)
│   ├── routes/               # All API routes
│   ├── socket/               # Socket.io setup + emitter
│   ├── utils/                # Cron jobs
│   └── server.js             # Entry point
├── frontend/                 # React + Vite + Tailwind
│   └── src/
│       ├── components/       # Shared UI components
│       ├── context/          # Zustand store, Socket context
│       ├── pages/            # All page components
│       └── services/         # Axios API client
└── package.json              # Root scripts
```

---

## ⚙️ Prerequisites

- Node.js 20+
- MySQL 8+
- MongoDB 7+ (local or Atlas)
- Razorpay test account → https://dashboard.razorpay.com
- Google OAuth credentials → https://console.cloud.google.com

---

## 🛠️ Setup

### 1. Clone & install

```bash
cd splitkar
npm run install:all
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual credentials
```

### 3. Create MySQL database

```sql
CREATE DATABASE splitkar_finance;
```
> Sequelize will auto-create all tables on first run via `sync({ alter: true })`.

### 4. Start development servers

```bash
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

---

## 🔑 Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `PORT` | Backend port (default: 5000) |
| `JWT_SECRET` | Strong random string |
| `MYSQL_*` | MySQL connection details |
| `MONGODB_URI` | MongoDB connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | `http://localhost:5000/api/auth/google/callback` |
| `RAZORPAY_KEY_ID` | Razorpay test key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret |
| `CLIENT_URL` | Frontend URL (`http://localhost:5173`) |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/send-otp` | Send phone OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Groups
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/groups` | All user groups |
| POST | `/api/groups` | Create group |
| GET | `/api/groups/:id` | Group details + balances |
| PUT | `/api/groups/:id` | Update group |
| DELETE | `/api/groups/:id` | Delete group |
| POST | `/api/groups/:id/members` | Add member |
| DELETE | `/api/groups/:id/members/:userId` | Remove member |
| GET | `/api/groups/:id/activity` | Activity log |

### Expenses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/groups/:gid/expenses` | List expenses |
| POST | `/api/groups/:gid/expenses` | Add expense |
| GET | `/api/groups/:gid/expenses/:id` | Get expense |
| PUT | `/api/groups/:gid/expenses/:id` | Update expense |
| DELETE | `/api/groups/:gid/expenses/:id` | Delete expense |
| GET | `/api/groups/:gid/analytics` | Analytics |

### Settlements
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/settlements/initiate` | Create Razorpay order |
| POST | `/api/settlements/verify` | Verify payment |
| POST | `/api/settlements/manual` | Record offline payment |
| GET | `/api/settlements/my` | My settlements |
| GET | `/api/groups/:gid/settlements` | Group settlements |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read-all` | Mark all read |
| PUT | `/api/notifications/:id/read` | Mark one read |
| DELETE | `/api/notifications/:id` | Delete |

---

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `join_group` | Client → Server | Join a group room |
| `expense_added` | Server → Client | New expense broadcast |
| `expense_updated` | Server → Client | Expense edited |
| `expense_deleted` | Server → Client | Expense removed |
| `balance_updated` | Server → Client | Recalculate balances |
| `settlement_completed` | Server → Client | Payment confirmed |
| `notification` | Server → Client | New in-app notification |
| `member_added` | Server → Client | New member joined |

---

## 💡 Split Types

| Type | How it works |
|---|---|
| `equal` | Total ÷ number of members |
| `percentage` | Each member assigned a %, must sum to 100 |
| `exact` | Each member assigned exact ₹ amount, must sum to total |
| `share` | Each member gets N shares; amount = (shares/totalShares) × total |

---

## 🏦 Razorpay Setup

1. Create account at https://dashboard.razorpay.com
2. Go to **Settings → API Keys → Generate Test Key**
3. Copy `Key ID` and `Key Secret` to `.env`
4. Test with card: `4111 1111 1111 1111`, any future date, any CVV

---

## 🗄️ Database Design

**MySQL** stores all financial data:
- `users` — account credentials & auth
- `groups` — group metadata
- `group_members` — membership + roles
- `expenses` — expense records
- `expense_shares` — per-member split amounts
- `settlements` — payment records with Razorpay IDs

**MongoDB** stores auxiliary data:
- `userprofiles` — avatars, UPI IDs, preferences
- `notifications` — in-app notification feed
- `activitylogs` — group audit trail

---

## 🚀 Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Start backend (serves API only; deploy frontend to Vercel/Netlify)
cd backend && NODE_ENV=production npm start
```

---

## 👨‍💻 Team

Submitted to: Akash Kumar Choudhary, Technical Trainer, GLA University Mathura  
Built by: Vaibhav Singh, Naman Sharma, Mayank Garg, Prashant Soni, Somendra Singh
