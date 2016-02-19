var gameApp = angular.module('game-app', ['ngAnimate']);

//attach fastclick
$(function() {
    FastClick.attach(document.body);
});

gameApp.controller('GameCenter', ['$scope', 'parseCenter', 'pusherCenter', function ($scope, $parseCenter, $pusherCenter){
	$scope.gameIdInput = '';
	$scope.nameInput = '';

	$scope.joiningGame = false;

	$scope.gameJoinScreenShown = true;
	$scope.playerWaitScreenShown = false;

	$scope.numPlayers = 0;

	$scope.joinGame = function() {
		if ($scope.gameIdInput.length > 0 && $scope.nameInput.length > 0){
			var gameObj;
			
			$scope.joiningGame = true;

			$parseCenter.locateGame($scope.gameIdInput).then(function(gameO){
				gameObj = gameO;
				return $parseCenter.addPlayerToGame($scope.nameInput, gameObj);
			}).then(function(playerObj){
				$scope.gameJoinScreenShown = false;
				$scope.playerWaitScreenShown = true;
				$pusherCenter.subscribeToChannel(gameObj.get("channelName"), playerObj.get("name"), playerObj.id);
				$pusherCenter.bindToPlayerConnectionEvent(playerAdded);
				$scope.$apply();
			}, function(error){
				alert(error.message);
				$scope.joiningGame = false;
			});
		}
		else if($scope.gameIdInput.length == 0){
			alert("Please enter a valid game code.  Please check and try again.");
		}
		else{
			alert("Please enter a name.");
		}
	}

	$scope.clickOrTouch = function(direction) {
		console.log(direction);
	}

	playerAdded = function(player){
		$scope.numPlayers = $pusherCenter.playersConnected();
		$scope.$apply();
	}

}]);

gameApp.factory('parseCenter', ['$q', function ($q) {
	var service = {};
	
	Parse.initialize("2MBFKOLhG48cWHDkvPK6cxMYOIAOnzQEUTDIxiJf", "TG3FXGzC6LpXmN2TkGh0Tad7gRgDd9XpWIkDLbb4");

	service.locateGame = function(gameId){
		return service.callCloudFunction('locateGame',{readableId:gameId});
	}

	service.addPlayerToGame = function(name, game){
		var player = new Parse.Object("Player");
		player.set("game", game);
		player.set("name", name);
		return player.save();
	}

	service.callCloudFunction = function(func,params){
		return Parse.Cloud.run(func,params);
	}

	return service;
}]);

gameApp.factory('pusherCenter', [function () {
	var service = {};

	var pusher;
	var channel;
	var playerId;

	service.subscribeToChannel = function(channelId, name, userId){
		playerId = userId;
		pusher = new Pusher('22228a560a162feb172a', {
			authEndpoint: 'https://battle-tanks.parseapp.com/pusher/auth',
			auth: {
				params: {
					user_name: name,
					user_id: userId
				}
			}
		});
		channel = pusher.subscribe(channelId);
	}

	service.playersConnected = function(){
		return channel.members.count;
	}

	service.bindToPlayerConnectionEvent = function(receivingFunction){
		channel.bind('pusher:member_added', receivingFunction);
		channel.bind('pusher:subscription_succeeded', receivingFunction);
	}

	service.publishMovementEvent = function(direction){
		channel.trigger('client-movement-event', {message : direction, client: playerId})
	}

	return service;
}])


