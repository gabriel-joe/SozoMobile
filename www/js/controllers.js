var API = "http://52.26.58.171/SozoAPI/public/";
var CAMERA = true;
var DEVICE = true;
angular.module('starter.controller', ['uiGmapgoogle-maps', 'ionic'])

.controller('AcompanharCtrl', function($scope, $http, $state, $localstorage, Ocorrencia, $ionicLoading) {
    $scope.$apply();
    $scope.marker = {
        id: 0,
        icon: 'img/map-icon-red.png',
        options: {
            animation: 1
        },
        coords: {
            latitude: null,
            longitude: null
        }
    }

    $scope.map = {
        options: {
            disableDefaultUI: true
        },
        center: {
            latitude: -8.0631490,
            longitude: -34.8713110
        },
        zoom: 10
    };

    $scope.markerViaturas = [];


    $scope.markerOcorrencia = {
        id: 99,
        icon: 'img/map-icon-red.png',
        options: {
            animation: 1
        },
        coords: {
            latitude: null,
            longitude: null
        }
    }



    var count = 0;
    function findOcorrenciaAtiva() {
        var solicitante = $localstorage.getObject('solicitante');
        $scope.ocorrencia = Ocorrencia.getOcorrenciaAberta();
        if($scope.ocorrencia) {
        $http.get(API + '/ocorrencias/aberta/solicitante/' + $scope.ocorrencia.id).
            success(function(response, status, headers, config) {
                if(response.type) {
                            var ocorrencia = response.data;
                            $scope.markerOcorrencia.coords.latitude = ocorrencia.latitude;
                            $scope.markerOcorrencia.coords.longitude = ocorrencia.longitude;
                            if(count == 0) {
                                $scope.map.center = {latitude: ocorrencia.latitude, longitude: ocorrencia.longitude};
                                if(DEVICE) $cordovaToast.showLongBottom('Mostrando solicitação aberta');
                                $ionicLoading.hide();
                            }
                            count++;
                            $scope.markerViaturas = [];
                            for(var i in ocorrencia.viaturas) {
                                var v = ocorrencia.viaturas[i];
                                $scope.ambulancia = true;
                                $scope.markerViaturas.push({
                                    id: v.id,
                                    icon: 'img/ambulance-icon.png',
                                    coords: {
                                        latitude: v.latitude,
                                        longitude: v.longitude
                                    }
                                })
                            }
                        }else {

                        }
                    }).error(function(data, status, headers, config) {});
        }
    }
    findOcorrenciaAtiva();

    var ocorrenciaInterval = setInterval(function() {
        findOcorrenciaAtiva();
    }, 5000);

    $scope.pararAcompanhamento = function() {
        $state.go('tab.map');
        clearInterval(ocorrenciaInterval);
    }
    
    $scope.findOcorrencia = function() {
            var o = $scope.markerOcorrencia.coords;
            $scope.map.center = {latitude: o.latitude, longitude: o.longitude };
    }

        $scope.findViatura = function(viatura) {
            console.log(viatura)
            $scope.map.center = {latitude: viatura.coords.latitude, longitude: viatura.coords.longitude }
        }
})

