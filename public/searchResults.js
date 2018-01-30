/**
 * 
 * searchReuslts.js
 * Grab input from search bar and provide results from Firebase
 */


 $(document).ready(function() {


    $('#submit').on('click', function(e) {
        let db = firebase.database();
        let eventsRef = db.ref("/events/");
        let catRef = db.ref("/categories");
        let user = firebase.auth().currentUser.uid; 
        let eventCount = 0;
        let currentEvents = [];
        let queryEvents = [];
        let categories = [];

        query = $('#search').val(); //current search string
        //do something (nothing) for empty string
        if (query == null) {
            return;
        }

        catRef.once("value", function(s) { 
            s.forEach(function(c) {
                if (c.val().category !== undefined)
                    categories.push(c.val().category);
            });  
            let arr = [];
            categories.forEach(function(event, idx) {
                if (event.toLowerCase().indexOf(query.toLowerCase()) != -1) {
                    arr.push(String(event));
                    console.log(event);
                }
                // if (idx === categories.length - 1) {
                //     $('#search').typeahead(
                //     {
                //         local: arr
                //     });
                // }
            });
        });

        
        //pull all events and store names and event count
        eventsRef.once("value", function(s) {
            if (s.val() == null) {
                console.log("ERROR: one time fetch");
            } else {
                eventCount = s.val().events_count;
                s.forEach(function(c) {

                });
            }
        });


        



    }); //submit
 });