# 📄 Patient Education PDF Generation System

A comprehensive Next.js application for generating PDFs from Contentful patient education content, with automatic upload to Bynder and intelligent webhook processing.

## 🚀 Features

- ✅ **Patient Education Pages**: Dynamic Next.js pages from Contentful
- ✅ **PDF Generation**: Automated PDF creation using Puppeteer
- ✅ **Bynder Integration**: Automatic upload to Bynder DAM with metaproperty tagging
- ✅ **Contentful Webhooks**: Smart webhook processing with infinite loop prevention
- ✅ **Media Search**: Advanced Bynder asset search by name and metaproperties
- ✅ **User-Based Loop Prevention**: Prevents infinite webhook loops using system user detection
- ✅ **Comprehensive API Responses**: Detailed workflow status tracking with custom headers

## 📦 Tech Stack

- **Next.js 15.5.3** (App Router with Turbopack)
- **React 19.1.0**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Contentful SDK** (Delivery + Management APIs)
- **Bynder SDK** (with Next.js compatibility patch)
- **Puppeteer** (PDF generation)
- **patch-package** (Bynder SDK compatibility)

---

## 🛠️ Setup

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Next.js Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3050

# Contentful - Delivery API
CONTENTFUL_SPACE=your_space_id
CONTENTFUL_ENVIRONMENT=develop
CONTENTFUL_DELIVERY_API=your_cda_access_token
CONTENTFUL_CHILDREN_S_SPACE_DELIVERY_API=your_childrens_space_token
CONTENTFUL_PDF_GEN_CT=patientEducation

# Contentful - Management API
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
CONTENTFUL_SYSTEM_USER_ID=your_system_user_id  # User ID of the management token

# Contentful - Preview (Optional)
CONTENTFUL_PREVIEW_API=your_preview_token
CONTENTFUL_PREVIEW_SECRET=your_preview_secret
CONTENTFUL_USE_CONTENT_SOURCE_MAPS=true

# Bynder Configuration
BYNDER_BASE_URL=https://childrenshealthsandbox.getbynder.com/api
BYNDER_PERMANENT_TOKEN=your_permanent_token
BYNDER_BRAND_ID=your_brand_id
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

**Note**: The `postinstall` script automatically applies the Bynder SDK compatibility patch using `patch-package`.

### 3. Get System User ID

To enable infinite loop prevention, you need your Management API token's user ID:

```bash
curl https://api.contentful.com/spaces/{space_id}/users/me \
  -H "Authorization: Bearer {your_management_token}"
```

Copy the `sys.id` value and set it as `CONTENTFUL_SYSTEM_USER_ID` in `.env.local`.

### 4. Run Development Server

```bash
npm run dev
```

Server will start on: **http://localhost:3050**

### 5. Local Development with Ngrok

For local development, you need to expose your local server to the internet so Contentful webhooks can reach it:

```bash
ngrok http 3050
```

This will generate a public URL (e.g., `https://35bfc038e17d.ngrok-free.app`).

**Configure Contentful Webhook:**
1. Go to Contentful → Settings → Webhooks
2. Set the webhook URL to: `https://35bfc038e17d.ngrok-free.app/api/webhook/pdf`
   _(Replace with your actual ngrok URL)_
3. Make sure to trigger on Entry Publish events

**Note**: The ngrok URL changes each time you restart ngrok. Update the webhook URL in Contentful whenever you restart ngrok.

---

## 🌐 Routes & Endpoints

### Public Pages

- **`/`** - Homepage
- **`/pt-ed/[slug]`** - Patient Education content pages
  - Example: `http://localhost:3050/pt-ed/qa-smt-9830-y`

### API Endpoints

#### Webhook
- **`POST /api/webhook/pdf`** - PDF generation webhook (triggered by Contentful)

#### Bynder (Currently deleted, can be re-added if needed)
- **`GET/POST /api/bynder/search`** - Search Bynder assets by metaproperty and name
- **`GET /api/bynder/test`** - Test Bynder SDK connectivity
- **`POST /api/bynder/upload`** - Test file upload to Bynder

---

## 🔄 PDF Generation Workflow

### Complete Flow

```
1. User publishes Patient Education entry in Contentful
   ↓
2. Contentful webhook triggers POST /api/webhook/pdf
   ↓
3. Check if publishedBy === SYSTEM_USER_ID
   - YES → Skip processing (infinite loop prevention)
   - NO  → Continue
   ↓
4. Generate PDF from /pt-ed/{slug} using Puppeteer
   ↓
5. Upload PDF to Bynder with metaproperties:
   - PatientName: entityId
   - assettype: Documents
   - FileExtension: pdf
   - Organization: Children's Health
   ↓
6. Update Contentful entry with PDF asset link
   - Link Bynder asset to entry.fields.pdf
   - Save as DRAFT (or publish with system user)
   ↓
7. Return comprehensive workflow response
```

