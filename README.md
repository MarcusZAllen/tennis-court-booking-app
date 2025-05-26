# 🎾 Tennis Court booking app 

This project is an early prototype of a **tennis court availability aggregator** for public courts in London. Booking a court is currently frustrating because each venue uses a different system. This app solves that by **scraping multiple booking websites** and displaying all available slots in one place.
---

## 🚀 What This Project Does

- Scrapes availability data from court booking sites like Park Sports or ClubSpark.
- Outputs structured court slot information (court name, date, time).
- Displays available slots in a user-friendly frontend (Lovable or Framer).
- Allows user to quickly book a an available court from the website.
- Built for flexibility — start simple and grow into a full product.

## 📦 Project Structure
tennis-court-scraper-template/
├── scrape.js               # Main scraper logic using Playwright
├── package.json            # Dependencies and scripts
├── .gitignore              # Hides node_modules and secrets
├── README.md               # You’re reading it!
├── data/                   # Optional: save scraped output here
├── examples/               # Optional: mock data or sample output

## 🚀 How to Use

1. Clone or download this repo.
2. Run `npm install` to install Playwright.
3. Run the scraper with `node scrape.js`.

## 📁 Output

Scraped court slots will be printed to the console. You can modify the script to save results to `data/output.json`.

## ⚠️ Note

This is for educational or personal use only. Be mindful of scraping limits and website terms of service.
