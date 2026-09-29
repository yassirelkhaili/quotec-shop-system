# Online-Shop (QuoTec Probeaufgabe)

Ein kleiner Shop: Produkte nach Kategorien durchsuchen, Warenkorb füllen und als angemeldeter Kunde bestellen.
Basiert auf dem Laravel React Starter Kit (Laravel 13, Inertia 3, React, TypeScript, Tailwind, shadcn/ui) mit MySQL.

## Starten

Voraussetzungen: PHP 8.3+ mit `pdo_mysql`, Composer, Node 22+, Docker.

```bash
git clone git@github.com:yassirelkhaili/quotec-shop-system.git
cd quotec-shop-system
composer install
npm install
cp .env.example .env
php artisan key:generate
docker compose up -d            # MySQL auf Port 3307, phpMyAdmin auf 8080
```

Datenbank in der `.env` eintragen:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=shop
DB_USERNAME=root
DB_PASSWORD=0000
```

```bash
php artisan migrate --seed
composer run dev
```

Danach http://localhost:8000 öffnen.

| Login | Passwort | Kundennummer |
|---|---|---|
| test@example.com | password | K-10001 |
| anna@example.com | password | K-10002 |

Datenbank im Browser: http://localhost:8080 (root / 0000).

## Funktionsweise

**Seitenaufruf:** `GET /` → `ShopController@index` lädt die Kategorien und 8 Produkte pro Seite, sortiert nach dem Kategoriebaum, und rendert `pages/home.tsx` über Inertia (keine eigene API).

**Warenkorb (nur im Browser):** Der Warenkorb liegt im React-State und im `localStorage`, bleibt also beim Seitenwechsel und beim Anmelden erhalten. Mengen sind auf den Bestand begrenzt; Summen werden in Cent berechnet (Netto, 19 % MwSt., Brutto).

**Bestellung:** `POST /orders` (nur angemeldet) → `StoreOrderRequest` prüft, ob die Kundennummer zum Konto gehört → `OrderController` in einer Transaktion: Produkte sperren, Bestand prüfen, Bestellung und Positionen speichern, Bestand senken. Anschließend wird `storage/app/private/orders/order_<id>.json` geschrieben und zur Startseite mit einer Bestätigung weitergeleitet.

**Kundennummer:** Jeder Benutzer erhält beim Anlegen `K-(10000 + id)` (`AppServiceProvider`). Sie steht im Header und ist beim Bestellen vorausgefüllt.

Preise und Bestand kommen immer aus der Datenbank; der Browser sendet nur Produkt-IDs und Mengen.

## Wo liegt was

```
app/
  Http/Controllers/ShopController.php    Daten der Startseite (Kategorien, Produkte mit Paginierung)
  Http/Controllers/OrderController.php   Bestellung speichern (Datenbank + JSON-Datei)
  Http/Requests/StoreOrderRequest.php    Validierung der Bestellung
  Models/                                Category, Product, Order, OrderItem (+ User)
  Providers/AppServiceProvider.php       vergibt die Kundennummer
database/
  migrations/                            Shop-Tabellen, customer_no in users
  factories/, seeders/                   Kategorien in 3 Ebenen, 36 Produkte, 2 Testbenutzer
routes/web.php                           GET /, POST /orders
resources/js/
  pages/home.tsx                         Shop-Seite: Kategorien, Produkte, Warenkorb, Bestellung
  components/shop/                       CategoryTree, Pagination
  layouts/shop-layout.tsx                Header mit Logo, Kundennummer, Profilmenü
  lib/shop.ts                            Hilfsfunktionen: Kategoriebaum, Warenkorb, Summen, Formatierung
  types/shop.ts                          gemeinsame TypeScript-Typen
compose.yaml                             MySQL 8.4 + phpMyAdmin
```

Tabellen: `categories` (mit `parent_id` auf sich selbst), `products`, `orders`, `order_items` sowie `users.customer_no`.

## Prüfungen

```bash
npm run types:check     # TypeScript
npm run check:fix       # Frontend formatieren + prüfen
vendor/bin/pint         # PHP formatieren
```