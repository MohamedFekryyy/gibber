# Gibber-as-a-Service

A subscription-based version of the [Gibber](https://github.com/gibber-cc/gibber) live-coding music platform, featuring cloud storage, user accounts, and analytics.

## Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **Cloud Storage**: Save and load your projects from anywhere
- **Original Gibber Experience**: Maintains the core functionality and UI of Gibber
- **Usage Analytics**: Track usage patterns to improve the platform
- **Local Development Server**: Easy setup for local development

## Setup

### Prerequisites

- Node.js 14 or later
- npm or pnpm
- A Supabase account (free tier works for development)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/your-username/gibber-saas.git
   cd gibber-saas
   ```

2. Install dependencies:
   ```
   cd playground
   npm install
   ```

3. Configure Supabase:
   
   - Create a new Supabase project at [https://supabase.com](https://supabase.com)
   - Create the following tables in your Supabase database:
     - `projects`: Store project metadata
     - `subscriptions`: Store user subscription information
     - `usage_logs`: Track user activity
   - Create a storage bucket named `gibber-projects`
   - Update `playground/supabase.js` with your Supabase URL and anon key:
     ```javascript
     const SUPABASE_URL = 'https://your-project.supabase.co';
     const SUPABASE_ANON_KEY = 'your-anon-key';
     ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Projects Table

```sql
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  storage_path TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name, user_id)
);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT
);
```

### Usage Logs Table

```sql
CREATE TABLE usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Usage

### Authentication

- Click the "Login" button in the top right to sign up or log in
- User accounts will be stored in Supabase Auth

### Saving and Loading Projects

- Click the "save" button to save your current code
- Click the "load" button to see a list of saved projects and load one

### Running the Code

- Write JavaScript code in the editor
- Press Ctrl+Enter (or Cmd+Enter on Mac) to run the selected code or the current line

## Deployment

1. Update the Supabase configuration with your production credentials
2. Deploy to your preferred hosting platform:
   - Heroku, Vercel, Netlify, etc.
   - Or use Docker with the provided configuration

## Next Steps

- Implement Stripe subscription management
- Add AI assistance for live coding
- Enhance collaboration features with Supabase Realtime

## License

MIT

## Credits

Based on the [Gibber](https://github.com/gibber-cc/gibber) project by Charlie Roberts. 