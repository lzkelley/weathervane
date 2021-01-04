"""
"""


PATH_STATION_DATA = "/Users/lzkelley/Programs/weathervane/data/stations"
PATH_DATA_DERIVED = "/Users/lzkelley/Programs/weathervane/data/derived"

FNAME_RAW_HISTORY = "/Users/lzkelley/Programs/weathervane/data/raw/isd-history.csv"
FNAME_STATIONS = "/Users/lzkelley/Programs/weathervane/data/us-stations_filtered.csv"
FNAME_INVENTORY = "/Users/lzkelley/Programs/weathervane/data/raw/isd-inventory.csv"



from . import main     # noqa
from .main import *    # noqa
from . import plot     # noqa
from .plot import *    # noqa
