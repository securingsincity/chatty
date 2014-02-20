/* add-on script */
(function ($) {

  var dialog;
  HipChat.require('env', function (env) {
    dialog = env;
    dialog.resize();
  });

  var app = angular.module('Chatty', ['ngResource']);

  app.config([
    '$httpProvider',
    '$interpolateProvider',
    function ($httpProvider, $interpolateProvider) {
      $interpolateProvider.startSymbol('[[').endSymbol(']]');
      $httpProvider.interceptors.push(function () {
        return {
          'response': function (response) {
            // Refresh to token
            ACPT = response.headers('x-acpt');
            return response;
          }
        };
      });
      $httpProvider.defaults.headers.common = {
        'x-acpt': ACPT
      };
    }
  ]);

  app.factory('scriptService', [
    '$resource',
    function ($resource) {
      return $resource('/script', {}, {
        all: {
          method: 'GET',
          isArray: true
        },
        update: {
          url: '/script/:id',
          method: 'PUT',
          isArray: false
        }
      });
    }
  ]);

  app.controller('MainCtrl', [
    '$scope',
    'scriptService',
    function ($scope, Script) {

      $scope.error = {};
      $scope.scriptName = '';
      $scope.scripts = Script.all();
      $scope.Object = Object;

      function resize() {
        // 1000px hack is because we're in a dialog
        dialog.resize('100%', '1000px');
      }
      resize();

      $scope.updateVars = function (script) {
        var vars = script.variables;
        script.varsRequired = !_.every(_.map(script.varspec, function (conf, k) {
          var result = !conf.required || (vars[k] != null && vars[k].length > 0);
          console.log('---', k, vars[k], conf.required, result);
          return result;
        }));
      };

      $scope.updateScript = function (script) {
        $scope.error = {};
        Script.update({id: script.name}, script);
      };

      $scope.saveScript = function (script) {
        $scope.error = {};
        if (script.varsRequired) script.enabled = false;
        Script.update({id: script.name}, script);
      };

      $scope.toggleConfig = function (event) {
        $scope.error = {};
        event.currentTarget.blur();
        if ($('#script-config-'+this.$index).is(':not(:visible)')) {
          $('.script-config').addClass('hidden');
          $('#script-config-'+this.$index).removeClass('hidden');
          $scope.expanded = this.$index;
        } else {
          $('#script-config-'+this.$index).addClass('hidden');
          delete $scope.expanded;
        }
        resize();
        return false;
      };

    }
  ]);

}(jQuery));
