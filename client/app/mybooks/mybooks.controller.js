'use strict';

(function() {


class MybooksCtrl {
	constructor($http, $scope, Auth) {	
		$scope.getCurrentUser = Auth.getCurrentUser;
		$scope.user = $scope.getCurrentUser();
		$scope.addBook = function(bookData, notes) {
			var img;
			if(bookData.volumeInfo.imageLinks !== undefined && bookData.volumeInfo.imageLinks.thumbnail !== undefined) {
				img = bookData.volumeInfo.imageLinks.thumbnail;
			} else {
				img = '';
			}
			var trade = {
				user: $scope.user.name,
				userId: $scope.user._id,
				book: {
					title: bookData.volumeInfo.title,
					image: img,
					author: bookData.volumeInfo.authors.join(", "),
					year: bookData.volumeInfo.publishedDate,
					volumeId: bookData.id
				},
				notes: '',
				requests: [],
				active: true
			};
			$http.post('/api/trades/', trade).success(function(data) {
				$scope.bookTrades.push(data);
			}).error(function(err) {
				console.log(err);
			});
		};
		$scope.removeBook = function(book) {
			$http.delete('/api/trades/' + book._id).success(function(data) {
				console.log(data);
				$scope.bookTrades = $scope.bookTrades.filter(function(trade, index) {
					return trade._id !== book._id;
				});
				$scope.acceptedTrades = $scope.acceptedTrades.filter(function(trade, index) {
					return trade._id !== book._id;
				});
			}).error(function(err) {
				console.log(err);
			});
		}
		$scope.getMyBooks = function() {
			$http.get('/api/trades/').success(function(data) {
				$scope.bookTrades = data.filter(function(trade, index) {
					return trade.userId === $scope.user._id && trade.active;
				});
				$scope.bookRequests = data.filter(function(trade, index) {
					return trade.requests.indexOf($scope.user._id) >= 0 && trade.active;
				});
				$scope.acceptedTrades = data.filter(function(trade, index) {
					return !trade.active && (trade.userId === $scope.user._id || trade.requests.indexOf($scope.user._id) >= 0);
				});

			}).error(function(err) {
				console.log(err);
			});
		};
		$scope.bookSearch = function(query) {
			var key = 'AIzaSyBRzQkPjF9QC05UphhctTImdgcdWWAzdEM';
			$http.get('https://www.googleapis.com/books/v1/volumes?key=' + key + '&q=' + query + '&CALLBACK=?').success(function(data) {
				$scope.raw = data;
				$scope.books = data.items;
			});
		};
		$scope.removeRequest = function(trade) {
			trade.requests = trade.requests.filter(function(id) {
				return id !== $scope.user._id;
			})
			$http.patch('/api/trades/' + trade._id, trade).success(function(data) {
				console.log(data)
				$scope.bookRequests = $scope.bookRequests.filter(function(data) {
					return data._id !== trade._id;
				})
			}).error(function(err) {
				console.log(err);
			});
		};
		$scope.getUserData = function(userId) {
			$http.get('/api/contact/' + userId).success(function(contact) {
				$scope.userData.push(contact);
			}).error(function(err) {
				console.log(err);
			});
		};
		$scope.showRequests = function(trade) {
			$scope.activeTrade = trade;
			var requests = trade.requests;
			$scope.userData = []
			for(var i=0;i<requests.length;i++) {
				$scope.getUserData(requests[i]);
			}
		};
		$scope.acceptTrade = function(trade, user) {
			console.log(trade, user);
			trade.active = false;
			trade.requests = trade.requests.filter(function(userId) {
				return userId === user._id;
			});
			trade.requests.push($scope.user._id);
			trade.notes = "accepted"
			$http.patch('/api/trades/' + trade._id, trade).success(function(data) {
				$scope.getMyBooks();
			}).error(function(err) {
				console.log(err);
			})
		};
		$scope.getMyBooks();


		$('#search').on('keyup', function(e) {
			if(e.keyCode === 13 ) {
				$('#searchButton').click();
			}
		});
	}
}

angular.module('booksApp')
	.controller('MybooksCtrl', MybooksCtrl);

})();
