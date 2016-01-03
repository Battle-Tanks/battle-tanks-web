var gameApp = angular.module('game-app', ['ngAnimate']);

gameApp.controller('GameCenter', ['$scope', 'parseCenter', 'pusherCenter', function ($scope, $parseCenter, $pusherCenter){
	$scope.gameIdInput = '';
	$scope.nameInput = '';

	$scope.joinGame = function() {
		if ($scope.gameIdInput.length > 0 && $scope.nameInput.length > 0){
			var gameObj;

			$parseCenter.locateGame($scope.gameIdInput).then(function(gameO){
				gameObj = gameO;
				return $parseCenter.addPlayerToGame($scope.nameInput, gameObj);
			}).then(function(playerObj){
				console.log(playerObj);
				$pusherCenter.subscribeToChannel(gameObj.get("channelName"), playerObj.get("name"), playerObj.id);
			}, function(error){
				alert(error.message);
			});
		}
		else if($scope.gameIdInput.length == 0){
			alert("Please enter a valid game code.  Please check and try again.");
		}
		else{
			alert("Please enter a name.");
		}
	}
}]);

gameApp.factory('parseCenter', ['$q', function ($q) {
	var service = {};
	
	Parse.initialize("Ue39jG8J5QMXZxdoaeuwjCcT0dwBHlvxufvXN8bo", "f7IlXuXGbwUzBJp8L4Zm9huQaFjEvCTHyKMfqD7K");

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

	service.subscribeToChannel = function(channelId, name, userId){
		pusher = new Pusher('960f2191f4ad2de45745', {
			authEndpoint: 'https://pyramid.parseapp.com/pusher/auth',
			auth: {
				params: {
					user_name: name,
					user_id: userId
				}
			}
		});
		channel = pusher.subscribe(channelId);
	}

	

	return service;
}])


