/**
 * 
 * searchResults.js
 * General set up functions and search
 */

    //global variable to make dynamic autocomplete work with changing categories
    let globalAutoComplete = null;
    let thesaurus = require("thesaurus");

    global.init = function() {
        scheduler.config.lightbox_recurring = "instance";
        scheduler.config.details_on_create=true;
        scheduler.config.details_on_dblclick=true;
        scheduler.config.include_end_by = true;
        scheduler.config.repeat_precise = true;        
        var today = new Date();	
        scheduler.init('scheduler_here',today, "week");	
        loadUserEvents();
        handleEventDeleted();
        scheduler.setCurrentView(today);
    };


    function loadUserEvents() {
        scheduler.attachEvent("onSchedulerReady", function(){
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    firebase.database().ref('users/' + user.uid).once('value').then(function (snapshot) {
                        let userProfileRef = firebase.database().ref('users/' + user.uid + "/events/");
                        userProfileRef.once("value", function(events) {
                            events.forEach(function(a) {
                                let e_ = a.val();
                                let add = {
                                    start_date: e_.start_date,
                                    end_date: e_.end_date,
                                    text: e_.text,
                                }
                                let id = scheduler.addEvent(add);
                                let ref = firebase.database().ref('users/' + user.uid + "/events/" + e_.text + "/id");
                                ref.set(id);

                            });
                        });
                    });
                }
            });
        });
    }

    function handleEventDeleted() {
        scheduler.attachEvent("onEventDeleted", function(id){
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    firebase.database().ref('users/' + user.uid).once('value').then(function (snapshot) {
                        let userProfileRef = firebase.database().ref('users/' + user.uid + "/events/");
                        userProfileRef.once("value", function(e) {
                            e.forEach(function(w) {
                                if (Number(w.val().id) === Number(id)) {
                                    userProfileRef.child(String(w.val().text)).remove();
                                }
                            })
                        })
                    });
                }
            });
        });
    }
    
    /**
     * Toggles all buttons in the category section to their opposite current value
     */
    global.toggleAll = function() {
        let catref = firebase.database().ref("/categories");
        let count = 0;
        catref.once("value", function(s) {
            count = s.val().category_count;
            for ( let i = 0; i < count+1; i++ ) {
                $("input[name='chbox" + i + "']").bootstrapSwitch('toggleState');
            }

        });
    }

    /**
     * Grab current state of all categories in "show categories" and load event data based on selected categories
     */
    global.loadUserCategories = function() {
        if (globalAutoComplete !== null)
            globalAutoComplete.destroy();
        let catref = firebase.database().ref("/categories");
        let eventref = firebase.database().ref("/events");
        let courseref = firebase.database().ref("/courses/UCI Courses/Terms/Winter 2018/Department/Computer Science");
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
            let options = ["UCI Courses", "Daytime Events", "Nighttime Events"];
            for ( let i =count; i < count+3; i++ ) {
                if($("input[name='chbox" + String(i) + "']").bootstrapSwitch('state')) {
                    userCats.push(options[i-count]);
                }
            }
            //get events according to user categories
            eventref.once("value", function(s) {
                //loop user events
                userCats.forEach(function(c, idx) {
                    s.child(c).forEach(function(event, idx) {
                        if (event.val().name !== undefined) {
                            let test = true;
                            let date = new Date(event.val().start_time.replace('T', ' '));
                            if (userCats.indexOf("Daytime Events") !== -1) {
                                if (date.getHours() < 17 && date.getHours() > 6 && test) {
                                    filteredEvents.push(String(event.val().name));
                                    test = false;
                                }
                            }
                            if (userCats.indexOf("Nighttime Events") !== -1 && test) {
                                if (date.getHours() >= 17 || date.getHours() <= 6) {
                                    filteredEvents.push(String(event.val().name));
                                    test = false;
                                }
                            } 
                            // if (test)
                            //     filteredEvents.push(String(event.val().name));
                        }
                    });
                });
            //courses
            courseref.once("value", function(a) {
                a.forEach(function(course) {
                    if (userCats.indexOf("UCI Courses") !== -1 && String(course.key) !== "count")
                        filteredEvents.push(String(course.key + ": " + course.val().name));
                });
            });
            console.log(filteredEvents);
            globalAutoComplete = new autoComplete({
                selector: '#search',
                minChars: 1,
                source: function(term, suggest){
                    term = term.toLowerCase();
                    var choices = filteredEvents;
                    var suggestions = [];
                    //https://tartarus.org/martin/PorterStemmer/
                    var stemmer = (function(){
                        var step2list = {
                                "ational" : "ate",
                                "tional" : "tion",
                                "enci" : "ence",
                                "anci" : "ance",
                                "izer" : "ize",
                                "bli" : "ble",
                                "alli" : "al",
                                "entli" : "ent",
                                "eli" : "e",
                                "ousli" : "ous",
                                "ization" : "ize",
                                "ation" : "ate",
                                "ator" : "ate",
                                "alism" : "al",
                                "iveness" : "ive",
                                "fulness" : "ful",
                                "ousness" : "ous",
                                "aliti" : "al",
                                "iviti" : "ive",
                                "biliti" : "ble",
                                "logi" : "log"
                            },
                            step3list = {
                                "icate" : "ic",
                                "ative" : "",
                                "alize" : "al",
                                "iciti" : "ic",
                                "ical" : "ic",
                                "ful" : "",
                                "ness" : ""
                            },
                            c = "[^aeiou]",          // consonant
                            v = "[aeiouy]",          // vowel
                            C = c + "[^aeiouy]*",    // consonant sequence
                            V = v + "[aeiou]*",      // vowel sequence
                            mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
                            meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
                            mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
                            s_v = "^(" + C + ")?" + v;                   // vowel in stem
                        return function (w) {
                            var 	stem,
                                suffix,
                                firstch,
                                re,
                                re2,
                                re3,
                                re4,
                                origword = w;
                            if (w.length < 3) { return w; }
                            firstch = w.substr(0,1);
                            if (firstch == "y") {
                                w = firstch.toUpperCase() + w.substr(1);
                            }
                            // Step 1a
                            re = /^(.+?)(ss|i)es$/;
                            re2 = /^(.+?)([^s])s$/;
                            if (re.test(w)) { w = w.replace(re,"$1$2"); }
                            else if (re2.test(w)) {	w = w.replace(re2,"$1$2"); }
                            // Step 1b
                            re = /^(.+?)eed$/;
                            re2 = /^(.+?)(ed|ing)$/;
                            if (re.test(w)) {
                                var fp = re.exec(w);
                                re = new RegExp(mgr0);
                                if (re.test(fp[1])) {
                                    re = /.$/;
                                    w = w.replace(re,"");
                                }
                            } else if (re2.test(w)) {
                                var fp = re2.exec(w);
                                stem = fp[1];
                                re2 = new RegExp(s_v);
                                if (re2.test(stem)) {
                                    w = stem;
                                    re2 = /(at|bl|iz)$/;
                                    re3 = new RegExp("([^aeiouylsz])\\1$");
                                    re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
                                    if (re2.test(w)) {	w = w + "e"; }
                                    else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
                                    else if (re4.test(w)) { w = w + "e"; }
                                }
                            }
                            // Step 1c
                            re = /^(.+?)y$/;
                            if (re.test(w)) {
                                var fp = re.exec(w);
                                stem = fp[1];
                                re = new RegExp(s_v);
                                if (re.test(stem)) { w = stem + "i"; }
                            }
                            // Step 2
                            re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
                            if (re.test(w)) {
                                var fp = re.exec(w);
                                stem = fp[1];
                                suffix = fp[2];
                                re = new RegExp(mgr0);
                                if (re.test(stem)) {
                                    w = stem + step2list[suffix];
                                }
                            }
                            // Step 3
                            re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
                            if (re.test(w)) {
                                var fp = re.exec(w);
                                stem = fp[1];
                                suffix = fp[2];
                                re = new RegExp(mgr0);
                                if (re.test(stem)) {
                                    w = stem + step3list[suffix];
                                }
                            }
                            // Step 4
                            re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
                            re2 = /^(.+?)(s|t)(ion)$/;
                            if (re.test(w)) {
                                var fp = re.exec(w);
                                stem = fp[1];
                                re = new RegExp(mgr1);
                                if (re.test(stem)) {
                                    w = stem;
                                }
                            } else if (re2.test(w)) {
                                var fp = re2.exec(w);
                                stem = fp[1] + fp[2];
                                re2 = new RegExp(mgr1);
                                if (re2.test(stem)) {
                                    w = stem;
                                }
                            }
                            // Step 5
                            re = /^(.+?)e$/;
                            if (re.test(w)) {
                                var fp = re.exec(w);
                                stem = fp[1];
                                re = new RegExp(mgr1);
                                re2 = new RegExp(meq1);
                                re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
                                if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
                                    w = stem;
                                }
                            }
                            re = /ll$/;
                            re2 = new RegExp(mgr1);
                            if (re.test(w) && re2.test(w)) {
                                re = /.$/;
                                w = w.replace(re,"");
                            }
                            // and turn initial Y back to y
                            if (firstch == "y") {
                                w = firstch.toLowerCase() + w.substr(1);
                            }
                            return w;
                        }
                    })();                    
                    let words = term.split(/\s|\/|\\|\?/);
                    let synonyms = [];
                    words.forEach(function(entry) {
                        let w = thesaurus.find(entry);
                        synonyms = synonyms.concat(w);
                    });
                    for (i=0;i<choices.length;i++) {
                        if (~choices[i].toLowerCase().indexOf(stemmer(term))) {
                            suggestions.push(choices[i]);
                        } else {
                            let len = synonyms.length;
                            for ( let j = 0; j < len && j < 50; j++ ) {
                                if (~choices[i].toLowerCase().indexOf(stemmer(synonyms[j]))) {
                                    suggestions.push(choices[i]);
                                    break;
                                }
                            }
                        }
                    }
                    suggest(suggestions);
                    }
                }); 
            });
        });
        $('#categoriesModal').modal('hide');    
        $('#preferencesModal').modal('hide');    
    }


    global.addCalendarEvent = function() {
        let eventRef = firebase.database().ref("/events");
        let catRef = firebase.database().ref("/categories");
        let courseRef = firebase.database().ref("/courses/UCI Courses/Terms/Winter 2018/Department/Computer Science");
        let categories = [];
        let query = $('#search').val();
        let eventFound = false;
        catRef.once("value", function(s) {
            s.forEach(function(cat) {
                if (cat.val().category !== undefined)
                    categories.push(cat.val().category);
            });
            eventRef.once("value", function(p) {
                function addCalendarEvent(event, type) {
                    let start = new Date(String(event.val().start_time.replace("T", ' ')));
                    let start_ = start.getDate() + "-" + String(parseInt(start.getMonth())+ 1) + "-" + start.getFullYear() + " " + start.getHours() + ":" + start.getMinutes() + ":" + start.getSeconds();
                    let end = new Date(String(event.val().end_time.replace("T", ' ')));
                    let end_ = end.getDate() + "-" + String(parseInt(end.getMonth())+ 1) + "-" + end.getFullYear() + " " + end.getHours()+ ":" + end.getMinutes() + ":" + end.getSeconds();
                    if (type === "event") {
                        let eventID = scheduler.addEvent({
                            start_date: start_,
                            end_date: end_,
                            text: String(event.val().name)
                        });
                     } //else if (type === "course") {
                    //     let days = {"MWF": "1,3,5", "MW": "1,3", "M": "1", "W": "3", "F": "5", "WF": "3,5"};
                    //     let rec = "week_1___";
                    //     for (k in days) {
                    //         if (event.meeting_time === k) {
                    //             rec += days[k];
                    //         } 
                    //     }
                        // let eventID = scheduler.addEvent({
                        //     start_date: "2018-03-03 10:00:00",
                        //     end_date: "2018-03-10 11:00:00",
                        //     text: "words",
                        //     details: "",
                        //     rec_type: "week_1___1,2",
                        // });
                    // }

                    firebase.auth().onAuthStateChanged(function(user) {
                        if (user) {
                            firebase.database().ref('users/' + user.uid).once('value').then(function (snapshot) {
                                let e_ = {};
                                e_[String(event.val().name)] = {
                                    start_date: start_,
                                    end_date: end_,
                                    text: String(event.val().name),
                                    id: eventID
                                };
                                let userProfileRef = firebase.database().ref('users/' + user.uid + "/events");
                                userProfileRef.update(e_);
                            });
                        }
                    });
                    return start;
                }
                categories.forEach(function(c, idx) {
                    p.child(c).forEach(function(event, idx) {
                        if (event.val().name !== undefined && (String(event.val().name.replace(/ /g, '')) === query.replace(/ /g, ''))) {
                                eventFound = true;
                                let view_time = addCalendarEvent(event, "event");
                                let start = new Date(String(event.val().start_time.replace("T", ' ')));
                                $('#eventModal').modal('toggle');
                                $('#eventAddedModal').modal('toggle');
                                $('#event_name2').text(String(event.val().name));
                                $('#event_start2').text(start);
                                scheduler.setCurrentView(new Date(view_time));
                        }
                    });
                });
                if (!eventFound) {
                    courseRef.once("value", function(m) {
                        m.forEach(function(course) {
                            if (query === (String(course.key + ": " + course.val().name))) {
                                eventFound = true;
                                let view_time = addCalendarEvent(course, "course");
                                let start = new Date(String(course.val().start_time.replace("T", ' ')));
                                $('#eventModal').modal('toggle');
                                $('#eventAddedModal').modal('toggle');
                                $('#event_name2').text(String(course.val().name));
                                $('#event_start2').text(start);
                                scheduler.setCurrentView(new Date(view_time));
                            }
                        });
                    });
                }
                eventFound = false;
            });
        });
    }
    global.grabQueriedEvent = function() {
            let eventRef = firebase.database().ref("/events");
            let catRef = firebase.database().ref("/categories");
            let courseRef = firebase.database().ref("/courses/UCI Courses/Terms/Winter 2018/Department/Computer Science");
            let categories = [];
            let eventFound = false;
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
                                let start = new Date(String(event.val().start_time.replace("T", ' ')));
                                eventFound = true;
                                $('#event_name').text(String(event.val().name));
                                $('#event_url').text(String(event.val().url));
                                $('#event_url').attr('href', String(event.val().url));
                                $('#event_start').text(start);
                                $('#event_description').text(String(event.val().description));
                                $('#eventModal').modal('toggle');
                            }
                        });
                    });
                });
                if (!eventFound) {
                    courseRef.once("value", function(a) {
                        a.forEach(function(course) {
                            if (query === (String(course.key + ": " + course.val().name))) {
                                eventFound = true;
                                let start = new Date(String(course.val().start_time.replace("T", ' ')));
                                let end = new Date(String(course.val().end_time.replace("T", ' ')));
                                let time_range = start.getHours() + ":" + (start.getMinutes()<10?'0':'') + start.getMinutes() + " - " + end.getHours() + ":" + (end.getMinutes()<10?'0':'') + end.getMinutes();
                                $('#event_name').text(String(course.val().name));
                                $('#event_url').text("https://www.reg.uci.edu/perl/WebSoc");
                                $('#event_url').attr('href', "https://www.reg.uci.edu/perl/WebSoc");
                                $('#event_start').text(course.val().meeting_time + ", " + time_range);
                                $('#event_description').text(String(course.val().name));
                                $('#eventModal').modal('toggle');
                            }
                        });
                    });
                }
            });
            
            eventFound = false;
        }   

    global.loadPreferences = function() {

    }
    /**
     * create category check boxes in "show categories"
     */
    global.createCheckBox = function() {
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
                // $('#mbody').append("<h2 class=\"h4\">" + "UCI Courses" + "</h2>");
                // $('#mbody').append("<input type=\"checkbox\" name=\"chbox" + String(count) + "\" checked=\"true\">");
                // $("[name='chbox" + String(count) + "']").bootstrapSwitch();
                // count++;
                $('#prefmodalbody').append("<h2 class=\"h4\">" + "UCI Courses" + "</h2>");
                $('#prefmodalbody').append("<input type=\"checkbox\" name=\"chbox" + String(count) + "\" checked=\"true\">");
                $("[name='chbox" + String(count) + "']").bootstrapSwitch();
                $('#prefmodalbody').append("<h2 class=\"h4\">" + "Daytime Events" + "</h2>");
                $('#prefmodalbody').append("<input type=\"checkbox\" name=\"chbox" + String(count+1) + "\" checked=\"true\">");
                $("[name='chbox" + String(count+1) + "']").bootstrapSwitch();
                $('#prefmodalbody').append("<h2 class=\"h4\">" + "Nighttime Events" + "</h2>");
                $('#prefmodalbody').append("<input type=\"checkbox\" name=\"chbox" + String(count+2) + "\" checked=\"true\">");
                $("[name='chbox" + String(count+2) + "']").bootstrapSwitch();
        });
    }

  

    global.loadData = function() {
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
