'use strict;'

/* Controllers */

var taskApp = angular.module('taskApp', ['uuid4', 'ngStorage']);

// include string names for the arguments eg: '$scope' so that they are not replaced when generating minified or obfuscated javascript
taskApp.controller('taskController', ['$scope', '$log', '$localStorage', 'uuid4', function ($scope, $log, $localStorage, uuid4) {

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

    $scope.$storage.todo = [
        {
            id: uuid4.generate(),
            sequence: 0,
            name: 'California',
            tasks: [
                { id: uuid4.generate(), name: 'Hiking', details: 'on Mt. Tamalpais' },
                { id: uuid4.generate(), name: 'Camping', details: 'in Carson Pass' },
                { id: uuid4.generate(), name: 'Kayaking', details: 'in San Francisco Bay' }
            ]
        },
        {
            id: uuid4.generate(),
            sequence: 1,
            name: 'Toronto',
            tasks: [
                { id: uuid4.generate(), name: 'Fishing', details: 'at the Cottage' },
                { id: uuid4.generate(), name: 'Biking', details: 'at the Island' },
                { id: uuid4.generate(), name: 'Visiting', details: 'with Marcel, Rhiane, Charis, Ashley, Philip, Kizzy, Caleb, the newbie, Laurel, Dan, Marley, Mom, Dad, Auntie Jo, Mr. Vetere, Gus, Patrick, Brian' }
            ]
        }
    ];

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
            onAdd: function (evt) { // fired after onRemove() in sortable.js
                Sortable.utils.stopPropagation(evt);
                //$scope.$apply(function () {
                    var next = evt.item.nextElementSibling;
                    var prev = evt.item.previousElementSibling;
                    var nextIndex = next ? next.getAttribute('data-index') : null;
                    var prevIndex = prev ? prev.getAttribute('data-index') : null;
                    var newIndex;

                    getCurrentCategoryAndTask(evt, listElement);

                    // TODO: can move to first or last, but not middle -- everything after newIndex is gone, but still in $scope.currentCategory.tasks

                    if (prev && next) { // when we have both, nextIndex is always > prevIndex
                        newIndex = nextIndex;
                        $log.warn(sprintf('(2) splice at %s', nextIndex));
                    } else if (next) {
                        newIndex = nextIndex;
                        $log.warn(sprintf('(2) splice at %s', nextIndex));
                    } else if (prev) {
                        newIndex = prevIndex;
                        $log.warn(sprintf('(2) splice at %s', prevIndex));
                    }

                    // add task to our scope
                    $log.debug($scope.currentCategory.tasks.length + ' tasks BEFORE');
                    $scope.currentCategory.tasks.splice(newIndex, 0, $scope.currentTask);
                    $log.debug($scope.currentCategory.tasks.length + ' tasks AFTER');
                //});
            },
            onUpdate: function (evt) {
                Sortable.utils.stopPropagation(evt);

                $scope.$apply(function () {
                    var next = evt.item.nextElementSibling;
                    var prev = evt.item.previousElementSibling;
                    var nextIndex = next ? next.getAttribute('data-index') : null;
                    var prevIndex = prev ? prev.getAttribute('data-index') : null;
                    var currentIndex = evt.item.getAttribute('data-index');
                    var newIndex;

                    getCurrentCategoryAndTask(evt, listElement);

                    if (prev && next) { // when we have both, nextIndex is always > prevIndex
                        if (nextIndex > currentIndex) {
                            newIndex = prevIndex;
                            //$log.warn(sprintf('(1) moving DOWN from %s to %s', currentIndex, prevIndex));  // 0-1
                        } else {
                            newIndex = nextIndex;
                            //$log.warn(sprintf('(1) moving UP from %s to %s', currentIndex, nextIndex));  // 2-1
                        }
                    } else if (next) {
                        newIndex = nextIndex;
                        //$log.warn(sprintf('(2) moving UP from %s to %s', currentIndex, nextIndex));        // 1-0
                    } else if (prev) {
                        newIndex = prevIndex;
                        //$log.warn(sprintf('(2) moving DOWN from %s to %s', currentIndex, prevIndex));      // 1-2
                    }

                    // move 1 item at $scope.currentCategory.tasks[currentIndex] to [newIndex]
                    $scope.currentCategory.tasks.splice(newIndex, 0, $scope.currentCategory.tasks.splice(currentIndex, 1)[0]);
                });
            },
            onRemove: function (evt) { // fired before onAdd() in sortable.js
                Sortable.utils.stopPropagation(evt);
                getCurrentCategoryAndTask(evt, listElement); // capture current task for use in onAdd()
                // remove 1 item at $scope.currentCategory.tasks[index]
                $scope.currentCategory.tasks.splice($scope.currentCategory.tasks.indexOf($scope.currentTask), 1);
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

            //category.removeWatchHandler = $scope.$watch('categories[' + categoryIndex + '].tasks', function (newValues, oldValues) {
            //    if (newValues !== oldValues) {
            //        $log.warn(category.name + ' changed');
            //        angular.forEach(category.tasks, function (task) {
            //            $log.info(sprintf('%s(%s)', task.name, task.sequence));
            //        });
            //        // TODO: update persistent store here
            //    }
            //}, true);
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

        $scope.categories.splice(index, 1); // remove 1 item at categories[index]
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
        //category.removeWatchHandler = $scope.$watch('categories[' + categoryIndex + '].tasks', function (newValues, oldValues) { // watch for task changes
        //    if (newValues !== oldValues) {
        //        $log.warn(category.name + ' changed');
        //        angular.forEach(category.tasks, function (task) {
        //            $log.info(sprintf('%s(%s)', task.name, task.sequence));
        //        });
        //        // update persistent store
        //        var categoryIndex = $scope.$storage.todo.indexOf(category);
        //        $scope.$storage.todo[categoryIndex] = category;
        //    }
        //}, true);
        //$scope.$watch('categories.length', function (newValues, oldValues) { // watch for changes
        //    if (newValues !== oldValues) {
        //        $log.warn('category.length change watched');
        //    }
        //});
        //$scope.$watch('categories[' + categoryIndex + '].sequence', function (newValues, oldValues) { // watch for changes
        //    if (newValues !== oldValues) {
        //        $log.warn('category.sequence change watched');
        //    }
        //});
        //$scope.$watch('categories[' + categoryIndex + '].tasks.length', function (newValues, oldValues) { // watch for changes
        //    if (newValues !== oldValues) {
        //        $log.warn('category.tasks.length change watched');
        //    }
        //});
        $scope.$watchCollection('categories[' + categoryIndex + '].tasks', function (newValues, oldValues) { // watch for changes
            if (newValues !== oldValues) {
                $log.warn('category.tasks change watched');
            }
        });
    });

    setTimeout(function () { // wait until list is rendered
        new Sortable(multi, { // create sortable for categories
            draggable: '.tile',
            handle: '.glyph-link-move',
            onAdd: function (evt) {
                Sortable.utils.stopPropagation(evt);
                $log.debug('category added');
            },
            onUpdate: function (evt) {
                Sortable.utils.stopPropagation(evt);

                $scope.$apply(function () {
                    $log.debug('category updated');

                    // TODO: reorder categories
                    angular.forEach(evt.item.parentNode.getElementsByClassName('tile'), function (item, index) {
                        var obj = _.find($scope.categories, function (cat) {
                            return cat.id === item.id;
                        });
                        obj.sequence = index;
                        console.log('set ' + obj.name + '.sequence=' + index);
                    });
                });
            },
            onRemove: function (evt) {
                Sortable.utils.stopPropagation(evt);
                $log.debug('category removed');
            }
        });

        [ ].forEach.call(multi.getElementsByClassName('list-group'), createSortable); // create sortable for tasks within a category
    }, 500);

    // DEBUG
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    window.scope = $scope; // for firebug
} ]);
