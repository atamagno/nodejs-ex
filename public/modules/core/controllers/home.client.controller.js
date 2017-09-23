'use strict';

angular.module('core').controller('HomeController',

	function($scope, $rootScope, $sce, Connections, $timeout, $interval, $cookies, $state) {

		$scope.selectMediaType = function(mediaType, fromServer) {

			$scope.playingSong = null;
			$scope.songUrl = null;

			$scope.selectedMediaType = mediaType;
			$scope.mediaTypeSelected = true;

			// Timeout to achieve animation after logo goes out of the screen.
			setTimeout(function() {

				if (mediaType == 'video') {

					$state.go('connect.video');

					$scope.library = $scope.videoLibrary.allArtists;
					$scope.artists = $scope.videoLibrary.allArtists;
					$scope.allAlbums = $scope.videoLibrary.allAlbums;
					$scope.allSongs = $scope.videoLibrary.allVideos;

					$scope.showAllAlbums();

				} else {

					$state.go('connect.audio');

					$scope.library = $scope.musicLibrary;
					$scope.artists = $scope.musicArtists;
					$scope.allAlbums = $scope.musicAlbums;
					$scope.allSongs = $scope.songList;

					$scope.showAllArtists();
				}

				$scope.selectSearchPlaceholder();

				if (!fromServer) {
					var msg = {
						type: "mediaType",
						mediaType: mediaType
					};

					$scope.webSocket.send(JSON.stringify(msg));
				}

			}, 900);

		};

		$scope.$on('$viewContentLoaded',
			function() {
				if ($state.current.name != 'connect' && !$scope.mediaTypeSelected) {
					$state.go('connect');
				} else {
				 	initPlayer();
				}
		});

		$scope.lastCode = $cookies.get('weezzlerConnectionCode');
		$scope.language = $cookies.get('weezzlerLanguage');
		if ($scope.language == 'spanish') {
			$scope.spanish = true;
		}

		$scope.showError = function(errorMessage) {

			if (!$scope.errorVisible) {
				$scope.errorMessage = errorMessage;
				$scope.errorVisible = true;
				$scope.toBackground = false;
				$timeout(function() {
					$scope.errorVisible = false;
				}, 4000, true);
			}
		};

		$scope.showSuccess = function(successMessage) {

			if (!$scope.successVisible) {
				$scope.errorMessage = successMessage;
				$scope.successVisible = true;
				$scope.toBackground = false;
				$timeout(function() {
					$scope.successVisible = false;
				}, 4000, true);
			}
		};

		$scope.hideMessage = function() {
			$scope.errorVisible = false;
			$scope.successVisible = false;
		};

		document.getElementById("codeInput").focus();

		var player, seekBar;
		function initPlayer() {

			var mediaType = $scope.selectedMediaType;
			if (mediaType) {

				player = document.getElementById(mediaType + "Player");
				seekBar = document.getElementById('seekBar');

				player.onplay = function() {
					$scope.playing = true;

					if (!$scope.playPauseFromServer) {
						$scope.sendPlayPause();
					}

					$scope.playPauseFromServer = false;

					$rootScope.$apply();
				};

				player.onpause = function() {
					$scope.playing = false;

					if (!$scope.playPauseFromServer) {
						$scope.sendPlayPause();
					}

					$scope.playPauseFromServer = false;

					$rootScope.$apply();
				};

				player.onended = function() {
					if ($scope.selectedMediaType != "video") {
						var nextSongExists = $scope.nextSong();
						if (!nextSongExists) {
							$scope.playing = false;
							$rootScope.$apply();
						}
					} else {
						// For video don't play next song automatically.
						$scope.playing = false;
						$rootScope.$apply();
					}
				};

				player.onloadeddata = function() {
					player.play();
					$scope.playing = true;
				};

				player.ontimeupdate = function() {

					if ($scope.playing) {

						var elapsedMinutes = Math.floor(this.currentTime / 60);
						var elapsedSeconds = Math.floor(this.currentTime % 60);

						elapsedMinutes = elapsedMinutes < 10 ? "0" + elapsedMinutes : elapsedMinutes;
						elapsedSeconds = elapsedSeconds < 10 ? "0" + elapsedSeconds : elapsedSeconds;

						if (this.currentTime <= this.duration) {
							$scope.elapsedTime = elapsedMinutes + ":" + elapsedSeconds;
							seekBar.setAttribute("value", this.currentTime / this.duration);
						}

						$rootScope.$apply();
					}
				};

				player.onseeked = function() {
					seekBar.setAttribute("value", player.currentTime / player.duration);
					$rootScope.$apply();
				};

				player.onvolumechange = function() {

					var volumeControl = document.getElementById("volumeControl");
					volumeControl.value = player.volume * 100;

					if (!$scope.volumeFromServer) {
						var msg = {
							type: "volume",
							volume: volumeControl.value
						};

						$scope.webSocket.send(JSON.stringify(msg));
					}

					$scope.volumeFromServer = false;
				};

				seekBar.addEventListener('click', function (e) {

					var x = e.pageX - this.offsetLeft,
						clickedValue = x * this.max / this.offsetWidth;

					if (player.currentTime) {
						seekBar.setAttribute("value", clickedValue);
						player.currentTime = player.duration * clickedValue;
					}
				});
			}
		}

		$scope.updateVolume = function(newVolume) {

			if (newVolume) {
				player.volume = newVolume / 100;
				$scope.volumeFromServer = true;
			} else {
				var volumeControl = document.getElementById("volumeControl");
				player.volume = volumeControl.value / 100;
			}
		};

		$scope.searchInput = {};
		$scope.loadingLibrary = false;

		$scope.reconnect = function() {
			$scope.reconnecting = true;
			$scope.createConnection($scope.wsUrl, true);
		};

		$scope.connect = function(lastCode) {

			if (lastCode) {
				$scope.uniqueCode = lastCode;
			}

			if (!$scope.uniqueCode || $scope.uniqueCode.length != 6) {
				var errorMsg = $scope.spanish ? $scope.strings_es.enter_valid_code : $scope.strings_en.enter_valid_code;
				$scope.showError(errorMsg);
				return;
			}

			Connections.query({
					code: $scope.uniqueCode
				}).$promise.then(function (response) {
					if (!response.url) {
						var errorMsg = $scope.spanish ? $scope.strings_es.code_not_found : $scope.strings_en.code_not_found;
						$scope.showError(errorMsg);
						return;
					}

					$cookies.put('weezzlerConnectionCode', $scope.uniqueCode);
					$scope.createConnection(response.url);
				});
		};

		$scope.createConnection = function(wsUrl, isReconnection) {

			if (!isReconnection) {
				$scope.codeSent = true;
				$scope.loadingLibrary = true;
			}

			$scope.wsUrl = wsUrl;
			var ws = new WebSocket("ws://" + wsUrl);

			$scope.webSocket = ws;

			ws.onopen = function () {
				if (ws.readyState == ws.OPEN) {
					if (isReconnection) {
						$scope.sendPlayQueue();

						ga('send', 'event', {
							'eventCategory': 'Connection',
							'eventAction': 'reconnection'
						});
					} else {
						ga('send', 'event', {
							'eventCategory': 'Connection',
							'eventAction': 'firstConnection'
						});
					}

					$scope.isConnected = true;
				}

				$scope.reconnecting = false;
			};

			ws.onerror = function () {

				if (!$scope.isConnected && !$scope.library) {
					$scope.codeSent = false;
					$scope.loadingLibrary = false;
				} else {
					$scope.isConnected = false;

					var tipAlreadyDisplayed = $cookies.get('tipAlreadyDisplayed');
					if (tipAlreadyDisplayed != 'true') {
						$cookies.put('tipAlreadyDisplayed', 'true');
					} else {
						$scope.tipAlreadyDisplayed = true;
					}

					if ($scope.playing) {
						$scope.playPause();
					}
				}

				var errorMsg = $scope.spanish ? $scope.strings_es.connection_error : $scope.strings_en.connection_error;
				$scope.showError(errorMsg);

				$rootScope.$apply();

				ga('send', 'event', {
					'eventCategory': 'Connection',
					'eventAction': 'error'
				});

				$scope.reconnecting = false;
			};

			ws.onclose = function () {

				if (!$scope.isConnected && !$scope.library) {
					$scope.codeSent = false;
					$scope.loadingLibrary = false;
				} else {
					$scope.isConnected = false;

					var tipAlreadyDisplayed = $cookies.get('tipAlreadyDisplayed');
					if (tipAlreadyDisplayed != 'true') {
						$cookies.put('tipAlreadyDisplayed', 'true');
					} else {
						$scope.tipAlreadyDisplayed = true;
					}

					if ($scope.playing) {
						$scope.playPause();
					}
				}

				var errorMsg = $scope.spanish ? $scope.strings_es.device_connection_error : $scope.strings_en.device_connection_error;
				$scope.showError(errorMsg);

				$rootScope.$apply();

				ga('send', 'event', {
					'eventCategory': 'Connection',
					'eventAction': 'close'
				});

				$scope.reconnecting = false;
			};

			ws.onmessage = function (event) {

				$scope.loadingLibrary = false;
				var msg = JSON.parse(event.data);

				console.log(msg);

				switch (msg.type) {
					case "library":
						$scope.organizeLibrary(msg);
						break;
					case "play":
						$scope.playPause(true);
						break;
					case "playSong":
						$scope.playSongFromServer(msg);
						break;
					case "playArtist":
						var artist = $scope.findArtist(msg.artistId);
						$scope.albums = artist.Albums;
						$scope.playArtist();
						break;
					case "playAlbum":
						var album = $scope.findAlbum(msg.albumId);
						$scope.songs = album.Songs;
						$scope.playAlbum();
						break;
					case "previous":
						$scope.previousSong();
						break;
					case "next":
						$scope.nextSong();
						break;
					case "shuffleAll":
						$scope.playAll(true, true);
						break;
					case "shuffleArtist":
						var artist = $scope.findArtist(msg.artistId);
						$scope.albums = artist.Albums;
						$scope.playArtist(true);
						break;
					case "shuffleAlbum":
						var album = $scope.findAlbum(msg.albumId);
						$scope.songs = album.Songs;
						$scope.playAlbum(true);
						break;
					case "addToPlayQueue":
						$scope.addSongsToList(msg.songList);
						break;
					case "clearPlayQueue":
						$scope.clearQueue();
						break;
					case "volume":
						$scope.updateVolume(msg.volume);
						break;
					case "mediaType":
						$scope.selectMediaType(msg.mediaType, true);
						break;
				}

				$rootScope.$apply();
			};
		};

		$scope.organizeLibrary = function(msg) {

			$scope.library = msg.library;
			$scope.artists = msg.library;
			$scope.allAlbums = msg.allAlbums;
			$scope.allSongs = msg.allSongs;

			$scope.musicLibrary = msg.library;
			$scope.musicArtists = msg.library;
			$scope.musicAlbums = msg.allAlbums;
			$scope.songList = msg.allSongs;

			$scope.videoLibrary = msg.videoLibrary;
			if (!$scope.videoLibrary) {
				$scope.newVersion = false;
				$scope.selectMediaType('audio');
			} else {
				$scope.newVersion = true;
				if (msg.mediaType) {
					$scope.selectMediaType(msg.mediaType);
				} else if ($scope.selectedMediaType) {
					$scope.selectMediaType($scope.selectedMediaType);
				}
			}

			$scope.selectSearchPlaceholder();

			var msg = {
				type: "libraryLoaded"
			};

			$scope.webSocket.send(JSON.stringify(msg));
		};

		$scope.navigateToAlbums = function(artist, playArtist) {

			$scope.albums = artist.Albums;
			$scope.selectedAlbums = artist.Albums;

			$scope.selectedArtist = artist;
			$scope.currentView = 'artist';
			$scope.selectedAlbum = null;

			$scope.backVisible = true;
			$scope.nextVisible = false;

			if (playArtist) {
				$scope.playAll();
			}

			$scope.selectSearchPlaceholder();

			window.scrollTo(0, 0);
		};

		$scope.navigateToSongs = function(album, playAlbum) {

			if ($scope.currentView == 'allAlbums') {
				$scope.allAlbumsClicked = true;
			}

			$scope.songs = album.Songs;
			$scope.selectedSongs = album.Songs;

			$scope.selectedAlbum = album;
			$scope.currentView = 'album';

			$scope.backVisible = true;
			$scope.nextVisible = false;

			if (playAlbum) {
				$scope.playAll();
			}

			$scope.selectSearchPlaceholder();

			window.scrollTo(0, 0);
		};

		$scope.showAllArtists = function() {

			$scope.artists = $scope.library;

			$scope.backVisible = false;
			$scope.nextVisible = false;

			$scope.selectedArtist = null;
			$scope.selectedAlbum = null;

			$scope.currentView = 'all';

			$scope.showPlayQueue = false;

			$scope.selectSearchPlaceholder();
		};

		$scope.showAllAlbums = function() {

			$scope.selectedAlbums = $scope.allAlbums;
			$scope.albums = $scope.allAlbums;

			$scope.backVisible = false;
			$scope.nextVisible = false;

			$scope.selectedArtist = null;
			$scope.selectedAlbum = null;

			$scope.currentView = 'allAlbums';

			$scope.showPlayQueue = false;

			$scope.selectSearchPlaceholder();
		};

		$scope.showAllSongs = function() {

			$scope.selectedSongs = $scope.allSongs;
			$scope.songs = $scope.allSongs;

			$scope.backVisible = false;
			$scope.nextVisible = false;

			$scope.selectedArtist = null;
			$scope.selectedAlbum = null;

			$scope.currentView = 'allSongs';

			$scope.showPlayQueue = false;

			$scope.selectSearchPlaceholder();
		};

		$scope.back = function() {

			$scope.nextVisible = true;

			switch ($scope.currentView)
			{
				case 'artist':
					$scope.currentView = 'all';
					$scope.backVisible = false;
					break;
				case 'album':
					if ($scope.allAlbumsClicked) {
						$scope.showAllAlbums();
						$scope.allAlbumsClicked = false;
					} else {
						if ($scope.selectedArtist != null) {
							$scope.currentView = 'artist';
						}
					}
					break;
			}
		};

		$scope.next = function() {

			switch ($scope.currentView)
			{
				case 'all':
					if ($scope.selectedArtist != null) {
						$scope.currentView = 'artist';
					}
					break;
				case 'artist':
					if ($scope.selectedAlbum != null) {
						$scope.currentView = 'album';
						$scope.backVisible = true;
					}
					break;
			}
		};

		$scope.findArtist = function(artistId) {
			for (var i = 0; i < $scope.artists.length; i++) {
				if ($scope.artists[i].Id == artistId)
				{
					return $scope.artists[i];
				}
			}

			return null;
		};

		$scope.findAlbum = function(albumId) {
			for (var i = 0; i < $scope.allAlbums.length; i++) {
				if ($scope.allAlbums[i].Id == albumId)
				{
					return $scope.allAlbums[i];
				}
			}

			return null;
		};

		$scope.findSongInPlaylist = function(songId) {
			for (var i = 0; i < $scope.playList.length; i++) {
				if ($scope.playList[i].Id == songId)
				{
					return $scope.playList[i];
				}
			}

			return null;
		};

		$scope.findSong = function(songId) {
			for (var i = 0; i < $scope.allSongs.length; i++) {
				if ($scope.allSongs[i].Id == songId)
				{
					return $scope.allSongs[i];
				}
			}

			return null;
		};

		$scope.findAlbumBySong = function(songId) {
			var artists = $scope.library;
			for (var i = 0; i < artists.length; i++) {
				var artistAlbums = artists[i].Albums;
				for (var j = 0; j < artistAlbums.length; j++) {
					var album = artistAlbums[j];
					var albumSongs = artistAlbums[j].Songs;
					for (var k = 0; k < albumSongs.length; k++) {
						if (albumSongs[k].Id == songId) {
							return album;
						}
					}
				}
			}

			return null;
		};

		$scope.findArtistByAlbum = function(albumId) {
			var artists = $scope.library;
			for (var i = 0; i < artists.length; i++) {
				var artist = artists[i];
				var artistAlbums = artists[i].Albums;
				for (var j = 0; j < artistAlbums.length; j++) {
					if (artistAlbums[j].Id == albumId) {
						return artist;
					}
				}
			}

			return null;
		};

		$scope.resetSearch = function() {
			$scope.searchInput.text = '';
			$scope.search();
		};

		$scope.playAll = function(isShuffle, fromServer) {

			if (isShuffle && fromServer) {
				$scope.playAllSongs(isShuffle);
				return;
			}

			switch ($scope.currentView)
			{
				case 'all':
				case 'allAlbums':
				case 'allSongs':
					$scope.playAllSongs(isShuffle);
					break;
				case 'artist':
					$scope.playArtist(isShuffle);
					break;
				case 'album':
					$scope.playAlbum(isShuffle);
					break;
			}
		};

		$scope.playAllSongs = function(isShuffle) {

			if (isShuffle) {
				ga('send', 'event', {
					'eventCategory': 'Music',
					'eventAction': 'shuffleAllSongs'
				});
			} else {
				ga('send', 'event', {
					'eventCategory': 'Music',
					'eventAction': 'playAllSongs'
				});
			}

			$scope.playingPosition = 0;
			$scope.playList = [];
			$scope.playList = $scope.allSongs.slice();

			$scope.playPlayQueue(isShuffle);
		};

		$scope.playArtist = function(isShuffle) {

			if (isShuffle) {
				ga('send', 'event', {
					'eventCategory': 'Music',
					'eventAction': 'shuffleArtist'
				});
			} else {
				ga('send', 'event', {
					'eventCategory': 'Music',
					'eventAction': 'playArtist'
				});
			}

			$scope.playingPosition = 0;
			$scope.playList = [];
			for (var i = 0; i < $scope.albums.length; i++) {
				var songs = $scope.albums[i].Songs;
				for (var j = 0; j < songs.length; j++) {
					$scope.playList.push(songs[j]);
				}
			}

			$scope.playPlayQueue(isShuffle);
		};

		$scope.playAlbum = function(isShuffle) {

			if (isShuffle) {
				ga('send', 'event', {
					'eventCategory': 'Music',
					'eventAction': 'shuffleAlbum'
				});
			} else {
				ga('send', 'event', {
					'eventCategory': 'Music',
					'eventAction': 'playAlbum'
				});
			}

			$scope.playingPosition = 0;
			$scope.playList = [];
			$scope.playList = $scope.songs.slice();

			$scope.playPlayQueue(isShuffle);
		};

		$scope.playSongFromServer = function(msg) {

			$scope.shuffleOn = false;

			var songIndex = msg.songIndex;
			var viewName = msg.viewName;
			var albumId = msg.albumId;

			if (viewName == 'all') {
				$scope.playList = $scope.allSongs.slice();
			} else if (viewName == 'album') {
				var album = $scope.findAlbum(albumId);
				$scope.songs = album.Songs;
				$scope.playList = $scope.songs.slice();
			} else {
				var song = $scope.findSongInPlaylist(msg.songId);
				$scope.play(song, songIndex, true);
				return;
			}

			var song = $scope.findSongInPlaylist(msg.songId);

			$scope.sendPlayQueue();
			$scope.play(song, songIndex, true);
		}

		$scope.playSong = function(song, songIndex) {

			$scope.shuffleOn = false;

			if ($scope.selectedAlbum && $scope.songs) {
				$scope.playList = $scope.songs.slice();
			} else {
				$scope.playList = $scope.allSongs.slice();
			}

			$scope.sendPlayQueue();
			$scope.play(song, songIndex, false);
		};

		$scope.playPlayQueue = function(isShuffle) {

			if (isShuffle) {
				$scope.shuffle();
			} else {
				$scope.shuffleOn = false;
				$scope.sendPlayQueue();
			}

			$scope.play($scope.playList[0], 0);
		}

		$scope.sendPlayQueue = function() {

			var msg;
			if ($scope.playList && $scope.playList.length > 0) {
				var songIdList = [];
				for (var i = 0; i < $scope.playList.length; i++) {
					songIdList.push($scope.playList[i].Id);
				}

				msg = {
					type: "addToPlayQueue",
					songIdList: songIdList,
					playingPosition: $scope.playingPosition
				};

			} else {

				msg = {
					type: "clearPlayQueue"
				};
			}
			$scope.webSocket.send(JSON.stringify(msg));
		};

		$scope.clearQueue = function() {

			$scope.playingPosition = 0;
			$scope.playList = [];
			$scope.shuffleOn = false;
			$scope.queueCleared = true;
			$scope.sendPlayQueue();
		};

		$scope.trustSrc = function(src) {
			return $sce.trustAsResourceUrl(src);
		};

		$scope.play = function(song, songIndex, fromServer)
		{
			$scope.playingPosition = songIndex;

			player.pause();

			var ip = "192.168.1.7";
			if ($scope.wsUrl) {
				ip = $scope.wsUrl.substring(0, $scope.wsUrl.indexOf(":"));
			}

			$scope.songUrl = "http:\/\/" + ip + ":8080\/song?id=" + song.Id;

			if ($scope.playingSong) {
				$scope.playingSong.isPlaying = false;
			}

			$scope.playingSong = song;
			$scope.playingAlbum = $scope.findAlbumBySong($scope.playingSong.Id);
			$scope.playingArtist = $scope.findArtistByAlbum($scope.playingAlbum.Id);

			seekBar.setAttribute("value", 0);
			$scope.elapsedTime = "00:00";
			$scope.songDuration = song.Duration;

			$timeout(function() {
				player.load();
			}, 1000, true);

			if (!fromServer) {

				var msg = {
					type: "song",
					id: song.Id,
					playingPosition: $scope.playingPosition
				};

				$scope.webSocket.send(JSON.stringify(msg));
			}

			song.isPlaying = true;

			ga('send', 'event', {
				'eventCategory': 'Music',
				'eventAction': 'playSong'
			});
		};

		$scope.playing = false;
		$scope.playPause = function(fromServer) {

			if (!fromServer) {
				$scope.playPauseFromServer = false;
			}

			if ($scope.playing) {
				player.pause();
			} else {
				player.play();
			}
		};

		$scope.sendPlayPause = function() {

			var msg = {
				type: "playPause",
				isPlaying: $scope.playing ? "true" : "false"
			};

			$scope.webSocket.send(JSON.stringify(msg));
		};

		$scope.previousSong = function() {

			if ($scope.playList && $scope.playList.length > 1 && $scope.playingSong) {

				if ($scope.queueCleared) {
					$scope.queueCleared = false;
				}

				var playingSongs = $scope.playList;
				if ($scope.playingPosition > 0) {
					var previousSongIndex = $scope.playingPosition - 1;
					$scope.play(playingSongs[previousSongIndex], previousSongIndex);
				}
			}
		};

		$scope.nextSong = function() {

			var nextSongExists = false;
			if ($scope.playList && $scope.playList.length > 1 && $scope.playingSong) {

				if ($scope.queueCleared) {
					$scope.queueCleared = false;
				}

				var playingSongs = $scope.playList;
				if ($scope.playingPosition < (playingSongs.length - 1)) {
					var nextSongIndex = $scope.playingPosition + 1;
					$scope.play(playingSongs[nextSongIndex], nextSongIndex);
					nextSongExists = true;
				}
			}

			return nextSongExists;
		};

		$scope.shuffle = function(isShuffleToggle) {

			if ($scope.playList) {

				if ($scope.shuffleOn && isShuffleToggle) {
					$scope.playList = $scope.playListNoShuffle;
				} else {

					$scope.playListNoShuffle = $scope.playList.slice();

					var currentIndex = $scope.playList.length, temporaryValue, randomIndex;
					while (0 !== currentIndex) {

						randomIndex = Math.floor(Math.random() * currentIndex);
						currentIndex -= 1;

						temporaryValue = $scope.playList[currentIndex];
						$scope.playList[currentIndex] = $scope.playList[randomIndex];
						$scope.playList[randomIndex] = temporaryValue;
					}
				}

				$scope.shuffleOn = isShuffleToggle ? !$scope.shuffleOn : true;

				$scope.play($scope.playList[0], 0);
			}

			$scope.sendPlayQueue();
		};

		$scope.addSongsToList = function(songList) {

			if (!$scope.playList) {
				$scope.playingPosition = 0;
				$scope.playList = [];
			}

			for (var i = 0; i < songList.length; i++) {
				$scope.addSong(songList[i]);
			}

			$scope.sendPlayQueue();
		};

		$scope.addArtistToList = function(artist) {

			if (!$scope.playList) {
				$scope.playingPosition = 0;
				$scope.playList = [];
			}

			for (var i = 0; i < artist.Albums.length; i++) {
				var albumSongs = artist.Albums[i].Songs;
				for (var j = 0; j < albumSongs.length; j++) {
					$scope.addSong(albumSongs[j]);

				}
			}

			$scope.sendPlayQueue();

			var successMsg = $scope.spanish ? $scope.strings_es.artist_added : $scope.strings_en.artist_added;

			$scope.showSuccess(successMsg);
		};

		$scope.addAlbumToList = function(album) {

			if (!$scope.playList) {
				$scope.playingPosition = 0;
				$scope.playList = [];
			}

			for (var i = 0; i < album.Songs.length; i++) {
				$scope.addSong(album.Songs[i]);
			}

			$scope.sendPlayQueue();

			var successMsg = $scope.spanish ? $scope.strings_es.album_added : $scope.strings_en.album_added;
			if ($scope.selectedMediaType == "video") {
				successMsg = $scope.spanish ? $scope.strings_es.folder_added : $scope.strings_en.folder_added;
			}

			$scope.showSuccess(successMsg);
		};

		$scope.addSongToList = function(song) {

			if (!$scope.playList) {
				$scope.playingPosition = 0;
				$scope.playList = [];
			}

			$scope.addSong(song);

			$scope.sendPlayQueue();

			var successMsg = $scope.spanish ? $scope.strings_es.song_added : $scope.strings_en.song_added;
			if ($scope.selectedMediaType == "video") {
				successMsg = $scope.spanish ? $scope.strings_es.video_added : $scope.strings_en.video_added;
			}

			$scope.showSuccess(successMsg);
		};

		$scope.addSong = function(song) {

			var found = false;
			for (var i = 0; i < $scope.playList.length; i++) {
				if ($scope.playList[i].Id == song.Id)
				{
					song = $scope.playList[i];
					found = true;
					break;
				}
			}

			if (!$scope.playListNoShuffle) {
				$scope.playListNoShuffle = [];
			}

			var duplicatedSong = {};
			if (found) {

				duplicatedSong.Id = song.Id;
				duplicatedSong.Name = song.Name;
				duplicatedSong.Duration = song.Duration;
				duplicatedSong.ArtistName = song.ArtistName;
				duplicatedSong.postion = $scope.playList.length;

				$scope.playListNoShuffle.push(duplicatedSong);
				$scope.playList.push(duplicatedSong);
			} else {
				$scope.playListNoShuffle.push(song);
				$scope.playList.push(song);
			}
		};

		$scope.viewPlayQueue = function () {

			if ($scope.showPlayQueue) {
				$scope.selectSearchPlaceholder();
			} else {
				$scope.searchPlaceholder = "";
			}

			$scope.showPlayQueue = !$scope.showPlayQueue;
		};

		$scope.search = function() {

			if ($scope.searchInput.text.length == 1) {
				window.scrollTo(0, 0);
			}

			switch ($scope.currentView)
			{
				case 'all':
					$scope.searchInArtists();
					break;
				case 'artist':
				case 'allAlbums':
					$scope.searchInAlbums();
					break;
				case 'album':
				case 'allSongs':
					$scope.searchInSongs();
					break;
			}
		};

		$scope.searchInArtists = function() {

			var searchResults = [];
			for (var i = 0; i < $scope.library.length; i++) {
				var artist = $scope.library[i];
				if (artist.Name.toLowerCase().indexOf($scope.searchInput.text.toLowerCase()) != -1) {
					searchResults.push(artist);
				}
			}

			if (searchResults.length) {
				$scope.artists = searchResults;
			}
		};

		$scope.searchInAlbums = function() {

			var searchResults = [];
			for (var i = 0; i < $scope.selectedAlbums.length; i++) {
				var album = $scope.selectedAlbums[i];
				if (album.Name.toLowerCase().indexOf($scope.searchInput.text.toLowerCase()) != -1) {
					searchResults.push(album);
				}
			}

			if (searchResults.length) {
				$scope.albums = searchResults;
			}
		};

		$scope.searchInSongs = function() {

			var searchResults = [];
			for (var i = 0; i < $scope.selectedSongs.length; i++) {
				var song = $scope.selectedSongs[i];
				if (song.Name.toLowerCase().indexOf($scope.searchInput.text.toLowerCase()) != -1) {
					searchResults.push(song);
				}
			}

			if (searchResults.length) {
				$scope.songs = searchResults;
			}
		};

		$scope.changeLanguage = function() {
			$scope.spanish = !$scope.spanish;
			if ($scope.spanish) {
				$cookies.put('weezzlerLanguage', 'spanish');
			} else {
				$cookies.put('weezzlerLanguage', 'english');
			}

			$scope.selectSearchPlaceholder();
		};

		$scope.selectSearchPlaceholder = function() {

			if ($scope.selectedMediaType == "video") {
				if ($scope.currentView == 'artist' || $scope.currentView == 'allAlbums') {
					$scope.searchPlaceholder = $scope.spanish ? $scope.strings_es.search_folders : $scope.strings_en.search_folders;
					return;
				}

				if ($scope.currentView == 'album' || $scope.currentView == 'allSongs') {
					$scope.searchPlaceholder = $scope.spanish ? $scope.strings_es.search_videos : $scope.strings_en.search_videos;
					return;
				}
			} else {
				if ($scope.currentView == 'all') {
					$scope.searchPlaceholder = $scope.spanish ? $scope.strings_es.search_artists : $scope.strings_en.search_artists;
					return;
				}

				if ($scope.currentView == 'artist' || $scope.currentView == 'allAlbums') {
					$scope.searchPlaceholder = $scope.spanish ? $scope.strings_es.search_albums : $scope.strings_en.search_albums;
					return;
				}

				if ($scope.currentView == 'album' || $scope.currentView == 'allSongs') {
					$scope.searchPlaceholder = $scope.spanish ? $scope.strings_es.search_songs : $scope.strings_en.search_songs;
					return;
				}
			}
		};

		$scope.gotoTop = function() {
			window.scrollTo(0, 0);
		}

		$scope.hidePopups = function() {
			$scope.showHelp = false;
			$scope.showAbout = false;
		};

		$scope.strings_en = {
			enter_valid_code: 'Please enter a valid code.',
			code_not_found: 'We couldn\'t find the entered code, please try getting a new one from your device.',
			connection_error: 'There was an error in the connection.',
			device_connection_error: 'The connection with your device has been lost.',

			artist_added: 'Artist added to play queue.',
			album_added: 'Album added to play queue.',
			song_added: 'Song added to play queue.',

			folder_added: 'Folder added to play queue.',
			video_added: 'Video added to play queue.',

			search_artists: 'Search artists...',
			search_albums: 'Search albums...',
			search_songs: 'Search songs...',

			search_folders: 'Search folders...',
			search_videos: 'Search videos...'
		};

		$scope.strings_es = {
			enter_valid_code: 'Por favor ingresá un código válido.',
			code_not_found: 'No pudimos encontrar el código ingresado, por favor intentá obtener uno nuevo en tu teléfono.',
			connection_error: 'Hubo un error en la conexión.',
			device_connection_error: 'Se perdió la conexión con tu teléfono.',

			artist_added: 'Artista agregado a la cola de reproducción.',
			album_added: 'Album agregado a la cola de reproducción.',
			song_added: 'Canción agregada a la cola de reproducción.',

			folder_added: 'Carpeta agregada a la cola de reproducción.',
			video_added: 'Video agregado a la cola de reproducción.',

			search_artists: 'Buscar artistas...',
			search_albums: 'Buscar álbumes...',
			search_songs: 'Buscar canciones...',

			search_folders: 'Buscar carpetas...',
			search_videos: 'Buscar videos...'
		};
	});