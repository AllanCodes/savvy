/**
 * 
 * searchReuslts.js
 * Grab input from search bar and provide results from Firebase
 */

    function loadData() {
        console.log("fe");
        let db = firebase.database();
        let eventsRef = db.ref("/events/");
        let catRef = db.ref("/categories");
        let user = "";
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
              user = firebase.auth().currentUser.uid;
            }
          });
        let eventCount = 0;
        let currentEvents = [];
        let queryEvents = [];
        let categories = [];

        query = $('#search').val(); //current search string

        catRef.once("value", function(s) { 
            s.forEach(function(c) {
                if (c.val().category !== undefined)
                    categories.push(c.val().category);
            });  
            let arr = [];
            categories.forEach(function(event, idx) {
                arr.push(String(event));
                if (idx === categories.length - 1) {
                    var demo1 = new autoComplete({
                        selector: '#search',
                        minChars: 1,
                        source: function(term, suggest){
                            term = term.toLowerCase();
                            var choices = arr;
                            var suggestions = [];
                            for (i=0;i<choices.length;i++)
                                if (~choices[i].toLowerCase().indexOf(term)) suggestions.push(choices[i]);
                            suggest(suggestions);
                        }
                    });
                }
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


        
    }
