
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
       this.id=params.id;
       this.idnm=params.idnm;
       this.kumcd=params.kumcd;
       this.ukecd = params.ukecd;
       this.ido = params.ido;
       this.keido = params.keido;
       this.haijun = params.haijun;
       this.nm = params.nm;
       this.adr = params.adr;
       this.url = params.url;
       this.url2 = params.url2;
   };
   
   return Product;
});

module.controller('AppController', function($scope, Product, $http) {
  
    $scope.scan = function() {
        var onSuccess = function(result) {
            if (!result.cancelled) {
//                alert("We got a barcode\n" +
//                      "Result: " + result.text + "\n" +
//                      "Format: " + result.format + "\n" +
//                      "Cancelled: " + result.cancelled);
                
                loadingDialog.show();
                
                $scope.search(result.text, function(product) {
                    $scope.history.unshift(product);
                    $scope.history = $scope.history.slice(0, 50);
                    $scope.saveHistory();
                    
                    $scope.selectProduct(product,0);
                    setTimeout(function() {
                        loadingDialog.hide();
                    }, 200);
                }, function() {
                    loadingDialog.hide();
                    ons.notification.alert({
                        title: '検索が失敗しました',
                        message: 'バーコードの形式が違います！',
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
    
    $scope.selectProduct = function(product,idno) {
        $scope.idno=idno;
        $scope.currentProduct = product;
        navi.pushPage('details.html');
    };

    $scope.search = function(getStr, callback, failCallback) {
        //  暗号化したデータを複合化
        var ret;
        var key=4;
        ret=decaesar(getStr,key);
        
        var arr=ret.split(',');
        var apiUrl = 'http://maps.google.com/maps?q=';
        
        if(Object.keys(arr).length<8){
            failCallback();
            return false;
        }
        
        var product=createProduct(arr,apiUrl);
        
        callback(product);
        
        // APIの返り値からProductオブジェクトを生成する
        function createProduct(response,response2) {
            var firstResult = response;
            var secondResult = response2;
            var pid;
            var pidnm;
            var para
            var para2
            
            para=firstResult[3]+','+firstResult[4]
            para2=firstResult[7]
            
            pid=firstResult[0];
                        
            switch (pid) {
                case "0" : pidnm="◎受取場住所完全一致" ; break ;
                case "1" : pidnm="△受取場住所部分一致" ; break ;
                case "2" : pidnm="◎受取場住所手動変更" ; break ;
                case "100" : pidnm="◎組合員住所完全一致" ; break ;
                case "101" : pidnm="△組合員住所部分一致" ; break ;
                case "102" : pidnm="◎組合員住所手動変更" ; break ;
                case "600" : pidnm="コメント情報" ; break ;
                case "700" : pidnm="写真情報" ; break ;
                default : pidnm="検索結果候補なし" ; break ;
            }
            
            return new Product({
                id: pid,
                idnm: pidnm,
                kumcd: firstResult[1],
                ukecd: firstResult[2],
                ido: firstResult[3],
                keido: firstResult[4],
                haijun: firstResult[5],
                nm: firstResult[6],
                adr: firstResult[7],
                url: secondResult+para,
                url2: secondResult+para2
            });
        }
        
        /* シーザーー暗号化 */
        function caesar(val, key) {
          val = encodeURIComponent(val);
          var result = "";
          for (var i = 0; i < val.length; i++) {
            result += String.fromCharCode(val.charCodeAt(i) + key);
          }
          return result;
        }
        
        /* シーザー復号化 */
        function decaesar(val, key) {
          var result = "";
          for (var i = 0; i < val.length; i++) {
            result += String.fromCharCode(val.charCodeAt(i) - key);
          }
          return decodeURIComponent(result) ;
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
        window.localStorage.setItem('history', JSON.stringify($scope.history));
        $scope.history=[];
        $scope.saveHistory();
        ons.notification.alert({
            title: '削除成功',
            message: '履歴を全件削除しました。！',
            buttonLabel: 'OK',
            animation: 'default', // もしくは'none'
        });
    };
    
    $scope.delHistory = function() {
        window.localStorage.setItem('history', JSON.stringify($scope.history));
        $scope.history.splice($scope.idno,1);
        $scope.saveHistory();
        ons.notification.alert({
            title: '削除成功',
            message: '履歴から削除しました。！',
            buttonLabel: 'OK',
            animation: 'default', // もしくは'none'
        });
        navi.popPage();
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