# Ticket Management System

A full-stack ticket tracking application with a Node.js/Express backend, SQL Server Express database, and modern web interface.

## Features

- Create, view, and edit support tickets
- Filter tickets by status (Open / Closed) and sort by status column
- Track tickets from multiple sources (ServiceNow, Dell, Databank, Superna, CDC, etc.)
- Real-time statistics dashboard
- Export tickets to CSV
- Runs as a Windows service with automatic startup on reboot
- RESTful API

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQL Server Express (Windows Authentication via ODBC Driver 17)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## Prerequisites

- [Node.js](https://nodejs.org/)
- [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (default instance name: `SQLEXPRESS`)
- ODBC Driver 17 for SQL Server (included with SSMS, or install separately)

## Installation

1. **Create the database:**
   ```bash
   sqlcmd -S localhost\SQLEXPRESS -E -Q "CREATE DATABASE TicketManagement"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure connection** (optional — defaults work for a standard local install):
   Edit `.env` if your instance name or database name differs:
   ```
   DB_SERVER=localhost\SQLEXPRESS
   DB_NAME=TicketManagement
   PORT=3000
   ```

4. **Migrate existing CSV data** (optional):
   ```bash
   npm run migrate
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

6. Open `http://localhost:3000`

## Running as a Windows Service

The app can run as a Windows service that starts automatically on reboot.

**One-time: grant the service account access to SQL Server:**
```bash
sqlcmd -S localhost\SQLEXPRESS -E -Q "
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'NT AUTHORITY\SYSTEM')
    CREATE LOGIN [NT AUTHORITY\SYSTEM] FROM WINDOWS;
USE TicketManagement;
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'NT AUTHORITY\SYSTEM')
    CREATE USER [NT AUTHORITY\SYSTEM] FOR LOGIN [NT AUTHORITY\SYSTEM];
ALTER ROLE db_owner ADD MEMBER [NT AUTHORITY\SYSTEM];"
```

**Install the service** (requires administrator privileges):
```bash
npm run install-service
```

**Uninstall the service:**
```bash
npm run uninstall-service
```

Manage via Windows Services (`services.msc`) — service name: **Ticket Management System**.
Logs are written to `daemon\ticketmanagementsystem.out.log` and `daemon\ticketmanagementsystem.err.log`.

## Usage

### Web Interface

1. Open `http://localhost:3000`
2. Add tickets using the form (source is auto-lowercased)
3. Click **Edit** on any row to update it in the form — submit saves the changes
4. Use the **All / Open / Closed** filter buttons to narrow the ticket list
5. Click the **Status** column header to sort by status
6. Click **Export to CSV** to download all tickets

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | Get all tickets |
| GET | `/api/tickets/:id` | Get a single ticket |
| POST | `/api/tickets` | Create a ticket |
| PUT | `/api/tickets/:id` | Update a ticket |
| DELETE | `/api/tickets/:id` | Delete a ticket |
| GET | `/api/stats` | Total tickets and unique sources |
| GET | `/api/export` | Download all tickets as CSV |

**Request body for POST / PUT:**
```json
{
  "source": "service now",
  "ticket": "RITM0000010759952",
  "date": "03-31-2026",
  "details": "Issue description",
  "status": "Open"
}
```

## Project Structure

```
tickets/
├── server.js              # Express server and API endpoints
├── migrate.js             # CSV to SQL Server migration script
├── install-service.js     # Windows service installer
├── uninstall-service.js   # Windows service uninstaller
├── index.html             # Frontend web interface
├── package.json           # Dependencies and scripts
├── tickets.csv            # Source CSV data
├── .env                   # DB connection settings (not committed)
├── CLAUDE.md              # Developer notes
└── README.md              # This file
```

## Database Schema

```sql
CREATE TABLE tickets (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    source     NVARCHAR(255) NOT NULL,
    ticket     NVARCHAR(255) NOT NULL,
    date       NVARCHAR(20)  NOT NULL,
    details    NVARCHAR(MAX) NOT NULL,
    status     NVARCHAR(20)  NOT NULL DEFAULT 'Open',
    created_at DATETIME2     DEFAULT GETDATE()
)
```

## License

MIT
