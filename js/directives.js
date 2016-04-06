gameApp.directive('gamepad', ['$interval', 'pubnubCenter', function ($interval, $pubnubCenter) {
   return {
      templateUrl: 'gamepad.html',
      restrict: 'E',
      link: function (scope, element, attrs) {
        element[0].children[0].innerText = "Move "+element[0].id

        element.on('mousedown', function(event){
          $pubnubCenter.publishMovementEvent(element[0].id.toLowerCase());
          setTimeout(function(){
            $pubnubCenter.publishMovementEvent(element[0].id.toLowerCase());
          }, 12)
        });

        element.on('mouseup', function(event){
          $pubnubCenter.publishMovementEvent("");
          setTimeout(function(){
            $pubnubCenter.publishMovementEvent("");
          }, 12)
        })

        element.on('touchstart', function(event){
          console.log(attrs);
        });

        element.on('touchend', function(event){
          console.log(element);
        });
    }
  };
}]);