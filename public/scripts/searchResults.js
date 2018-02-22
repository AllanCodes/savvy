/**
 * 
 * searchResults.js
 * General set up functions and search
 */

    //global variable to make dynamic autocomplete work with changing categories
    let globalAutoComplete = null;
    let thesaurus = require("thesaurus");

    global.init = function() {
        var today = new Date();	
        scheduler.init('scheduler_here',today, "week");	
    };

    
    /**
     * Toggles all buttons in the category section to their opposite current value
     */
    global.toggleAll = function() {
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
    global.loadUserCategories = function() {
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
                            console.log("1");
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
    }


    global.addCalendarEvent = function() {
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
                    let start_ = start.getDate() + "-" + String(parseInt(start.getMonth())+ 1) + "-" + start.getFullYear() + " " + start.getHours() + ":" + start.getMinutes() + ":" + start.getSeconds();
                    let end = new Date(String(event.val().end_time.replace("T", ' ')));
                    let end_ = end.getDate() + "-" + String(parseInt(end.getMonth())+ 1) + "-" + end.getFullYear() + " " + end.getHours()+ ":" + end.getMinutes() + ":" + end.getSeconds();
                    scheduler.addEvent({
                        start_date: start_,
                        end_date: end_,
                        text: String(event.val().name)
                    });
                    return start;
                }
                categories.forEach(function(c, idx) {
                    p.child(c).forEach(function(event, idx) {
                        if (event.val().name !== undefined && (String(event.val().name.replace(/ /g, '')) === query.replace(/ /g, ''))) {
                                let view_time = addCalendarEvent(event);
                                let start = new Date(String(event.val().start_time.replace("T", ' ')));
                                $('#eventModal').modal('toggle');
                                $('#eventAddedModal').modal('toggle');
                                $('#event_name2').text(String(event.val().name));
                                $('#event_start2').text(start);
                                scheduler.setCurrentView(new Date(view_time));
                        }
                    });
                });
            });
        });
    }
    global.grabQueriedEvent = function() {
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
                                let start = new Date(String(event.val().start_time.replace("T", ' ')));
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
            });
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
            console.log(count + " categories added");
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
