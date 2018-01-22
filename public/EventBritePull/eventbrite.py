import requests
from bs4 import BeautifulSoup
import json

class eventBrite():
    """
    Grab events from EventBrite
    """

    def __init__(self):
        self.base_url = "https://www.eventbriteapi.com/v3/"
        self.token = "?token=TEBVRVJTULLCGBTZSHSI"

    def categories(self):
        ep = self.base_url + "/categories/" + self.token
        r = requests.get(ep, verify=True)
        print(BeautifulSoup(r.json()))
p = eventBrite()
p.categories()
