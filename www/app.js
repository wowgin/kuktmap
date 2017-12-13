
"use strict";

var loadingDialog = null;
ons.ready(function() {
    // 読み込み中ダイアログの初期化
    ons.createAlertDialog('loading.html').then(function(alert) {
        loadingDialog = alert;
    });
});

module.factory('Product', function() {
   var Product = function(params) {
       this.name = params.name;
       this.price = params.price;
       this.desc = params.desc;
       this.thumbnailUrl = params.thumbnailUrl;
       this.imageUrl = params.imageUrl;
       this.url = params.url;
   };
   
   return Product;
});

module.controller('AppController', function($scope, Product, $http) {
  
    $scope.scan = function() {
        var onSuccess = function(result) {
            if (!result.cancelled) {
                /*alert("We got a barcode\n" +
                      "Result: " + result.text + "\n" +
                      "Format: " + result.format + "\n" +
                      "Cancelled: " + result.cancelled);*/
                
                loadingDialog.show();
                
                $scope.search(result.text, function(product) {
                    $scope.history.unshift(product);
                    $scope.history = $scope.history.slice(0, 10);
                    $scope.saveHistory();
                    
                    $scope.selectProduct(product);
                    setTimeout(function() {
                        loadingDialog.hide();
                    }, 200);
                }, function() {
                    loadingDialog.hide();
                    ons.notification.alert({
                        title: '商品検索に失敗しました',
                        message: '商品情報を取得できませんでした',
                        buttonLabel: 'OK',
                        animation: 'default', // もしくは'none'
                    });
                });
            }
        };
        
        var onFailure = function(error) {
            ons.notification.alert({
                message: error,
                title: 'スキャンに失敗しました',
                buttonLabel: 'OK',
                animation: 'default', // もしくは'none'
            });
        };

        // バーコードをスキャンする
        plugins.barcodeScanner.scan(onSuccess, onFailure);
    };
    
    $scope.selectProduct = function(product) {
        $scope.currentProduct = product;
        navi.pushPage('details.html');
    };

    $scope.search = function(janCode, callback, failCallback) {
        var apiUrl = 'http://shopping.yahooapis.jp/ShoppingWebService/V1/json/itemSearch';
        // 取得したアプリIDを代入
        // http://www.yahoo-help.jp/app/answers/detail/p/537/a_id/43398/session/L2F2LzEvdGltZS8xNDE4NjEyODk4L3NpZC9WekVGaFc5bQ%3D%3D
        var appId = 'dj0zaiZpPVdaMnVsQnF4aHVlUCZzPWNvbnN1bWVyc2VjcmV0Jng9YTE-';
        $http.get(apiUrl, {params: {appid: appId, jan: janCode}})
            .success(function(data, status, headers, config) {
                try {
                    var product = createProduct(data);
                    callback(product);
                } catch(e) {
                    failCallback();
                }
            })
            .error(function(data, status, headers, config) {
                failCallback();
            });
        
        // APIの返り値からProductオブジェクトを生成する
        function createProduct(response) {
            var firstResult = response.ResultSet[0].Result[0];
            return new Product({
                name: firstResult.Name,
                desc: firstResult.Description,
                url: firstResult.Url,
                imageUrl: firstResult.Image.Medium,
                thumbnailUrl: firstResult.Image.Small,
                price: firstResult.Price._value
            });
        }
    };

    $scope.openWithBrowser = function(url) {
        // 外部ブラウザで開く
        window.open(url, '_system');
    };
    
    $scope.saveHistory = function() {
        window.localStorage.setItem('history', JSON.stringify($scope.history));
    };
    
    $scope.clearHistory = function() {
        $scope.history = [];
        $scope.saveHistory();
    };
    
    try {
        $scope.history = JSON.parse(window.localStorage.getItem('history'));
        if (!angular.isArray($scope.history)) {
            $scope.history = [];
        }
    } catch (e) {
        $scope.history = [];
    }
    
});