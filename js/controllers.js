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

    function updateCategoryProperties(category) {
        $log.info(category.name);
        category.sequence = 0;
        category.initialized = false;
        updateTaskProperties(category);
    }

    function updateTaskProperties(category) {
        angular.forEach(category.tasks, function (task, sequence) {
            task.sequence = sequence;
            task.category = category.name;
            $log.debug(sequence + ' : ' + task.name);
        });
    }

    function categoryChanged(category, newValues, oldValues) {
        if (!category.initialized) {
            category.initialized = true;
        } else {
            angular.forEach($scope.categories, function (cat, sequence) {
                if (cat.tasks === newValues) {
                    if (cat.name === category.name) {
                        $log.debug(cat.name + ' same cat, tasks matches newValues');
                    } else {
                        $log.error(cat.name + ' different cat, tasks matches newValues');
                    }
                }
            });

            if (newValues !== oldValues) {
                $log.debug(category.name + ' changed');
                updateTaskProperties(category);
            }
        }
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
            id: uuid4.generate(),
            name: 'California',
            tasks: [
                { id: uuid4.generate(), name: 'Hiking', details: 'on Mt. Tamalpais' },
                { id: uuid4.generate(), name: 'Camping', details: 'in Carson Pass' },
                { id: uuid4.generate(), name: 'Kayaking', details: 'in San Francisco Bay' }
            ]
        },
        {
            id: uuid4.generate(),
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
    };

    // METHODS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.addCategory = function () {
        var index = $scope.categories.length;
        var category = {
            id: uuid4.generate(),
            name: 'More',
            tasks: [
                { id: uuid4.generate(), name: 'Testing', details: 'added new category' }
            ]
        };
        updateCategoryProperties(category);
        $scope.categories.push(category);
        category.removeWatchHandler = $scope.$watchCollection('categories[' + index + '].tasks', function (oldValues, newValues) {
            categoryChanged(category, oldValues, newValues);
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
        updateCategoryProperties(category); // add computed properties
        category.removeWatchHandler = $scope.$watchCollection('categories[' + index + '].tasks', function (oldValues, newValues) {
            categoryChanged(category, oldValues, newValues);
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