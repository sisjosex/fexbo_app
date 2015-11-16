var API_URL = 'http://172.20.10.5:3000/api/'
var module = ons.bootstrap();

var applicationLanguage = 'es';
var user;
var user_storage_key = 'fexbo_user';

var lang = {
    en: {
        yes: 'Yes',
        no: 'No',
        confirmation: 'Confirmation',
        email_required: 'Email is required',
        email_invalid: 'Email is invalid',
        password_required: 'Password is required',
        message: 'Message',
        login: 'Login',
        email: 'Email',
        password: 'Password',
        there_was_an_error: 'There was an error when loading data',
        are_sure_to_logout: 'Are you sure that want logout ?',
        today: 'Today',
        all: 'All',
        welcome: 'Welcome',
        meetings: 'My Meetings',
        profile: 'Profile',
        back: 'Back',
        call_to: 'Call',
        send_email: 'Send email'
    },
    es: {
        yes: 'Si',
        no: 'No',
        confirmation: 'Confirmación',
        email_required: 'Email es requerido',
        email_invalid: 'Email es inválido',
        password_required: 'Password es requerido',
        message: 'Mensage',
        login: 'Ingresar',
        email: 'Email',
        password: 'Contraseña',
        there_was_an_error: 'Ocurrio un problema al cargar los datos',
        are_sure_to_logout: 'Esta seguro que quieres salir ?',
        today: 'Hoy',
        all: 'Todas',
        welcome: 'Bienvenido',
        meetings: 'Mis Reuniones',
        profile: 'Perfil',
        back: 'Atras',
        call_to: 'Llamar',
        send_email: 'Enviar email'
    }
};

module.controller('MainNavigatorController', function($scope){

    ons.ready(function(){

        localStorage.setItem('lang', applicationLanguage);

        mainNavigator.pushPage('login.html', {animation: 'none'});

    });
});

var scopeLogin;
module.controller('Login', function($scope) {

    ons.ready(function() {

        scopeLogin = $scope;

        var login_email = $('#login_email');
        var login_password = $('#login_password');

        $scope.labels = lang[applicationLanguage];

        $scope.login = function() {

            if( $.trim(login_email.val()) == '') {
                alert( t('email_required') );
                return;
            } else if( !login_email.val().match( /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/ )) {
                alert( t('email_invalid') );
                return;
            } else if( $.trim(login_password.val()) == '') {
                alert( t('password_required') );
                return;
            }

            getJsonP(API_URL + 'login',
                function(response) {

                    if(response.status == 'fail') {

                        alert(response.message);

                    } else if (response.status == 'success') {

                        mainNavigator.pushPage('meetings.html');

                        user = response.user;
                        saveUser(user);

                    } else {

                        alert(t('there_was_an_error'));
                    }
                },
                function() {

                    alert(t('there_was_an_error'));

                }, {
                    email: login_email.val(),
                    password: login_password.val()
                }
            );
        };

        $scope.updateLanguage = updateLanguage;

        if ( getUser() != undefined ) {

            mainNavigator.pushPage('meetings.html', {animation:'none'});
        }

        setTimeout(function(){

            try {
                navigator.splashscreen.hide();
            } catch(error) {}

        }, 3000);

    });
});


var scopeMeetings;
module.controller('Meetings', function($scope) {

    ons.ready(function() {

        scopeMeetings = $scope;

        $scope.labels = lang[applicationLanguage];

        $scope.logout = function(event) {

            confirm(t('are_sure_to_logout'), function(index){

                if(index == 0) {
                    mainNavigator.popPage('meetings.html');
                    scopeMeetings = undefined;
                    deleteUser();
                }
            });
        };

        $scope.filter = function(filter) {

            getJsonP(API_URL + 'getAllMeetings',
                function(response) {

                    if(response.status == 'fail') {

                        alert(response.message);

                    } else if (response.status == 'success') {

                        scopeMeetings.$apply(function(){
                            scopeMeetings.meetings = formatMeetings(response.meetings);
                        });

                    } else {

                        alert(t('there_was_an_error'));
                    }
                },
                function() {

                    alert(t('there_was_an_error'));

                }, {
                    user_id: user.id,
                    date: filter=='today' ? moment().format("YYYY-M-D") : ''
                }
            );
        };

        $scope.gotoParticipantDetail = function(index) {

            mainNavigator.pushPage('participant_detail.html', {index: index})
        };

        $scope.updateLanguage = updateLanguage;

        $scope.filter('today');
    });
});


