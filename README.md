<div align="center">

  <img src="public/logo.png" alt="Avadi City Logo" width="120" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />

# 🏙️ Avadi City - Community Driven App

### Next-Generation Civic Portal & Smart Municipal Hub for Avadi City peoples.

  <p align="center">
    Empowering 48 Wards of Avadi with instant civic grievance redressal, 24/7 SOS dispatch, approved local business discovery, community feeds, and municipal governance.
  </p>

  <p align="center">
    <a href="https://github.com/anburocky3/avadi-city/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License: MIT" />
    </a>
    <a href="https://nextjs.org/">
      <img src="https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
    </a>
    <a href="https://react.dev/">
      <img src="https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
    </a>
    <a href="https://tailwindcss.com/">
      <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
    </a>
    <a href="https://www.prisma.io/">
      <img src="https://img.shields.io/badge/Prisma%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    </a>
  </p>

  <p align="center">
    <a href="#-features">Key Features</a> •
    <a href="#-live-screenshots">Screenshots</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-project-architecture">Architecture</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-author--credits">Author</a>
  </p>
</div>

---

## 🌟 Overview

**Avadi City** is a modern civic mobile-first Progressive Web App (PWA) and municipal administration platform built for the citizens and administrators of **Avadi City Municipal Corporation** (Chennai Metropolitan Area, Tamil Nadu).

It bridges the gap between citizens, ward councilors, and municipal authorities with high-speed digital services, real-time grievance tracking, local commerce promotion, community engagement, and rapid emergency dispatch.

> [!NOTE]
> Designed with multi-language support (English & தமிழ் - Tamil), accessible offline-first PWA capabilities, and an administrative approval engine for all local commerce listings.

---

## ✨ Features

### 🛡️ 1. Multi-Tier Role-Based Access Control (RBAC)

- **Super Admin:** Global municipal governance, administrative audit logs, cross-ward access, push notification broadcasts, and emergency feed overrides.
- **Ward Admin:** Granular oversight of assigned wards (out of 48 wards), reviewing civic grievances, verifying local business listings, and approving services.
- **Citizen / Public:** Seamless authentication via phone OTP or credentials, profile management, grievance reporting, community interactions, and emergency SOS triggers.

### 🚨 2. Radiant 24/7 SOS Emergency Hub

- **Instant 112 Dial Dial:** Magnetic multi-ring animated radar dial for rapid dispatch to the National Emergency helpline.
- **🔊 Client Audio Siren Alarm:** Web Audio API emergency synthesizer that emits a dual-tone police whistle/alarm directly on device speakers.
- **📍 WhatsApp Live GPS Dispatch:** One-click Geolocation trigger generating instant coordinate links for dispatch to family or responders.
- **Vibrant Hotline Cards:** Color-coded direct lines for Police (100), Ambulance (108), Fire (101), Women Safety (1091), Cyber Crime (1930), and Wildlife & Snake Rescue.
- **Avadi Police Stations Directory:** Direct landlines and officer contacts for Avadi Main, Pattabiram, Thirumullaivoyal, HVF Tank Factory, and Poonamallee stations.

### 🏛️ 3. Full-Featured Modern Admin Management Console

- **Horizontal Dropdown Navigation:** Categorized workflow menus with real-time pending badges:
  - 🤝 **Citizen Services:** Community Feed, Grievances & Complaints, Lost & Found, Citizen Support.
  - 💼 **Approvals & Commerce:** Food & Dining, Local Services, Rent & Properties, Job Vacancies.
  - 📍 **City Directory:** Explore Places, Hospitals & Pharmacies, Travel & Transit, Volunteers.
  - 📢 **Broadcast & Admin:** Civic Push Notifications, User Directory, Super Admin Console.
- **One-Click Approval Engine:** User-submitted food spots, service profiles, and rental listings are staged in `PENDING` status until verified and approved by admins before going live.

### 🏥 4. Civic & Community Utilities

- **Emergency Blood Request:** Instant 48-ward red alert broadcast with volunteer matching.
- **Complaints & Grievances Redressal:** Geo-tagged complaint submissions with category filtering, photo attachments, and status tracking (`OPEN` ➔ `IN_PROGRESS` ➔ `RESOLVED`).
- **24/7 Healthcare Finder:** Directory of hospitals, clinics, and ICU emergency lines in and around Avadi.
- **Explore Avadi:** Curated guides to historic and eco-destinations like Paruthipattu Eco Park, Vijayanta Tank Memorial, and local heritage spots.

---

## 📸 Screenshots

![Avadi City Homepage](./docs/screenshots/hero.png)

<div align="center">
  <table>
    <tr>
      <td width="50%" align="center">
        <img src="./docs/screenshots/1.png" alt="SOS & Civic Hub Preview" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0;" />
      </td>
      <td width="50%" align="center">
        <img src="./docs/screenshots/2.png" alt="Avadi Eco Park" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0;" />
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <img src="./docs/screenshots/3.png" alt="Vijayanta Tank Memorial" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0;" />
      </td>
      <td width="50%" align="center">
        <img src="./docs/screenshots/4.png" alt="Historic Congress Session" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0;" />
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <img src="./docs/screenshots/5.png" alt="Vijayanta Tank Memorial" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0;" />
      </td>
      <td width="50%" align="center">
        <img src="./docs/screenshots/6.png" alt="Historic Congress Session" width="100%" style="border-radius: 12px; border: 1px solid #e2e8f0;" />
      </td>
    </tr>   
  </table>
