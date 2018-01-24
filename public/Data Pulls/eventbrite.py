import requests
import json

class eventBrite():
    """
    Grab events from EventBrite
    """

    def __init__(self):
        self.base_url = "https://www.eventbriteapi.com/v3/"
        self.token = "?token=TEBVRVJTULLCGBTZSHSI"
        self.raw_token = "TEBVRVJTULLCGBTZSHSI"

    def categories(self):
        """
        Grab all available categories
        """
        ep = self.base_url + "categories/" + self.token
        r = requests.get(ep, verify=True)
        if (r.status_code == 200):
            cats = []
            l_ = r.json()["categories"]
            for category in l_:
                if (category["name"] != None):
                    d_ = {
                        "category": category["name"],
                        "id": category["id"]
                    }
                    cats.append(d_)
            return cats


    def events(self, city="Irvine", within="100", category=""):
        """
        Grab all events in area, within specified radius
        """
        ep = self.base_url + "events/search/" + self.token + "&location.address=" + city + "&location.within=" + str(within) + "mi" + "&categories=" + str(category)
        r = requests.get(ep, verify=True)
        if (r.status_code == 200):
            events = []
            pages = int(r.json()["pagination"]["page_count"])
            for x in range(pages):
                ep = self.base_url + "events/search/" + self.token + "&location.address=" + city + "&page=" + str(x) + "&location.within=" + str(within) + "mi" + "&categories=" + str(category)
                l_ = r.json()["events"]
                for event in l_:
                    print(event["name"]["text"])
                    d_ = {
                        "name": event["name"]["text"],
                        "start_time": event["start"]["local"],
                        "end_time": event["end"]["local"],
                        "url": event["url"]   ,
                        "alive": event["status"],
                        "description": event["description"]["text"]                 
                    }
                    events.append(d_)

            return events
    

    def writeJson(self, l_, name):
        """
        convert list called {l_} to JSON file called {name}
        """
        with open(name, 'w') as f:
            json.dump(l_, f)

if __name__ == "__main__":
   #pass
   p = eventBrite()
   p.events()
#    p.writeJson(p.categories(), "d.json")
#    p.writeJson(p.events(), "events.json")