.controller('CadastroCtrl', function($scope, $state, $localstorage, $http, Sozo, $ionicPopup, $cordovaToast, $ionicLoading) {
    //localStorage.clear();
    //state.go('tab.map');
    console.log($localstorage.getObject('solicitante').id )
    if(typeof $localstorage.getObject('solicitante').id != 'undefined') {
        $state.go('tab.map');
    }
    if($localstorage.get('armazenarDados', null) == null) {
        $localstorage.set('armazenarDados', true);
    }
    $scope.solicitante = {
        nome: null,
        telefone: null
    }
    $scope.error = {
        messages: [],
        nome: false,
        telefone: false
    };
    
    $scope.cadastrar = function() {
        
        $scope.error = {
            messages: [],
            nome: false,
            telefone: false
        };
        if($scope.solicitante.nome == null) {
            $scope.error.messages.push('Preencha o campo Nome Completo');
            $scope.error.nome = true;
        }else if(!new RegExp("^[a-zà-ú]+[ ][a-z à-ú]{1,70}[a-zà-ú]$", "i").test($scope.solicitante.nome)) {
            
            $scope.error.messages.push('Preencha o campo Nome Completo com um nome válido');
            $scope.error.nome = true;
        }
        if($scope.solicitante.telefone == null) {
            console.log($scope.telefone)
            $scope.error.messages.push('Preencha o campo Telefone');
            $scope.error.telefone = true;
        }else if(!new RegExp("^[0-9]{2}[ ][0-9]{8}$").test($scope.solicitante.telefone)) {
            $scope.error.messages.push('Preencha o campo Telefone corretamente no formato DD + Número ex: 88 88888888');
            $scope.error.telefone = true;
        }
        if($scope.error.messages.length > 0) return;

        var confirmPopup = $ionicPopup.confirm({
            title: 'Atenção',
            template: '<b>Verifique se ' + $scope.solicitante.telefone + ' é o número do seu aparelho atual</b><br />Será enviado uma mensagem para o aparalho com um código de confirmação, você deseja prosseguir?'
        });
        confirmPopup.then(function(res) {
            if(res) {
                $ionicLoading.show({
                  template: 'Cadastrando... <br/><br/><ion-spinner></ion-spinner>',
                  showBackdrop: true
                });
                    $http.post(API + 'solicitantes/add', $scope.solicitante).
                    success(function(response, status, headers, config) {
                        var id = response.data.id;
                        $scope.solicitante.id = id;
                        $localstorage.setObject("solicitante", $scope.solicitante);
                        //alert('Cadastro efetuado com sucesso');
                        if(DEVICE) $cordovaToast.showLongBottom('Cadastro efetuado com sucesso');
                        Sozo.setNovoUsuario(true);
                        $state.go('tab.map', {}, {reload: true});
                        $ionicLoading.hide();
                    }).
                    error(function(data, status, headers, config) {
                        $ionicLoading.hide();
                        alert('Não foi possível realizar o cadastro, verifique a sua conexão com a internet ou tente novamente mais tarde');
                    });
            } else {
                console.log('Cadastro cancelado');
            }
         });
        
    }

})

