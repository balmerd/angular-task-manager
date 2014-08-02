'use strict;'

taskApp.controller('nameDialogController', ['$scope', '$log', function ($scope, $log) {

    // DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    var $dialog = $('#name-dialog');

    $scope.value = '';

    // METHODS
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.save = function () {
        var validation = $scope.nameDialog.onValidate($scope.value);

        if (validation.ok) {
            $dialog.modal('hide');
            $scope.nameDialog.onSave($scope.value);
        } else {
            setTimeout(function() { // so we don't block UI
                alert(validation.message);
            }, 0);
        }
    };

    // INIT
    ////////////////////////////////////////////////////////////////////////////////////////////////////

    $dialog.on('show.bs.modal', function (e) {
        $(this).find('input:text').val('');
    }).on('shown.bs.modal', function (e) {
        $(this).find('input:text').focus();
    });
} ]);