### Infinite Loop Prevention

The system uses **user-based detection**:

- **System User** (Management Token): Updates are made by this user
- **Human Users**: All other users in Contentful
- **Logic**: If `publishedBy === SYSTEM_USER_ID`, skip processing

**Benefits:**
- ✅ Prevents infinite loops automatically
- ✅ Allows re-generation on real content changes
- ✅ No manual intervention needed
- ✅ Works with auto-publish

---

## 📡 Webhook Configuration

### Contentful Webhook Setup

1. **URL**: `https://your-domain.com/api/webhook/pdf`
2. **Trigger**: Entry Publish (Content Type: `patientEducation`)
3. **Payload**: Include all fields + `sys` object
4. **Important**: Ensure `sys.publishedBy` is included

### Expected Payload

```json
{
  "entityId": "entry-id",
  "environment": "master",
  "spaceId": "space-id",
  "slug": {
    "en-US": "patient-education-slug"
  },
  "sys": {
    "publishedBy": {
      "sys": {
        "id": "user-id"
      }
    }
  },
  "parameters": {}
}
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "message": "PDF generation workflow completed successfully",
  "workflow": {
    "pdfGeneration": {
      "status": "completed",
      "fileName": "qa-smt-9830-y.pdf",
      "fileSize": 123456,
      "timestamp": "2025-10-07T..."
    },
    "bynderUpload": {
      "status": "completed",
      "assetId": "mediaid-123",
      "batchId": "batch-456",
      "s3Location": {...},
      "timestamp": "2025-10-07T..."
    },
    "contentfulUpdate": {
      "status": "completed",
      "entryId": "entry-id",
      "timestamp": "2025-10-07T..."
    }
  },
  "metadata": {
    "slug": "qa-smt-9830-y",
    "entityId": "entry-id",
    "spaceId": "space-id",
    "environment": "master",
    "publishedBy": "user-id",
    "processedAt": "2025-10-07T..."
  }
}
```

#### Custom Headers

All responses include these headers:

- `X-Contentful-PDF-Generation`: Status (completed/failed/skipped/error)
- `X-PDF-Asset-ID`: Bynder asset ID
- `X-PDF-Entry-ID`: Contentful entry ID
- `X-PDF-Workflow-Status`: Detailed workflow status
- `X-PDF-Error-Stage`: Stage where error occurred (if applicable)

---

## 🔧 Bynder SDK Compatibility

This project uses a **patched version** of `@bynder/bynder-js-sdk` to work with Next.js.

### How It Works

1. **Patch File**: `patches/@bynder+bynder-js-sdk+2.5.2.patch`
2. **Auto-Apply**: The `postinstall` script runs `patch-package` after `npm install`
3. **Fix**: Replaces `proper-url-join` with custom implementation compatible with Next.js runtime

### What Was Fixed

The official Bynder SDK uses `proper-url-join` which doesn't work in Next.js App Router. Our patch:
- Replaces the import with a custom `joinUrl` function
- Maintains full SDK compatibility
- Works in both development and production

**No manual intervention needed** - the patch applies automatically!

---

## 📚 Core Functions

### Contentful Integration

- **`getClient()`** - Get Contentful Delivery API client
- **`getClientForChildrensSpace()`** - Get client for Children's space
- **`getManagementClient()`** - Get Management API client
- **`fetchPatientEducationBySlug()`** - Fetch patient education by slug
- **`fetchRelatedEntries()`** - Fetch related conditions/treatments
- **`updatePatientEducationEntry()`** - Update entry with PDF info

### Bynder Integration

- **`uploadToBynder()`** - Upload file to Bynder with metaproperties
- **`searchMediaByMetaPropertyAndName()`** - Search assets by filters
- **`findMediaByExactNameAndMetaProperty()`** - Find exact match
- **`fetchMetaProperties()`** - Get all available metaproperties
- **`bynderAssetLookup()`** - Lookup asset by keyword

### PDF Generation

- **`generatePDF()`** - Generate PDF from HTML
- **`generatePDFFromURL()`** - Generate PDF from URL using Puppeteer

---

## 🧪 Testing

### Test Patient Education Page

```bash
curl http://localhost:3050/pt-ed/qa-smt-9830-y
```

### Test Webhook

```bash
curl -X POST http://localhost:3050/api/webhook/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "7MLJKUTuwFSAHZxwKKhPHH",
    "environment": "develop",
    "spaceId": "lib98re7zk1x",
    "slug": { "en-US": "qa-smt-9830-y" },
    "sys": {
      "publishedBy": { "sys": { "id": "human-user-123" } }
    }
  }'
```

