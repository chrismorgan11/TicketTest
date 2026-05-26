# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains a full-stack ticket tracking system with:
- **Backend**: Node.js/Express server with SQL Server Express database
- **Frontend**: Modern web interface (`index.html`)
- **Database**: SQL Server Express (MSSQL) for persistent storage
- **Migration**: Script to import existing CSV data

## Data Structure

The `tickets.csv` file uses the following schema:
- **Source**: The system or vendor that generated the ticket (e.g., service now, dell, databank, superna, cdc)
- **Ticket**: The ticket identifier/number
- **Date**: The ticket date in MM-DD-YYYY format
- **Details**: Brief description of the issue or request

## Prerequisites

- **SQL Server Express** installed with instance name `SQLEXPRESS` (default)
- **ODBC Driver 17 for SQL Server** installed (comes with SSMS)
- **TicketManagement** database created before first run:
  ```bash
  sqlcmd -S localhost\SQLEXPRESS -E -Q "CREATE DATABASE TicketManagement"
  ```

## Setup and Installation

**Install dependencies:**
```bash
npm install
```

**Migrate existing CSV data to database:**
```bash
npm run migrate
```

**Start the server:**
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## Configuration

Connection settings are in `.env`:
```
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=TicketManagement
PORT=3000
```

Change `DB_SERVER` if using a different instance or remote server.

## Development Commands

- `npm start` - Start the Express server
- `npm run migrate` - Import tickets.csv data into SQL Server database
- `npm run dev` - Start server in development mode
- `npm run install-service` - Install as Windows service (requires admin privileges)
- `npm run uninstall-service` - Uninstall Windows service (requires admin privileges)

## Windows Service

The application runs as a Windows service (`Ticket Management System`) with Automatic startup.

**First-time setup — grant SQL Server access to the service account:**

The service runs as `NT AUTHORITY\SYSTEM`, which requires an explicit SQL Server login:
```bash
sqlcmd -S localhost\SQLEXPRESS -E -Q "
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'NT AUTHORITY\SYSTEM')
    CREATE LOGIN [NT AUTHORITY\SYSTEM] FROM WINDOWS;
USE TicketManagement;
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'NT AUTHORITY\SYSTEM')
    CREATE USER [NT AUTHORITY\SYSTEM] FOR LOGIN [NT AUTHORITY\SYSTEM];
ALTER ROLE db_owner ADD MEMBER [NT AUTHORITY\SYSTEM];"
```

This only needs to be done once. Without it the service will fail to connect and crash on startup.

**Installation:**
```bash
npm run install-service   # requires administrator privileges
```

**Reinstalling after config changes:**
```bash
npm run uninstall-service
npm run install-service
```

**Service Scripts:**
- `install-service.js` - Creates and starts the Windows service; reads DB settings from `.env`
- `uninstall-service.js` - Removes the Windows service

**Management:**
- Use Windows Services (`services.msc`) or PowerShell to start/stop/restart
- Logs are written to `daemon\ticketmanagementsystem.out.log` and `daemon\ticketmanagementsystem.err.log`

## Backend Architecture

**Server (`server.js`):**
- Express.js REST API server
- SQL Server Express via `mssql` + `msnodesqlv8` (Windows Authentication)
- CORS enabled for development
- Serves static frontend files
- Fully async/await — no callbacks

**Database connection (`mssql/msnodesqlv8`):**
- Uses ODBC Driver 17 for SQL Server with `Trusted_Connection=yes`
- Connection pool managed by `mssql`
- Parameterized queries via `.input()` to prevent SQL injection

**Database Schema:**
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

## API Endpoints

- `GET /api/tickets` - Retrieve all tickets
- `GET /api/tickets/:id` - Retrieve a single ticket by ID
- `POST /api/tickets` - Create a new ticket
- `PUT /api/tickets/:id` - Update an existing ticket
- `DELETE /api/tickets/:id` - Delete a ticket
- `GET /api/stats` - Get ticket statistics (total count, unique sources)
- `GET /api/export` - Export all tickets as CSV file

**Request body format for POST/PUT:**
```json
{
  "source": "service now",
  "ticket": "RITM0000010759952",
  "date": "03-31-2026",
  "details": "Issue description",
  "status": "Open"
}
```

## Frontend Features

- **View tickets**: Displays all tickets from database in a table
- **Edit tickets**: Inline edit via form — populates fields and sends PUT request
- **Filter by status**: Show All / Open / Closed tickets
- **Sort by status**: Click the Status column header to sort
- **Statistics**: Real-time display of total tickets and unique sources
- **Export to CSV**: Download current database as CSV file
- **Auto-refresh**: Automatic data reload after modifications

## Working with the Data

When modifying `tickets.csv`:
- Maintain the existing CSV format with quoted fields
- Preserve the header row: `"Source","Ticket","Date","Details"`
- Use consistent date format (MM-DD-YYYY)
- Keep ticket sources lowercase
- Quote all fields to handle commas and special characters in the Details field
