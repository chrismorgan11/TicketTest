const sql = require('mssql/msnodesqlv8');
const fs = require('fs');
require('dotenv').config();

const server   = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const database = process.env.DB_NAME   || 'TicketManagement';

const dbConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`
};

async function migrate() {
    const pool = await sql.connect(dbConfig);
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

    if (!fs.existsSync('tickets.csv')) {
        console.log('No tickets.csv found. Nothing to migrate.');
        await sql.close();
        return;
    }

    const lines = fs.readFileSync('tickets.csv', 'utf-8').trim().split('\n').slice(1);

    if (lines.length === 0) {
        console.log('CSV file is empty. Nothing to migrate.');
        await sql.close();
        return;
    }

    console.log(`Found ${lines.length} tickets to migrate.`);

    await pool.request().query('DELETE FROM tickets');
    console.log('Cleared existing tickets.');

    let success = 0;
    let errors = 0;

    for (const [index, line] of lines.entries()) {
        if (!line.trim()) continue;

        try {
            const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
            if (!matches || matches.length < 4) {
                console.error(`Row ${index + 2}: Invalid format`);
                errors++;
                continue;
            }

            const [source, ticket, date, details] = matches.map(f => f.replace(/^"|"$/g, ''));

            await pool.request()
                .input('source',  sql.NVarChar, source)
                .input('ticket',  sql.NVarChar, ticket)
                .input('date',    sql.NVarChar, date)
                .input('details', sql.NVarChar, details)
                .query('INSERT INTO tickets (source, ticket, date, details) VALUES (@source, @ticket, @date, @details)');

            success++;
        } catch (err) {
            console.error(`Row ${index + 2}: ${err.message}`);
            errors++;
        }
    }

    console.log(`\nMigration complete! Migrated: ${success}, Errors: ${errors}`);
    await sql.close();
}

migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
