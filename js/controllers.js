'use strict;'

/* Controllers */

var categoryChangeTimer;

var taskApp = angular.module('taskApp', ['uuid4', 'ngStorage']);

// include string names for the arguments eg: '$scope' so that they are not replaced when generating minified or obfuscated javascript
//taskApp.controller('taskController', ['$scope', '$log', '$localStorage', 'uuid4', 'helloWorldService', function ($scope, $log, $localStorage, uuid4, helloWorldService) {
taskApp.controller('taskController', ['$scope', '$log', '$localStorage', 'uuid4', function ($scope, $log, $localStorage, uuid4) {

    // DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    var taskboard = document.getElementById('taskboard');

    var $taskDialog = $('#task-dialog');
    var $taskName = $('input[name=taskName]');
    var $taskDetails = $('input[name=taskDetails]');

    $scope.nameDialog = null;
    $scope.currentTask = null;
    $scope.currentCollection = null;
    $scope.currentCategory = null;

    $scope.$storage = $localStorage;

    var collectionMgr = (function () {
        //
        // private
        //
        function _createMockCategoriesAndTasks() {
            return [
                {
                    id: uuid4.generate(),
                    name: 'California',
                    sequence: 0,
                    tasks: [
                        { id: uuid4.generate(), name: 'Hiking', details: 'on Mt. Tamalpais' },
                        { id: uuid4.generate(), name: 'Camping', details: 'in Carson Pass' },
                        { id: uuid4.generate(), name: 'Kayaking', details: 'in San Francisco Bay' }
                    ]
                },
                {
                    id: uuid4.generate(),
                    name: 'Toronto',
                    sequence: 1,
                    tasks: [
                        { id: uuid4.generate(), name: 'Fishing', details: 'at the Cottage' },
                        { id: uuid4.generate(), name: 'Biking', details: 'at the Island' }
                    ]
                }
            ];
        }
        function _setCurrentFromStorage() {
            $scope.currentCollection = $scope.$storage.collections[$scope.$storage.collections.current];
        }
        function _updateCurrentFromStorage() {
            $scope.$storage.collections[$scope.$storage.collections.current] = $scope.currentCollection;
        }
        function _mockInit() {
            $scope.$storage.collections = {
                list: ['test'], current: 'test',
                test: _createMockCategoriesAndTasks()
            };
        }
        //
        // public
        //
        return {
            context: function () {
                return $scope.$storage.collections;
            },
            currentName: function () {
                return $scope.$storage.collections.current;
            },
            setCurrentFromStorage: _setCurrentFromStorage,
            updateCurrentFromStorage: _updateCurrentFromStorage,
            add: function (collectionName) {
                $scope.$storage.collections.list.push(collectionName); // add to dropdown
                $scope.$storage.collections[collectionName] = []; // add collection with empty tasks list
            },
            nameIsValid: function (collectionName) {
                return validateName($scope.$storage.collections, collectionName);
            },
            removeCurrentFromList: function () {
                $scope.$storage.collections.list = _.without($scope.$storage.collections.list, $scope.$storage.collections.current);
            },
            changeTo: function (collectionName) {
                $scope.$storage.collections.current = collectionName;
                _setCurrentFromStorage();
            },
            selectFirstAvailable: function () {
                if (!$scope.$storage.collections.list.length === 1) {
                    $scope.$storage.collections.current = $scope.$storage.collections.list[0];
                }
            },
            init: function () {
                //$scope.$storage.$reset();
                if (!$scope.$storage.collections) {
                    _mockInit();
                }
                _setCurrentFromStorage();
            }
        };
    })();

    var taskMgr = (function () {
        return {
        };
    })();

    // HELPERS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

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

                    collectionMgr.updateCurrentFromStorage();
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

                    collectionMgr.updateCurrentFromStorage();
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

                collectionMgr.updateCurrentFromStorage();
                //});
            }
        });
        //$log.warn('typeof foo.destroy: ' + (typeof foo.destroy));
    }

    // METHODS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    function validateName(context, name) {
        var obj, validation;
        if (name && name.length) {
            if (context === collectionMgr.context()) {
                obj = context[name];
            } else if (context === $scope.currentCollection) {
                obj = _.find(context, function (item) {
                    return item.name.toUpperCase() === name.toUpperCase();
                });
            }
            if (obj) { // already exists
                validation = {
                    ok: false,
                    message: name + ' already exists!'
                };
            } else {
                validation = { ok: true };
            }
        } else {
            validation = {
                ok: false,
                message: 'Please enter a name'
            };
        }
        return validation;
    }

    // TODO: need to refactor this mess
    $scope.addCollection = function () {
        $scope.nameDialog = {
            title: 'Create Collection',
            prompt: 'Enter Collection Name',
            onValidate: function (collectionName) {
                return collectionMgr.nameIsValid(collectionName);
            },
            onSave: function (collectionName) {
                if (collectionName.length) {

                    collectionMgr.add(collectionName);

                    setTimeout(function () { // wait for DOM to render
                        $scope.$apply(function () {
                            //$scope.changeCollection(collectionName);
                            collectionMgr.changeTo(collectionName);
                        })
                    }, 0);
                }
            }
        };

        $('#name-dialog').modal('show');
    };

    $scope.addCategory = function () {
        $scope.nameDialog = {
            title: 'Create Category',
            prompt: 'Enter Category Name',
            onValidate: function (categoryName) {
                return validateName($scope.currentCollections, categoryName);
            },
            onSave: function (categoryName) {
                var categoryIndex = $scope.currentCollection.length;

                if (categoryName.length) {
                    $log.warn(sprintf('New category name is %s', categoryName));

                    // TODO: verify that category name doesn't already exist

                    var category = {
                        id: uuid4.generate(),
                        sequence: categoryIndex,
                        name: categoryName,
                        tasks: []
                    };

                    $scope.currentCollection.push(category);
                    collectionMgr.updateCurrentFromStorage();

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
        };

        $('#name-dialog').modal('show');
    };

    $scope.addTask = function (category) {
        $taskName.val('');
        $taskDetails.val('');
        $scope.currentCategory = category;
        $taskDialog.find('.modal-title').text('Create Task').end().on('shown.bs.modal', function (e) {
            $taskName.focus();
        }).modal('show');
    };

    $scope.changeCollection = collectionMgr.changeTo;

    $scope.editTask = function (category, task) {
        // open task-dialog
        $taskName.val(task.name);
        $taskDetails.val(task.details);

        //$scope.currentCategory = category; // TODO: need to lookup storage
        $scope.currentCategory = _.find($scope.categories, function (cat) {
            return category.id === cat.id;
        });

        $taskDialog.find('.modal-title').text('Edit Task').end().on('shown.bs.modal', function (e) {
            $taskName.focus();
        }).modal('show');
        // TODO: need to tell enteredTask() that we're updating, not adding
    };

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
                collectionMgr.updateCurrentFromStorage();
            }
        }
    }

    // TODO: need to refactor this mess
    $scope.removeCollection = function () {
        // TODO: confirm delete collection dialog here
        alert(sprintf('removeCollection(%s)', collectionMgr.currentName()));

        // empty the collection
        $scope.currentCollection = [];

        // remove collection from dropdown list
        collectionMgr.removeCurrentFromList();

        // TODO: need to remove watch handlers?

        // delete the collection
        //delete $scope.$storage.collections[$scope.$storage.collections.current];

        collectionMgr.selectFirstAvailable();

        collectionMgr.updateCurrentFromStorage();

        //    });
        //});
    };

    $scope.removeCategory = function (category) {

        // no need to wrap in $scope.$apply() because that's already done by angular directive ng-click="removeCategory(category)"

        // TODO: confirm delete category dialog here

        var index = $scope.currentCollection.indexOf(category);

        if (category.removeWatchHandler && typeof category.removeWatchHandler === 'function') {
            category.removeWatchHandler();
        }

        $scope.currentCollection.splice(index, 1); // remove item at categories[index]

        // update sequence numbers
        $scope.currentCollections.forEach(function (category, categoryIndex) {
            category.sequence = categoryIndex;
        });

        collectionMgr.updateCurrentFromStorage();
    };

    $scope.removeTask = function (category, task) {
        // TODO: confirm delete task dialog here

        var index = category.tasks.indexOf(task);

        category.tasks.splice(index, 1);

        collectionMgr.updateCurrentFromStorage();
    };

    // INIT
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    //helloWorldService.sayHello();

    collectionMgr.init();

    $('.glyph-link-move').on('click', function (evt) { // clicking move handle won't change the window.location.hash
        evt.preventDefault();
    });

    $scope.$watch('categories.length', function (newValues, oldValues) { // watch for changes in number of categories
        if (newValues !== oldValues) { // fires twice because $digest loop runs a minumum of 2 times

            // SEE: https://docs.angularjs.org/api/ng/directive/ngModelOptions
            // ngModelOptions="{ updateOn: 'default blur', debounce: {'default': 500, 'blur': 0} }"

            if (categoryChangeTimer) { // debounce this event, so we only run the handler once
                clearInterval(categoryChangeTimer);
            }
            categoryChangeTimer = setTimeout(function () {
                $log.warn('category.length changed, oldValues:' + oldValues + ', newValues: ' + newValues);
                categoryChangeTimer = null;
            }, 100);
        }
    });

    $scope.currentCollection.forEach(function (category, categoryIndex) {
        category.removeWatchHandler = $scope.$watchCollection('categories[' + categoryIndex + '].tasks', function (newValues, oldValues) { // watch for changes in category tasks
            if (newValues !== oldValues) {
                if (newValues) {
                    $log.warn('category[' + this.scope.categories[categoryIndex].name + '].tasks changed');
                } else {
                    $log.warn('category and tasks removed because collection was deleted');
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
                        var cat = _.find($scope.currentCollection, function (cat) {
                            return cat.id === item.id;
                        });
                        $log.info(sprintf('%s.sequence = %s', cat.name, index));
                        cat.sequence = index;
                    });

                    collectionMgr.updateCurrentFromStorage();
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
