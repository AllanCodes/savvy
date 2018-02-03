/**
 * 
 * searchResults.js
 * General set up functions and search
 */

    //global variable to make dynamic autocomplete work with changing categories
    let globalAutoComplete = null;


	function init() {
		var today = new Date();	
        scheduler.init('scheduler_here',today, "week");		
    }

    function pushEvent() {
        // scheduler.addEvent({
        //     start_date: "03-02-2018 07:00:00",
        //     end_date:   "03-02-2018 12:00:00",
        //     text:   "Meeting",
        //     holder: "John", 
        //     room:   "5"     
        // });	

    }
    /**
     * Toggles all buttons in the category section to their opposite current value
     */
    function toggleAll() {
        pushEvent();
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
                    function addCalendarEvent(event) {
                        let start = new Date(String(event.val().start_time.replace("T", ' ')));
                        let end = new Date(String(event.val().end_time.replace("T", ' ')));
                        scheduler.addEvent({
                            start_date: start.getDate() + "-" + String(parseInt(start.getMonth())+ 1) + "-" + start.getFullYear() + " " + start.getHours() + ":" + start.getMinutes() + ":" + start.getSeconds(),
                            end_date: end.getDate() + "-" + String(parseInt(end.getMonth())+ 1) + "-" + end.getFullYear() + " " + end.getHours()+ ":" + end.getMinutes() + ":" + end.getSeconds(),
                            text: String(event.val().name)
                            // start_date: "2-5-2018 8:0:0",
                            // end_date: "2-5-2018 9:0:0",
                            // text: "market"                            
                        });
                    }
                    categories.forEach(function(c, idx) {
                        p.child(c).forEach(function(event, idx) {
                            if (event.val().name !== undefined && (String(event.val().name.replace(/ /g, '')) === query.replace(/ /g, ''))) {
                                addCalendarEvent(event);
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