.controller('MapCtrl', function($scope, $ionicLoading, $state, $cordovaSms, Ocorrencia, $ionicPopup, Camera, $localstorage, Sozo, $window, $ionicModal, $cordovaCapture, $cordovaToast, $cordovaFileTransfer, $http, $localstorage, $timeout) {
    $scope.zoomIn = function() {
        $scope.map.zoom += 1;
    }
    $scope.zoomOut = function() {
        $scope.map.zoom -= 1;
    }

    $scope.isGPSactived = false;
    $scope.GPS = false;
    $scope.map = {
        options: {
            disableDefaultUI: true
        },
        center: {
            latitude: -8.0631490,
            longitude: -34.8713110
        },
        zoom: 1
    };

    $scope.marker = {
        id: 0,
        /*icon: '../img/map-icon-red.png',*/
        options: {
            animation: 2
        },
        coords: {
            latitude: null,
            longitude: null
        }
    }

    $scope.markerOcorrencia = {
        id: 99,
        icon: 'img/map-icon-red.png',
        options: {
            animation: 1
        },
        coords: {
            latitude: null,
            longitude: null
        }
    }
    $scope.markerViaturas = [];

    $scope.find = function() {
        if (!$scope.map) return;
        $ionicLoading.show({
            content: 'Buscando localização atual...',
            showBackdrop: false
        });
        var options = {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 10000
        };
        navigator.geolocation.getCurrentPosition(function(pos) {
            $ionicLoading.hide();
            console.log(pos.coords)
            $scope.map.center = {latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            $scope.marker.coords = pos.coords;

            $scope.map.zoom = 15;
            Ocorrencia.setOcorrencia(pos.coords);
            
            $scope.isGPSactived = true;
            $scope.GPS = true;
        }, function(error) {
            $ionicLoading.hide();
            $scope.isGPSactived = false;
            $scope.GPS = true;
            alert('Não foi possível encontrar a localização do aparelho. Por favor verifique se o GPS do aparelho está ativado.');

        }, options);
    }
    // A confirm dialog
     $ionicModal.fromTemplateUrl('modal.html', function($ionicModal) {
        $scope.modal = $ionicModal;
    }, {
        // Use our scope for the scope of the modal to keep it simple
        scope: $scope,
        // The animation we want to use for the modal entrance
        animation: 'slide-in-up'
    });
    $scope.solicitarSocorro = function() {
        if(!DEVICE) send();
        Camera.getPicture().then(function(imageURI) {
            var o = Ocorrencia.getOcorrencia();
            o.image = imageURI;
                        $scope.modal.hide();
                        //$state.go('foto', {}, {reload: true});
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'Atenção',
                            template: '<b>Você tem certeza que deseja enviar essa solicitação?</b>'
                        });
                        confirmPopup.then(function(res) {
                            if(res) {
                                    send();
                            }
                         });
                    }, function(err) {
                        console.log(err);
                    }, {encodingType: 1});
    }

    $scope.solicitarSocorroVideo = function() {
        var options = { limit: 1, duration: 15 };

        $cordovaCapture.captureVideo(options).then(function(videoData) {
            var o = Ocorrencia.getOcorrencia();
            o.image = videoData[0].localURL;
            $scope.modal.hide();
            var confirmPopup = $ionicPopup.confirm({
                            title: 'Atenção',
                            template: '<b>Você tem certeza que deseja enviar essa solicitação?</b>'
                        });
                        confirmPopup.then(function(res) {
                            if(res) {
                                    send();
                            }
                         });
        }, function(err) {
            console.log(err)
            alert(err)
        });
    }  

    $scope.openModal = function() {
        console.log('Opening Modal');
        $scope.modal.show();
      };

    function send() {
        $scope.ocorrencia = Ocorrencia.getOcorrencia();
        if(typeof $scope.ocorrencia.image != 'undefined') {
            var format = $scope.ocorrencia.image.split(".")[$scope.ocorrencia.image.split(".").length-1];
        }
        $ionicLoading.show({
          template: 'Registrando ocorrência <br/><br/><ion-spinner></ion-spinner>',
          showBackdrop: true
        });
        if(!DEVICE || CAMERA == false) {
            $http.post(API + 'ocorrencias/add', {
                        longitude: $scope.ocorrencia.longitude,
                        latitude: $scope.ocorrencia.latitude,
                        solicitante_id: $localstorage.getObject("solicitante").id
                    }).
                    success(function(response, status, headers, config) {
                        $scope.ocorrencia = null;
                        $ionicLoading.hide();
                        if(DEVICE) {
                            $cordovaToast.showLongBottom('Solicitação enviada com sucesso');
                        }else {
                            alert("Solicitação enviada com sucesso");
                        }
                        op = response.data;
                        //$state.go('tab.ocorrencias');
                    }).
                    error(function(data, status, headers, config) {
                        $scope.ocorrencia = null;
                        $ionicLoading.hide();
                        $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                    });
            return;
        }
        $cordovaFileTransfer.upload(API + '/ocorrencias/upload', $scope.ocorrencia.image, {
            params: {
                "solicitante_id": $localstorage.getObject("solicitante").id,
                "formato": format
            }
        }).then(function(result) {
                var r = JSON.parse(result.response);
                if(r.type) {
                    $http.post(API + 'ocorrencias/add', {
                        longitude: $scope.ocorrencia.longitude,
                        latitude: $scope.ocorrencia.latitude,
                        solicitante_id: $localstorage.getObject("solicitante").id,
                        file: r.data
                    }).
                    success(function(response, status, headers, config) {
                        $ionicLoading.hide();
                        $scope.ocorrencia = null;
                        if(DEVICE) $cordovaToast.showLongBottom('Solicitação enviada com sucesso');
                        op = response.data;
                        //$state.go('tab.ocorrencias');
                    }).
                    error(function(data, status, headers, config) {
                        $scope.ocorrencia = null;
                        $ionicLoading.hide();
                        $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                    });
                }else {
                    $scope.ocorrencia = null;
                    $ionicLoading.hide();
                    $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                }
                
            }, function(err) {
                $scope.ocorrencia = null;
                $ionicLoading.hide();
                $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
            }, function (progress) {
            });
    }

    $scope.ocorrencia = false;
    $scope.ambulancia = false;
    $scope.viaturas = null;
    var count = 0;


    function findOcorrenciaAtiva() {
        console.log(count);
        var solicitante = $localstorage.getObject('solicitante');
        $scope.ocorrencia = Ocorrencia.getOcorrenciaAberta();
        if($scope.ocorrencia) {
        $http.get(API + '/ocorrencias/aberta/solicitante/' + $scope.ocorrencia.id).
            success(function(response, status, headers, config) {
                if(response.type) {
                            var ocorrencia = response.data;
                            $scope.markerOcorrencia.coords.latitude = ocorrencia.latitude;
                            $scope.markerOcorrencia.coords.longitude = ocorrencia.longitude;
                            if(count == 0) {
                                $ionicLoading.hide();
                                $scope.map.center = {latitude: ocorrencia.latitude, longitude: ocorrencia.longitude};
                                if(DEVICE) $cordovaToast.showLongBottom('Mostrando solicitação aberta');
                            }
                            count++;
                            $scope.markerViaturas = [];
                            for(var i in ocorrencia.viaturas) {
                                var v = ocorrencia.viaturas[i];
                                $scope.ambulancia = true;
                                $scope.markerViaturas.push({
                                    id: v.id,
                                    icon: 'img/ambulance-icon.png',
                                    coords: {
                                        latitude: v.latitude,
                                        longitude: v.longitude
                                    }
                                })
                            }
                        }else {

                        }
                    }).error(function(data, status, headers, config) {});
        }
    }
    findOcorrenciaAtiva();
    var ocorrenciaInterval = setInterval(function() {
        findOcorrenciaAtiva();
    }, 5000);

    $scope.pararAcompanhamento = function() {
        count = 0;
        
        $timeout(function() {
            $scope.markerViaturas = [];
            $scope.markerOcorrencia.coords = {
                latitude: null,
                longitude: null
            }
            $state.go('tab.ocorrencias');
            Ocorrencia.setOcorrenciaAberta(null);
        }, 100);
        
    }
    
        $scope.findOcorrencia = function() {
            var o = $scope.markerOcorrencia.coords;
            $scope.map.center = {latitude: o.latitude, longitude: o.longitude };
        }

        $scope.findViatura = function(viatura) {
            console.log(viatura)
            $scope.map.center = {latitude: viatura.coords.latitude, longitude: viatura.coords.longitude }
        }
})

