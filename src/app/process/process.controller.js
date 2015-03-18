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
  .controller('ProcessController', function ($scope, $routeParams, xmlParser, $http, ProcessService, InstanceService, ngToast) {

  var updateInstanceTable = function () {
    InstanceService.listInstancesSummary('pid = ' + $routeParams.pid, '-last-active', $scope.maxInstances).then(function(instances) {
      $scope.instances = instances;
    }, function(fault) {
        $scope.instances = [];
        var re = /java\.lang\.RuntimeException: Invocation of method \S+ in management interface failed: (.+)/,
            m;
        if ((m = re.exec(fault.faultstring)) !== null) {
          ngToast.create({content: m[0], class: 'warning'});
        } else {
          ngToast.create({content: 'Could not load process instance list.', class: 'danger'});
        }
    });
  };

  var updateProcessInfo = function () {
    ProcessService.getProcessInfo($routeParams.pid).then(function(process) {
      $scope.process = process;
    }, function() {
        ngToast.create({content: 'Could not load process ' + $routeParams.pid + '.', class: 'danger'});
    });
  };

  // listen for changes issued by actions to reload table
  $scope.$on('instance-modified', function () { 
    updateInstanceTable();
  });
  $scope.$on('process-modified', function () { 
    updateProcessInfo();
  });

  $scope.maxInstances = 15;


  updateInstanceTable();
  updateProcessInfo();
});
