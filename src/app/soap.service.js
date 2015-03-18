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
 * @ngdoc service
 * @name odeConsole.SoapService
 * @description
 * # SoapService
 * Service in the odeConsole.
 */
angular.module('odeConsole')
  .factory('SoapService', function ($http, $log, $q, xmlFilter, _) {

  var soap = {};

  /** private functions **/
  var parseSOAPFault = function (response) {
    var result = {};
    var fault = xmlFilter(response.data).xpath('/*:Envelope/*:Body/*:Fault');
    if (fault) {
      result.faultcode = fault.xpath('faultcode').text();
      result.faultstring = fault.xpath('faultstring').text();
      result.details = fault.xpath('details').text();
    }

    return result;
  };

  var serializeSOAPParameters = function (parameters) {
    var param = '';
    for (var key in parameters) {
      var value = parameters[key];
      if (_.isObject(value)) {
        // then we expect a QName and serialize it accordingly
        param += '<' + key + ' xmlns:' + value.prefix + '="' + value.namespaceURI + '">' + value.prefix + ':' + value.localName + '</' + key + '>';
      } else {
        param += '<' + key + '>' + value + '</' + key + '>';
      }
    }
    return param;
  };

  var createSOAPMessage = function (operation, parameters) {
    operation.prefix = operation.prefix || 'prfx';
    var message = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' +
      '   <soapenv:Header/>' +
      '   <soapenv:Body>' + 
      '      <' + operation.prefix + ':' + operation.localName + ' xmlns:' + operation.prefix + '="' + operation.namespaceURI + '">' +
      serializeSOAPParameters(parameters) + 
      '      </' + operation.prefix + ':' + operation.localName + '>' +
      '   </soapenv:Body>' +
      '</soapenv:Envelope>';
    return message;
  };

  /** public functions **/
  soap.callSOAP = function(endpoint, operation, parameters) {
    var deferred = $q.defer(),
        request = createSOAPMessage(operation, parameters);

    $http.post(endpoint + '/' + operation.localName, request)
      .then(function(response) {
        deferred.resolve(response.xml);
      }, function(response) {
          if (response.status !== 500) {
            deferred.reject({faultcode: 'Client', faultstring: 'Network problem'});
          } else {
            var fault = parseSOAPFault(response);
            deferred.reject(fault);
            $log.error(fault);
          }
      });

    return deferred.promise;
  };

  /** Parses string representation into a QName object **/
  soap.parseQNameStr = function(qnameStr) {
    if (qnameStr.charAt(0) !== '{') {
      return {
        namespaceURI: '',
        localName:    qnameStr,
        prefix:       ''
      };
    }

    var endOfNamespaceURI = qnameStr.indexOf('}');
    return {
      namespaceURI: qnameStr.substr(1, endOfNamespaceURI -1),
      localName:    qnameStr.substr(endOfNamespaceURI + 1),
      prefix:       ''
    };
  };

  soap.qnameToString = function (qname) {
    return '{' + qname.namespaceURI + '}' + qname.localName;
  };

  /** Creates QName object from an XML QName **/
  soap.createQNameObj = function (qname, contextElement) {
    var endOfPrefix = qname.indexOf(':');
    var prefix = qname.substr(0, endOfPrefix);
    return {
      namespaceURI: contextElement.lookupNamespaceURI(prefix),
      localName:    qname.substr(endOfPrefix + 1),
      prefix:       prefix
    };
  };

  return soap;
});
