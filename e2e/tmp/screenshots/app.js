var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "should display welcome message|workspace-project App",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 23980,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Failed: Angular could not be found on the page http://localhost:4200/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page http://localhost:4200/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:718:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)\nFrom: Task: Run it(\"should display welcome message\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError: \n    at Suite.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\app.e2e-spec.ts:11:3)\n    at addSpecsToSuite (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\app.e2e-spec.ts:4:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Module.m._compile (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (internal/modules/cjs/loader.js:1092:10)\n    at Object.require.extensions.<computed> [as .ts] (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00d200b0-0069-00a4-0078-00b200bd00aa.png",
        "timestamp": 1613426576427,
        "duration": 14483
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 15048,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 'Paquetes Turisticos Eje Cafetero' to equal 'Angular Seed'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\app.e2e-spec.ts:13:33)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00bc002d-0019-0031-00eb-00e5004f005d.png",
        "timestamp": 1613426956219,
        "duration": 1533
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 22716,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009b0064-005a-0044-0027-009500d1000b.png",
        "timestamp": 1613427026889,
        "duration": 1275
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12660,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003300b7-00a3-0058-003a-009f0055004a.png",
        "timestamp": 1613427203699,
        "duration": 1192
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12660,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:33:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00f40029-0022-00f3-000e-00bf00920086.png",
        "timestamp": 1613427205455,
        "duration": 889
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 19384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d000e6-00a7-007a-0011-006000550024.png",
        "timestamp": 1613427448203,
        "duration": 1164
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 19384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:33:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00540059-00bb-001f-0099-003f00b50092.png",
        "timestamp": 1613427449909,
        "duration": 791
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 19760,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f000b0-00e9-0088-0090-004b00c600e2.png",
        "timestamp": 1613427993150,
        "duration": 1516
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 19760,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:43:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "006100ac-0088-00a8-0078-006600ab0069.png",
        "timestamp": 1613427995219,
        "duration": 957
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 23024,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00020047-0092-0015-00a7-00c700e9008d.png",
        "timestamp": 1613428048966,
        "duration": 1222
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 23024,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:43:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00e200c8-003a-00ca-00ac-00ab00f60011.png",
        "timestamp": 1613428050695,
        "duration": 937
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 19836,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00dd00f8-00b1-00f4-00f1-009500d20044.png",
        "timestamp": 1613428091738,
        "duration": 1136
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 19836,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:43:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "002b0054-0006-0011-00ff-0084001c0050.png",
        "timestamp": 1613428093413,
        "duration": 1557
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 24384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001a0010-0025-0028-00de-0096007d004a.png",
        "timestamp": 1613428176779,
        "duration": 1177
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 24384,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:43:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "001100e4-00b3-009e-00f1-007800a2007c.png",
        "timestamp": 1613428178480,
        "duration": 1086
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12648,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0069006e-00b2-00ba-00cc-005c00770078.png",
        "timestamp": 1613428242853,
        "duration": 1150
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12648,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:43:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "0020003d-0070-0015-0000-00a500f500d1.png",
        "timestamp": 1613428244537,
        "duration": 1135
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 17708,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00490036-0061-00de-00aa-009300b000ae.png",
        "timestamp": 1613428300801,
        "duration": 1265
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 17708,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:44:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/PaquetesTuristicos/lugares-turisticos - Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
                "timestamp": 1613428304115,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/main.js 655:27 \"Error inesperado:\\n\" Object",
                "timestamp": 1613428304115,
                "type": ""
            }
        ],
        "screenShotFile": "008e00c5-0059-005a-008d-00aa00e9003a.png",
        "timestamp": 1613428302610,
        "duration": 1524
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 2200,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f600e4-0017-00e0-0084-007a00fa00d9.png",
        "timestamp": 1613429519948,
        "duration": 1265
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 2200,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:44:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/PaquetesTuristicos/lugares-turisticos - Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
                "timestamp": 1613429523120,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/main.js 655:27 \"Error inesperado:\\n\" Object",
                "timestamp": 1613429523121,
                "type": ""
            }
        ],
        "screenShotFile": "001900b3-0067-0079-0098-007500740058.png",
        "timestamp": 1613429521738,
        "duration": 1413
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3680,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f60097-0074-00c1-000d-006d00a90066.png",
        "timestamp": 1613429681767,
        "duration": 1131
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 3680,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Failed: No element found using locator: By(css selector, *[id=\"idMunicipio\"])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(css selector, *[id=\"idMunicipio\"])\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:814:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)Error: \n    at ElementArrayFinder.applyAction_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as click] (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as click] (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at LugarTuristicoPage.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\page\\lugar-turistico\\lugar-turistico.po.ts:36:46)\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:115:75\n    at new Promise (<anonymous>)\n    at Object.__awaiter (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:111:16)\n    at LugarTuristicoPage.ingresarMunicipio (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\page\\lugar-turistico\\lugar-turistico.po.ts:77:24)\nFrom: Task: Run it(\"Deberia crear lugar turistico\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError: \n    at Suite.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:19:5)\n    at addSpecsToSuite (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Module.m._compile (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (internal/modules/cjs/loader.js:1092:10)\n    at Object.require.extensions.<computed> [as .ts] (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\ts-node\\src\\index.ts:442:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "007a004c-0061-003d-008a-00f10035000f.png",
        "timestamp": 1613429683428,
        "duration": 1159
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003100e4-0090-0037-0039-00eb003700e1.png",
        "timestamp": 1613429775540,
        "duration": 1618
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 11772,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:44:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/PaquetesTuristicos/lugares-turisticos - Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
                "timestamp": 1613429779030,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/main.js 655:27 \"Error inesperado:\\n\" Object",
                "timestamp": 1613429779031,
                "type": ""
            }
        ],
        "screenShotFile": "006e0000-00bc-0030-003c-00c800c8008a.png",
        "timestamp": 1613429777697,
        "duration": 1422
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7880,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00bd008b-00e3-001c-00c5-00d200bc00fa.png",
        "timestamp": 1613429803300,
        "duration": 1174
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7880,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006300e6-0011-001a-007f-00b1002800b1.png",
        "timestamp": 1613429804996,
        "duration": 1731
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 14996,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005b00c7-000c-004c-005a-0070003c0090.png",
        "timestamp": 1613430025161,
        "duration": 2304
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 14996,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:44:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/PaquetesTuristicos/lugares-turisticos - Failed to load resource: the server responded with a status of 400 (Bad Request)",
                "timestamp": 1613430029351,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/main.js 655:27 \"Error inesperado:\\n\" Object",
                "timestamp": 1613430029351,
                "type": ""
            }
        ],
        "screenShotFile": "00b100c5-00a2-00ed-00bc-002900fe0041.png",
        "timestamp": 1613430027997,
        "duration": 1389
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7772,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00750083-0025-0030-004e-00bc00c0002c.png",
        "timestamp": 1613430220400,
        "duration": 1274
    },
    {
        "description": "Deberia listar productos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 7772,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fa009d-003f-0024-003b-005700400083.png",
        "timestamp": 1613430222189,
        "duration": 790
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 13188,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00700067-0098-008a-0034-000c0024005e.png",
        "timestamp": 1613430309116,
        "duration": 1324
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 13188,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00750074-0067-004f-00e2-007a00f100c4.png",
        "timestamp": 1613430310995,
        "duration": 1745
    },
    {
        "description": "Deberia listar productos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 13188,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001300ba-0034-0045-00d8-001c001d00e1.png",
        "timestamp": 1613430313001,
        "duration": 916
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 21640,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00db0085-0043-0067-00d1-00b100b2003e.png",
        "timestamp": 1613430345070,
        "duration": 1334
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 21640,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00950000-00b4-0004-004e-004a005600f9.png",
        "timestamp": 1613430346914,
        "duration": 1604
    },
    {
        "description": "Deberia listar productos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 21640,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 2 to be 3."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:49:19)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00d400e0-0074-009e-00fa-002e00cc0050.png",
        "timestamp": 1613430348759,
        "duration": 47
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 17232,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008500a9-0097-00cb-007f-004b00680044.png",
        "timestamp": 1613430453719,
        "duration": 1514
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 17232,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:43:59)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/PaquetesTuristicos/lugares-turisticos - Failed to load resource: the server responded with a status of 400 (Bad Request)",
                "timestamp": 1613430457121,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/main.js 655:27 \"Error inesperado:\\n\" Object",
                "timestamp": 1613430457121,
                "type": ""
            }
        ],
        "screenShotFile": "00700029-0011-003b-00d0-00c700de0059.png",
        "timestamp": 1613430455760,
        "duration": 1385
    },
    {
        "description": "Deberia listar productos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 17232,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 4 to be 3."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:49:19)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "001100bc-008b-00a7-0089-006500660073.png",
        "timestamp": 1613430457451,
        "duration": 414
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9156,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005b00a5-0088-00b9-00d0-005900e10065.png",
        "timestamp": 1613430757047,
        "duration": 1250
    },
    {
        "description": "encountered a declaration exception|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 9156,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "TypeError: Cannot read property 'contarLugaresTuristicos' of undefined"
        ],
        "trace": [
            "TypeError: Cannot read property 'contarLugaresTuristicos' of undefined\n    at Suite.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:19:52)\n    at addSpecsToSuite (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:6:1)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Module.m._compile (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\ts-node\\src\\index.ts:439:23)\n    at Module._extensions..js (internal/modules/cjs/loader.js:1092:10)\n    at Object.require.extensions.<computed> [as .ts] (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\ts-node\\src\\index.ts:442:12)\n    at Module.load (internal/modules/cjs/loader.js:928:32)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ad00b3-00dd-00f8-0073-0099007e00e7.png",
        "timestamp": 1613430758813,
        "duration": 9
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6656,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f800c6-0065-00d0-0046-00c2001800e3.png",
        "timestamp": 1613430796744,
        "duration": 1109
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6656,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009d0010-00b5-001e-00be-00db0093002d.png",
        "timestamp": 1613430798374,
        "duration": 1880
    },
    {
        "description": "Deberia listar productos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 6656,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be 2."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:52:24)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "002c008e-0091-004c-0042-004300750030.png",
        "timestamp": 1613430800524,
        "duration": 57
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 21844,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008200f8-00e0-0030-007f-004c007a00d2.png",
        "timestamp": 1613430837366,
        "duration": 1329
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 21844,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00070017-0074-00b9-003b-0063009b00e7.png",
        "timestamp": 1613430839233,
        "duration": 1702
    },
    {
        "description": "Deberia listar productos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 21844,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected '[object Promise]1' to be 3."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:51:24)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00010019-00a5-00e5-00a6-007600a6005a.png",
        "timestamp": 1613430841217,
        "duration": 55
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 22396,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008d00f9-0078-00a3-00c6-0062007300a5.png",
        "timestamp": 1613431268095,
        "duration": 1228
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 22396,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e0003a-00b3-006c-0018-001d00100099.png",
        "timestamp": 1613431269857,
        "duration": 1820
    },
    {
        "description": "Deberia listar productos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 22396,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d60088-0011-00f2-00fb-0026009300bc.png",
        "timestamp": 1613431271969,
        "duration": 48
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 23664,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009300e6-006b-0074-00db-005b00110083.png",
        "timestamp": 1613431779136,
        "duration": 1150
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 23664,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00210074-000f-0039-0093-00cc003800b5.png",
        "timestamp": 1613431780835,
        "duration": 1561
    },
    {
        "description": "Deberia listar los lugres turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 23664,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 6 to be 5."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:50:47\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:115:75\n    at new Promise (<anonymous>)\n    at Object.__awaiter (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:111:16)\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:48:48)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "00a100c5-004b-00c2-00f2-006a008c004b.png",
        "timestamp": 1613431782652,
        "duration": 65
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4116,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ed00d8-005a-00a1-00c0-00f2000e00f2.png",
        "timestamp": 1613431826601,
        "duration": 1141
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4116,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00140021-003f-0057-0001-005f00d700c9.png",
        "timestamp": 1613431828259,
        "duration": 1808
    },
    {
        "description": "Deberia listar los lugres turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 4116,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 3 to be 2."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:50:47\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:115:75\n    at new Promise (<anonymous>)\n    at Object.__awaiter (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:111:16)\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:48:48)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)"
        ],
        "browserLogs": [],
        "screenShotFile": "00630094-003d-00b8-000b-001100da0064.png",
        "timestamp": 1613431830329,
        "duration": 58
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10820,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004a00a0-004b-0010-00f6-001500f600fb.png",
        "timestamp": 1613433115960,
        "duration": 1511
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10820,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008b0049-009a-00ab-0068-00b1005100d9.png",
        "timestamp": 1613433117984,
        "duration": 1781
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 10820,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ba00fa-006a-00bd-005a-000a00d9002f.png",
        "timestamp": 1613433120028,
        "duration": 27
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 10820,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 3 to be less than 3."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:56:58\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at fulfilled (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:112:62)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/PaquetesTuristicos/lugares-turisticos/1 - Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
                "timestamp": 1613433120462,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/main.js 655:27 \"Error inesperado:\\n\" Object",
                "timestamp": 1613433120462,
                "type": ""
            }
        ],
        "screenShotFile": "00f8000f-0082-006d-0013-006b004a003d.png",
        "timestamp": 1613433120305,
        "duration": 170
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8428,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fd00ba-00e2-0088-0046-00a300c900e2.png",
        "timestamp": 1613433392580,
        "duration": 1425
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8428,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002a00d1-0006-00ef-00c0-00e400e70055.png",
        "timestamp": 1613433394558,
        "duration": 1641
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8428,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009d0002-004c-00b5-0061-00e9007a0069.png",
        "timestamp": 1613433396457,
        "duration": 23
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 8428,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 4 to be less than 4."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:56:58\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at fulfilled (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:112:62)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/PaquetesTuristicos/lugares-turisticos/1 - Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
                "timestamp": 1613433396906,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://localhost:4200/main.js 655:27 \"Error inesperado:\\n\" Object",
                "timestamp": 1613433396906,
                "type": ""
            }
        ],
        "screenShotFile": "00b8007c-0062-0080-0088-00ed00b70091.png",
        "timestamp": 1613433396743,
        "duration": 180
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 19024,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002500d6-0018-00ce-00f1-002300cd008e.png",
        "timestamp": 1613433923427,
        "duration": 1274
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 19024,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00540024-00fb-00d8-00cc-009c00e40039.png",
        "timestamp": 1613433925271,
        "duration": 1846
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 19024,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ef00da-007c-0066-00e3-00ce008d004c.png",
        "timestamp": 1613433927382,
        "duration": 23
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 19024,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 5 to be less than 5."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:56:58\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at fulfilled (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:112:62)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ac001d-00df-002e-001d-0032005f00ed.png",
        "timestamp": 1613433927693,
        "duration": 47
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 12388,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006500bd-002b-001c-003a-0001009e007f.png",
        "timestamp": 1613434009382,
        "duration": 1195
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12388,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:43:58)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\juan.perdomo\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "008c003a-00f9-000a-00c7-002e00550013.png",
        "timestamp": 1613434011140,
        "duration": 1361
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12388,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be greater than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:49:37\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at fulfilled (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:112:62)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "009000b9-006d-0032-008a-006f0057001a.png",
        "timestamp": 1613434012796,
        "duration": 25
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 12388,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 0 to be less than 0."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:56:58\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at fulfilled (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:112:62)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "00b9000e-006f-0089-0092-00fd00ad008f.png",
        "timestamp": 1613434013078,
        "duration": 66
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 21852,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0021009c-0046-0047-00d0-009a00990023.png",
        "timestamp": 1613434058442,
        "duration": 1085
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 21852,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006b0087-005f-00a9-00dd-008900f60049.png",
        "timestamp": 1613434060079,
        "duration": 1614
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 21852,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000800ff-00a8-0014-00f7-005e008500c7.png",
        "timestamp": 1613434061950,
        "duration": 23
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 21852,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 6 to be less than 6."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:56:58\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at fulfilled (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:112:62)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "00c40015-00cd-0014-003c-00a1005b0036.png",
        "timestamp": 1613434062228,
        "duration": 52
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6552,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "005d00a2-00a1-00d9-0046-00a300650097.png",
        "timestamp": 1613434101212,
        "duration": 1388
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6552,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0056009a-001a-0086-000f-00e80025004e.png",
        "timestamp": 1613434103150,
        "duration": 1637
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 6552,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0050006e-00d7-007a-00a4-003200ef0037.png",
        "timestamp": 1613434105061,
        "duration": 24
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 6552,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": [
            "Expected 2 to be less than 2."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\e2e\\src\\test\\lugar-turistico.e2e-spec.ts:56:58\n    at step (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:141:27)\n    at Object.next (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:122:57)\n    at fulfilled (C:\\Users\\juan.perdomo\\Documents\\ADN\\FRONTEND\\GestorReservasPaquetesTuristicosEjeCafetero\\node_modules\\tslib\\tslib.js:112:62)\n    at processTicksAndRejections (internal/process/task_queues.js:93:5)"
        ],
        "browserLogs": [],
        "screenShotFile": "002900f0-0053-005b-004a-00c900b80030.png",
        "timestamp": 1613434105342,
        "duration": 44
    },
    {
        "description": "should display welcome message|workspace-project App",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18760,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f90091-00f6-0040-0002-003400bb0094.png",
        "timestamp": 1613434234805,
        "duration": 1318
    },
    {
        "description": "Deberia crear lugar turistico|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18760,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003c0058-00eb-00c6-0036-00d0008100cf.png",
        "timestamp": 1613434236530,
        "duration": 1779
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18760,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001b00a7-004f-00d1-0052-008f002b00cf.png",
        "timestamp": 1613434238573,
        "duration": 27
    },
    {
        "description": "Deberia listar los lugares turisticos|workspace-project Lugar turistico",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18760,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.146"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00f000bd-0007-00e1-006d-00b400f50048.png",
        "timestamp": 1613434238866,
        "duration": 489
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