.controller('FotoCtrl', function($scope, $state, Ocorrencia, $http, $localstorage, $cordovaFileTransfer, $ionicLoading, $cordovaToast, $sce) {
    $scope.ocorrencia = Ocorrencia.getOcorrencia();
    if(typeof $scope.ocorrencia.image != 'undefined') {
        var format = $scope.ocorrencia.image.split(".")[$scope.ocorrencia.image.split(".").length-1];
        $scope.image = $sce.trustAsResourceUrl($scope.ocorrencia.image);
    }

    $scope.confirmarSolicitacao = function() {
        $ionicLoading.show({
          template: 'Registrando ocorrência <br/><br/><ion-spinner></ion-spinner>',
          showBackdrop: true
        });
        $cordovaFileTransfer.upload(API + '/ocorrencias/upload', $scope.ocorrencia.image, {
            params: {
                "solicitante_id": $localstorage.getObject("solicitante").id,
                "formato": format
            }
        }).then(function(result) {
                var r = JSON.parse(result.response);
                if(r.type) {
                    $http.post(API + 'ocorrencias/add', {
                        longitude: $scope.ocorrencia.longitude,
                        latitude: $scope.ocorrencia.latitude,
                        solicitante_id: $localstorage.getObject("solicitante").id,
                        file: r.data
                    }).
                    success(function(data, status, headers, config) {
                        $ionicLoading.hide();
                        $cordovaToast.showLongBottom('Solicitação enviada com sucesso');
                        $state.go('tab.ocorrencias');
                    }).
                    error(function(data, status, headers, config) {
                        $ionicLoading.hide();
                        $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                    });
                }else {
                    $ionicLoading.hide();
                    $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
                }
                
            }, function(err) {
                $ionicLoading.hide();
                $cordovaToast.showLongBottom('Não foi possível efetuar a solicitação');
            }, function (progress) {
            });
    }
})

.controller('OcorrenciasCtrl', function($scope, $http, Ocorrencias, $ionicLoading, $localstorage) {
    $scope.ocorrencias = [];
    $scope.buscou = false;
    $ionicLoading.show({
            content: 'Buscando ocorrências...',
            showBackdrop: true
        });
    $http.get(API + 'ocorrencias/solicitante/' + $localstorage.getObject("solicitante").id).
    success(function(response, status, headers, config) {
        $scope.buscou = true;
        console.log(response);
        if(response.data instanceof Array)  $scope.ocorrencias = response.data;
      console.log($scope.ocorrencias)
      for(var i in $scope.ocorrencias) {
        var o = $scope.ocorrencias[i];
        var d = new Date(o.dataCriacao);
        o.dataCriacao = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();// + "  " + d.getHours(); + ":" + d.getMinutes() + ":" + d.getSeconds();
        console.log(o.dataCriacao)
        switch(o.situacaoOcorrencia) {
            case "PENDENTE":
                o.situacao = "aguardando análise";
                break;
            case "EM_ANALISE":
                o.situacao = "em análise";
                break;
            case "ATENDIMENTO_ENCAMINHADO":
                o.situacao = "atendimeto encaminhado";
                break;
            case "VIATURA_A_CAMINHO":
                o.situacao = "viatura a caminho";
                break;
            case "FINALIZADA":
                o.situacao = "finalizada";
                break;
            case "CANCELADA":
                o.situacao = "cancelada";
                break;
            case "AMBULANCIA_A_CAMINHO":
                o.situacao = "Viatura a caminho";
                break;
        }
      }
      Ocorrencias.set($scope.ocorrencias);
      $ionicLoading.hide();
    }).
    error(function(data, status, headers, config) {
        $scope.buscou = true;
      console.log("não foi possível acessar a url");
      $ionicLoading.hide();
    });
})

