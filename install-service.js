const Service = require('node-windows').Service;
const path = require('path');
require('dotenv').config();

// Create a new service object
const svc = new Service({
    name: 'Ticket Management System',
    description: 'Ticket tracking system with Express.js and SQL Server Express backend',
    script: path.join(__dirname, 'server.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ],
    env: [
        {
            name: "PORT",
            value: process.env.PORT || "3000"
        },
        {
            name: "DB_SERVER",
            value: process.env.DB_SERVER || "localhost\\SQLEXPRESS"
        },
        {
            name: "DB_NAME",
            value: process.env.DB_NAME || "TicketManagement"
        },
        {
            name: "NODE_ENV",
            value: "production"
        }
    ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
    console.log('Service installed successfully!');
    console.log('Starting service...');
    svc.start();
});

svc.on('start', function() {
    console.log('Service started successfully!');
    console.log('The Ticket Management System is now running as a Windows service.');
    console.log('It will automatically start on system reboot.');
    console.log('Access the application at: http://localhost:3000');
    process.exit(0);
});

svc.on('alreadyinstalled', function() {
    console.log('Service is already installed.');
    console.log('To reinstall, first run: node uninstall-service.js');
    process.exit(1);
});

svc.on('error', function(err) {
    console.error('Error installing service:', err);
    process.exit(1);
});

// Install the service
console.log('Installing Ticket Management System as a Windows service...');
console.log('Note: This requires administrator privileges.');
svc.install();
