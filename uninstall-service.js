const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'Ticket Management System',
    script: path.join(__dirname, 'server.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function() {
    console.log('Service uninstalled successfully!');
    console.log('The Ticket Management System service has been removed.');
    console.log('You can now run the application manually with: npm start');
    process.exit(0);
});

svc.on('alreadyuninstalled', function() {
    console.log('Service is not installed.');
    process.exit(1);
});

svc.on('error', function(err) {
    console.error('Error uninstalling service:', err);
    process.exit(1);
});

// Uninstall the service
console.log('Uninstalling Ticket Management System service...');
console.log('Note: This requires administrator privileges.');
svc.uninstall();
