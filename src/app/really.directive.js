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

'use strict';

/**
 * A generic confirmation for risky actions.
 * Usage: Add attributes: ng-really-message="Are you sure"? ng-really-click="takeAction()" function
 * Inspired from https://gist.github.com/asafge/7430497
 */
angular.module('odeConsole').directive('ngReallyClick', ['$modal', '$parse', function($modal, $parse) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        // create new child scope to pass data to dialog
        var mScope = scope.$new();
        mScope.message = attrs.ngReallyMessage;

        $modal.open({
          templateUrl: 'app/confirmdialog.html',
          scope: mScope
        }).result.then(function() {
          // destroy temporary child scope
          mScope.$destroy();
          // invoke action
          $parse(attrs.ngReallyClick)(scope);
        });
      });
    }
  };
}]);
