# AllSmart Hub ⚡

<img width="1168" height="821" alt="image" src="https://github.com/user-attachments/assets/0dc9f44c-bf11-4a2b-9d81-cadcf3181a74" />
<img width="1177" height="597" alt="image" src="https://github.com/user-attachments/assets/82d61407-d6f4-43e4-ab97-85f95d3796f7" />


Nowoczesna aplikacja webowa do centralnego zarządzania ekosystemem inteligentnego domu oraz monitorowania zużycia energii w czasie rzeczywistym.

---

## 🚀 Główne Funkcjonalności

- **Pulpit Urządzeń (Dashboard):** Podgląd stanu urządzeń (online/offline), kontrola przełączników on/off, zarządzanie poziomem jasności oraz temperatury barwowej oświetlenia.
- **Kategoryzacja Pomieszczeń:** Przypisywanie urządzeń do konkretnych pokoi w mieszkaniu z opcją elastycznego filtrowania.
- **Monitorowanie Zużycia Energii:** Rejestrowanie bieżącego poboru mocy (W) oraz generowanie logów telemetrycznych (`EnergyLog`).
- **Profile Ochronne & Auto-Restore:** Mechanizm pamięci ostatnich nastaw urządzeń i ich bezpiecznego przywracania po resecie zasilania.
- **Architektura Multi-User:** Izolacja danych na poziomie użytkownika w oparciu o relacje bazodanowe.

---

## 🛠️ Stack Technologiczny

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React Server Components & API Routes)
- **Baza danych:** [PostgreSQL](https://www.postgresql.org/) (Supabase)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Styling:** Tailwind CSS + Lucide Icons
- **Język:** TypeScript

---

## 🗄️ Model Danych (Prisma)

Aplikacja wykorzystuje relacyjny model danych zaprojektowany pod elastyczne typy integracji:

* **`User`** – dane użytkowników, relacje do pomieszczeń i sprzętów.
* **`Room`** – organizacja przestrzenna lokalu.
* **`Device`** – stan logiczny, parametry świecenia, status online oraz relacja do pomieszczenia i użytkownika.
* **`EnergyLog`** – historia pomiarów poboru prądu i całkowitego zużycia energii.
* **`Integration`** – konfiguracja zewnętrznych konektorów (m.in. Tuya Cloud, Local LAN, Home Assistant, Manual Mock).

---

## ⚙️ Uruchomienie Lokalne

1. **Sklonuj repozytorium:**
   ```bash
   git clone <url-twojego-repozytorium>
   cd allsmart

   
Zainstaluj zależności:
Bash
npm install

Skonfiguruj zmienne środowiskowe:
Utwórz plik .env w głównym katalogu i uzupełnij dane połączenia z bazą:

Fragment kodu
DATABASE_URL="postgresql://user:password@host:port/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/dbname"

Wykonaj migracje bazy danych:
Bash
npx prisma db push
# lub
npx prisma migrate dev
Uruchom serwer deweloperski:

Bash
npm run dev
Aplikacja będzie dostępna pod adresem: http://localhost:3000.
