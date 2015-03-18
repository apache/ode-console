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
  .controller('ProcessListController', function ($scope, xmlParser, $http, ProcessService, ngToast) {

  var updateTable = function () {
    ProcessService.getPackages().then(function(packages) {
      $scope.packages = packages;
    }, function() {
        ngToast.create({content: 'Could not load process list.', class: 'danger'});
    });
  };

  $scope.upload = {};
  $scope.uploadPackage = function () {
    ProcessService.deployPackage($scope.upload.packageName, $scope.upload.file.base64).then(function() {
      ngToast.create({content: 'Package ' + $scope.upload.name + ' successfully deployed', class: 'success'});
      $scope.upload = {};
      updateTable();
    }, function(fault) {
      ngToast.create({content: 'Could not deploy package ' + $scope.upload.file.filename + ': ' + fault.faultstring, class: 'danger'});
      $scope.upload = {};
    });
  };

  // listen for changes issued by actions to reload table
  $scope.$on('process-modified', function () { 
    updateTable();
  });
  $scope.$on('package-modified', function () { 
    updateTable();
  });

  updateTable();

});
