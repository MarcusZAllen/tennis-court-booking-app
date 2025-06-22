<<<<<<< HEAD
T# 🎾 Tennis Court Booking App
=======
# 🎾 Tennis Court Booking App
>>>>>>> 121eb37ae1536e4b7f8ac3003b18dd8c6af8b0fa

A script-based tool to aggregate publicly available tennis court booking data across different platforms in London. The goal is to maximize your chances of booking a court — without jumping across multiple outdated websites.

---

## 🚀 What This Project Does

- Scrapes availability data from court booking sites like Park Sports or ClubSpark.
- Outputs structured court slot information (court name, date, time, cost).
- (Planned) Displays available slots in a user-friendly frontend (Lovable or Framer).
- (Planned) Allows users to book an available court directly from the website.
- Built for flexibility — start simple and grow into a full product.

---

## 📦 Project Structure

```
tennis-court-booking-app/
├── scrapers/                  # Individual scrapers for each booking site
│   ├── parksports.js          # done
│   └── clubspark.js           # (planned)
├── runner/                    # Scripts that orchestrate scrapers
│   ├── scrape-multiple-dates.js 
│   └── scrape-all-sites.js
├── data/                      # Scraped output and debug files
│   ├── output.json
│   └── debug.html
├── utils/                     # Helper functions (optional, planned)
├── package.json
└── README.md
```

---

## 👋 How to Use

1. Clone or download this repo.
2. Run `npm install` to install dependencies (e.g. Playwright).
3. Run the scraper with:

```
node scrapers/parksports.js
```

4. (Planned) To scrape multiple dates:

```
node runner/scrape-multiple-dates.js
```

---

## 📁 Output

- Scraped court slots are printed to the console.
- They are also saved to:

```
data/output.json
```

This will later feed into a frontend calendar view.

---

## 📊 Data Format

Each slot is output like this:

```json
{
  "provider": "parksports",
  "court": "Regents Park",
  "date": "2025-06-03",
  "readableTime": "14:00 - 15:00",
  "cost": "£16.40"
}
```

---

## 🧠 Roadmap

- [x] Scrape Park Sports availability  
- [ ] Loop over multiple dates  
- [ ] Add support for ClubSpark  
- [ ] Combine multiple scrapers into a unified output  
- [ ] Display results in a calendar UI  
- [ ] Deploy as scheduled cloud task  

---

## ⚠️ Disclaimer

<<<<<<< HEAD
This project is for educational or personal use only. Be mindful of scraping limits and website terms of service.
=======
This project is for educational or personal use only. Be mindful of scraping limits and website terms of service.
>>>>>>> 121eb37ae1536e4b7f8ac3003b18dd8c6af8b0fa
