[العربية](README.ar.md) · **English**

# Hasad — Agricultural Farm Management System

A web platform that helps farmers organise crop data, schedule irrigation, and track farm activities, inventory and costs — in Arabic or English, on a computer or a phone.

> **Graduation project** — Prepared by **Mohamad** · Supervised by **Dr. ArunKumar Sivaraman** · **Gulf College**
> Presentation: [`docs/presentation/Hasad_Presentation.pptx`](docs/presentation/Hasad_Presentation.pptx) (English) · [`docs/presentation/Hasad_Presentation_AR.pptx`](docs/presentation/Hasad_Presentation_AR.pptx) (Arabic)

![Dashboard](docs/screenshots/en/dashboard.jpg)

---

## Contents

1. [What is Hasad?](#what-is-hasad)
2. [Running the system for the first time](#running-the-system-for-the-first-time)
3. [The key idea: the order of data entry](#the-key-idea-the-order-of-data-entry)
4. [User guide, page by page](#user-guide-page-by-page)
5. [Tools available on every page](#tools-available-on-every-page)
6. [A typical day with Hasad](#a-typical-day-with-hasad)
7. [Using Hasad on a phone](#using-hasad-on-a-phone)
8. [FAQ & troubleshooting](#faq--troubleshooting)
9. [For developers: technologies & project structure](#for-developers-technologies--project-structure)

---

## What is Hasad?

*Hasad* (حصاد) means "harvest" in Arabic. It is an agricultural information system that brings all farm data into one place:

| Module | What it does |
|---|---|
| 🚜 **Farms & fields** | Record farms with their location and area, and divide them into fields with soil type and irrigation system |
| 🌱 **Crops** | Variety, planting and harvest dates, growth progress, expected and actual yield |
| 💧 **Irrigation** | Schedule irrigation per field (date, time, duration, water volume, method) and mark it as done |
| 📋 **Activities** | Plowing, fertilizing, spraying, harvesting… with priority, status, assignee and cost |
| 📦 **Inventory** | Seeds, fertilizers, pesticides and fuel, with low-stock alerts |
| ☀️ **Weather** | Live weather for each farm + a smart irrigation recommendation based on evapotranspiration (ET₀) |
| 📊 **Reports** | Charts for costs, water use and yield, with printing and export to Excel (CSV) |

---

## Running the system for the first time

### Requirements
- **Node.js** version 20.9 or newer — [nodejs.org](https://nodejs.org)
- A free **Supabase** account — [supabase.com](https://supabase.com) (this is the database)

### Step 1: Create the database in Supabase
1. Sign in to Supabase, click **New project**, choose a name and a database password, and wait until the project is ready.
2. From the side menu open **SQL Editor** → **New query**.
3. Open the file [`supabase/schema.sql`](supabase/schema.sql) from this project, copy **all** of it, paste it and click **Run**. You should see *Success*.
4. Under **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`
5. *(Optional, for quick testing)* Under **Authentication** → **Sign In / Providers** → **Email**, turn off **Confirm email** so new users are signed in right after registering.

### Step 2: Connect the app to the database
1. In Supabase open **Project Settings** → **API** (or the **Connect** button) and copy:
   - the **Project URL**
   - the **anon / publishable key**
2. In the project folder, copy `.env.example` to a new file named `.env.local`:

```bash
cp .env.example .env.local
```

3. Open `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Step 3: Run
Open a terminal inside the `agri-farm-system` folder and run this once:

```bash
npm install
```

Then, every time you want to start the system:

```bash
npm run dev
```

Open **http://localhost:3000** in your browser 🎉

> 💡 If the sign-in page shows a yellow message *"Supabase is not configured yet"*, the `.env.local` file is missing or its values are wrong. Fix it, then restart `npm run dev`.

---

## The key idea: the order of data entry

Data in Hasad is linked together, so enter it in this order:

```
Farm  →  Field  →  Crop / Irrigation schedule
  │
  └──────────────→  Activity (belongs to a farm; the field is optional)

Inventory is independent and can be added at any time
```

- You cannot add a **field** before a **farm** exists (a yellow notice appears and the add button is disabled).
- You cannot add a **crop** or an **irrigation schedule** before a **field** exists.
- **Deleting a farm** also deletes all of its fields, crops, irrigation schedules and activities.

> ⚡ **Fastest way to try it:** after creating your account, click **"Load demo data"** on the dashboard. Hasad adds two farms with fields, crops, irrigation, activities and inventory so you can explore every page immediately.

---

## User guide, page by page

### 1. Landing page
The first page of the site. It introduces the system and its features, with buttons to **Start for free** (create an account) or **Sign in**. The top bar has the **language** and **theme (light/dark)** toggles.

![Landing page](docs/screenshots/en/landing.jpg)

### 2. Creating an account and signing in

![Sign in](docs/screenshots/en/login.jpg)

- **Create account:** enter your full name, email, phone (optional), and a password of at least **8 characters**, twice.
  - If email confirmation is enabled in Supabase you will receive an email; open the link, then sign in.
- **Sign in:** email + password. The 👁 icon shows the password.
- **Forgot password?** Enter your email and you will receive a link to choose a new password.
- **Sign out:** the exit icon at the bottom of the side menu, or from your avatar at the top of the page.

> Each user sees only their own data — no other account can see or change your farms.

### 3. Dashboard

![Dashboard](docs/screenshots/en/dashboard.jpg)

The first page after signing in. It gives a complete picture of the farm today:

| Section | Description |
|---|---|
| **Top cards** | Number of farms, total area, active crops, irrigations this week, open tasks, low-stock items |
| **Weather card** | Temperature, humidity, wind and evapotranspiration for the first farm with coordinates, plus a 5-day forecast |
| **Irrigation advice** | A coloured message recommending to postpone, keep or reduce irrigation (see the table below) |
| **Upcoming irrigation** | The next 5 scheduled irrigations, with a **"Today"** badge when due today |
| **Charts** | Activity costs and water usage for the last 6 months (hover a bar to see its value) |
| **Upcoming tasks** | Unfinished tasks; overdue ones carry a red **"Overdue"** badge |
| **Harvest soon** | Crops whose harvest date is approaching |

The **"Schedule irrigation"** and **"Add activity"** buttons at the top open the add form directly.

**How does the irrigation advice work?** Hasad uses the rain forecast and the **FAO reference evapotranspiration (ET₀)** from the Open-Meteo service:

| Condition | Recommendation |
|---|---|
| 🌧️ Rain ≥ 5 mm expected within 48 hours | Postpone irrigation |
| 🔴 ET₀ ≥ 6 mm/day | High demand — keep to the schedule or increase |
| 🟡 ET₀ between 3 and 6 | Moderate demand — normal irrigation plan |
| 🟢 ET₀ below 3 | Low demand — irrigation can be reduced |

> If you see *"Add farm coordinates"* instead of the weather, edit the farm and add its latitude and longitude (or click **Use my current location**).

### 4. Farms

![Farms](docs/screenshots/en/farms.jpg)

- **Add a farm:** click **"Add farm"** and enter:
  - **Farm name** (required), **Location** (e.g. Al-Kharj, Riyadh), **Area** in hectares, **Description**.
  - **Latitude / Longitude**: needed for the weather. Click **"Use my current location"** if you are at the farm, or leave them empty and Hasad will try to find them from the location name.
- Each card shows the area, number of fields and active crops.
- ✏️ edits the farm, 🗑 deletes it (after a confirmation).
- **View details** opens the farm page:

![Farm details](docs/screenshots/en/farm-details.jpg)

The details page shows the farm's own weather, its fields with the crops planted in each, and its latest activities.

### 5. Fields

![Fields](docs/screenshots/en/fields.jpg)

A field is a plot of land inside a farm. When adding one:

| Input | Description |
|---|---|
| Field name \* | e.g. North Field (A) |
| Farm \* | The farm it belongs to |
| Area | In hectares |
| Status \* | Active / Fallow / Preparing |
| Soil type | Clay, sandy, loamy… |
| Irrigation system | Drip, sprinkler, flood, center pivot, manual |

### 6. Crops

![Crops](docs/screenshots/en/crops.jpg)

| Input | Description |
|---|---|
| Crop name \* / Variety | e.g. Wheat — Yecora Rojo |
| Field \* | Where it is planted |
| Planting date / Expected harvest | The harvest must be after planting |
| Status \* | Planned, Planted, Growing, Harvested, Failed |
| Expected / actual yield + unit | In kilograms or tons |

- **Growth progress** is calculated automatically from the planting and expected harvest dates.
- Under the harvest date, **"in X days"** appears and turns orange when 14 days or fewer remain.
- The 🌾 icon next to an active crop marks it **"Harvested"** in one click and records today's date.

### 7. Irrigation

![Irrigation](docs/screenshots/en/irrigation.jpg)

- **Schedule irrigation:** choose the field, date, start time, duration in minutes, water volume (m³), irrigation method and status.

![Add form](docs/screenshots/en/add-form.jpg)

- After watering, click ✓ **"Mark as done"** next to the entry.
- Badges: **"Today"** for irrigations due today, **"Overdue"** for scheduled irrigations whose date has passed.
- Top cards: today's irrigations, this week's, water used this month, and the completion rate.

### 8. Activities

![Activities](docs/screenshots/en/activities.jpg)

Every job on the farm (plowing, planting, fertilizing, spraying, weeding, pruning, harvesting, maintenance):

| Input | Description |
|---|---|
| Title \* and Type \* | e.g. Nitrogen fertilizing — Fertilizing |
| Date \* | When it should be done |
| Farm \* / Field | After choosing a farm, only its fields are listed |
| Priority \* | Low / Medium / High |
| Status \* | Pending, In progress, Completed, Cancelled |
| Cost | In the currency chosen in Settings |
| Assigned to | The worker or engineer responsible |

- Tasks past their date and not completed get an **"Overdue"** badge and appear in the notifications.
- The ✓ button marks a task as **"Completed"** directly.

### 9. Inventory

![Inventory](docs/screenshots/en/inventory.jpg)

- Add an item with its **category**, quantity, unit, **minimum quantity**, unit cost and supplier.
- When the quantity reaches the minimum or below, a red **"Low stock"** badge appears, along with an alert in the notifications.
- **Stock value** = quantity × unit cost.

### 10. Reports

![Reports](docs/screenshots/en/reports.jpg)

- Choose the period: **last 3 / 6 / 12 months**.
- Summary: total costs, water used, harvested yield, inventory value.
- Charts: monthly water, monthly costs, costs by activity type, expected vs. actual yield, crops by status, tasks by status, inventory value by category.
- **Print** button — to save the report as a PDF, choose *Save as PDF* in the print dialog.

### 11. Settings

![Settings](docs/screenshots/en/settings.jpg)

- **Profile:** name, phone and **currency** (SAR, AED, KWD, USD…) — the currency changes on every page.
- **Preferences:** language (العربية / English) and theme (light / dark / system).
- **Security:** change your password.

### 12. Notifications 🔔
The bell icon at the top of the page; the red number is the count of alerts. Clicking it shows:
- Irrigations scheduled for **today**
- **Overdue** tasks
- **Low-stock** inventory items
- Crops to be **harvested** within 14 days

Click any alert to go to the related page.

---

## Tools available on every page

| Tool | How to use it |
|---|---|
| ➕ **Add** | The green button at the top opens the add form. Fields marked \* are required |
| 🔍 **Search** | Type any word or number to search across all columns |
| 🔽 **Filters** | The drop-downs next to the search box (e.g. status, field, type) |
| ↕️ **Sort** | Click any column header to sort ascending/descending |
| ✏️ **Edit** | The pencil icon next to a record |
| 🗑 **Delete** | The bin icon — asks for confirmation first |
| ✓ **Done** | In Irrigation and Activities (🌾 in Crops) |
| ⬇️ **Export CSV** | Downloads the visible data as a file that opens in Excel |
| 📄 **Pages** | Below the table, 10 records per page |
| 🌐 / 🌙 | Switch language and theme from the top bar at any time |

---

## A typical day with Hasad

1. **Morning:** open the dashboard → read the **irrigation advice**, check **upcoming irrigation** and the 🔔 notifications.
2. **In the field:** after watering, tap ✓ on the irrigation entry from your phone.
3. **During the day:** finish tasks, mark each one as completed and record its cost.
4. **When buying supplies:** update inventory quantities (seeds, fertilizer, fuel).
5. **At harvest:** tap 🌾 on the crop, then edit it and enter the **actual yield**.
6. **End of the month:** open **Reports**, review costs, water and yield, and print the report.

---

## Using Hasad on a phone

The site is designed for phones and needs no app — open the link in your phone's browser (you can add it to your home screen).

<p align="center">
  <img src="docs/screenshots/en/mobile-dashboard.jpg" width="240" alt="Dashboard on a phone" />
  &nbsp;
  <img src="docs/screenshots/en/mobile-menu.jpg" width="240" alt="Menu on a phone" />
  &nbsp;
  <img src="docs/screenshots/en/mobile-form.jpg" width="240" alt="Add form on a phone" />
</p>

- **Bottom bar:** Dashboard, Crops, Irrigation, Activities, and **More** to open the full menu.
- **The ☰ menu** at the top opens every section and the sign-out button.
- Tables turn into easy-to-read **cards**, and forms slide up from the **bottom of the screen**.

**Dark mode:**

![Dark mode](docs/screenshots/en/dark-mode.jpg)

---

## FAQ & troubleshooting

<details>
<summary><b>I see "Supabase is not configured yet"</b></summary>

The `.env.local` file is missing or wrong. Check the file name (it starts with a dot) and the values copied from Supabase, then stop the app (`Ctrl + C`) and start it again with `npm run dev`.
</details>

<details>
<summary><b>I registered but cannot sign in: "Please confirm your email address first"</b></summary>

Open the confirmation email (check your spam folder too), or turn off **Confirm email** in Supabase → Authentication → Sign In / Providers → Email.
</details>

<details>
<summary><b>The email confirmation or password reset link doesn't work</b></summary>

Make sure `http://localhost:3000/auth/callback` is listed under **Redirect URLs** and that the **Site URL** is `http://localhost:3000` (or your site's address after deployment).
</details>

<details>
<summary><b>The "Add field" or "Add crop" button is disabled</b></summary>

You need a **farm** before adding fields, and a **field** before adding crops or irrigation schedules. Read the yellow notice above the table.
</details>

<details>
<summary><b>The weather doesn't appear on the dashboard</b></summary>

Edit the farm and add its **latitude** and **longitude**, or click **Use my current location**. The weather needs an internet connection.
</details>

<details>
<summary><b>"Something went wrong" appears when saving</b></summary>

Make sure you ran the whole `supabase/schema.sql` file in Supabase, filled in the required fields (\*), and that the expected harvest date is after the planting date.
</details>

<details>
<summary><b>How do I remove the demo data?</b></summary>

Delete the two demo farms from the **Farms** page (everything linked to them is deleted too), then delete the items on the **Inventory** page.
</details>

<details>
<summary><b>How do I change the student or university name in the landing-page footer?</b></summary>

In the file [`src/lib/site.ts`](src/lib/site.ts).
</details>

---

## For developers: technologies & project structure

### Technologies
- **Next.js 16** (App Router, Server Components, Server Actions, `proxy.ts`) + **React 19** + **TypeScript**
- **Supabase** (PostgreSQL + Auth + Row Level Security) via `@supabase/ssr`
- **Tailwind CSS 4**, **Recharts**, **lucide-react**, **zod**, **sonner**, **next-themes**
- **Open-Meteo** for weather and geocoding (free, no API key)

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run lint` | Lint the code |

### Project structure

```
supabase/schema.sql          ← tables + RLS policies + triggers
docs/screenshots/            ← screenshots for the guides (en / ar)
src/
├─ proxy.ts                  ← session refresh and /dashboard route protection
├─ app/
│  ├─ page.tsx               ← landing page
│  ├─ (auth)/                ← sign in, sign up, forgot/reset password
│  ├─ auth/callback/         ← handles email links from Supabase
│  └─ dashboard/             ← dashboard and all management, reports and settings pages
├─ components/
│  ├─ ui/                    ← shared components (Button, Modal, Card, Badge…)
│  ├─ resource/              ← generic CRUD table + form (search, filters, sort, export, mobile cards)
│  ├─ views/                 ← UI for each page (crops, irrigation, activities…)
│  └─ dashboard/             ← sidebar, top bar, weather, notifications
└─ lib/
   ├─ actions/               ← Server Actions (save/delete, auth, profile, demo data)
   ├─ i18n/                  ← Arabic and English dictionaries
   ├─ validations.ts         ← input validation with zod
   ├─ weather.ts             ← weather and irrigation advice
   └─ data.ts / analytics.ts ← data loading and statistics
```

### Database

| Table | Description |
|---|---|
| `profiles` | User profile (name, phone, currency) — created automatically on sign-up |
| `farms` | Farms (location, area, coordinates) |
| `fields` | Fields inside each farm (soil, irrigation system, status) |
| `crops` | Crops in each field (dates, status, yield) |
| `irrigation_schedules` | Irrigation schedules (date, time, duration, water, method, status) |
| `activities` | Activities and tasks (type, priority, cost, assignee) |
| `inventory_items` | Inventory (category, quantity, minimum, cost) |

**Security:** every table has Row Level Security enabled (each user can only read and change their own rows), an `assert_same_owner` trigger prevents linking a record to another user's farm or field, and all input is validated on the server with zod.

### Deploying (Vercel)
1. Push the project to GitHub, then import it at [vercel.com](https://vercel.com).
2. Add the same environment variables, plus `NEXT_PUBLIC_SITE_URL` with your site's address.
3. In Supabase, set your site's address as the **Site URL** and add `https://your-site/auth/callback` to **Redirect URLs**.

### Customising
- Student, university and supervisor names: [`src/lib/site.ts`](src/lib/site.ts)
- Texts and translations: [`src/lib/i18n/dictionaries/`](src/lib/i18n/dictionaries/)
- Colours: [`src/app/globals.css`](src/app/globals.css)
