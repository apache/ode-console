'use strict';

angular.module('odeConsole')
  .controller('NavbarController', function ($scope, $location, ProcessService) {
    $scope.isActive = function (viewLocation) {
        return $location.path().indexOf(viewLocation) === 0;
    };

    // watch for summary changes and update counter badges
    $scope.$watch(function() { 
        return ProcessService.summary;
      }, function (newVal, oldVal, scope) {
        scope.summary = newVal;
    });
  })
;