### Test Bynder Search (if endpoints are enabled)

```bash
# Search by metaproperty
curl "http://localhost:3050/api/bynder/search?assettype=Documents&limit=5"

# Exact match
curl -X POST http://localhost:3050/api/bynder/search \
  -H "Content-Type: application/json" \
  -d '{"name": "patient-edu.pdf", "exactMatch": true}'
```

---

## 📁 Project Structure

```
PDF-Gen-HTML/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── webhook/
│   │   │       └── pdf/
│   │   │           └── route.ts          # PDF generation webhook
│   │   ├── pt-ed/
│   │   │   └── [slug]/
│   │   │       └── page.tsx              # Patient education pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── PatientEducation/
│   │   │   └── PatientEducationPage.tsx  # Main content component
│   │   ├── ErrorBoundary.tsx
│   │   └── Loading.tsx
│   └── lib/
│       ├── bynder-service.js             # Bynder SDK wrapper
│       ├── contentful.ts                 # Contentful Delivery API
│       ├── contentful-cma.ts             # Contentful Management API
│       ├── contentfulUpdate.ts           # Update Contentful entries
│       ├── pdfGenerator.ts               # PDF generation logic
│       ├── uploadPdfToBynder.ts          # Upload PDF to Bynder
│       ├── fetchPatientEducationBySlug.ts
│       ├── fetchRelatedEntries.ts
│       ├── fetchByUrn.ts
│       ├── parseUrn.ts
│       └── types.ts                      # TypeScript types
├── patches/
│   └── @bynder+bynder-js-sdk+2.5.2.patch # Bynder SDK fix
├── package.json
└── .env.local                            # Environment variables
```

---

## 🎯 Key Features Explained

### 1. Patient Education Pages

Dynamic pages that fetch and render content from Contentful:

- **Route**: `/pt-ed/[slug]`
- **Data Source**: Contentful `patientEducation` content type
- **Features**: 
  - Rich text rendering
  - Related conditions and treatments
  - Error handling with custom error boundary
  - Loading states

### 2. PDF Generation

Automated PDF creation from HTML pages:

- **Engine**: Puppeteer (headless Chrome)
- **Format**: A4 with 1cm margins
- **Source**: Renders actual `/pt-ed/[slug]` page
- **Output**: Buffer (in-memory, no file system storage)

### 3. Bynder Upload

Intelligent upload system with metaproperty tagging:

- **Asset Type Detection**: Based on file extension
- **Metaproperties**: 
  - `PatientName`: Links to Contentful entry ID
  - `assettype`: Documents/Photography/Videos/Graphics
  - `Organization`: Children's Health
  - `FileExtension`: Extracted from filename
- **Public by Default**: All uploads set to public
- **Search Integration**: Can find existing assets before uploading

### 4. Contentful Update

Updates patient education entries with PDF information:

- **Fields Updated**:
  - `pdf`: Array of asset links
  - Custom PDF metadata fields (if configured)
- **Loop Prevention**: Uses system user ID check
- **Status Tracking**: Comprehensive workflow status

### 5. Infinite Loop Prevention

Three-layer protection system:

1. **User ID Check**: Skip if `publishedBy === SYSTEM_USER_ID`
2. **Duplicate Detection**: Skip if PDF already exists with same name
3. **Manual Override**: Can bypass by changing user or removing metadata

---

## 🔍 Bynder Media Search

Search for existing assets before uploading:

### Search Functions

```javascript
// Search by metaproperty and name
const results = await searchMediaByMetaPropertyAndName({
  name: 'patient-education',
  metaProperties: {
    PatientName: 'entry-id',
    assettype: 'Documents'
  },
  limit: 50
});

// Find exact match
const asset = await findMediaByExactNameAndMetaProperty({
  name: 'exact-filename',
  metaProperties: {
    PatientName: 'entry-id'
  }
});
```

### Available Metaproperties

- `PatientName` - Entity/Entry ID
- `assettype` - Documents, Photography, Videos, Graphics
- `assetsubtype` - dotcom, etc.
- `FileExtension` - pdf, jpg, png, etc.
- `Organization` - Children's Health
- `DepartmentClinicalArea` - Department name
- `CityFacility` - Location
- And many more...

---

## 📊 API Response Examples

### Success Response

```json
{
  "success": true,
  "message": "PDF generation workflow completed successfully",
  "workflow": {
    "pdfGeneration": { "status": "completed", "fileName": "...", "fileSize": 123456 },
    "bynderUpload": { "status": "completed", "assetId": "...", "s3Location": {...} },
    "contentfulUpdate": { "status": "completed", "entryId": "..." }
  },
  "metadata": {
    "slug": "...",
    "entityId": "...",
    "publishedBy": "...",
    "processedAt": "..."
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "PDF generation workflow failed at ...",
  "workflow": {
    "pdfGeneration": { "status": "failed", "error": "..." },
    "bynderUpload": { "status": "skipped" },
    "contentfulUpdate": { "status": "skipped" }
  }
}
```

