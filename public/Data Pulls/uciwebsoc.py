import requests
from bs4 import BeautifulSoup


class UCIWebSoc():
    """
    Pull data from the Official UCI Schedule of Classes
    """

    def __init__(self):
        self.base_url = "https://www.reg.uci.edu/perl/WebSoc/?"

    def classes(self, dept):
        ep = self.base_url + "YearTerm=2018-03&Dept=" + dept
        r = requests.get(ep,verify=True)
        soup = BeautifulSoup(r.content, "html.parser")
        

p = UCIWebSoc()
p.classes("REL STD")


