gameApp.directive('gamepad', ['$interval', 'pusherCenter', function ($interval, $pusherCenter) {
   return {
      templateUrl: 'gamepad.html',
      restrict: 'E',
      scope: {
        Time: '=value'
      },
      link: function (scope, element, attrs) {
        element.addClass('gamepad');

        var promise;      
        scope.mouseDown = function(dir) {
          promise = $interval(function () { 
            if (dir === "up"){
              $pusherCenter.publishMovementEvent(dir);
            }
            else{
              console.log("down")
            }
          }, 100);

        };

        scope.mouseUp = function () {
           $interval.cancel(promise);
        };
    }
  };
}]);