'use strict;'

/* Controllers */

var taskApp = angular.module('taskApp', ['ui.sortable', 'uuid4']);

taskApp.controller('TaskListCtrl', function ($log, $scope, uuid4) {

    // HELPERS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function getByName(arr, name) {
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i].name === name) {
                return arr[i];
            }
        }
    }

    function updateCategoryProperties(categories) {
        angular.forEach(categories, function (category) {
            updateTaskProperties(category);
        });
    }

    function updateTaskProperties(category) {
        $log.info(category.name);
        angular.forEach(category.tasks, function (task, sequence) {
            task.sequence = sequence;
            task.category = category.name;
            $log.debug(sequence + ' : ' + task.name);
        });
    }

    // DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.trash = [];

    $scope.collections = {
        current: 'todo',
        list: ['todo', 'other'] // these show up in the dropdown
    };

    $scope.categories = [
        {
            name: 'California',
            tasks: [
                { id: uuid4.generate(), name: 'Hiking', details: 'on Mt. Tamalpais' },
                { id: uuid4.generate(), name: 'Camping', details: 'in Carson Pass' },
                { id: uuid4.generate(), name: 'Kayaking', details: 'in San Francisco Bay' }
            ]
        },
        {
            name: 'Toronto',
            tasks: [
                { id: uuid4.generate(), name: 'Fishing', details: 'at the Cottage' },
                { id: uuid4.generate(), name: 'Biking', details: 'at the Island' },
            ]
        }
    ];

    // OPTIONS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.sortableCategoryOptions = {
        //axis: 'x',
        handle: 'i',
        cursor: 'move',
        dropOnEmpty: false,
        connectWith: '.connectedSortableCategory'
    };

    $scope.sortableTaskOptions = {
        handle: 'i',
        cursor: 'move',
        dropOnEmpty: true,
        connectWith: '.connectedSortableTask'
        // TODO: need to add this to a sortable.js callback
        //,stop: function (e, ui) {
        //    $log.debug(JSON.stringify($('.ui-sortable').sortable('serialize')));
        //}
    };

    // METHODS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.addCategory = function () {
        var index = $scope.categories.length;
        var category = {
            name: 'More',
            tasks: [
                { id: uuid4.generate(), name: 'Testing', details: 'added new category' }
            ]
        };
        updateTaskProperties(category);
        $scope.categories.push(category);
        category.removeWatchHandler = $scope.$watchCollection('categories[' + index + '].tasks', function (newValues, oldValues) {
            if (newValues !== oldValues) {
                $log.debug(category.name + ' changed');
                updateTaskProperties(category);
            }
        });
    }

    $scope.addTask = function (category) {
        category.tasks.push({ id: uuid4.generate(), name: 'Learning', details: 'angular.js' });
    }

    $scope.changeCollection = function (collectionName) {
        $scope.collections.current = collectionName;
        $scope.tasks = {}; // TODO: load from persistent storage
        $scope.apply();
    }

    $scope.editCategoryName = function (category) {
        category.name = 'Changed';
    }

    $scope.emptyTrash = function () {
        this.trash = []; // 'this' points to $scope
    }

    $scope.removeCategory = function (category) {
        // TODO: delete category
        // TODO: http://www.bennadel.com/blog/2480-unbinding-watch-listeners-in-angularjs.htm
        if (category.removeWatchHandler && typeof category.removeWatchHandler === 'function') {
            category.removeWatchHandler();
        }
    }

    // INIT
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    angular.forEach($scope.categories, function (category, index) {
        updateTaskProperties(category); // add computed properties
        category.removeWatchHandler = $scope.$watchCollection('categories[' + index + '].tasks', function (newValues, oldValues) {
            if (newValues !== oldValues) {
                $log.debug(category.name + ' changed');
                updateTaskProperties(category);
            }
        });
    });

    $scope.$watchCollection('trash', function (newValues, oldValues) {
        if (newValues !== oldValues) {
            $log.info('trash changed');
        }
    });

    // DEBUG
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    window.scope = $scope; // for firebug
});