gameApp.directive('gamepad', ['$interval', 'pusherCenter', function ($interval, $pusherCenter) {
   return {
      templateUrl: 'gamepad.html',
      restrict: 'E',
      link: function (scope, element, attrs) {
        element.addClass('gamepad');

        element.on('touchstart', function(event){
          console.log(event);
        });

        element.on('touchend', function(event){
          console.log(event);
        })
    }
  };
}]);