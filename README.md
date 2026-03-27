# Material Transport & Inventory Coordination System

A full-stack web application for managing inventory, request workflows, and delivery execution across multiple shop locations. Built with Next.js, Supabase, Twilio, and Firebase.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### 🔐 Authentication
- Phone number-based OTP authentication
- Role-based access control (Owner, Transporter, Shopkeeper)
- Persistent sessions with secure token management

### 📦 Inventory Management
- Real-time inventory tracking
- Automatic price calculations
- Only authorized roles can update inventory

### 📋 Request Workflow
- Shopkeepers can create material requests
- Transporter manages request lifecycle
- Status tracking: Placed → Received → Reviewed → Scheduled → Delivered → Photo Uploaded → Verified → Completed

### 🔔 Notifications
- In-app notifications
- SMS notifications via Twilio
- Push notifications via Firebase Cloud Messaging

### 📱 Responsive Design
- Mobile-responsive interface
- Desktop-first optimization
- Clean, modern UI with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Supabase Edge Functions |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Auth + Twilio Verify |
| SMS | Twilio SMS API |
| Push Notifications | Firebase Cloud Messaging |
| Storage | Supabase Storage |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Twilio account
- Firebase project

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kushalchalla981-tech/inventory.git
cd inventory
```

2. **Install dependencies**
```bash
cd inventory-app
npm install
```

3. **Environment Setup**

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_firebase_vapid_key
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Supabase Setup

1. Run the SQL script in `supabase-setup.sql` to create tables
2. Create storage bucket for delivery proofs
3. Deploy Edge Functions (verify-otp, send-sms, send-push)
4. Configure Edge Function secrets

## Project Structure

```
inventory-app/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── login/          # Login page
│   │   └── dashboard/      # Role-based dashboards
│   │       ├── owner/      # Owner dashboard
│   │       ├── transporter/# Transporter dashboard
│   │       └── shopkeeper/ # Shopkeeper dashboard
│   ├── components/         # React components
│   ├── context/            # React context (Auth)
│   └── lib/               # Supabase & Firebase clients
├── public/                 # Static assets
└── supabase/              # Edge Functions
    └── functions/
        ├── verify-otp/
        ├── send-sms/
        └── send-push/
```

## User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | View all requests, view all inventory, monitor operations |
| **Transporter** | Manage requests, update status, update inventory, verify deliveries |
| **Shopkeeper** | Create requests, view own requests, upload delivery proof |

## API Reference

### Edge Functions

- `verify-otp` - Send and verify OTP via Twilio
- `send-sms` - Send SMS notifications via Twilio
- `send-push` - Send push notifications via Firebase

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js and Supabase
