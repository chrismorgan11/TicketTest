const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const server   = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const database = process.env.DB_NAME   || 'TicketManagement';

const dbConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`
};

let pool;

async function initializeDatabase() {
    pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server.');

    await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tickets' AND xtype='U')
        CREATE TABLE tickets (
            id          INT IDENTITY(1,1) PRIMARY KEY,
            source      NVARCHAR(255)  NOT NULL,
            ticket      NVARCHAR(255)  NOT NULL,
            date        NVARCHAR(20)   NOT NULL,
            details     NVARCHAR(MAX)  NOT NULL,
            status      NVARCHAR(20)   NOT NULL DEFAULT 'Open',
            created_at  DATETIME2      DEFAULT GETDATE()
        )
    `);
    console.log('Tickets table ready.');
}

// Get all tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const result = await pool.request()
            .query('SELECT * FROM tickets ORDER BY created_at DESC');
        res.json({ tickets: result.recordset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single ticket
app.get('/api/tickets/:id', async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM tickets WHERE id = @id');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.json({ ticket: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a ticket
app.post('/api/tickets', async (req, res) => {
    const { source, ticket, date, details, status = 'Open' } = req.body;

    if (!source || !ticket || !date || !details) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['Open', 'Closed'].includes(status)) {
        return res.status(400).json({ error: 'Status must be Open or Closed' });
    }

    try {
        const result = await pool.request()
            .input('source',  sql.NVarChar, source.toLowerCase())
            .input('ticket',  sql.NVarChar, ticket)
            .input('date',    sql.NVarChar, date)
            .input('details', sql.NVarChar, details)
            .input('status',  sql.NVarChar, status)
            .query(`INSERT INTO tickets (source, ticket, date, details, status)
                    OUTPUT INSERTED.id
                    VALUES (@source, @ticket, @date, @details, @status)`);

        res.status(201).json({
            message: 'Ticket created successfully',
            ticket: {
                id: result.recordset[0].id,
                source: source.toLowerCase(),
                ticket, date, details, status
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a ticket
app.put('/api/tickets/:id', async (req, res) => {
    const { source, ticket, date, details, status = 'Open' } = req.body;
    const id = parseInt(req.params.id);

    if (!source || !ticket || !date || !details) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['Open', 'Closed'].includes(status)) {
        return res.status(400).json({ error: 'Status must be Open or Closed' });
    }

    try {
        const result = await pool.request()
            .input('id',      sql.Int,      id)
            .input('source',  sql.NVarChar, source.toLowerCase())
            .input('ticket',  sql.NVarChar, ticket)
            .input('date',    sql.NVarChar, date)
            .input('details', sql.NVarChar, details)
            .input('status',  sql.NVarChar, status)
            .query(`UPDATE tickets
                    SET source=@source, ticket=@ticket, date=@date, details=@details, status=@status
                    WHERE id=@id`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.json({
            message: 'Ticket updated successfully',
            ticket: { id, source: source.toLowerCase(), ticket, date, details, status }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a ticket
app.delete('/api/tickets/:id', async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM tickets WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.json({ message: 'Ticket deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Statistics
app.get('/api/stats', async (req, res) => {
    try {
        const result = await pool.request().query(
            'SELECT COUNT(*) AS total, COUNT(DISTINCT source) AS sources FROM tickets'
        );
        const row = result.recordset[0];
        res.json({ totalTickets: row.total, uniqueSources: row.sources });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export CSV
app.get('/api/export', async (req, res) => {
    try {
        const result = await pool.request().query(
            'SELECT source, ticket, date, details, status FROM tickets ORDER BY created_at DESC'
        );

        let csv = '"Source","Ticket","Date","Details","Status"\n';
        result.recordset.forEach(row => {
            csv += `"${row.source}","${row.ticket}","${row.date}","${row.details}","${row.status}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=tickets.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('Failed to connect to database:', err.message);
        process.exit(1);
    });

process.on('SIGINT', async () => {
    await sql.close();
    console.log('Database connection closed.');
    process.exit(0);
});
