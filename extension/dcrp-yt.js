var port = browser.runtime.connectNative("dcrp");

function onResponse(response) {
   console.log(response);
}

function onError(error) {
   console.log(error);
}

let sending = browser.runtime.sendNativeMessage("dcrp", "ping pongsteris")
sending.then(onResponse, onError)

port.disconnect()
