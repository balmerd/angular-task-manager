'use strict';

/* App Module */

var taskApp = angular.module('taskApp', [
  'ngRoute',
  //'phonecatAnimations',

  //'phonecatControllers',
  //'phonecatFilters',
  //'phonecatServices',
  'ui.sortable'
]);

taskApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/phones', {
        templateUrl: 'partials/phone-list.html',
        controller: 'PhoneListCtrl'
      }).
      when('/phones/:phoneId', {
        templateUrl: 'partials/phone-detail.html',
        controller: 'PhoneDetailCtrl'
      }).
      otherwise({
        redirectTo: '/phones'
      });
  }]);
