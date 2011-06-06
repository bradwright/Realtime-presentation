// Node.js server file for DIBI real-time

var sys = require('sys'),
    path = require('path'),
    squeenote = require('./modules/Squeenote/node-lib/squeenote');

// set up defaults
var presentationPath = "presentation.html";
var presenterPassword = "crc";
var port = 8080;
var staticPath = ['/modules/Squeenote/public', '/static'];

// process command line options
process.argv.forEach(function(val, index, array) {
    switch (index) {
        case 2:
            if (val == 'help' || val == '?') {
                console.log('Usage: node presentation.js [file] [password] [port]');
                process.exit();
            }
            presentationPath = val;
            break;
        case 3:
            presenterPassword = val;
            break;
        case 4:
            port = val;
            break;
        case 0:
        default:
            break;
    }
});

squeenote.listen(presentationPath, presenterPassword, port, staticPath);
