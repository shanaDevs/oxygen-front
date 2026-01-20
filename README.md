# Oxygen POS - Frontend

A modern Point of Sale (POS) system frontend built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** - Overview of sales, orders, and top products
- **Products** - Manage product inventory with search and filtering
- **Sales** - View and manage all sales transactions
- **POS Terminal** - Full-featured point of sale interface with cart
- **Settings** - Configure store settings and API connection

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd oxygen-front
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
 app/                    # Next.js App Router pages
    page.tsx           # Dashboard (home page)
    products/          # Products management
    sales/             # Sales history
    pos/               # POS terminal
    settings/          # Settings page
 components/            # Reusable React components
    dashboard/         # Dashboard-specific components
    products/          # Product-related components
    sales/             # Sales-related components
    layout/            # Layout components (Sidebar, Header)
    ui/                # Generic UI components
 data/                  # Dummy data for development
    products.ts
    categories.ts
    sales.ts
    users.ts
    customers.ts
 services/              # API service layer
    config.ts          # API configuration
    productService.ts
    categoryService.ts
    saleService.ts
    dashboardService.ts
 types/                 # TypeScript type definitions
     index.ts
```

## Using Dummy Data vs Real Backend

The project is configured to use **dummy data by default** for development. 

### To switch to Express.js backend:

1. Open `src/services/config.ts`
2. Change `USE_MOCK_DATA: true` to `USE_MOCK_DATA: false`
3. Update `.env.local` with your backend URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### Expected Backend API Endpoints

When connecting to your Express.js backend, implement these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | Get all products |
| `/api/products/:id` | GET | Get product by ID |
| `/api/products` | POST | Create product |
| `/api/products/:id` | PUT | Update product |
| `/api/products/:id` | DELETE | Delete product |
| `/api/categories` | GET | Get all categories |
| `/api/sales` | GET | Get all sales |
| `/api/sales` | POST | Create sale |
| `/api/sales/:id/cancel` | POST | Cancel sale |
| `/api/dashboard` | GET | Get dashboard stats |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
