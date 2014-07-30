'use strict';

taskApp.service('helloWorldService', ['$log', function ($log) {
    this.sayHello = function () {
        $log.debug('Hello, world');
    };
} ]);
