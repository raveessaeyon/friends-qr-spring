# Friends QR Circle

Friends QR Circle is a React + Vite app for browsing and sharing payment QR codes, connected to **Supabase** as its cloud backend (PostgreSQL database & object storage).

---

## ⚡ Supabase Setup

### 1. Run the Database & Storage Script
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project, click on **SQL Editor** from the left navigation.
3. Open or copy the contents of [`supabase_schema.sql`](file:///c:/Users/HP/Documents/GitHub/friends-qr-spring/supabase_schema.sql).
4. Click **Run**. This will:
   - Create the `public.qr_codes` table.
   - Configure Row Level Security (RLS) policies.
   - Create the public `qr-images` storage bucket with upload and view policies.

### 2. Configure Environment Variables
Create a `.env` (or `.env.local`) file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Where to find credentials**: In Supabase Dashboard, go to **Project Settings** > **API**. Copy the Project URL and the `anon` / `public` API key.
> 
> *Note: If credentials are not set, the app will run in local fallback mode using browser `localStorage`.*

---

## 🚀 Run Locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite in your browser (e.g. `http://localhost:5173`).

To build for production:
```powershell
npm run build
npm run preview
```

---

## ☕ Connecting Spring Boot to Supabase (Optional)

If you are running a Java / Spring Boot backend service and want to connect it to the same Supabase PostgreSQL database:

1. In Supabase Dashboard, go to **Project Settings** > **Database** > **Connection string** > **URI** (or JDBC).
2. Configure `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require
spring.datasource.username=postgres
spring.datasource.password=YOUR_DATABASE_PASSWORD
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
```
