'use strict';

/** License unclear: http://jsfiddle.net/wldaunfr/JSFLa/ **/
angular.module('odeConsole')
  .directive('selectAllCheckbox', ['$filter', function($filter) {
    return {
        restrict: 'E',
        template: '<input type="checkbox">',
        replace: true,
        link: function(scope, element, iAttrs) {
            function changeState(checked, indet) {
                element.prop('checked', checked).prop('indeterminate', indet);
            }
            function updateItems() {
                angular.forEach(scope.$eval(iAttrs.items), function(el) {
                    el[iAttrs.prop] = element.prop('checked');
                });
            }
            element.bind('change', function() {
                scope.$apply(function() { updateItems(); });
            });
            scope.$watch(iAttrs.items, function(newValue) {
                var checkedItems = $filter('filter')(newValue, function(el) {
                    return el[iAttrs.prop];
                });
                switch(checkedItems ? checkedItems.length : 0) {
                    case 0:                // none selected
                        changeState(false, false);
                        break;
                    case newValue.length:  // all selected
                        changeState(true, false);
                        break;
                    default:               // some selected
                        changeState(false, true);
                }
            }, true);
            scope.$on('$destroy', function() {
              element.off('change');
            });
            updateItems();
        }
    };
}]);
