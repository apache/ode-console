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
  .factory('InstanceService', function ($log, $q, xmlFilter, SoapService, IMAPI_ENDPOINT) {

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

  var mapInstanceInfo = function (instanceInfoElement) {
    var processNameEl = instanceInfoElement.xpath('ns:process-name', nsResolver),
        rootScopeEl   = instanceInfoElement.xpath('ns:root-scope', nsResolver),
        iObj = {
      iid: instanceInfoElement.xpath('ns:iid', nsResolver).text(),
      pid: instanceInfoElement.xpath('ns:pid', nsResolver).text(),
      processNameShort: processNameEl.text(),
      processNameFull: SoapService.qnameToString(SoapService.createQNameObj(processNameEl.text(), processNameEl[0])),
      processQName: SoapService.createQNameObj(processNameEl.text(), processNameEl[0]),
      status: instanceInfoElement.xpath('ns:status', nsResolver).text(),
      started: instanceInfoElement.xpath('ns:dt-started', nsResolver).text(),
      lastActive: instanceInfoElement.xpath('ns:dt-last-active', nsResolver).text(),
      rootScope: {id: rootScopeEl.attr('siid'),
                  name: rootScopeEl.attr('name'),
                  status: rootScopeEl.attr('status'),
                  modelId: rootScopeEl.attr('modelId')}
    };

    if (instanceInfoElement.xpath('ns:fault-info', nsResolver).length !== 0) {
      var faultNameEl = instanceInfoElement.xpath('ns:fault-info/ns:name', nsResolver);
      iObj.fault = {
        name: SoapService.createQNameObj(faultNameEl.text(), faultNameEl[0]),
        explanation: instanceInfoElement.xpath('ns:fault-info/ns:explanation', nsResolver).text(),
        lineNumber: instanceInfoElement.xpath('ns:fault-info/ns:line-number', nsResolver).text(),
        aiid: instanceInfoElement.xpath('ns:fault-info/ns:aiid', nsResolver).text()
      };
    }

    if (instanceInfoElement.xpath('ns:failures', nsResolver).length !== 0) {
      iObj.failures = {
        failure: instanceInfoElement.xpath('ns:failures/ns:dt-failure', nsResolver).text(),
        count: instanceInfoElement.xpath('ns:failures/ns:count', nsResolver).text()
      };
    }

    if (instanceInfoElement.xpath('ns:correlation-properties/ns:correlation-property', nsResolver).length !== 0) {
      var cProps = instanceInfoElement.xpath('ns:correlation-properties/ns:correlation-property', nsResolver);
      iObj.correlationProperties = [];
      for (var j = 0; j < cProps.length; j++) {
        var propEl = angular.element(cProps[j]);
        iObj.correlationProperties.push(
          { name: SoapService.createQNameObj(propEl.attr('propertyName'), propEl[0]), 
            value: propEl.text()
          });
      }
    }

    return iObj;
  };

  var mapScopeInfo = function (scopeInfoElement) {
    var si = {};
    si.siid = scopeInfoElement.xpath('ns:siid', nsResolver).text();
    si.name = scopeInfoElement.xpath('ns:name', nsResolver).text();
    si.status = scopeInfoElement.xpath('ns:status', nsResolver).text();

    // variables
    si.variables = [];
    scopeInfoElement.xpath('ns:variables/ns:variable-ref', nsResolver).each(function() {
      var vr = {};
      vr.iid = Number($(this).attr('iid'));
      vr.siid = Number($(this).attr('siid'));
      vr.name = $(this).attr('name');
      vr.scope = { name: si.name, status: si.status };

      si.variables.push(vr);
    });

    // endpoints
    si.endpoints = [];
    scopeInfoElement.xpath('ns:endpoints/ns:endpoint-ref', nsResolver).each(function() {
      var er = {};
      er.siid = si.siid;
      er.partnerLink = $(this).attr('partner-link');
      er.partnerRole = $(this).attr('partner-role');
      er.scope = { name: si.name, status: si.status };
      er.value = vkbeautify.xml($(this).first().html().trim(), 2);
      si.endpoints.push(er);
    });

    // activities
    si.activities = [];
    scopeInfoElement.xpath('ns:activities/ns:activity-info', nsResolver).each(function() {
      var act = {};
      act.name = $(this).xpath('ns:name', nsResolver).text();
      act.type = $(this).xpath('ns:type', nsResolver).text();
      act.status = $(this).xpath('ns:status', nsResolver).text();
      act.enabled = $(this).xpath('ns:dt-enabled', nsResolver).text();
      act.started = $(this).xpath('ns:dt-started', nsResolver).text();
      act.completed = $(this).xpath('ns:dt-completed', nsResolver).text();
      act.aiid = Number($(this).xpath('ns:aiid', nsResolver).text());
      var scope = $(this).xpath('ns:scope', nsResolver);
      act.scope = {siid : Number(scope.attr('siid')), name: scope.attr('name'), modelId: Number(scope.attr('modelId')), status: si.status };
      si.activities.push(act);
      
      var failure = $(this).xpath('ns:failure', nsResolver);
      if (failure.length > 0) {
        act.failure = {};
        act.failure.failure = failure.xpath('ns:dt-failure', nsResolver).text();
        act.failure.retries = failure.xpath('ns:retries', nsResolver).text();
        act.failure.reason = failure.xpath('ns:reason', nsResolver).text();
        act.failure.actions = failure.xpath('ns:actions', nsResolver).text().split(' ');
      }
    });

    // children
    si.children = [];
    // add child references
    scopeInfoElement.xpath('ns:children/ns:child-ref', nsResolver).each(function() {
      var cr = {};
      cr.siid = Number($(this).attr('siid'));
      cr.name = $(this).attr('name');
      cr.status = $(this).attr('status');
      cr.modelId = Number($(this).attr('modelId'));
      cr.isRef = true;

      si.children.push(cr);
    });

    return si;
  };

  /** public functions **/
  var is = {};

  /**
   * List instances and only return summary information about the instance,
   * combined with all correlation properties.
   * 
   * The request identifies the process instances using a filter that can
   * select instances with a given name, status, property values, etc.
   * Without a filter, the operation returns all process instances up to a
   * specified <code>limit<.code>. The request also indicates which key fields
   * to use for ordering the results.
   * </p>
   *
   * <p>
   * The filter element can be used to narrow down the list of process definitions
   * by applying selection criteria. There are six filters that can be applied:
   * <ul>
   * <li><p>name -- Only process instances with this local name.</p></li>
   * <li><p>namespace -- Only process instances with this namespace URI.</p></li>
   * <li><p>status -- Only process instances with these status code(s).</p></li>
   * <li><p>started -- Only process instances started relative to this date/time.</p></li>
   * <li><p> last-active -- Only process instances last active relative to this date/time.</p></li>
   * <li><p>$property -- Only process instances with a correlation property equal to the
   * specified value.</p></li>
   * </ul>
   *
   * </p>
   * <p>
   * The name and namespace filters can do full or partial name matching. Partial matching
   * occurs if either filter ends with an asterisk (*). These filters are not case sensitive,
   * for example name=my* will match MyProcess and my-process. If unspecified, the default
   * filter is name=* namespace=*.
   * </p>
   *
   * <p>
   * The status filter can be used to filter all process definitions based on six status codes:
   * <ul>
   * <li><p>active -- All currently active process instances (excludes instances in any other
   * state).</p></li>
   * <li><p>suspended -- All process instances that have not completed, but are currently
   * suspended.</p></li>
   * <li><p>error -- All process instances that have not completed, but are currently indicate an
   * error condition.</p></li>
   * <li><p>completed -- All successfully completed process instances (excludes instances in any
   * other state). </p></li>
   * <li><p>terminated -- All process instances that were terminated.
   * <li><p>faulted -- All process instances that encountered a fault (in the global scope).
   * </ul>
   * <p>
   * The started filter can be used to filter all process instances started on or after a
   * particular date or date/time instant. The value of this filter is either an ISO-8601
   * date or ISO-8601 date/time. For example, to find all process instances started on or
   * after September 1, 2005, use started>=20050901. Similarly, the last-active filter can
   * be used to filter all process instances based on their last active time. The last
   * active time records when the process last completed performing work, and either
   * completed or is now waiting to receive a message, a timeout or some other event.
   * </p>
   *
   * <p>
   * Each process instance has one or more properties that are set its instantiation, that
   * can be used to distinguish it from other process instances. In this version of the
   * specification, we only support properties instantiated as part of correlation sets
   * defined in the global scope of the process. For example, if a process instantiates a
   * correlation set that uses the property order-id, it is possible to filter that process
   * instance based on the value of that property.
   * </p>
   *
   * <p>
   * The property name is identified by the prefix $. If the property name is an NCName,
   * the filter will match all properties with that local name. If the property name is
   * {namespace}local, the filter will match all properties with the specified namespace URI
   * and local name. For example, to retrieve a list of all active process instances with a
   * property order-id that has the value 456, use status=active $order-id=456.
   * </p>
   *
   * <p>
   * By default the response returns process instances in no particular order. The order
   * element can be used to order the results by specifying a space-separated list of keys.
   * Each key can be prefixed with a plus sign '+' to specify ascending order, or a '-'
   * minus sign to specify descending order. Without a sign the default behavior is to
   * return process instances in ascending order. The currently supported odering keys are:
   * <ul>
   * <li><p>pid</p></li> -- Order based on the process identifier.
   * <li><p>name</p></li> -- Order based on the local name of the process instance.
   * <li><p>namespace</p></li> -- Order based on the namespace URI of the process instance.
   * <li><p>version</p></li> -- Order based on the version number.
   * <li><p>status</p></li> -- Order based on the status of the process instance.
   * <li><p>started</p></li> -- Order based on the process instance start date/time.
   * <li><p>last-active</p></li> -- Order based on the process instance last active date/time.
   * </ul>
   * 
   * @param {string} filter See listInstances' filter argument
   * @param {string} order  See listInstances' order argument
   * @param {number} limit maximum number of instances to return
   * @returns list of matching instances
   */
  is.listInstancesSummary = function (filter, order, limit) {
    filter = filter || '';
    order = order || '';
    limit = limit || 0;
    
    var deferred = $q.defer();

    SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'listInstancesSummary', namespaceURI: PMAPI_NS},
      {filter: filter, order: order, limit: limit})
      .then(function(response) {
        var instances = [],
          els = response.xpath('//ns:instance-info', nsResolver), 
          instance,
          i;

        for (i = 0; i < els.length; i += 1) {
          instance = angular.element(els[i]);
          instances.push(mapInstanceInfo(instance));
        }

        deferred.resolve(instances);

      }, function(fault) {
        deferred.reject(fault);
      });
      
    return deferred.promise;
  };

  /**
   * Get an instance by id.
   * @param {number} iid
   * @returns information about a specific instance
   */
  is.getInstanceInfo = function (iid) {
    var deferred = $q.defer();

    SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'getInstanceInfo', namespaceURI: PMAPI_NS},
      {iid: iid})
    .then(function(response) {
      deferred.resolve(mapInstanceInfo(response.xpath('//instance-info', nsResolver)));
    }, function(fault) {
      deferred.reject(fault);
    });

    return deferred.promise;
  };

  /** Get info about a scope instance by id, optionally including activity info.
   * @param {number} siid scope instance identifier
   * @param {boolean} activityInfo if <code>true</code>, include activity info
   * @returns information about a specific scope instance
   */
  is.getScopeInfoWithActivity = function (siid, activityInfo) {
    var deferred = $q.defer();

    SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'getScopeInfoWithActivity', namespaceURI: PMAPI_NS},
      {sid: siid, activityInfo: activityInfo})
    .then(function(response) {
      deferred.resolve(mapScopeInfo(response.xpath('//scope-info')));
    }, function(fault) {
      deferred.reject(fault);
    });

    return deferred.promise;
  };

  /**
   * Delete a process instances with the given IID.
   * @param iid InstanceID.
   * @returns collection of instances identfiers, corresponding to deleted
   *         instances
   */
  is.delete = function (iid) {
    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'delete', namespaceURI: PMAPI_NS},
      {filter: 'iid = ' + iid});
  };

  /**
   * Delete the process instances matching the given filter.
   * @param filter instance filter (see listInstancesSummary ).
   * @returns collection of instances identfiers, corresponding to deleted
   *         instances
   */
  is.deleteFilter = function (filter) {
    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'delete', namespaceURI: PMAPI_NS},
      {filter: filter});
  };

  /**
   * Causes the process instance to terminate immediately, without a chance to
   * perform any fault handling or compensation. The process transitions to the
   * terminated state. It only affects process instances that are in the active,
   * suspended or error states.
   * @param iid instance id
   * @returns post-change instance information
   */
  is.terminate = function (iid) {
    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'terminate', namespaceURI: PMAPI_NS},
      {iid: iid});
  };

  /**
   * Changes the process state from active to suspended. this affects process instances that
   * are in the active or error states.
   * @param iid instance id
   * @returns post-change instance information
   */
  is.suspend = function (iid) {
    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'suspend', namespaceURI: PMAPI_NS},
      {iid: iid});
  };

  /**
   * Resume the (previously suspended) instance. This operation only affects process instances
   * that are in the suspended state.
   * @param iid instance id
   * @returns post-change instance information
   */
  is.resume = function (iid) {
    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'resume', namespaceURI: PMAPI_NS},
      {iid: iid});
  };

  /**
   * Performs an activity recovery action.
   * @param iid instance id (process)
   * @param aid instance id (activity)
   * @param action recovery action (e.g. retry, fault)
   * @returns post-change instance information
   */
  is.recoverActivity = function (iid, aid, action) {
    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'recoverActivity', namespaceURI: PMAPI_NS},
      {iid: iid, aid: aid, action: action});
  };

  /**
   * Get info about a variable.
   * @param siid scope identifier
   * @param varName variable name
   * @returns information about variable (basically the value)
   */
  is.getVariableInfo = function (siid, varName) {
    var deferred = $q.defer();

    SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'getVariableInfo', namespaceURI: PMAPI_NS},
      {sid: siid, varName: varName})
    .then(function(response) {
      var res = {};
      var selfEl = response.xpath('//variable-info/ns:self', nsResolver);
      res.name = selfEl.attr('name');
      res.iid = selfEl.attr('iid');
      res.siid = selfEl.attr('siid');
      res.value = response.xpath('//variable-info/ns:value', nsResolver).html().trim();
      deferred.resolve(res);
    }, function(fault) {
      deferred.reject(fault);
    });

    return deferred.promise;
  };

  is.setVariable = function (siid, varName, value) {
    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'setVariable', namespaceURI: PMAPI_NS},
      {sid: siid, varName: varName, value: value});
  };

  /**
   * Retrieve a timeline of BPEL events.
   *
   * @param instanceFilter instance filter (if set,return only events for matching instances)
   * @param eventFilter event filter (event type and data range)
   * @returns list of stringified dates (in ISO format)
   */
  is.getEventTimeline = function (instanceFilter, eventFilter) {
    instanceFilter = instanceFilter || '';
    eventFilter = eventFilter || '';

    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'getEventTimeline', namespaceURI: PMAPI_NS},
      {instanceFilter: instanceFilter, eventFilter: eventFilter});
    //TODO
  };

  /**
   * Retrieve BPEL events. One may specify an "instance filter" and an "event filter" to
   * limit the number of events returned. The instance filter takes the exact same syntax
   * as for the {@link #listInstances(String, String, int)} method. The "event filter" employs
   * a similar syntax; the following properties may be filtered: <ol>
   * <li><em>type</em> -  the event type</li>
   * <li><em>tstamp</em> - the event timestamp</li>
   * </ol>
   * @param instanceFilter instance filter (if set,return only events for matching instances)
   * @param eventFilter event filter (event type and data range)
   * @returns list of events
   */
  is.listEvents = function (instanceFilter, eventFilter, maxCount) {
    instanceFilter = instanceFilter || '';
    eventFilter = eventFilter || '';

    return SoapService.callSOAP(IMAPI_ENDPOINT,
      {localName: 'getEventTimeline', namespaceURI: PMAPI_NS},
      {instanceFilter: instanceFilter, eventFilter: eventFilter, maxCount: maxCount});
    //TODO
  };

  return is;

});