### Skip Response (Loop Prevention)

```json
{
  "success": true,
  "message": "Webhook skipped - published by system user",
  "skipped": true,
  "reason": "infinite-loop-prevention",
  "metadata": {
    "publishedBy": "system-user-id",
    "systemUserId": "system-user-id"
  }
}
```

---

## 🔐 Security Features

- **Origin Verification**: Logs webhook origin and user agent
- **User Authentication**: System user validation
- **Input Validation**: Validates required fields
- **Error Handling**: Comprehensive try-catch blocks
- **Type Safety**: Full TypeScript implementation

---

## 🐛 Troubleshooting

### Port Issues

```bash
# Check if port 3050 is in use
lsof -ti:3050

# Kill process if needed
lsof -ti:3050 | xargs kill -9

# Restart server
npm run dev
```

### PDF Generation 404 Errors

Verify that `NEXT_PUBLIC_BASE_URL` is set correctly:

```bash
grep NEXT_PUBLIC_BASE_URL .env.local
# Should show: NEXT_PUBLIC_BASE_URL=http://localhost:3050
```

### Bynder SDK Errors

If you see `joinUrl is not a function`:

1. Check that `patch-package` is in dependencies
2. Verify patch file exists: `ls -la patches/`
3. Re-apply patch: `npm run postinstall`
4. Reinstall dependencies: `rm -rf node_modules && npm install`

### Contentful Update Failures

- Verify `CONTENTFUL_MANAGEMENT_TOKEN` has write permissions
- Check that all PDF fields exist in content type schema
- Ensure `CONTENTFUL_SYSTEM_USER_ID` is set correctly
- Review logs for specific field errors

### Infinite Loops

If you're experiencing loops:

1. Check `CONTENTFUL_SYSTEM_USER_ID` is correctly set
2. Verify webhook is configured for **Publish** only (not Save/Auto-save)
3. Review webhook logs to see which user is triggering
4. Ensure Management API token user ID matches `CONTENTFUL_SYSTEM_USER_ID`

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

Server will start on: **http://localhost:3050**

### Environment Variables for Production

Update `.env.production` or your hosting platform with:

```bash
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
# ... all other environment variables
```

---

## 📖 Additional Documentation

- **Bynder Search Examples**: Check `BYNDER-SEARCH-EXAMPLES.md` (if available)
- **Infinite Loop Prevention**: See `INFINITE-LOOP-PREVENTION.md` (if available)
- **Port Configuration**: See `PORT-CONFIG.md` (if available)

---

## 🛡️ Scripts

```json
{
  "dev": "next dev --turbopack -p 3050",
  "build": "next build --turbopack",
  "start": "next start -p 3050",
  "lint": "biome check",
  "format": "biome format --write",
  "postinstall": "patch-package"
}
```

---

## 📝 Content Type Requirements

### patientEducation Content Type

Required fields:
- `title` (Text)
- `subtitle` (Text)
- `slug` (Short text, unique)
- `body` (Rich Text)

Optional fields for full functionality:
- `relatedConditions` (References)
- `relatedTreatments` (References)
- `pdf` (Asset array) - Updated by webhook
- `pdfUrl`, `pdfFileName`, `pdfFileSize` - PDF metadata
- `bynderAssetId`, `bynderPdfUrl` - Bynder integration

---

## 🎨 Styling

This project uses **Tailwind CSS 4** with custom configurations.

Global styles: `src/app/globals.css`

---

## 📦 Dependencies

### Key Dependencies

- `@bynder/bynder-js-sdk` - Bynder DAM integration (patched for Next.js)
- `contentful` - Contentful Delivery API
- `contentful-management` - Contentful Management API
- `puppeteer` - PDF generation
- `patch-package` - Apply SDK patches automatically
- `@contentful/rich-text-react-renderer` - Render rich text content

---

## 🤝 Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` with required variables
4. Start development server: `npm run dev`
5. Make your changes
6. Test thoroughly
7. Submit pull request

---

## 📄 License

Private project for Children's Health.

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs for specific error messages
3. Verify all environment variables are set
4. Check Contentful and Bynder API status

---

## ✨ Recent Updates

- ✅ Configured permanent port 3050
- ✅ Implemented user-based infinite loop prevention
- ✅ Added comprehensive workflow responses with custom headers
- ✅ Integrated Bynder media search functionality
- ✅ Applied Bynder SDK compatibility patch using patch-package
- ✅ Added Contentful entry update after PDF generation
