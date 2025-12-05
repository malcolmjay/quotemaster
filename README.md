# Quote and Bid Management Tool

A comprehensive quote and bid management system built with React, TypeScript, and Supabase for seamless backend integration.

## 🚀 Features

- **User Authentication**: Secure email/password authentication with Supabase Auth
- **Quote Management**: Create, edit, and track quotes with real-time updates
- **Product Catalog**: Comprehensive product management with inventory tracking
- **Customer Management**: Complete customer profiles with analytics
- **Cross-Reference System**: Multi-dimensional part number lookup
- **Cost Analysis**: Advanced margin calculation and pricing tools
- **Real-time Updates**: Live synchronization across all users
- **Responsive Design**: Mobile-first design that works on all devices

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **Build Tool**: Vite
- **Icons**: Lucide React
- **State Management**: React Context + Supabase hooks

## 📋 Prerequisites

### For Cloud Deployment (Supabase Cloud)
- Node.js 16+
- npm or yarn
- Supabase account

### For Self-Hosted Deployment
- Linux server (Ubuntu 20.04+ recommended)
- Docker 20.10+
- Docker Compose 1.29+
- 4GB RAM, 2 CPU cores minimum
- 20GB free disk space

## 🔧 Installation & Setup

### Quick Start - Self-Hosted Deployment (Recommended)

For a complete self-hosted deployment with Supabase on Docker, follow our comprehensive guide:

**[→ Self-Hosted Quick Start Guide](SELF-HOSTED-QUICKSTART.md)** - Get up and running in 5 minutes!

```bash
# One-command setup
sudo ./scripts/setup-selfhosted.sh
```

This includes:
- Complete Supabase stack (PostgreSQL, Auth, REST API, Realtime, Storage, Studio)
- Automated database setup and migrations
- Secure key generation
- SSL certificate setup
- Health monitoring

See also:
- [Self-Hosted Deployment Guide](SELF-HOSTED-DEPLOYMENT.md) - Detailed architecture and configuration
- [Database Setup Guide](DATABASE-SETUP-GUIDE.md) - Database schema and migrations

---

### Alternative: Cloud Deployment (Supabase Cloud)

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd quote-bid-management-tool
npm install
```

#### 2. Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database migrations**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
   - Then run `supabase/migrations/002_seed_data.sql` for sample data

3. **Configure Authentication**:
   - In Supabase dashboard, go to Authentication > Settings
   - Disable email confirmations for development (optional)
   - Configure any additional auth providers if needed

4. **Get your Supabase credentials**:
   - Go to Settings > API
   - Copy your Project URL and anon/public key

### 3. Environment Configuration

1. **Copy the environment template**:
```bash
cp .env.example .env
```

2. **Update your `.env` file**:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=QuoteMaster Pro
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄 Database Schema

The application uses the following main tables:

- **profiles** - User profiles extending Supabase auth
- **customers** - Customer management
- **customer_users** - Customer contacts
- **products** - Product catalog
- **inventory_levels** - Stock management
- **quotes** - Quote management
- **quote_line_items** - Quote line items
- **cross_references** - Part number cross-references
- **price_breaks** - Supplier pricing tiers
- **reservations** - Inventory reservations
- **cost_analysis** - Cost analysis data

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- **User-based data isolation** - users can only access their own data
- **Secure authentication** with Supabase Auth
- **API key protection** through environment variables

## 📱 Key Features

### Authentication
- Email/password sign up and sign in
- Secure session management
- Protected routes

### Quote Management
- Create and edit quotes
- Real-time collaboration
- PDF generation
- Status tracking (Draft, Sent, Won, Lost, etc.)

### Product Catalog
- Visual product browser
- Real-time inventory levels
- Advanced search and filtering
- Price break management

### Customer Analytics
- Performance metrics
- Win/loss analysis
- Historical trends
- Profitability tracking

### Cross-Reference System
- Multi-dimensional part lookup
- Customer-specific part numbers
- Usage frequency tracking

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)

1. **Build the application**:
```bash
npm run build
```

2. **Deploy to your preferred platform**:
   - **Netlify**: Connect your repository and set environment variables
   - **Vercel**: Import project and configure environment variables
   - **Other platforms**: Upload the `dist` folder

3. **Configure environment variables** on your deployment platform with the same values from your `.env` file

### Supabase Configuration

Your Supabase project is already configured and ready. No additional deployment needed for the backend.

## 🔧 Development

### Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── layout/         # Header, Navigation
│   ├── quote/          # Quote management
│   ├── catalog/        # Product catalog
│   ├── customer/       # Customer management
│   └── management/     # Quote management
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Supabase client and utilities
└── types/              # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

1. **Database changes**: Add migrations to `supabase/migrations/`
2. **API functions**: Add to `src/lib/supabase.ts`
3. **React hooks**: Create custom hooks in `src/hooks/`
4. **Components**: Follow existing patterns in `src/components/`

## 🐛 Troubleshooting

### Common Issues

1. **Supabase connection errors**:
   - Verify your environment variables
   - Check Supabase project status
   - Ensure RLS policies are correctly configured

2. **Authentication issues**:
   - Check if email confirmation is disabled for development
   - Verify auth settings in Supabase dashboard

3. **Data not loading**:
   - Check browser console for errors
   - Verify RLS policies allow data access
   - Ensure user is properly authenticated

### Getting Help

- Check the browser console for detailed error messages
- Review Supabase logs in the dashboard
- Ensure all environment variables are correctly set

## 📊 Performance Considerations

- **Database indexing**: Indexes are created for frequently queried columns
- **Real-time subscriptions**: Used judiciously to avoid excessive updates
- **Lazy loading**: Components load data as needed
- **Caching**: Supabase client handles caching automatically

## 🔄 Data Migration

If migrating from an existing system:

1. **Export existing data** to CSV format
2. **Transform data** to match the new schema
3. **Use Supabase dashboard** to import data
4. **Run data validation** queries to ensure integrity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

---

**QuoteMaster Pro** - Professional quote management made simple with Supabase integration.