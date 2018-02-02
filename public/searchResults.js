/**
 * 
 * searchResults.js
 * Grab input from search bar and provide results from Firebase
 */

    let globalAutoComplete = null;

    function toggleAll() {
        let catref = firebase.database().ref("/categories");
        let count = 0;
        catref.once("value", function(s) {
            count = s.val().category_count;
            for ( let i = 0; i < count; i++ ) {
                $("input[name='chbox" + i + "']").bootstrapSwitch('toggleState');
            }
        });
    }
    //attach this to search for automatic updates according to category
    function loadUserCategories() {
        if (globalAutoComplete !== null)
            globalAutoComplete.destroy();
        let catref = firebase.database().ref("/categories");
        let eventref = firebase.database().ref("/events");
        let count = 0;
        let allCats = [];
        let userCats = [];
        catref.once("value", function(s) {
            let filteredEvents = [];
            s.forEach(function(o) {
                if (o.val().category !== undefined)
                    allCats.push(o.val().category);
            });
            count = s.val().category_count;
            for ( let i = 0; i < count; i++ ) {
                if($("input[name='chbox" + i + "']").bootstrapSwitch('state')) {
                    userCats.push(allCats[i]);
                }
            }
            //get events according to user categories
            eventref.once("value", function(s) {
                //loop user events
                userCats.forEach(function(c, idx) {
                    s.child(c).forEach(function(event, idx) {
                        if (event.val().name !== undefined) {
                            filteredEvents.push(String(event.val().name));
                        }
                    });
                });
            globalAutoComplete = new autoComplete({
                selector: '#search',
                minChars: 1,
                source: function(term, suggest){
                    term = term.toLowerCase();
                    var choices = filteredEvents;
                    var suggestions = [];
                    for (i=0;i<choices.length;i++)
                        if (~choices[i].toLowerCase().indexOf(term)) suggestions.push(choices[i]);
                    suggest(suggestions);
                    }
                }); 
            });
        });
        $('#categoriesModal').modal('hide');    
    }

    function loadData() {
        let db = firebase.database();
        let eventsRef = db.ref("/events");
        let catRef = db.ref("/categories/");
        let user = "";
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
              user = firebase.auth().currentUser.uid;
              console.log("Loading database contents for user: " + user );
            }
          });
        let eventCount = 0;
        let categoryCount = 0;
        let currentEvents = [];
        let queryEvents = [];
        let categories = [];
        query = $('#search').val(); //current search string

        catRef.once("value", function(s) { 
            function createCheckbox(categories) {
                categories.forEach(function(cats, idx) {
                    $('#mbody').append("<h2 class=\"h4\">" + cats + "</h2>");
                    $('#mbody').append("<input type=\"checkbox\" name=\"chbox" + String(idx) + "\" checked=\"true\">");
                    $("[name='chbox" + String(idx) + "']").bootstrapSwitch();
                });
                console.log(categoryCount + " categories added");
                return;
            }

            categoryCount = s.val().category_count;
            s.forEach(function(c) {
                if (c.val().category !== undefined) {
                    categories.push(c.val().category);
                }
            });  
            let arr = [];
            categories.forEach(function(event, idx) {
                arr.push(String(event));
                if (idx === categories.length - 1) {
                    createCheckbox(arr);
                    //search suggestions here
                }
            });
        });

        
        $('#submit').keypress(function (e) {
            if (e.keyCode == 13) $('#submit').click();
          });

        let selectedCats = ["Music", "School Activities"]
        $('#submit').on('click', function(e) {
             //pull all events and store names and event count
            let eve = [];
            eventsRef.once("value", function(s) {
            if (s.val() == null) {
                console.log("ERROR: one time fetch");
            } else {
                // s.child("Music").forEach(function(events) {
                //     console.log(events.val());
                // }); 
                selectedCats.forEach(function(c) {
                    s.child(c).forEach(function(events) {
                        if (events.key !== "events_count" && events.key !== "id") {
                            console.log(c + ": ");
                            console.log(events.key + " , ");
                            console.log(events.val());
                        }
                    });
                })
            }
        });
        });


        
    }
