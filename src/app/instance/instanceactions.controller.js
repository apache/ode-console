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
  .controller('InstanceActionsController', function ($scope, $location, xmlParser, $http, InstanceService, ngToast, $modal, $q) {

  var fireChangeEvent = function (action, iids) {
    $scope.$emit('instance-modified', {action: action, iids: iids});
  };

  $scope.delete = function(iids) {
    iids = iids.pop ? iids : [iids];
    if (iids.length === 0) {return;}
    console.log('delete ' + iids);

    $q.all(iids.map(function (id) {
      return InstanceService.delete(id);
    })).then(function() {
      fireChangeEvent('delete', iids);
    });
  };

  $scope.terminate = function(iids) {
    iids = iids.pop ? iids : [iids];
    if (iids.length === 0) {return;}
    console.log('terminate ' + iids);

    $q.all(iids.map(function (id) {
      return InstanceService.terminate(id);
    })).then(function() {
      fireChangeEvent('terminate', iids);
    });
  };

  $scope.suspend = function(iids) {
    iids = iids.pop ? iids : [iids];
    if (iids.length === 0) {return;}
    console.log('suspend ' + iids);

    $q.all(iids.map(function (id) {
      return InstanceService.suspend(id);
    })).then(function() {
      fireChangeEvent('suspend', iids);
    });
  };

  $scope.resume = function(iids) {
    iids = iids.pop ? iids : [iids];
    if (iids.length === 0) {return;}
    console.log('resume ' + iids);

    $q.all(iids.map(function (id) {
      return InstanceService.resume(id);
    })).then(function() {
      fireChangeEvent('resume', iids);
    });
  };

  $scope.deleteAll = function() {
    console.log('deleteAll ' + $scope.filter);
    InstanceService.deleteFilter($scope.filter).then(function() {
      fireChangeEvent('deleteAll', '*');
    });
  };

  $scope.openFaultModal = function () {
    $modal.open({
      templateUrl: 'app/instance/faultinfodialog.html',
      scope: $scope,
    });
  };

  $scope.openCorrelationPropertiesModal = function () {
    $modal.open({
      templateUrl: 'app/instance/corrpropinfodialog.html',
      scope: $scope,
    });
  };
});
