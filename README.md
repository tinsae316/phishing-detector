# Phishing URL Detection System

A complete, production-ready phishing URL detection system with real-time scanning, threat intelligence integration, and admin management capabilities.

## 🏗️ System Architecture

The system consists of three main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firefox       │    │   Backend API   │    │   Admin         │
│   Extension     │◄──►│   (Node.js)     │◄──►│   Dashboard     │
│   (MV2)         │    │   + Prisma      │    │   (Next.js)     │
└─────────────────┘    │   + PostgreSQL  │    └─────────────────┘
                       └─────────────────┘
```

### 🔍 Detection Flow

1. **URL Input**: User visits a website or right-clicks a link
2. **Extension Scan**: Firefox extension sends URL to backend API
3. **Multi-Layer Analysis**: Backend performs rule-based + external intelligence checks
4. **Verdict**: Returns safe/suspicious/unsafe with score and reasons
5. **Action**: Extension blocks unsafe pages, shows warnings for suspicious

## 📁 Project Structure

```
phishing-detector/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── services/        # Core scanning logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, validation
│   │   └── lib/            # Config, database
│   └── prisma/             # Database schema & migrations
├── dashboard/              # Next.js admin interface
│   └── app/               # React pages (login, threats, logs)
├── extension/             # Firefox WebExtension (MV2)
│   ├── background.js      # Service worker logic
│   ├── popup.html         # Extension popup UI
│   ├── block.html         # Blocking page
│   └── options.html       # Settings page
└── docker-compose.yml     # PostgreSQL (optional)
```

## 🧠 Detection Logic

### Backend Scanner (`backend/src/services/scanner.ts`)

The core detection engine uses a multi-layered approach:

#### 1. **Threat Database Matching** (Highest Priority)
- Direct pattern matching against admin-defined threats
- Supports exact domains and regex patterns
- Severity-based scoring:
  - `high` → +80 points (forces unsafe verdict)
  - `medium` → +60 points (likely unsafe)
  - `low` → +30 points (suspicious)

#### 2. **Rule-Based Heuristics**
- **Subdomain Analysis**: Long chains (>4 levels) → +10
- **Hostname Length**: Very long (>50 chars) → +8
- **Numeric Patterns**: Long digit sequences → +5
- **Separator Abuse**: Repeated `-_.` → +6
- **Control Characters**: Non-printable chars → +10
- **Homograph Detection**: Mixed scripts (Cyrillic + Latin) → +25
- **Brand Typosquatting**: Known brands in subdomains → +12
- **Protocol Security**: Non-HTTPS → +20

#### 3. **External Intelligence** (Optional)
- **Google Safe Browsing API**: Known malicious URLs → +60
- **VirusTotal API**: Community threat reports → +5 per detection

#### 4. **Scoring & Verdict**
```typescript
score = ruleScore + externalScore
if (score >= 70) verdict = "unsafe"
else if (score >= 35) verdict = "suspicious"
else verdict = "safe"
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - Admin login (email/password → JWT)

### URL Scanning
- `POST /scan-url` - Analyze URL, returns verdict + score + reasons

### Admin Management (JWT Required)
- `GET /threats` - List threat entries (with search)
- `POST /threats` - Create new threat rule
- `PUT /threats/:id` - Update threat rule
- `DELETE /threats/:id` - Remove threat rule
- `GET /logs` - View detection logs (with filters)

## 🗄️ Database Schema

### AdminUser
- Admin authentication for dashboard access

### ThreatEntry
- `pattern`: Domain or regex to match
- `isRegex`: Boolean flag for regex patterns
- `severity`: high/medium/low impact
- `source`: Origin (manual, feed, etc.)
- `notes`: Optional description

### DetectionLog
- Complete audit trail of all scans
- Stores URL, verdict, score, reasons
- Tracks client IP and user agent
- Links to matched threat IDs

## 🌐 Firefox Extension

### Manifest V2 Compatibility
- Uses `browserAction` instead of `action` for MV2
- Background script handles all scanning logic
- Context menu integration for link scanning

