/**
 * 
 * searchReuslts.js
 * Grab input from search bar and provide results from Firebase
 */


 $(document).ready(function() {


    $('#submit').on('click', function(e) {
        var db = firebase.database();
        var eventsRef = db.ref("/events");
        var catRef = db.ref("/categories");
        var user = firebase.auth().currentUser.uid;

        query = $('#search').val();
        if (query == null) {
            return;
        }
        console.log(eventsRef.events_count);
        // for ( let i = 0; i < eventsRef.events_count)
        
    });
 });