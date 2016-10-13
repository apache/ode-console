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
/*global $:false */
/*global vkbeautify:false */

/**
 * @ngdoc service
 * @name angApp.InstanceService
 * @description
 * # InstanceService
 * Service in the angApp.
 */
angular.module('odeConsole')
  .factory('ProcessService', function ($http, $log, $q, $interval, _, SoapService, PMAPI_ENDPOINT, DSAPI_ENDPOINT, POLLING_INTERVAL) {
  
  var PMAPI_NS = 'http://www.apache.org/ode/pmapi';

  /** private functions **/
  var nsResolver = function (prefix) {
    var ns = {
      'ns'     : 'http://www.apache.org/ode/pmapi/types/2006/08/02/',
      'soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
      'pmapi'  : 'http://www.apache.org/ode/pmapi'
    };

    return ns[prefix] || null;
  };

  var splitPackageName = function(packageName) {
    var split = packageName.split('-');
    var hasVersion = !isNaN(_.last(split));
    var result = {
      packageId: packageName,
      name: (_.first(split, split.length - hasVersion).join('-')),
    };
  
    result.version = hasVersion ? _.last(split) : null;
    return result;
  };

  var mapProcessInfo = function(processElement) {
    var processNameEl = processElement.xpath('ns:definition-info/ns:process-name', nsResolver);
    var result = {};
    result.pid = processElement.xpath('ns:pid', nsResolver).text();
    result.status = processElement.xpath('ns:status', nsResolver).text();
    result.version = processElement.xpath('ns:version', nsResolver).text();
    result.package = processElement.xpath('ns:deployment-info/ns:package', nsResolver).text();
    result.deployDate = processElement.xpath('ns:deployment-info/ns:deploy-date', nsResolver).text();

    result.nameShort = processNameEl.text();
    result.nameFull = SoapService.qnameToString(SoapService.createQNameObj(processNameEl.text(), processNameEl[0]));

    // endpoints
    result.endpoints = {
      myRole:  [],
      partnerRole: []
    };

    processElement.xpath('ns:endpoints/ns:endpoint-ref[@my-role]', nsResolver).each(function() {
      result.endpoints.myRole.push(vkbeautify.xml($(this).first().html().trim(), 2));
    });
    processElement.xpath('ns:endpoints/ns:endpoint-ref[@partner-role]', nsResolver).each(function() {
      result.endpoints.partnerRole.push(vkbeautify.xml($(this).first().html().trim(), 2));
    });

    // documents
    result.documents = [];
    processElement.xpath('ns:documents/ns:document', nsResolver).each(function() {
      var d = {};
      d.name = $(this).xpath('ns:name', nsResolver).text();
      d.type = $(this).xpath('ns:type', nsResolver).text();
      d.source = $(this).xpath('ns:source', nsResolver).text();
      result.documents.push(d);
    });

    // properties
    // TODO

    result.stats = {
        active:     Number(processElement.xpath('ns:instance-summary/ns:instances[@state=\'ACTIVE\']/@count', nsResolver).val()),
        completed:  Number(processElement.xpath('ns:instance-summary/ns:instances[@state=\'COMPLETED\']/@count', nsResolver).val()),
        error:      Number(processElement.xpath('ns:instance-summary/ns:instances[@state=\'ERROR\']/@count', nsResolver).val()),
        failed:     Number(processElement.xpath('ns:instance-summary/ns:instances[@state=\'FAILED\']/@count', nsResolver).val()),
        suspended:  Number(processElement.xpath('ns:instance-summary/ns:instances[@state=\'SUSPENDED\']/@count', nsResolver).val()),
        terminated: Number(processElement.xpath('ns:instance-summary/ns:instances[@state=\'TERMINATED\']/@count', nsResolver).val()),
        inrecovery: Number(processElement.xpath('ns:instance-summary/ns:failures/ns:count', nsResolver).text() || 0)
      };

    return result;
  };

  /** public functions **/
  var ps = {};

  var updateStats = function(packages) {
    ps.summary = {};
    ps.summary.packages = 0;
    ps.summary.processes = 0;
    ps.summary.instances = 0;

    ps.summary.active = 0;
    ps.summary.completed = 0;
    ps.summary.suspended = 0;
    ps.summary.failed = 0;
    ps.summary.error = 0;
    ps.summary.inrecovery = 0;
    ps.summary.terminated = 0;

    packages.forEach(function(pa) {
      ps.summary.packages++;
      pa.processes.forEach(function(process) {
        ps.summary.processes++;

        ps.summary.active += process.stats.active;
        ps.summary.completed += process.stats.completed;
        ps.summary.suspended += process.stats.suspended;
        ps.summary.failed += process.stats.failed;
        ps.summary.error += process.stats.error;
        ps.summary.inrecovery += process.stats.inrecovery;
        ps.summary.terminated += process.stats.terminated;

        ps.summary.instances += Object.keys(process.stats).reduce(function (a,b) { 
          return a + process.stats[b];
        }, 0);

      });
    });
  };


  ps.getPackages = function() {
    var deferred = $q.defer();
    SoapService.callSOAP(PMAPI_ENDPOINT,
      {localName: 'listAllProcesses', namespaceURI: PMAPI_NS},
      {})
      .then(function(response) {
        var packages = {},
            els = response.xpath('//ns:process-info', nsResolver);

        for (var i = 0; i < els.length; i += 1) {
          var process = angular.element(els[i]);
          var packageName = process.xpath('ns:deployment-info/ns:package', nsResolver).text();

          packages[packageName] = packages[packageName] || _.extend(splitPackageName(packageName),
            { 
              deployDate: process.xpath('ns:deployment-info/ns:deploy-date', nsResolver).text(),
              processes: []
            });

          packages[packageName].processes.push(mapProcessInfo(process));
        }
        updateStats(_.values(packages));
        deferred.resolve(_.values(packages));
      }, function(msg, code) {
          deferred.reject(msg);
          $log.error(msg, code);
      });
    return deferred.promise;
  };

  /**
   * List the processes known to the engine.
   * @returns list of {@link ProcessInfoDocument}s (including instance summaries)
   */
  ps.getProcesses = function() {
    var deferred = $q.defer();
    SoapService.callSOAP(PMAPI_ENDPOINT,
      {localName: 'listAllProcesses', namespaceURI: PMAPI_NS},
      {})
      .then(function(response) {
        var processes = [],
          els = response.xpath('//ns:process-info', nsResolver),
          process,
          i;

        for (i = 0; i < els.length; i += 1) {
          process = angular.element(els[i]);
          processes.push(mapProcessInfo(process));
        }

        deferred.resolve(processes);
      }, function(msg, code) {
          deferred.reject(msg);
          $log.error(msg, code);
      });
    return deferred.promise;
  };

  /**
   * Get the process info for a process (includingthe instance summary).
   * @param pid name of the process
   * @returns {@link ProcessInfoDocument} with all details.
   */
  ps.getProcessInfo = function (pid) {
    var deferred = $q.defer();
    var pidQName = SoapService.parseQNameStr(pid);
    pidQName.prefix = 'pns';

    SoapService.callSOAP(PMAPI_ENDPOINT,
      {localName: 'getProcessInfo', namespaceURI: PMAPI_NS},
      {pid: pidQName})
    .then(function(response) {
      deferred.resolve(mapProcessInfo(response.xpath('//process-info')));
    }, function(fault) {
      deferred.reject(fault);
    });

    return deferred.promise;
  };

  /**
   * Retire a process.
   * @param pid identifier of the process to retire
   * @param {boolean} retired retired or not?
   * @return {@link ProcessInfoDocument} reflecting the modification
   */
  ps.setRetired = function (pid, retired) {
    var pidQName = SoapService.parseQNameStr(pid);
    pidQName.prefix = 'pns';

    return SoapService.callSOAP(PMAPI_ENDPOINT,
      {localName: 'setRetired', namespaceURI: PMAPI_NS},
      {pid: pidQName, retired: retired});
  };
  
  /**
   * Deploy a package
   * @param {string} packageName the package name.
   * @param {string} zip the package zip in Base64 encoding
   * @return {Promise}     a promise for this request.
   */
  ps.deployPackage = function (packageName, zip) {
    return SoapService.callSOAP(DSAPI_ENDPOINT,
      {localName: 'deploy', namespaceURI: PMAPI_NS},
      {name: packageName,
       'package': '<dep:zip xmlns:dep="http://www.apache.org/ode/deployapi">' + zip + '</dep:zip>'});
  };

  if (POLLING_INTERVAL > 0) {
    $interval(ps.getPackages, POLLING_INTERVAL);
  }

  /**
   * Undeploy a package
   * @param  {string} paid the package name.
   * @return {Promise}     a promise for this request.
   */
  ps.undeployPackage = function (paid) {
    return SoapService.callSOAP(DSAPI_ENDPOINT,
      {localName: 'undeploy', namespaceURI: PMAPI_NS},
      {packageName: paid});
  };

  if (POLLING_INTERVAL > 0) {
    $interval(ps.getPackages, POLLING_INTERVAL);
  }

  return ps;

});
