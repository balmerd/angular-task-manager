'use strict;'

/* Controllers */

var taskApp = angular.module('taskApp', ['ui.sortable', 'uuid4']);

// include string names for the arguments eg: '$scope' so that they are not replaced when generating minified or obfuscated javascript
taskApp.controller('TaskListCtrl', ['$scope', '$log', 'uuid4', function ($scope, $log, uuid4) {

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
                { id: uuid4.generate(), name: 'Visiting', details: 'with Marcel, Rhiane, Charis, Ashley, Philip, Kizzy, Caleb, Laurel, Dan, Marley, Mom, Dad, Auntie Jo, Mr. Vetere' }
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
        connectWith: '.connectedSortableCategory',
        stop: function (e, ui) {
            var fromIndex = ui.item.sortable.index;
            var toIndex = ui.item.sortable.dropindex;
            $log.info('category[' + fromIndex + '] moved to category[' + toIndex + ']');
        }
    };

    $scope.sortableTaskOptions = {
        handle: 'i',
        cursor: 'move',
        dropOnEmpty: true,
        connectWith: '.connectedSortableTask',
        stop: function (e, ui) {
            var fromIndex = ui.item.sortable.index;
            var toIndex = ui.item.sortable.dropindex;
            $log.info('task[' + fromIndex + '] moved to task[' + toIndex + ']');
        }
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
                $log.warn(category.name + ' changed');
                updateTaskProperties(category);
            }
        });
    };

    $scope.addCollection = function () {
        alert('addCollection');
    };

    $scope.addTask = function (category) {
        category.tasks.push({ id: uuid4.generate(), name: 'Learning', details: 'angular.js' });
    };

    $scope.changeCollection = function (collectionName) {
        $scope.collections.current = collectionName;
        $scope.tasks = {}; // TODO: load from persistent storage
        $scope.apply();
    };

    $scope.editTask = function (task) {
        alert('editTask - ' + JSON.stringify(task));
    };

    $scope.removeCategory = function (category) {
        // TODO: confirm delete category dialog here

        var index = $scope.categories.indexOf(category);

        if (category.removeWatchHandler && typeof category.removeWatchHandler === 'function') {
            category.removeWatchHandler();
        }

        $scope.categories.splice(index, 1);
    };

    $scope.removeCollection = function (collection) {
        // TODO: confirm delete collection dialog here
        // TODO: delete collection
        // TODO: need to remove watch handlers?
        alert('removeCollection - ' + JSON.stringify(collection));
    };

    $scope.removeTask = function (category, task) {
        // TODO: confirm delete task dialog here

        var index = category.tasks.indexOf(task);

        category.tasks.splice(index, 1);
    };

    // INIT
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    //$scope.cats = {};

    angular.forEach($scope.categories, function (category, index) {
        updateTaskProperties(category); // add computed properties
        //$scope.cats[category.name] = index;

        category.removeWatchHandler = $scope.$watchCollection('categories[' + index + '].tasks', function (newValues, oldValues) {
            //
            // PROBLEM: when categories are re-ordered, the category and index within this closure become invalid
            //
            if (newValues !== oldValues) {
                $log.warn(category.name + ' changed');
                updateTaskProperties(category);
            }
        });
    });

    // DEBUG
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    window.scope = $scope; // for firebug
} ]);