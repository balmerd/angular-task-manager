'use strict;'

taskApp.controller('nameDialogController', ['$scope', function ($scope) {

    // DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    var $dialog = $('#name-dialog');

    $scope.value = '';

    // METHODS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.save = function () {
        $dialog.modal('hide');
        $scope.nameDialog.onSave($scope.value);
    };

    // INIT
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $dialog.on('show.bs.modal', function (e) {
        $(this).find('input:text').val('');
    }).on('shown.bs.modal', function (e) {
        $(this).find('input:text').focus();
    });

} ]);
