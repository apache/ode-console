[![Travis](https://img.shields.io/travis/apache/ode-console.svg)]()

# Apache ODE Console

**Apache ODE** (Orchestration Director Engine) executes business processes written following the [WS-BPEL](http://ode.apache.org/ws-bpel-20.html) standard. It talks to web services, sending and receiving messages, handling data manipulation and error recovery as described by your process definition. It supports both long and short living process executions to orchestrate all the services that are part of your application.

**Apache ODE Console** is a web console for monitoring and controlling Apache ODE.

## Features
* Deployment of BPEL processes via web upload.
* List of process models (and the possibility to undeploy, retire, activate them).
* List of process instances.
* Query and filter for process instances.
* Detail view of process instances.
* Ability to change variable values.
* Ability to trigger activity recovery.

## Build

To install all needed dependencies do the following:
1. Install nodejs and npm
1. Install Gulp via `npm i -g gulp`
1. Install npm dependencies via `npm install` (in the working copy)
1. Install bower dependencies via `bower install` (in the working copy)

* `gulp` or `gulp build` to build an optimized version of your application in `/dist`
* `gulp serve` to launch a browser sync server on your source files
* `gulp serve:dist` to launch a server on your optimized application
* `gulp test` to launch your unit tests with Karma
* `gulp test:auto` to launch your unit tests with Karma in watch mode
* `gulp protractor` to launch your e2e tests with Protractor
* `gulp protractor:dist` to launch your e2e tests with Protractor on the dist files

## Install / Usage

There are two ways of installing ODE console.

1. Copy contents of `/dist` after building to the exploded webapp folder of ODE within a web container, e.g. Tomcat.
2. Change the endpoint references IMAPI_ENDPOINT, PMAPI_ENDPOINT and DSAPI_ENDPOINT to point to your ODE installation and serve ODE console from what ever webserver you like. ODE console is a single page app that has no specific server-side requirements. When ODE and ODE console are exposed on different hosts and ports, make sure that ODE sets correct CORS headers so that the console can access ODE's endpoints.

## License

Apache Software License 2.0