### Scanning Triggers
1. **Tab Load Complete**: Auto-scan when page finishes loading
2. **Tab Activation**: Scan when switching to a tab
3. **Extension Install**: Initial scan of current tab
4. **Context Menu**: Right-click "Scan this link"

### User Experience
- **Safe**: No visual indicator
- **Suspicious**: Orange "!" badge on extension icon
- **Unsafe**: Redirects to blocking page with details

### Blocking Page
- Shows warning message with risk score
- Displays the blocked URL
- Option to close tab
- Customizable styling

## 🖥️ Admin Dashboard

### Next.js App Router
- Modern React with TypeScript
- Server-side rendering for better SEO
- Client-side state management

### Pages
- **Login** (`/login`): Admin authentication
- **Dashboard** (`/`): Overview statistics
- **Threats** (`/threats`): CRUD threat management
- **Logs** (`/logs`): Detection history with filters

### Features
- Real-time statistics (total scans, unsafe, suspicious)
- Threat rule management with severity levels
- Log filtering by date, severity, URL search
- Responsive design for mobile/desktop

## 🔧 Configuration

### Environment Variables (`backend/.env`)
```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Security
JWT_SECRET="your-secret-key"
FORCE_HTTPS=true  # Production only

# External APIs (Optional)
SAFE_BROWSING_API_KEY="google-api-key"
VIRUSTOTAL_API_KEY="virustotal-api-key"
```

### Extension Configuration
- API Base URL (defaults to `http://localhost:4000`)
- Accessible via Options page or storage API

## 🚀 Deployment

### Backend Deployment
1. Set environment variables
2. Run database migrations: `npx prisma migrate deploy`
3. Generate Prisma client: `npx prisma generate`
4. Start production server: `npm start`

### Dashboard Deployment
1. Set `NEXT_PUBLIC_API_BASE_URL` to backend HTTPS URL
2. Build: `npm run build`
3. Start: `npm start`

### Extension Distribution
- Load as temporary add-on for development
- Package for Firefox Add-ons store for production

## 🔒 Security Features

### Backend Security
- **Helmet.js**: Security headers
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Zod schema validation
- **JWT Authentication**: Secure admin access
- **CORS Configuration**: Cross-origin protection
- **HTTPS Enforcement**: Production redirect

### Extension Security
- **Content Security Policy**: Prevents XSS
- **Minimal Permissions**: Only required host permissions
- **Secure Storage**: Chrome storage API for settings

## 📊 Monitoring & Analytics

### Detection Metrics
- Total scans performed
- Verdict distribution (safe/suspicious/unsafe)
- Threat rule effectiveness
- External API usage statistics

### Performance Monitoring
- API response times
- Database query performance
- Extension scan frequency
- Error rates and types

## 🔄 Development Workflow

### Local Development
1. Start PostgreSQL (Docker or Neon)
2. Backend: `npm run dev` (port 4000)
3. Dashboard: `npm run dev` (port 3000)
4. Load extension in Firefox
5. Test with example.com threat rule

### Database Management
- **Migrations**: `npx prisma migrate dev`
- **Seeding**: `npx prisma db seed`
- **Studio**: `npx prisma studio`

### Testing
- API endpoints with curl/Postman
- Extension functionality in Firefox
- Dashboard features in browser
- Threat rule effectiveness

## 🎯 Use Cases

### Enterprise Security
- Block known phishing domains
- Monitor employee web browsing
- Generate security reports
- Integrate with SIEM systems

### Personal Protection
- Real-time URL scanning
- Safe browsing enhancement
- Privacy protection
- Educational tool

### Security Research
- Threat intelligence collection
- Pattern analysis
- Malware detection
- Security metrics

## 🔮 Future Enhancements

### Machine Learning Integration
- URL feature extraction
- Behavioral analysis
- Anomaly detection
- Predictive scoring

### Advanced Features
- Screenshot analysis
- JavaScript execution monitoring
- Certificate validation
- Geolocation blocking

### Integrations
- SIEM systems (Splunk, ELK)
- Threat feeds (AbuseIPDB, PhishTank)
- Email security (DMARC, SPF)
- Identity providers (SAML, OAuth)

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments


