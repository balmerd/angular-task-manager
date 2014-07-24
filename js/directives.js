'use strict';

/* Directives */

taskApp.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind('keydown keypress', function (evt) {
            if (evt.which === 13) {
                evt.preventDefault();
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
            }
        });
    };
});