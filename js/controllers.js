
/* Controllers */

var taskApp = angular.module('taskApp', ['ui.sortable', 'uuid4']);

taskApp.controller('TaskListCtrl', function ($scope, uuid4) {
    $scope.trash = [];
    $scope.tasks = [
        { id: uuid4.generate(), name: 'Nexus S', details: 'Fast just got faster with Nexus S.' },
        { id: uuid4.generate(), name: 'MOTOROLA XOOM', details: 'The Next, Next Generation tablet.' },
        { id: uuid4.generate(), name: 'Motorola XOOM with Wi-Fi', details: 'The Next, Next Generation tablet.' }
    ];
    $scope.sortableOptions = {
        handle: 'i',
        cursor: 'move',
        dropOnEmpty: true,
        connectWith: '.connectedSortable'
        // TODO: need to add this to a sortable.js callback
        //,stop: function (e, ui) {
        //    console.log(JSON.stringify($('.ui-sortable').sortable('serialize')));
        //}
    };
});