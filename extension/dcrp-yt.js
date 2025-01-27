var port = browser.runtime.connectNative("dcrp");

console.log(port)

//function onResponse(response) {
//    console.log(`Received ${response}`);
//}
//
//function onError(error) {
//    console.log(`Error: ${error}`);
//}
//
//let sending = browser.runtime.sendNativeMessage("dcrp", "ping")
//sending.then(onResponse, onError)
