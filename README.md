# 🏛️ NEU MOA Management System (MEMO)

**MOA Electronic Management & Oversight (MEMO)** is a centralized, secure, and real-time platform designed for New Era University to manage institutional partnerships and Memorandums of Agreement (MOA).

---

## 🚀 Key Features

### 📊 Intelligent Dashboard
- **Real-time Stats**: Track Active, Processing, Expiring, and Expired MOAs at a glance.
- **Data Visualization**: Interactive charts (Bar & Pie) showing status distribution and MOA composition using **Recharts**.
- **Quick Actions**: One-click file uploads and record navigation for administrators.

### 🔐 Role-Based Access Control (RBAC)
- **Superadmin**: Full system oversight, user management, and data seeding capabilities.
- **Admin**: Manage MOA records, view audit trails, and handle file uploads.
- **Faculty**: Department-specific view with editing permissions (if granted).
- **Student**: Read-only access to browse active institutional partnerships for internships.

### 📝 MOA Lifecycle Management
- **Full CRUD**: Create, Read, Update, and Soft-Delete MOA records.
- **Advanced Filtering**: Search by Company, College, Industry, or Status.
- **Document Preview**: Integrated PDF and Image previewer for uploaded MOA documents.
- **Audit Trail**: A transparent log of every insertion, edit, and deletion, ensuring accountability.

### 🛡️ Security & Integrity
- **Google Auth**: Restricted to `@neu.edu.ph` domains for institutional security.
- **Firestore Rules**: Robust server-side validation to prevent unauthorized data access or modification.
- **Soft Delete**: Recover accidentally deleted records with a single click.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (`motion/react`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **Date Handling**: [date-fns](https://date-fns.org/)

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/neu-moa-system.git
   cd neu-moa-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file based on `.env.example` and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
src/
├── components/     # Reusable UI components (Modals, Spinners, etc.)
├── context/        # Auth and Global State management
├── hooks/          # Custom hooks (useMOAs, useStorage)
├── pages/          # Main application views (Dashboard, MOAList, AuditTrail)
├── utils/          # Helper functions (Error handlers, Seed data)
├── firebase.ts     # Firebase initialization
├── constants.ts    # Global constants and role definitions
└── App.tsx         # Main routing and layout
```

---

## 📜 License

This project is developed exclusively for **New Era University**. All rights reserved.

---

## 👥 Contributors

- **Julia Rodrigo** - Lead Developer & Super Admin
- **JC Esperanza** - Super Admin

---

> "Centralizing partnerships, empowering students, and ensuring institutional excellence." 🎓
