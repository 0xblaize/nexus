# Team Notifications & Signal Email System

Real-time email notifications for team members when signals are detected.

## 🚀 Quick Start

### 1. Configure Email Credentials

Update `.env.local` with your email provider:

```bash
# Gmail (Recommended)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Generate at https://myaccount.google.com/apppasswords

# Or use your own SMTP server
```

### 2. Add Team Members

Visit Settings → Team Members and add team members:
- **Email**: Team member's email address
- **Name**: Full name
- **Role**: Admin or Member

Or use the API:

```bash
curl -X POST http://localhost:3000/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teammate@example.com",
    "name": "John Doe",
    "role": "member"
  }'
```

### 3. Integrate with Signal Generation

When signals are detected, call the notification function:

```javascript
import { notifyTeamOfSignals } from "@/lib/signal-notifications";

// After generating signals
await notifyTeamOfSignals({
  company: "Acme Corp",
  signals: [
    { type: "regulatory", title: "New Filing", detail: "...", weight: 0.8 },
    { type: "news", title: "Executive Move", detail: "...", weight: 0.6 },
  ],
  score: 78,
  recommendation: "Buy interest",
});
```

Or send via API endpoint:

```bash
curl -X POST http://localhost:3000/api/notifications/team-signals \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Acme Corp",
    "signals": [...],
    "score": 78,
    "recommendation": "Buy interest"
  }'
```

## 📧 Email Templates

### Signal Alert Email
- Company name
- Score and recommendation
- Top 5 signals with types and titles
- Link to dashboard

### Daily Digest Email (future)
- Summary table of all monitored companies
- Scores and signal counts
- Recommendation status

## 🔌 API Endpoints

### Team Management

**GET /api/team**
- Get all active team members
- Returns: `{ success, members, count }`

**POST /api/team**
- Add a team member
- Body: `{ email, name, role? }`
- Returns: `{ success, message, member }`

**PATCH /api/team**
- Update team member
- Body: `{ email, name?, role? }`
- Returns: `{ success, message, member }`

**DELETE /api/team**
- Remove team member (soft delete)
- Body: `{ email }`
- Returns: `{ success, message, member }`

### Notifications

**POST /api/notifications/team-signals**
- Send signal notification to all team members
- Body: `{ company, signals, score, recommendation }`
- Returns: `{ success, message, notified, company }`

## 🗄️ Database Schema

### team_members table

```sql
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 🔒 Security

- Email credentials stored in environment variables only
- Team members soft-deleted (status='inactive')
- Authentication required for all team endpoints
- Requires NextAuth session

## 📝 Usage Examples

### Example 1: Send Signal After Analysis

```javascript
import { notifyTeamOfSignals } from "@/lib/signal-notifications";

async function analyzeCompany(company) {
  // ... analysis code ...
  
  const result = await runAnalysis(company);
  
  // Notify team of important findings
  if (result.score > 70 && result.signals.length > 0) {
    await notifyTeamOfSignals({
      company: result.company,
      signals: result.signals,
      score: result.score,
      recommendation: result.recommendation,
    });
  }
  
  return result;
}
```

### Example 2: Notify via API Route

```typescript
// In your analyze/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const result = await performAnalysis(company);
  
  // Send notifications
  try {
    await fetch("/api/notifications/team-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: result.company,
        signals: result.signals,
        score: result.score,
        recommendation: result.recommendation,
      }),
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
    // Don't fail the analysis if notification fails
  }
  
  return NextResponse.json(result);
}
```

## 🐛 Troubleshooting

### Emails not sending

1. Check `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env.local`
2. For Gmail: Use App Password, not your regular password
3. Check database has `team_members` table (run migration if needed)
4. Verify team members are added and have status='active'

### Database errors

1. Ensure `DATABASE_URL` is configured
2. Run migrations: `npm run db:migrate`
3. Check database has `team_members` table

### No team members showing

1. Verify members were added: `GET /api/team`
2. Check status field is 'active' in database
3. Ensure authenticated (NextAuth session required)

## 📚 Related Files

- [Email Service](./email.js)
- [Team Management](./team-members.js)
- [Team API Routes](../app/api/team/route.ts)
- [Notification Routes](../app/api/notifications/team-signals/route.ts)
- [UI Component](../components/settings/TeamManagement.tsx)
- [Types](../types/nexus.ts)

## 🔄 Real-time Flow

```
Signal Detection
    ↓
Analysis Complete
    ↓
notifyTeamOfSignals()
    ↓
Get Active Team Members from DB
    ↓
Send Email to Each Member
    ↓
Log Success/Failure
```

## 💡 Future Enhancements

- [ ] Slack integration (currently Teams & Email)
- [ ] SMS notifications
- [ ] Weekly digest emails
- [ ] Signal type filtering per member
- [ ] Company subscription per member
- [ ] Notification history/audit log
- [ ] Digest scheduling
- [ ] Push notifications