var scopeParticipantDetail;
module.controller('ParticipantDetail', function($scope){

    ons.ready(function(){

        scopeParticipantDetail = $scope;

        index = mainNavigator.getCurrentPage().options.index;

        meeting = scopeMeetings.meetings[index];

        participant_id = meeting.participant_id;

        $scope.labels = lang[applicationLanguage];

        getJsonP(API_URL + 'getParticipantDetail',
            function(response) {

                if(response.status == 'fail') {

                    alert(response.message);

                } else if (response.status == 'success') {

                    scopeParticipantDetail.$apply(function(){
                        scopeParticipantDetail.participant = response.participant;
                        response.company.description = $(response.company.description).text();
                        scopeParticipantDetail.company = response.company;
                    });

                } else {

                    alert(t('there_was_an_error'));
                }
            },
            function() {

                alert(t('there_was_an_error'));

            }, {
                participant_id: participant_id
            }
        );
    });
});

function formatMeetings(meetings) {

    var meetings_array = [];
    var current_expo_id = true;

    for(var i in meetings) {

        meeting = meetings[i];

        scheduled_start = moment(meeting['scheduled_start'], 'YYYY-MM-DD h:mm');

        meeting['scheduled_hour'] = scheduled_start.format('h:mm a');

        if(current_expo_id != meeting['expo_id']) {
            meeting['first_expo'] = true;
            current_expo_id = meeting['expo_id'];
        } else {
            meeting['first_expo'] = false;
        }

        meetings_array.push(meeting);
    }

    return meetings_array;
}

function getUser() {

    if ( user == undefined ) {

        if (localStorage.getItem(user_storage_key) != null && localStorage.getItem(user_storage_key) != undefined && localStorage.getItem(user_storage_key) != '' && localStorage.getItem(user_storage_key) != 'undefined') {

            user = JSON.parse(localStorage.getItem(user_storage_key));

        } else {

            user = undefined;
        }
    }

    return user;
}

function saveUser(user) {

    localStorage.setItem(user_storage_key, JSON.stringify(user));
}

function deleteUser() {

    localStorage.setItem(user_storage_key, undefined);
}

function getJsonP(url, callback_success, callback_error, data) {

    if(data === undefined) {
        data = {};
    }


    if(data.lang === undefined) {
        data.lang = applicationLanguage;
    }

    modal.show();

    url = url + '?format=js'

    $.ajax({
        type: 'POST',
        url: url,
        data: data,
        dataType: 'json',
        timeout: 20000,
        async:true,
        success: function(data) {

            modal.hide();

            callback_success(data);
        },
        error: function() {

            modal.hide();

            callback_error();
        }
    });
}

function updateLanguage(l) {

    applicationLanguage = l;

    if(scopeLogin != undefined) {

        scopeLogin.labels = lang[applicationLanguage];
        scopeLogin.$apply();
    }

    if(scopeMeetings != undefined) {

        scopeMeetings.labels = lang[applicationLanguage];
        scopeMeetings.$apply();
    }

    moment.locale(applicationLanguage);

    localStorage.setItem('lang', applicationLanguage);
}

function alert(message, callback) {
    ons.notification.alert({
        message: message,
        // or messageHTML: '<div>Message in HTML</div>',
        title: t('message'),
        buttonLabel: 'OK',
        animation: 'default', // or 'none'
        // modifier: 'optional-modifier'
        callback: function() {
            callback ? callback() : '';
        }
    });
}

function confirm(message, callback) {
    ons.notification.confirm({
        message: message,
        // or messageHTML: '<div>Message in HTML</div>',
        title: t('confirmation'),
        buttonLabels: [t('yes'), t('no')],
        animation: 'default', // or 'none'
        primaryButtonIndex: 1,
        cancelable: true,
        callback: function(index) {
            // -1: Cancel
            // 0-: Button index from the left
            callback ? callback(index) : '';
        }
    });
}

function t(label) {

    if(lang[applicationLanguage][label] == undefined) {
        return label;
    } else {
        return lang[applicationLanguage][label]
    }
}
