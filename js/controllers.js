var gameApp = angular.module('game-app', ['ngAnimate']);

//attach fastclick
$(function() {
    FastClick.attach(document.body);
});

gameApp.controller('GameCenter', ['$scope', 'parseCenter', 'pubnubCenter', function ($scope, $parseCenter, $pubnubCenter){
	$scope.gameIdInput = '';
	$scope.nameInput = '';

	GAME_STATUS = {
		PREJOIN : 0,
		JOINING : 1,
		CONNECTING : 2,
		INGAME : 3,
		INHAND : 4,
		WAITING : 5,
		ERRORED : 6
	}
	$scope.status = GAME_STATUS.PREJOIN

	//annoying angular scope ng-show variables
	$scope.joinScreenShown = function(){return $scope.status == GAME_STATUS.PREJOIN || $scope.status == GAME_STATUS.JOINING};
	$scope.joiningGame = function(){return $scope.status == GAME_STATUS.JOINING};
	$scope.findingSeat = function(){return $scope.status == GAME_STATUS.CONNECTING};
	$scope.waitingForSeat = function(){return $scope.status == GAME_STATUS.WAITING};
	$scope.inGame = function(){return $scope.status ==  GAME_STATUS.INGAME};
	$scope.inHand = function(){return $scope.status == GAME_STATUS.INHAND};

	BET_OPTIONS = {
		CHECK : 0,
		FOLD : 1,
		ALLIN : 2,
		RAISE : 3,
		BET : 4
	}
	$scope.options = []

	//same for BET_OPTIONS
	$scope.checkShown = function(){console.log($scope.options.indexOf(BET_OPTIONS.CHECK));return $scope.options.indexOf(BET_OPTIONS.CHECK) > -1};
	$scope.foldShown = function(){return $scope.options.indexOf(BET_OPTIONS.FOLD) > -1};
	$scope.allinShown = function(){return $scope.options.indexOf(BET_OPTIONS.ALLIN) > -1};
	$scope.raiseShown = function(){return $scope.options.indexOf(BET_OPTIONS.RAISE) > -1};
	$scope.betShown = function(){return $scope.options.indexOf(BET_OPTIONS.BET) > -1};

	var playerId;

	

	$scope.chips = 0;

	$scope.cardsHidden = false

	var card_asset_location = 'assets/cards/'
	var card1Val = 'back'
	var card2Val = 'back'
	$scope.card1 = function(){
		var resolvedValue = $scope.cardsHidden ? 'back' : card1Val
		return card_asset_location + resolvedValue + '.png'
	}
	$scope.card2 = function(){
		var resolvedValue = $scope.cardsHidden ? 'back' : card2Val
		return card_asset_location + resolvedValue + '.png'
	}


	$scope.joinGame = function() {
		if ($scope.gameIdInput.length > 0 && $scope.nameInput.length > 0){
			var gameObj;
			
			$scope.status = GAME_STATUS.JOINING
			$parseCenter.locateGame($scope.gameIdInput).then(function(gameO){
				gameObj = gameO;
				return $parseCenter.addPlayerToGame($scope.nameInput, gameObj);
			}).then(function(playerObj){
				playerId = playerObj.id;
				$scope.status = GAME_STATUS.CONNECTING;
				$pubnubCenter.subscribeToChannel(gameObj.get("channelName"), playerObj.get("name"), playerObj.id, stateChanged);
				$scope.$apply();
			}, function(error){
				alert(error.message);
				$scope.status = GAME_STATUS.ERRORED;
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

	stateChanged = function(m){
		if (m.action == "state-change" && m.uuid == playerId){
			//is this a game status change?
			console.log(m);
			if (m.data && m.data.GAME_STATUS){
				$scope.status = GAME_STATUS[m.data.GAME_STATUS]
				$scope.$apply();
			}
			if (m.data && m.data.CHIPS){
				$scope.chips = m.data.CHIPS
				$scope.$apply();
			}
			if (m.data && m.data.HAND){
				card1Val = m.data.HAND[0];
				card2Val = m.data.HAND[1];
				$scope.$apply();
			}
			if (m.data && m.data.BET_OPTIONS){
				$scope.options = []
				for (var i = 0; i < m.data.BET_OPTIONS.length; i++) {
					var option = m.data.BET_OPTIONS[i]
					$scope.options.push(BET_OPTIONS[option]);
				};
				console.log($scope.options);
				$scope.$apply();
			}
		}
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

gameApp.factory('pubnubCenter', [function () {
	var service = {};

	var pubnub;
	var channel;
	var playerId;

	service.subscribeToChannel = function(channelId, name, userId, callback){
		playerId = userId;
		channel = channelId;
		pubnub = PUBNUB({
			publish_key: "pub-c-9629b438-9328-4fb1-9cb5-156752315d42",
			subscribe_key: "sub-c-d0635f8a-fa00-11e5-8916-0619f8945a4f",
			uuid: userId
		});
		pubnub.subscribe({
			channel: channel,
			state:{
				username: name
			},
			message : function (message, envelope, channelOrGroup, time, channel) {
        console.log(
        "Message Received." + "\n" +
        "Channel or Group: " + JSON.stringify(channelOrGroup) + "\n" +
        "Channel: " + JSON.stringify(channel) + "\n" +
        "Message: " + JSON.stringify(message) + "\n" +
        "Time: " + time + "\n" +
        "Raw Envelope: " + JSON.stringify(envelope)
      )},
			presence: callback,
			connect: join
		});
	}

	function join() {
		console.log('joined');
	}

	service.playersConnected = function(){
		return channel.members.count;
	}

	service.publishMovementEvent = function(direction){
		pubnub.state({
			channel: channel,
			state:{
				direction: direction
			}
		});
	}

	return service;
}])