.controller('OcorrenciaCtrl', function($scope, $stateParams, Ocorrencias, Ocorrencia, $http, $ionicLoading, $timeout, $state, $ionicPopup, $sce, $cordovaToast, $timeout) {
    
    $scope.visualizarOcorrencia = function() {
        Ocorrencia.setOcorrenciaAberta($scope.ocorrencia);
        $state.go("tab.map");
        $ionicLoading.show({
            template: 'Atualizando mapa... <br/><br/><ion-spinner></ion-spinner>',
            showBackdrop: true
        });

        $timeout(function() {
            $ionicLoading.hide();
        }, 6000);
    };

    $ionicLoading.show({
        content: 'Carregando ocorrência...',
        showBackdrop: true
    });
    $scope.ocorrencia = Ocorrencias.get($stateParams.id);
    $scope.isFoto = true;
    if($scope.ocorrencia.foto && $scope.ocorrencia.foto.indexOf(".mp4") != -1) $scope.isFoto = false;
    if($scope.ocorrencia == null) {
        $state.go("tab.ocorrencias");
        return;
    }
    $scope.ocorrencia.foto = $sce.trustAsResourceUrl(API + "uploads/" + $scope.ocorrencia.foto);


    $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + $scope.ocorrencia.latitude + ',' + $scope.ocorrencia.longitude + '&sensor=false').
    success(function(response, s, h, c) {
        if(typeof response.results[0] == 'undefined') {
            $scope.ocorrencia.endereco = "Não foi possível localizar o endereco dessa ocorrência.";
            return;
        }
        $scope.ocorrencia.endereco = response.results[0].formatted_address;
        $ionicLoading.hide();
    }).
    error(function(response, s, h,c ) {
        $ionicLoading.hide();
    });

    $timeout(function() {
        $ionicLoading.hide();
    }, 60000)

    $scope.cancelarSolicitacao = function(ocorrencia) {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Atenção',
            template: '<b>Você tem certeza que deseja cancelar essa solicitação?</b>'
        });
        confirmPopup.then(function(res) {
            if(res) {
                    $http.get(API + 'ocorrencias/delete/' + ocorrencia.id).
                    success(function(response, status, headers, config) {
                        if(response.type == true) {
                            alert('solicitação cancelada com sucesso');
                        }else {
                            alert('Não foi possível cancelar a solicitação');
                        }
                        
                        $state.go('tab.ocorrencias', {}, {reload: true});
                    }).
                    error(function(data, status, headers, config) {
                        alert('Não foi possível cancelar a solicitação');
                    });
            }
         });
        
    }

})

.controller('AjustesCtrl', function($scope, $http, $state, $ionicPopup, $localstorage) {
    $scope.solicitante = $localstorage.getObject("solicitante");
    var nome = $scope.solicitante.nome;
    $scope.armazenarDados = $localstorage.get("armazenarDados");
    console.log($scope.armazenarDados)
    $scope.error = {
        messages: [],
        nome: false
    }

    $scope.salvarNome = function() {
        $scope.error = {
            messages: [],
            nome: false
        }
        if(!new RegExp("^[a-zà-ú]+[ ][a-z à-ú]{1,70}[a-zà-ú]$", "i").test($scope.solicitante.nome)) {
            $scope.error.messages.push('Preencha o campo Nome Completo com um nome válido');
            $scope.error.nome = true;
        }

        if($scope.error.nome) {
            $scope.solicitante.nome = nome;
            return;
        }
        $localstorage.setObject("solicitante", $scope.solicitante);

    }
    $scope.toggleArmazenarDados = function() {
        if($scope.armazenarDados) {
            $scope.armazenarDados = false;
        }else {
            $scope.armazenarDados = true;
        }

        $localstorage.set("armazenarDados", $scope.armazenarDados);
        console.log("oi")
    }
});
