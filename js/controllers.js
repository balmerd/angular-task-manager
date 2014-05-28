'use strict;'

/* Controllers */

var taskApp = angular.module('taskApp', ['uuid4', 'ngStorage']);

// include string names for the arguments eg: '$scope' so that they are not replaced when generating minified or obfuscated javascript
taskApp.controller('TaskListCtrl', ['$scope', '$log', '$localStorage', 'uuid4', function ($scope, $log, $localStorage, uuid4) {

    // DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    var multi = document.getElementById('multi');

    $scope.currentCategory;
    $scope.currentTask;

    $scope.$storage = $localStorage;

    $scope.collections = {
        current: 'todo',
        list: ['todo', 'other'] // these show up in the dropdown
    };

    //$scope.$storage.todo = [
    //    {
    //        id: uuid4.generate(),
    //        sequence: 0,
    //        name: 'California',
    //        tasks: [
    //            { id: uuid4.generate(), sequence: 0, name: 'Hiking', details: 'on Mt. Tamalpais' },
    //            { id: uuid4.generate(), sequence: 1, name: 'Camping', details: 'in Carson Pass' },
    //            { id: uuid4.generate(), sequence: 2, name: 'Kayaking', details: 'in San Francisco Bay' }
    //        ]
    //    },
    //    {
    //        id: uuid4.generate(),
    //        sequence: 1,
    //        name: 'Toronto',
    //        tasks: [
    //            { id: uuid4.generate(), sequence: 0, name: 'Fishing', details: 'at the Cottage' },
    //            { id: uuid4.generate(), sequence: 1, name: 'Biking', details: 'at the Island' },
    //            { id: uuid4.generate(), sequence: 2, name: 'Visiting', details: 'with Marcel, Rhiane, Charis, Ashley, Philip, Kizzy, Caleb, the newbie, Laurel, Dan, Marley, Mom, Dad, Auntie Jo, Mr. Vetere, Gus, Patrick, Brian' }
    //        ]
    //    }
    //];

    $scope.categories = $scope.$storage.todo;

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

    // METHODS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.addCategory = function () {
        var categoryIndex = $scope.categories.length;

        // TODO: category name dialog here

        var category = {
            id: uuid4.generate(),
            sequence: categoryIndex,
            name: 'More',
            tasks: []
        };

        $scope.categories.push(category);

        setTimeout(function () { // wait for render
            createSortable(multi.getElementsByClassName('list-group')[categoryIndex]);

            category.removeWatchHandler = $scope.$watch('categories[' + categoryIndex + '].tasks', function (newValues, oldValues) {
                if (newValues !== oldValues) {
                    $log.warn(category.name + ' changed');
                    angular.forEach(category.tasks, function (task) {
                        $log.info(sprintf('%s(%s)', task.name, task.sequence));
                    });
                    // TODO: update persistent store here
                }
            }, true);
        }, 500)
    };

    $scope.addCollection = function () {
        // TODO: collection name dialog here

        alert('addCollection');
    };

    $scope.addTask = function (category) {
        // TODO: task entry dialog here

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

    angular.forEach($scope.categories, function (category, categoryIndex) {
        category.removeWatchHandler = $scope.$watch('categories[' + categoryIndex + '].tasks', function (newValues, oldValues) { // watch for task changes
            if (newValues !== oldValues) {
                $log.warn(category.name + ' changed');
                angular.forEach(category.tasks, function (task) {
                    $log.info(sprintf('%s(%s)', task.name, task.sequence));
                });
                // update persistent store
                var categoryIndex = $scope.$storage.todo.categories.indexOf(category);
                $scope.$storage.todo.categories[categoryIndex] = category;
            }
        }, true);
    });

    setTimeout(function () { // wait until list is rendered
        new Sortable(multi, { // create sortable for categories
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

        [ ].forEach.call(multi.getElementsByClassName('list-group'), createSortable); // create sortable for tasks within a category
    }, 500);

    // DEBUG
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    window.scope = $scope; // for firebug
} ]);
