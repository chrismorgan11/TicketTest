# Ticket Management System

A full-stack ticket tracking application with a Node.js/Express backend, SQLite database, and modern web interface.

## Features

- Create, view, and delete support tickets
- Track tickets from multiple sources (ServiceNow, Dell, Databank, Superna, CDC, etc.)
- Real-time statistics dashboard
- Export tickets to CSV
- Persistent SQLite database storage
- RESTful API for integration
- Clean, responsive UI

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **API**: RESTful endpoints

## Installation

1. **Install Node.js** (if not already installed)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Migrate existing data** (optional - imports tickets.csv into database):
   ```bash
   npm run migrate
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`

## Running as a Windows Service

To run the application as a Windows service (auto-start on reboot):

**Install as a Windows service:**
```bash
npm run install-service
```
*Note: Requires administrator privileges. Right-click Command Prompt or PowerShell and select "Run as administrator"*

**Uninstall the service:**
```bash
npm run uninstall-service
```

**Benefits of running as a service:**
- Automatically starts on system reboot
- Runs in the background without a terminal window
- Automatically restarts if it crashes
- Can be managed through Windows Services (services.msc)

**Managing the service:**
- Open Windows Services: Press `Win + R`, type `services.msc`, and press Enter
- Find "Ticket Management System" in the list
- Right-click to Start, Stop, Restart, or configure the service

## Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. Use the form to add new tickets:
   - **Source**: The system that generated the ticket (automatically converted to lowercase)
   - **Ticket Number**: The ticket identifier
   - **Date**: Date of the ticket
   - **Details**: Description of the issue or request
3. View all tickets in the table below
4. Click "Delete" to remove a ticket (with confirmation)
5. Click "Export to CSV" to download all tickets as a CSV file
6. Click "Refresh" to reload the data from the database

### API Endpoints

#### Get all tickets
```bash
GET /api/tickets
```

#### Get a single ticket
```bash
GET /api/tickets/:id
```

#### Create a new ticket
```bash
POST /api/tickets
Content-Type: application/json

{
  "source": "service now",
  "ticket": "RITM0000010759952",
  "date": "03-31-2026",
  "details": "Issue description"
}
```

#### Update a ticket
```bash
PUT /api/tickets/:id
Content-Type: application/json

{
  "source": "dell",
  "ticket": "224642161",
  "date": "04-01-2026",
  "details": "Updated description"
}
```

#### Delete a ticket
```bash
DELETE /api/tickets/:id
```

#### Get statistics
```bash
GET /api/stats
```

#### Export to CSV
```bash
GET /api/export
```

## Project Structure

```
tickets/
├── server.js           # Express server and API endpoints
├── migrate.js          # CSV to database migration script
├── index.html          # Frontend web interface
├── package.json        # Node.js dependencies and scripts
├── tickets.csv         # Original CSV data
├── tickets.db          # SQLite database (created after migration)
├── CLAUDE.md          # Development documentation
└── README.md          # This file
```

## Database Schema

```sql
CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    ticket TEXT NOT NULL,
    date TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Development

- The server automatically creates the database and tables on first run
- Changes are persisted to `tickets.db`
- The frontend makes API calls to the backend for all operations
- CORS is enabled for development

## License

MIT
