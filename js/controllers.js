'use strict;'

/* Controllers */

var taskApp = angular.module('taskApp', ['uuid4']);

// include string names for the arguments eg: '$scope' so that they are not replaced when generating minified or obfuscated javascript
taskApp.controller('TaskListCtrl', ['$scope', '$log', 'uuid4', function ($scope, $log, uuid4) {

    // HELPERS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function sprintf() {
        var s = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            s = s.replace('%s', arguments[i]);
        }
        return s;
    }

    function getCurrentCategoryAndTask(evt, listElement) {
        $scope.currentCategory = getCategory(listElement);
        if ((/update|remove/i).test(evt.type)) {
            $scope.currentTask = _.find($scope.currentCategory.tasks, function (task) {
                return task.id === evt.item.id;
            });
        }
        $log.debug(sprintf('%s %s %s', $scope.currentCategory.name, evt.type.toUpperCase(), $scope.currentTask.name));
    }

    function getCategory(listElement) {
        return $scope.categories[listElement.getAttribute('data-index')];
    }

    function createSortable(listElement) {
        new Sortable(listElement, {
            group: 'tasks',
            draggable: '.list-group-item',
            handle: '.item-handle',
            onAdd: function (evt) { // fired after remove in no-jquery-sortable.js
                Sortable.utils.stopPropagation(evt);

                $scope.$apply(function () {
                    getCurrentCategoryAndTask(evt, listElement);

                    // add task to our scope

                    $scope.currentCategory.tasks.push($scope.currentTask);

                    // reorder task.sequence by LI order (orderBy doesn't work if "track by" is specified)

                    angular.forEach(evt.item.parentNode.getElementsByTagName('li'), function (item, index) {
                        _.find($scope.currentCategory.tasks, function (task) { return task.id === item.id; }).sequence = index;
                    });

                    // remove dropped LI from the UL, otherwise we get a duplicate when angular re-renders the list -- why???

                    evt.item.parentNode.removeChild(evt.item);
                });
            },
            onUpdate: function (evt) {
                Sortable.utils.stopPropagation(evt);

                $scope.$apply(function () {
                    getCurrentCategoryAndTask(evt, listElement);

                    // reorder task.sequence by LI order (orderBy doesn't work if "track by" is specified)

                    angular.forEach(evt.item.parentNode.getElementsByTagName('li'), function (item, index) {
                        _.find($scope.currentCategory.tasks, function (task) { return task.id === item.id; }).sequence = index;
                    });

                });
            },
            onRemove: function (evt) { // fired before add in no-jquery-sortable.js
                Sortable.utils.stopPropagation(evt);

                getCurrentCategoryAndTask(evt, listElement);

                $scope.currentCategory.tasks.splice($scope.currentCategory.tasks.indexOf($scope.currentTask), 1);

                // reorder task.sequence (orderBy doesn't work if "track by" is specified)

                angular.forEach($scope.currentCategory.tasks, function (task, index) {
                    task.sequence = index;
                });
            }
        });
    }

    // DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.currentCategory;
    $scope.currentTask;

    $scope.collections = {
        current: 'todo',
        list: ['todo', 'other'] // these show up in the dropdown
    };

    $scope.categories = [
        {
            id: uuid4.generate(),
            sequence: 0,
            name: 'California',
            tasks: [
                { id: uuid4.generate(), sequence: 0, name: 'Hiking', details: 'on Mt. Tamalpais' },
                { id: uuid4.generate(), sequence: 1, name: 'Camping', details: 'in Carson Pass' },
                { id: uuid4.generate(), sequence: 2, name: 'Kayaking', details: 'in San Francisco Bay' }
            ]
        },
        {
            id: uuid4.generate(),
            sequence: 1,
            name: 'Toronto',
            tasks: [
                { id: uuid4.generate(), sequence: 0, name: 'Fishing', details: 'at the Cottage' },
                { id: uuid4.generate(), sequence: 1, name: 'Biking', details: 'at the Island' },
                { id: uuid4.generate(), sequence: 2, name: 'Visiting', details: 'with Marcel, Rhiane, Charis, Ashley, Philip, Kizzy, Caleb, the newbie, Laurel, Dan, Marley, Mom, Dad, Auntie Jo, Mr. Vetere, Gus, Patrick, Brian' }
            ]
        }
    ];

    var multi = document.getElementById('multi');

    new Sortable(multi, {
        draggable: '.tile',
        handle: '.glyph-link-move',
        onAdd: function (evt) {
            $log.debug('category added');
            Sortable.utils.stopPropagation(evt);
        },
        onUpdate: function (evt) {
            $log.debug('category updated');
            Sortable.utils.stopPropagation(evt);
        },
        onRemove: function (evt) {
            $log.debug('category removed');
            Sortable.utils.stopPropagation(evt);
        }
    });

    setTimeout(function () { // wait until list is rendered
        [ ].forEach.call(multi.getElementsByClassName('list-group'), createSortable);
    }, 500);

    // METHODS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.addCategory = function () {
        var index = $scope.categories.length;
        var category = {
            id: uuid4.generate(),
            sequence: index,
            name: 'More',
            tasks: [
                { id: uuid4.generate(), sequence: 0, name: 'Testing', details: 'added new category' }
            ]
        };
        $scope.categories.push(category);
        category.removeWatchHandler = $scope.$watchCollection('categories[' + index + '].tasks', function (newValues, oldValues) {
            if (newValues !== oldValues) {
                $log.warn(category.name + ' changed');
            }
        });
    };

    $scope.addCollection = function () {
        alert('addCollection');
    };

    $scope.addTask = function (category) {
        category.tasks.push({ id: uuid4.generate(), sequence: category.tasks.length, name: 'Learning', details: 'angular.js' });
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
        //category.removeWatchHandler = $scope.$watchCollection('categories[' + index + '].tasks', function (newValues, oldValues) {
        //    //
        //    // PROBLEM: when categories are re-ordered, the category and index within this closure become invalid
        //    //
        //    if (newValues !== oldValues) {
        //        $log.warn(category.name + ' changed');
        //        updateTaskProperties(category);
        //    } else {
        //        $log.warn(category.name + ' same');
        //    }
        //});
    });

    // DEBUG
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    window.scope = $scope; // for firebug
} ]);