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
  .controller('InstanceController', function ($scope, $routeParams, $location, xmlParser, $http, InstanceService, ngToast, $q, $modal) {

  var update = function() {
  InstanceService.getInstanceInfo($routeParams.iid).then(function(instance) {
      $scope.instance = instance;
      $scope.activities = [];
      $scope.variables = [];
      $scope.endpoints = [];
      $scope.scopes = [];
      InstanceService.getScopeInfoWithActivity(instance.rootScope.id, true).then(function(rootScope) {
          $scope.rootScope = rootScope;
          $scope.activities = rootScope.activities;
          $scope.variables = rootScope.variables;
          $scope.endpoints = rootScope.endpoints;
          $scope.scopes.push(rootScope);

          var loadChildren = function (scope) {
            var promises = [];
            if (scope.children) {
              scope.children.forEach(function (child) {
                //console.log(child.siid);
                promises.push(InstanceService.getScopeInfoWithActivity(child.siid, true).then(function(childScope) {
                  $scope.activities = $scope.activities.concat(childScope.activities);
                  $scope.variables = $scope.variables.concat(childScope.variables);
                  $scope.endpoints = $scope.endpoints.concat(childScope.endpoints);
                  $scope.scopes.push(childScope);
                  childScope.isProc = true;
                }).then(loadChildren(child)));
              });

              return $q.all(promises);              
            }
          };

          loadChildren(rootScope);
        }, function() {
            ngToast.create({content: 'Could not load root scope for instance ' + $routeParams.iid + '.', class: 'danger'});
        });
    }, function() {
        ngToast.create({content: 'Could not load process instance ' + $routeParams.iid + '.', class: 'danger'});
    });
  };

  $scope.recoverActivity = function(activity) {
    var dlgScope = $scope.$new();
    dlgScope.activity = activity;
    dlgScope.radio = {model: undefined};
    $modal.open({
      templateUrl: 'app/instance/recoverydialog.html',
      scope: dlgScope,
    }).result.then(function() {
      if (dlgScope.radio.model) {
        InstanceService.recoverActivity($scope.instance.iid, activity.aiid, dlgScope.radio.model).then(function() {
          ngToast.create('Activity recovery scheduled...');
          update();
          dlgScope.$destroy();
        });
      }
    }, function() {
      ngToast.create({content: 'Activity recovery could not be scheduled', class: 'danger'});
    });
  };

  $scope.showVariableModal = function(siid, varName) {
    // load variable info
    InstanceService.getVariableInfo(siid, varName).then(function(varInfo) {
      // when loaded, open modal.
      $modal.open({
        templateUrl: 'app/instance/varinfodialog.html',
        controller: function ($scope, $modalInstance, varInfo) {
          $scope.var = varInfo;
          // beautify indentation of value
          //$scope.var.value = vkbeautify.xml(varInfo.value, 2);
        },
        resolve: {
          varInfo: function() {
            return varInfo;
          }
        }
      }).result.then(function(v) {
        // closed with ok. save variable
        InstanceService.setVariable(siid, varName, v.value).then(function () {
          ngToast.create('Variable updated.');
          update();
        }, function (fault) {
          ngToast.create({content: 'Variable value could not be updated: ' + fault.faultstring, class: 'danger'});
        });
      });
    }, function(fault) {
      ngToast.create({content: 'Could not retrieve variable information: ' + fault.faultstring, class: 'danger'});      
    });
  };

    // listen for changes issued by actions to reload table
  $scope.$on('instance-modified', function () { 
    update();
  });

  update();

});
