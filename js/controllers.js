'use strict;'

/* Controllers */

var categoryChangeTimer;

var taskApp = angular.module('taskApp', ['uuid4', 'ngStorage']);

// include string names for the arguments eg: '$scope' so that they are not replaced when generating minified or obfuscated javascript
taskApp.controller('taskController', ['$scope', '$log', '$localStorage', 'uuid4', function ($scope, $log, $localStorage, uuid4) {

    // DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    var taskboard = document.getElementById('taskboard');

    var $taskDialog = $('#task-dialog');
    var $categoryDialog = $('#category-dialog');
    var $collectionDialog = $('#collection-dialog');

    var $taskName = $('input[name=taskName]');
    var $taskDetails = $('input[name=taskDetails]');
    var $categoryName = $('input[name=categoryName]');
    var $collectionName = $('input[name=collectionName]');

    $scope.currentTask;
    $scope.currentCategory;

    $scope.$storage = $localStorage;

    initializeCurrentCollection();

    // HELPERS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function initializeCurrentCollection() {
        //$scope.$storage.collections = undefined; // DEBUG: uncomment to reset
        if ($scope.$storage.collections === undefined) {
            $scope.$storage.collections = {
                current: 'test',
                list: ['test'] // these show up in the dropdown
            };
            $scope.$storage.collections[$scope.$storage.collections.current] = createMockCategoriesAndTasks();
        }

        $scope.collections = $scope.$storage.collections;

        // sort categories so that they render in the correct sequence
        $scope.categories = _.sortBy($scope.collections[$scope.collections.current], function (category) { return category.sequence; });
    }

    function createMockCategoriesAndTasks() {
        return [
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
                    { id: uuid4.generate(), name: 'Biking', details: 'at the Island' }
                ]
            }
        ];
    }

    function sprintf() {
        var s = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            s = s.replace('%s', arguments[i]);
        }
        return s;
    }

    function getCurrentCategoryAndTask(evt, listElement, trace) {
        //
        // onAdd and onUpdate : listElement is the <div> for the target category
        // onRemove : listElement is the <div> for the source category
        //

        $scope.currentCategory = angular.element(listElement).scope().category; // scope() doesn't have a task property :-(

        if ((/update|remove/i).test(evt.type)) {
            $scope.currentTask = _.find($scope.currentCategory.tasks, function (task) {
                return task.id === evt.item.id;
            });
        }

        //$log.info(sprintf("%s : $scope.currentCategory.name: %s, $scope.currentTask.name: %s", trace, $scope.currentCategory.name, $scope.currentTask.name));
    }

    function getPosition(evt) {
        var ui = {
            next: evt.item.nextElementSibling,
            prev: evt.item.previousElementSibling,
            currentIndex: evt.item.getAttribute('data-index')
        };
        ui.prevIndex = ui.prev ? ui.prev.getAttribute('data-index') : null;
        ui.nextIndex = ui.next ? ui.next.getAttribute('data-index') : null;
        return ui;
    }

    function createSortable(listElement) {
        var foo = new Sortable(listElement, {
            group: 'tasks',
            draggable: '.list-group-item',
            handle: '.item-handle',
            onAdd: function (evt) { // fired after onRemove() in sortable.js
                evt.stopPropagation();

                $scope.$apply(function () {
                    var ui = getPosition(evt); // get position of droppped item within list

                    getCurrentCategoryAndTask(evt, listElement, 'onAdd');

                    $(evt.item).remove(); // remove dropped DOM element, will be rendered by angular when added to scope

                    if (ui.prev && ui.next) { // when we have both, nextIndex is always > prevIndex
                        ui.newIndex = ui.nextIndex;
                    } else if (ui.next) {
                        ui.newIndex = ui.nextIndex;
                    } else if (ui.prev) { // add after last entry
                        ui.newIndex = ui.prevIndex + 1;
                    }

                    // add task to our scope
                    $scope.currentCategory.tasks.splice(ui.newIndex, 0, $scope.currentTask);
                });
            },
            onUpdate: function (evt) {
                evt.stopPropagation();

                $scope.$apply(function () {
                    var ui = getPosition(evt);

                    getCurrentCategoryAndTask(evt, listElement, 'onUpdate');

                    if (ui.prev && ui.next) { // when we have both, nextIndex is always > prevIndex
                        if (ui.nextIndex > ui.currentIndex) { // moving down
                            ui.newIndex = ui.prevIndex;
                        } else { // moving up
                            ui.newIndex = ui.nextIndex;
                        }
                    } else if (ui.next) { // moving up
                        ui.newIndex = ui.nextIndex;
                    } else if (ui.prev) { // moving down
                        ui.newIndex = ui.prevIndex;
                    }

                    // move item at $scope.currentCategory.tasks[currentIndex] to [newIndex]
                    $scope.currentCategory.tasks.splice(ui.newIndex, 0, $scope.currentCategory.tasks.splice(ui.currentIndex, 1)[0]);
                });
            },
            onRemove: function (evt) { // fired before onAdd() in sortable.js
                evt.stopPropagation();

                // WHY: does it work without $scope.$apply() ? because DOM element has already been removed -- no need to re-render
                // WHY: does it break when using $scope.$apply() ? everything before the drop location (including the droppped element) disappears even though the collection still has those items

                //$scope.$apply(function () {
                getCurrentCategoryAndTask(evt, listElement, 'onRemove'); // capture current task for use in onAdd()

                //$log.warn('$scope.currentCategory.name: ' + $scope.currentCategory.name);

                var currentIndex = $scope.currentCategory.tasks.indexOf($scope.currentTask);

                // remove item at $scope.currentCategory.tasks[currentIndex]
                $scope.currentCategory.tasks.splice(currentIndex, 1);
                //});
            }
        });
        //$log.warn('typeof foo.destroy: ' + (typeof foo.destroy));
    }

    // METHODS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.dumpCategories = function () {
        $scope.categories.forEach(function (cat, index) {
            $log.warn(sprintf('#%s : %s %s', cat.sequence, cat.id, cat.name));
            cat.tasks.forEach(function (task, index) {
                $log.log(task.id + ' ' + task.name);
            });
        });
    };

    $scope.reset = function () {
        // TODO: why does this cause TASK drag and drop to become unbound? CATEGORY drag and drop is still ok
        $scope.collections.current = 'test';
        $scope.categories = $scope.collections[$scope.collections.current] = createMockCategoriesAndTasks();
        $scope.categories.forEach(function (category, categoryIndex) { // update sequence numbers
            category.sequence = categoryIndex;
        });
    };

    $scope.addCollection = function () {
        $collectionName.val('');
        $collectionDialog.on('shown.bs.modal', function (e) {
            $collectionName.focus();
        }).modal('show');
    };

    $scope.addCategory = function () {
        $categoryName.val('');
        $categoryDialog.on('shown.bs.modal', function (e) {
            $categoryName.focus();
        }).modal('show');
    };

    $scope.addTask = function (category) {
        $taskName.val('');
        $taskDetails.val('');
        $scope.currentCategory = category;
        $taskDialog.find('.modal-title').text('Create Task').end().on('shown.bs.modal', function (e) {
            $taskName.focus();
        }).modal('show');
    };

    $scope.changeCollection = function (collectionName) {
        $scope.collections.current = collectionName;
        $scope.categories = $scope.collections[collectionName];
    };

    $scope.editTask = function (category, task) {
        // open task-dialog
        $taskName.val(task.name);
        $taskDetails.val(task.details);
        $scope.currentCategory = category;
        $taskDialog.find('.modal-title').text('Edit Task').end().on('shown.bs.modal', function (e) {
            $taskName.focus();
        }).modal('show');
        // TODO: need to tell enteredTask() that we're updating, not adding
    };

    $scope.enteredCollection = function () {
        var categoryIndex = $scope.categories.length;
        var collectionName = $collectionName.val().trim();

        $collectionDialog.modal('hide');

        if (collectionName.length) {
            $log.warn(sprintf('New collection name is %s', collectionName));

            // TODO: verify that collectionName name doesn't already exist

            $scope.collections.list.push(collectionName);
            $scope.collections[collectionName] = [];
        }
    }

    $scope.enteredCategory = function () {
        var categoryIndex = $scope.categories.length;
        var categoryName = $categoryName.val().trim();

        $categoryDialog.modal('hide');

        if (categoryName.length) {
            $log.warn(sprintf('New category name is %s', categoryName));

            // TODO: verify that category name doesn't already exist

            var category = {
                id: uuid4.generate(),
                sequence: categoryIndex,
                name: categoryName,
                tasks: []
            };

            $scope.categories.push(category);

            category.removeWatchHandler = $scope.$watchCollection('categories[' + categoryIndex + '].tasks', function (newValues, oldValues) { // watch for changes
                if (newValues !== oldValues) {
                    $log.warn(sprintf('category[%s].tasks changed', this.scope.categories[categoryIndex].name));
                }
            });

            setTimeout(function () { // wait for render
                createSortable(taskboard.getElementsByClassName('list-group')[categoryIndex]);
            }, 0)
        }
    }

    $scope.enteredTask = function () {
        var taskName = $taskName.val().trim();
        var taskDetails = $taskDetails.val().trim();
        var editing = $taskDialog.find('.modal-title').text() === 'Edit Task';

        // TODO: need to do this "the angular way", not like this...

        $taskDialog.modal('hide');

        if (taskName.length || taskDetails.length) {
            if (editing) {
                // TODO: find existing task and update
            } else {
                // TODO: verify that task name doesn't already exist
                $scope.currentCategory.tasks.push({ id: uuid4.generate(), name: taskName, details: taskDetails }); // create task
            }
        }
    }

    $scope.removeCollection = function () {
        var collection = $scope.collections[$scope.collections.current];

        // TODO: confirm delete collection dialog here
        alert('removeCollection - ' + $scope.collections.current);

        // empty the collection
        $scope.categories = $scope.collections[$scope.collections.current] = [];

        // remove collection from dropdown list
        $scope.collections.list = _.without($scope.collections.list, $scope.collections.current);

        // TODO: need to remove watch handlers?

        // delete the collection
        //setTimeout(function () {
        //    $scope.apply(function () {
        delete $scope.collections[$scope.collections.current];
        $scope.collections.current = '';
        //    });
        //});
    };

    $scope.removeCategory = function (category) {

        // no need to wrap in $scope.$apply() because that's already done by angular directive ng-click="removeCategory(category)"

        // TODO: confirm delete category dialog here

        var index = $scope.categories.indexOf(category);

        if (category.removeWatchHandler && typeof category.removeWatchHandler === 'function') {
            category.removeWatchHandler();
        }

        $scope.categories.splice(index, 1); // remove item at categories[index]

        // update sequence numbers
        $scope.categories.forEach(function (category, categoryIndex) {
            category.sequence = categoryIndex;
        });
    };

    $scope.removeTask = function (category, task) {
        // TODO: confirm delete task dialog here

        var index = category.tasks.indexOf(task);

        category.tasks.splice(index, 1);
    };

    // INIT
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.$watch('categories.length', function (newValues, oldValues) { // watch for changes in number of categories
        if (newValues !== oldValues) { // fires twice because $digest loop runs a minumum of 2 times
            if (categoryChangeTimer) { // debounce this event, so we only run the handler once
                clearInterval(categoryChangeTimer);
            }
            categoryChangeTimer = setTimeout(function () {
                $log.warn('category.length changed, oldValues:' + oldValues + ', newValues: ' + newValues);
                categoryChangeTimer = null;
            }, 100);
        }
    });

    $scope.categories.forEach(function (category, categoryIndex) {
        category.removeWatchHandler = $scope.$watchCollection('categories[' + categoryIndex + '].tasks', function (newValues, oldValues) { // watch for changes in category tasks
            if (newValues !== oldValues) {
                if (newValues === undefined) {
                    $log.warn('category and tasks removed because collection was deleted');
                } else {
                    $log.warn('category[' + this.scope.categories[categoryIndex].name + '].tasks changed');
                }
            }
        });
    });

    setTimeout(function () { // wait until list is rendered
        new Sortable(taskboard, { // create sortable for categories
            draggable: '.category-item',
            handle: '.glyph-link-move',
            onAdd: function (evt) {
                evt.stopPropagation();
                $log.debug('category added');
            },
            onUpdate: function (evt) {
                evt.stopPropagation();

                $scope.$apply(function () {
                    $log.debug('category updated');

                    // update category sequence (array will not be sorted until next time the collection is loaded)
                    angular.forEach(evt.item.parentNode.getElementsByClassName('category-item'), function (item, index) {
                        var cat = _.find($scope.categories, function (cat) {
                            return cat.id === item.id;
                        });
                        cat.sequence = index;
                    });
                });
            },
            onRemove: function (evt) {
                evt.stopPropagation();
                $log.debug('category removed');
            }
        });

        [ ].forEach.call(taskboard.getElementsByClassName('list-group'), createSortable); // create sortable for tasks within a category
    }, 500);

    // DEBUG
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    window.scope = $scope; // for Firebug
} ]);
