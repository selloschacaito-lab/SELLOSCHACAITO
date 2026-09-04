/**
 * CSInterface - v8.0.0
 * Adobe CEP interface library
 */
function CSInterface() {}

CSInterface.prototype.getHostEnvironment = function() {
    var str = window.__adobe_cep__.getHostEnvironment();
    return JSON.parse(str);
};

CSInterface.prototype.closeExtension = function() {
    window.__adobe_cep__.closeExtension();
};

CSInterface.prototype.getSystemPath = function(pathType) {
    var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
    var OSVersion = this.getOSInformation();
    if (OSVersion.indexOf("Windows") >= 0) {
        path = path.replace("file:///", "");
    } else if (OSVersion.indexOf("Mac") >= 0) {
        path = path.replace("file://", "");
    }
    return path;
};

CSInterface.prototype.evalScript = function(script, callback) {
    if (callback === null || callback === undefined) {
        callback = function(result) {};
    }
    window.__adobe_cep__.evalScript(script, callback);
};

CSInterface.prototype.getApplicationID = function() {
    var appId = this.getHostEnvironment().appId;
    return appId;
};

CSInterface.prototype.getHostCapabilities = function() {
    var hostCapabilities = window.__adobe_cep__.getHostCapabilities();
    return JSON.parse(hostCapabilities);
};

CSInterface.prototype.dispatchEvent = function(event) {
    return window.__adobe_cep__.dispatchEvent(event);
};

CSInterface.prototype.addEventListener = function(type, listener, obj) {
    window.__adobe_cep__.addEventListener(type, listener, obj);
};

CSInterface.prototype.removeEventListener = function(type, listener, obj) {
    window.__adobe_cep__.removeEventListener(type, listener, obj);
};

CSInterface.prototype.requestOpenExtension = function(extensionId, params) {
    window.__adobe_cep__.requestOpenExtension(extensionId, params);
};

CSInterface.prototype.getOSInformation = function() {
    var userAgent = navigator.userAgent;
    if ((navigator.platform == "Win32") || (navigator.platform == "Windows")) {
        return "Windows";
    } else if ((navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "MacIntel")) {
        return "Mac";
    }
    return "Unknown";
};

CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    return cep.util.openURLInDefaultBrowser(url);
};

var SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};
