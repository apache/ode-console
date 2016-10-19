/* 
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

 /* https://github.com/wldaunfr/ng-selectall/blob/develop/src/selectall.directive.js */
 
'use strict';

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
