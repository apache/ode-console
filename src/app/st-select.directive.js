/*
 Copyright 2013 Daniel Unfried
 Modifications 2015 Apache ODE team

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

'use strict';

/* See https://github.com/wldaunfr/ng-selectall/blob/develop/src/selectall.directive.js */
angular.module('odeConsole')
  .directive('selectAllCheckbox', ['$filter', function($filter) {
    return {
        restrict: 'E',
        template: '<input type="checkbox">',
        replace: true,
        link: function(scope, element, attrs) {
            // set checked and indeterminate state
            function changeState(checked, indet) {
                element.prop('checked', checked).prop('indeterminate', indet);
            }
            // update item checkboxes
            function updateItems() {
                angular.forEach(scope.$eval(attrs.items), function(el) {
                    el[attrs.prop] = element.prop('checked');
                });
            }
            element.bind('change', function() {
                // update items on change
                scope.$apply(function() { updateItems(); });
            });
            scope.$watch(attrs.items, function(newValue) {
                var checkedItems = $filter('filter')(newValue, function(el) {
                    return el[attrs.prop];
                });
                switch(checkedItems ? checkedItems.length : 0) {
                    case 0:
                        // none selected (not checked, not indeterminate)
                        changeState(false, false);
                        break;
                    case newValue.length:
                        // all selected (checked, not indeterminate)
                        changeState(true, false);
                        break;
                    default:
                        // some selected (not checked, indeterminate)
                        changeState(false, true);
                }
            }, true);
            scope.$on('$destroy', function() {
              element.off('change');
            });
            // initially update items
            updateItems();
        }
    };
}]);
