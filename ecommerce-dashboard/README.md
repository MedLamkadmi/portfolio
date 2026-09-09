# E‑commerce Dashboard (Canada)

A responsive admin dashboard for an e‑commerce platform targeting the Canadian market, built with **HTML5 + Bootstrap 4** and the Gelr palette (`#6f42c1`, `#e7e3e2`, `#28a745`, `#dc3545`).  

## Features
- Responsive sidebar (Home, Orders, Products, Customers, Analytics, Settings)  
- Top navigation with alerts & user profile  
- Card‑based widget grid: total sales, total orders, avg order value, growth %  
- **Top Products** widget with thumbnails, names, prices (CAD), sales count  
- **Recent Orders** table: order ID, customer, total, date, status badges (processing/shipped/delivered/cancelled)  
- **Sales Trend** line chart of daily sales (last 30 days) using Chart.js  
- Mock data: prices in CAD, typical Canadian order statuses, sample products (e.g., “Canadian‑made leather jacket”, “Maple‑syrup gift set”)  

## Tech Stack
- HTML5, Bootstrap 4 CSS (Gelr palette)  
- Chart.js for sparkline/line chart  
- Optional Laravel Blade views, Eloquent models (Product, Order, Customer), seeders, routes & controllers (if you want a full Laravel backend)  

## Quick start (Laravel)
```bash
cd ecommerce-dashboard
composer install
npm install && npm run dev
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```
Visit `http://localhost:8000` to see the dashboard.

## Screenshot
![E‑commerce Dashboard screenshot](preview.png)

---

*Feel free to fork, modify, or use this as a starter for your own admin dashboards.*