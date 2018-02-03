/**
 * 
 * searchResults.js
 * General set up functions and search
 */

    //global variable to make dynamic autocomplete work with changing categories
    let globalAutoComplete = null;
      
    /**
     * Toggles all buttons in the category section to their opposite current value
     */
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

    /**
     * Grab current state of all categories in "show categories" and load event data based on selected categories
     */
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

   
    function grabQueriedEvent() {
            let eventRef = firebase.database().ref("/events");
            let catRef = firebase.database().ref("/categories");
            let categories = [];
            let query = $('#search').val();
            catRef.once("value", function(s) {
                s.forEach(function(cat) {
                    if (cat.val().category !== undefined)
                        categories.push(cat.val().category);
                });
                eventRef.once("value", function(p) {
                    categories.forEach(function(c, idx) {
                        p.child(c).forEach(function(event, idx) {
                            if (event.val().name !== undefined && (String(event.val().name.replace(/ /g, '')) === query.replace(/ /g, ''))) {
                                $('#event_name').text(String(event.val().name));
                                $('#event_url').text(String(event.val().url));
                                $('#event_url').attr('href', String(event.val().url));
                                $('#event_start').text(String(event.val().start_time));
                                $('#event_description').text(String(event.val().description));
                                $('#eventModal').modal('toggle');
                            }
                        });
                    });
                });
            });
        }   

    /**
     * create category check boxes in "show categories"
     */
    function createCheckBox() {
        let ref = firebase.database().ref("/categories/");
        let count = 0;
        let categories = [];
        ref.once("value", function(s) {
            count = s.val().category_count;
            s.forEach(function(category) {
                if (category.val().category !== undefined) {
                    categories.push(String(category.val().category));
                }
            });
            categories.forEach(function(cats, idx) {
                $('#mbody').append("<h2 class=\"h4\">" + cats + "</h2>");
                $('#mbody').append("<input type=\"checkbox\" name=\"chbox" + String(idx) + "\" checked=\"true\">");
                $("[name='chbox" + String(idx) + "']").bootstrapSwitch();
            });
            console.log(count + " categories added");
        });
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
        
    }
