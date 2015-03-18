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

angular.module('odeConsole')
  .controller('ProcessActionsController', function ($scope, xmlParser, $http, ProcessService, ngToast) {

  var fireProcessChangeEvent = function (action, pid) {
    $scope.$emit('process-modified', {action: action, pid: pid});
  };

  var firePackageChangeEvent = function (action, paid) {
    $scope.$emit('package-modified', {action: action, paid: paid});
  };

  $scope.retire = function(pid) {
    console.log('retire ' + pid);
    ProcessService.setRetired(pid, true).then(function() {
      ngToast.create('Process ' + pid + ' retired.');
      fireProcessChangeEvent('retire', pid);
    }, function() {
      ngToast.create({content: 'Ouups, something went wrong.', class: 'danger'});
    });
  };

  $scope.activate = function(pid) {
    console.log('activate ' + pid);
    ProcessService.setRetired(pid, false).then(function() {
      ngToast.create('Process ' + pid + ' activated.');
      fireProcessChangeEvent('activate', pid);
    }, function() {
      ngToast.create({content: 'Ouups, something went wrong.', class: 'danger'});
    });
  };

  $scope.undeployPackage = function(paid) {
    console.log('undeployPackage ' + paid);
    ProcessService.undeployPackage(paid).then(function() {
      ngToast.create('Package ' + paid + ' undeployed.');
      firePackageChangeEvent('undeploy', paid);
    }, function() {
      ngToast.create({content: 'Ouups, something went wrong.', class: 'danger'});
    });
  };

});
