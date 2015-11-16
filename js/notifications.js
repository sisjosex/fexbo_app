var TOKEN_PUSH_NOTIFICATION = 0;
var HAVE_NOTIFICATION = '';
var TYPE_NOTIFICATION = '';
var EVENT;
var pushNotificationPlugin;
var DEVICE_UUID;

function registerNotifications() {

    DEVICE_UUID = getStoredKey('uuid');
    TOKEN_PUSH_NOTIFICATION = getStoredKey('uuid');

    if(window.plugins && window.plugins.pushNotification) {

        pushNotificationPlugin = window.plugins.pushNotification;

        if (device.platform === 'android' || device.platform === 'Android') {

            pushNotificationPlugin.register(successHandler, this.errorHandler, {
                "senderID": "1000613045394",
                "ecb": "onNotificationGCM"
            });

        } else {

            pushNotificationPlugin.register(tokenHandler, this.errorHandler, {
                "badge": "true",
                "sound": "true",
                "alert": "true",
                "ecb": "onNotificationAPN"
            });
        }
    }
}

function successHandler() {}

// android
function tokenHandler(result) {

    // always store token
    storeToken(device.uuid, result, 'iphone');
}

function onNotificationGCM(e) {

    switch( e.event )
    {
        case 'registered':
            if ( e.regid.length > 0 )
            {
                if(TOKEN_PUSH_NOTIFICATION === 0){
                    storeToken(device.uuid, e.regid, 'android');
                }
            }
            break;

        case 'message':
            // this is the actual push notification. its format depends on the data model from the push server
            if(TOKEN_PUSH_NOTIFICATION !== 0){
                showNotification(e,'android');
            }else{
                HAVE_NOTIFICATION = true;
                TYPE_NOTIFICATION = 'android';
                EVENT = e;
            }
            break;

        case 'error':
            alert('GCM error = '+e.msg);
            break;

        default:
            alert('An unknown GCM event has occurred');
            break;
    }
}

function onNotificationAPN(event) {
    if (event.alert) {
        if(TOKEN_PUSH_NOTIFICATION !== 0){
            showNotification(event,'ios');
        }else{
            HAVE_NOTIFICATION = true;
            TYPE_NOTIFICATION = 'ios';
            EVENT = event;
        }
    }
}

function showNotification(event, type){
    var message     = type === "android" ? event.message : event.alert;
    var seccion     = type === "android" ? event.payload.seccion : event.seccion;
    var seccion_id  = type === "android" ? event.payload.seccion_id : event.seccion_id;
    var date        = type === "android" ? event.payload.date : event.date;

    currentDate = date;

    try {
        navigator.notification.alert(
            message,
            function () {
                redirectToPage(seccion, seccion_id);
            },
            t("alert"),
            t("accept")
        );
    } catch(error) {
        redirectToPage(seccion, seccion_id);
    }
}

function redirectToPage(seccion, id) {

}

function errorHandler() {}


function storeToken(uuid, token, device) {

    TOKEN_PUSH_NOTIFICATION = token;
    DEVICE_UUID = uuid;

    console.log('========================');
    console.log(DEVICE_UUID);
    console.log(TOKEN_PUSH_NOTIFICATION);

    getJsonPBackground(api_url + 'updateUUID/', storePushInfoInMobile, onError, {
        user_id: userData.id,
        uuid: TOKEN_PUSH_NOTIFICATION,
        uuid_device: uuid,
        device: device
    });
}

function storePushInfoInMobile(data) {

    localStorage.setItem("push_token", TOKEN_PUSH_NOTIFICATION);
    localStorage.setItem("uuid", DEVICE_UUID);
}

function redirectToSection(scope, section) {
    // after clicked notification redirects or makes something here
}

function verifyNotification() {
    // show directly notification if already have one
    if(HAVE_NOTIFICATION){
        setTimeout(function(){
            showNotification(EVENT, TYPE_NOTIFICATION);
        },800);
        HAVE_NOTIFICATION = false;
    }
}

function getStoredKey(key) {

    if ( user == undefined ) {

        if (localStorage.getItem(key) != null && localStorage.getItem(key) != undefined && localStorage.getItem(key) != '' && localStorage.getItem(key) != 'undefined') {

            user = JSON.parse(localStorage.getItem(key));

        } else {

            user = undefined;
        }
    }

    return user;
}