</div>

---

## 🛠️ Tech Stack

| Domain                   | Technology                                                                               |
| :----------------------- | :--------------------------------------------------------------------------------------- |
| **Framework**            | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, RSC, Server Actions)           |
| **Frontend Library**     | [React 19](https://react.dev/)                                                           |
| **Styling & Design**     | [Tailwind CSS v4](https://tailwindcss.com/) with modern Glassmorphism & Micro-animations |
| **Language**             | [TypeScript](https://www.typescriptlang.org/) (Strict type checking)                     |
| **Database ORM**         | [Prisma ORM 7](https://www.prisma.io/) with MariaDB / MySQL Adapter                      |
| **State & Cache**        | [TanStack React Query v5](https://tanstack.com/query)                                    |
| **Animations**           | [Framer Motion](https://www.framer.com/motion/)                                          |
| **Form Validation**      | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)                |
| **Internationalization** | [next-intl](https://next-intl.dev/) (English & தமிழ்)                                    |
| **Icons**                | [Lucide React](https://lucide.dev/)                                                      |
| **Security & Auth**      | Custom Session Tokens, Role Guards, bcryptjs, Jose                                       |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later (or [Bun](https://bun.sh/) `v1.2+`)
- **Database**: MySQL 8+ or MariaDB 10.6+
- **Package Manager**: `npm`, `pnpm`, or `bun`

### 1. Clone Repository

```bash
git clone https://github.com/anburocky3/avadi-city.git
cd avadi-city
```

### 2. Install Dependencies

```bash
bun install
# or
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the project root:

```env
# Database Connection (MySQL / MariaDB)
DATABASE_URL="mysql://root:password@localhost:3306/avadi_city"

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="your-super-secret-jwt-key"

# Development OTP bypass (optional)
ENABLE_DEV_OTP="true"
```

### 4. Database Migration & Schema Generation

```bash
bun x prisma generate
bun x prisma db push
```

### 5. Run the Development Server

```bash
bun run dev
# or
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) or [`https://localhost:3000`](https://localhost:3000) in your browser.

---

## 📂 Project Architecture

```
avadi-city/
├── app/
│   ├── (auth)/                  # Public citizen authenticated pages
│   │   ├── complaints/          # Civic complaints submission & tracking
│   │   ├── foods/               # Local restaurants & food directory
│   │   ├── healthcare/          # 24/7 Hospital & Pharmacy directory
│   │   ├── services/            # Plumbers, electricians, local pros
│   │   ├── rentals/             # Housing, apartments & commercial rents
│   │   └── sos/                 # Vibrant 24/7 SOS Emergency Hub
│   ├── admin/                   # Dedicated Admin & Super Admin Portal
│   │   ├── (auth)/login/        # Secure administrative login portal
│   │   └── (portal)/            # Horizontal nav layout with 12 module managers
│   │       ├── dashboard/       # Overview metrics & approval queues
│   │       ├── foods/           # Restaurant approval & menu management
│   │       ├── complaints/      # Grievance redressal resolution desk
│   │       ├── notifications/   # Ward-wide civic push broadcasts
│   │       └── super-admin/     # System-wide administrative governance
│   └── actions/                 # Secure Next.js Server Actions with RBAC
├── components/
│   ├── admin/                   # Admin horizontal navigation & module tools
│   ├── shared-components/       # Modals, form fields, cards, loaders
│   └── ui/                      # Base interface atoms
├── data/                        # Static datasets (wards, emergency lines)
├── lang/                        # Translation dictionaries (en.json, ta.json)
├── prisma/                      # Prisma schema and database migrations
└── proxy.ts                     # Edge routing, session verification & RBAC guard
```

---

## 🤝 Contributing

Contributions make the open-source community a vibrant place to learn, inspire, and create. Any contributions you make to **Avadi City** are **greatly appreciated**!

1. **Fork the Project**
2. **Create your Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your Changes**
   ```bash
   git commit -m "feat: add AmazingFeature to Avadi City"
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

> [!TIP]
> Ensure all TypeScript types pass validation before pushing:
>
> ```bash
> bun x tsc --noEmit
> ```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👤 Author & Maintainer

<table border="0">
  <tr>
    <td width="100" align="center">
      <a href="https://github.com/anburocky3">
        <img src="https://github.com/anburocky3.png" width="90" style="border-radius: 50%;" alt="Anbuselvan Annamalai" />
      </a>
    </td>
    <td>
      <b>Anbuselvan Annamalai</b><br/>
      <i>Creator & Lead Developer</i><br/>
      GitHub: <a href="https://github.com/anburocky3">@anburocky3</a><br/>
      Website / Repo: <a href="https://github.com/anburocky3/avadi-city">avadi-city</a>
    </td>
  </tr>
</table>

---

## 💖 Contributors

Thank you to everyone who has contributed to improving the Avadi City civic super app!

<a href="https://github.com/anburocky3/avadi-city/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=anburocky3/avadi-city" alt="Contributors" />
</a>

<div align="center">
  <br/>
  <sub>Built with ❤️ for the citizens of Avadi City, Tamil Nadu 🇮🇳</sub>
</div>
