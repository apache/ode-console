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

/*jslint browser: true*/
/*global vkbeautify:false */
/*global ApacheOdeConsole:true */

'use strict';

// prepopulate endpoint if not overridden
ApacheOdeConsole.endpoint = ApacheOdeConsole.endpoint || window.location.protocol + '//' + window.location.host + window.location.pathname;
ApacheOdeConsole.endpoint = ApacheOdeConsole.endpoint.replace(/\/$/, '');

var underscore = angular.module('underscore', []);
underscore.factory('_', function() {
  return window._;
});

angular.module('odeConsole', ['ngAnimate', 'ngSanitize', 'ngRoute', 'ui.bootstrap', 'ngToast', 'smart-table', 'xml', 'angularMoment', 'underscore', 'angular-loading-bar', 'ui.ace', 'naif.base64'])
  .config(function ($httpProvider) {
        $httpProvider.interceptors.push('xmlHttpInterceptor');
  })
  .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.latencyThreshold = 50;
  }])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'app/dashboard/dashboard.html',
        controller: 'DashboardController'
      })
      .when('/instances', {
        templateUrl: 'app/instance/instancelist.html',
        controller: 'InstanceListController'
      })
      .when('/instances/:iid', {
        templateUrl: 'app/instance/instance.html',
        controller: 'InstanceController'
      })
      .when('/processes', {
        templateUrl: 'app/process/processlist.html',
        controller: 'ProcessListController'
      })
      .when('/processes/:pid*', {
        templateUrl: 'app/process/process.html',
        controller: 'ProcessController'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .constant('IMAPI_ENDPOINT', ApacheOdeConsole.endpoint + '/processes/InstanceManagement')
  .constant('PMAPI_ENDPOINT', ApacheOdeConsole.endpoint + '/processes/ProcessManagement')
  .constant('DSAPI_ENDPOINT', ApacheOdeConsole.endpoint + '/processes/DeploymentService')
  .constant('POLLING_INTERVAL', '10000')
  .filter('escape', function() {
    return window.encodeURIComponent;
  })
  .filter('vkbeautify', function() {
    return function(text) { return vkbeautify.xml(text, 2); };
  }).config(['uiAceConfig', function (uiAceConfig) {
    angular.extend(uiAceConfig, {
        ace: {
          onLoad: function(_editor) {
            _editor.setOptions({
                maxLines: Infinity
            });
            _editor.setFadeFoldWidgets(true);
          }
        }
    });
  }])
  .run(['$templateCache', function ($templateCache) {
    $templateCache.put('template/smart-table/pagination.html',
        '<nav ng-if="pages.length >= 2"><ul class="pagination">' +
        '<li ng-class="{disabled: currentPage == 1}"><a ng-click="selectPage(currentPage - 1)" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a></li>' +
        '<li ng-repeat="page in pages" ng-class="{active: page==currentPage}"><a ng-click="selectPage(page)">{{page}}</a></li>' +
        '<li ng-class="{disabled: currentPage == pages.length}"><a ng-click="selectPage(currentPage + 1)" aria-label="Next"><span aria-hidden="true">&raquo;</span></a></li>' +
        '</ul></nav>');
  }])

;
