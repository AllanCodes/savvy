/*
    getData.js
    Grab data { events, categories, websoc, ...}
*/

$(document).ready(function() {
    var config = {
        apiKey: "AIzaSyAsPdolj3xYtfiiQ1hL795PoTJRqz9IBg0",
          authDomain: "savvy-aa31e.firebaseapp.com",
          databaseURL: "https://savvy-aa31e.firebaseio.com",
          projectId: "savvy-aa31e",
          storageBucket: "savvy-aa31e.appspot.com",
          messagingSenderId: "66499803255"
      };
      if (!firebase.apps.length)
        firebase.initializeApp(config);

        var Auth = firebase.auth(); 
        var dbRef = firebase.database();
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                firebase.database().ref('users/' + user.uid).once('value').then(function (snapshot) {
                    $.notify("Welcome " + snapshot.val().firstName, "success");
                });
            }
            else {
            }
        })

});
