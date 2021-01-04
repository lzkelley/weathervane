"""
"""

import os
import shutil
import datetime
import logging

import requests
import numpy as np
import scipy as sp
import pandas as pd

import fuzzywuzzy as fuzz
import fuzzywuzzy.process  # noqa

import zcode.inout as zio
import zcode.math as zmath

from weathervane import FNAME_STATIONS, PATH_STATION_DATA

URL_BASE = "https://www.ncei.noaa.gov/data/global-hourly/access/{year}/{name}.csv"
FNAME_YEAR_BASE = "{name}_{year}.csv"

'''
LOAD_COLS = [
    'DATE', 'WND', 'CIG', 'VIS', 'TMP', 'DEW', 'SLP',
    'AA1', 'AA2', 'AA3', 'AJ1', 'AL1', 'AY1',
    # 'GA1', 'GA2', 'GA3', 'GA4', 'GD1', 'GD2', 'GD3', 'GD4', 'GF1'    # sky cover
    'MW1', 'MW2', 'MW3', 'MW4',   # atmospheric condition descrption
    'OC1', 'SA1', 'UG1', 'GR1',
    'AT1', 'AT2', 'AT3', 'AT4',   # automated atmospheric condition description
    'GJ1', 'GK1', 'IA1',
    'AW1', 'AW2', 'AW3', 'AW4',   # other? automated atmos cond desc
    'RH1', 'RH2', 'RH3',
]
'''
LOAD_COLS = None

RAD_EARTH = 6378.1    # km


class States:

    FNAME_STATE_ABBREVS = "/Users/lzkelley/Programs/weathervane/data/raw/us-state-abbrevs.csv"

    def __init__(self):
        df = pd.read_csv(self.FNAME_STATE_ABBREVS)
        self._states = df['State'].str.lower().to_list()
        self._abbrevs = df['Abbreviation'].str.lower().to_list()

    def name(self, abb, error=False):
        # Check if given `abb` is already a full name
        if abb.lower() in self._states:
            return abb

        # Try to find abbreviation in list of abbreviations
        try:
            idx = self._abbrevs.index(abb.lower())
        except ValueError:
            err = f"State abbreviation '{abb}' is not in abbreviations list!"
            logging.error(err)
            if error:
                raise ValueError(err)

            return None

        state = self._states[idx].title()
        return state

    def abbrev(self, name, error=False):
        # Check if given `name` is already an abbreviation
        if name.lower() in self._abbrevs:
            return name

        # Try to find state-name in list of states
        try:
            idx = self._states.index(name.lower())
        except ValueError:
            err = f"State name '{abb}' is not in states list!"
            logging.error(err)
            if error:
                raise ValueError(err)

            return None

        abbrev = self._abbrevs[idx].upper()
        return abbrev


class Cities:

    FNAME_CITIES = "/Users/lzkelley/Programs/weathervane/data/raw/us-cities.json"

    def __init__(self):
        self._all_states = States()
        self._data = pd.read_json(self.FNAME_CITIES)
        self._cities = self._data['city'].str.lower()
        self._states_names = self._data['state'].str.lower()
        self._states_abbrevs = [self._all_states.abbrev(ss).lower() for ss in self._states_names]
        self._states_abbrevs = np.array(self._states_abbrevs)
        self._size = self._data.shape[0]
        return

    def __iter__(self):
        for city, state in zip(self._cities, self._states_abbrevs):
            yield city, state

    def _index(self, city):
        # Process argument
        _city = city
        city = [cc.strip() for cc in _city.lower().split(',')]
        if len(city) == 1:
            state = None
        elif len(city) == 2:
            state = city[1]
            state = self._all_states.abbrev(state).lower()
        else:
            err = f"City '{_city}' split into too many components!"
            logging.error(err)
            raise ValueError(err)

        # Find matches
        city = city[0]
        key = f"'{_city}' ('{city}', '{state}')"
        logging.info(key)
        match_city = (self._cities == city)
        match_state = True if (state is None) else (self._states_abbrevs == state)
        idx = (match_city & match_state)
        # logging.debug(
        #     f"match_city={np.count_nonzero(match_city)}",
        #     f"match_state={np.count_nonzero(match_state)}"
        # )

        # Make sure matches are unique
        err = None
        if np.count_nonzero(idx) < 1:

            err = f"No matches for {key}!"
        elif np.count_nonzero(idx) > 1:
            err = f"Multiple matches for {key}, specify state also!"

        if err is not None:
            logging.error(err)
            raise ValueError(err)

        # Return
        idx = np.argmax(idx)
        return idx

    def city_state(self, name):
        idx = self._index(name)
        city = self._data['city'].iloc[idx]
        state = self._data['state'].iloc[idx]
        return city, state

    def lat_lon(self, name):
        idx = self._index(name)
        lat = self._data['latitude'].iloc[idx]
        lon = self._data['longitude'].iloc[idx]
        return lat, lon

    @property
    def size(self):
        return self._size


class Stations:

    FNAME_STATIONS = "/Users/lzkelley/Programs/weathervane/data/us-stations_filtered.csv"

    def __init__(self):
        self._data = pd.read_csv(FNAME_STATIONS)
        self._cities = None
        self._names = None
        self._lats = None
        self._lons = None
        return

    def by_name(self, name):
        idx = self.names.index(name)
        return self.iloc[idx]

    def fuzz(self, name, print_top=False, warn_below=85):
        names_list = self.names
        scorer = fuzz.fuzz.partial_ratio
        # scorer = fuzz.fuzz.WRatio
        # scorer = fuzz.fuzz.ratio
        # print(f"{scorer=}")

        matches = fuzz.process.extract(name, names_list, scorer=scorer, limit=5)
        if print_top:
            print(matches)
        match_name, match_score = matches[0]
        logging.debug("{match_name=}, {match_score=} ({scorer=})")
        if match_score < warn_below:
            logging.warning(f"Warning fuzzy-match score ({match_score}) is low!")
            logging.warning(f"Other matches: {matches}")

        return self.by_name(match_name)

    def __getattribute__(self, name):
        try:
            # return self.__getattr__(name)
            return object.__getattribute__(self, name)
        except AttributeError as err:
            try:
                return self._data.__getattr__(name)
            except AttributeError:
                logging.error("Failed to `__getattr__` on both self and self._data!")
                raise err

    def __getitem__(self, name):
        errors = (AttributeError, TypeError, KeyError, IndexError)
        try:
            return super().__getitem__(name)
        except errors as err:
            try:
                return self._data.__getitem__(name)
            except errors:
                logging.error("Failed to `__getitem__` on both self and self._data!")
                raise err

    @property
    def size(self):
        return self.shape[0]

    @property
    def cities(self):
        if self._cities is None:
            self._cities = Cities()
        return self._cities

    @property
    def names(self):
        if self._names is None:
            self._names = self['STATION NAME'].to_list()
        return self._names

    @property
    def lats(self):
        if self._lats is None:
            self._lats = self['LAT'].to_numpy()
        return self._lats

    @property
    def lons(self):
        if self._lons is None:
            self._lons = self['LON'].to_numpy()
        return self._lons

    def nearest(self, name, haversine=True, warn_above=20.0):
        lat, lon = self.cities.lat_lon(name)
        logging.debug(f"{name} : {lat}, {lon}")
        if haversine:
            dist = lat_lon_dist([lat, lon], np.array([self.lats, self.lons]).T)
        else:
            dist = np.linalg.norm(np.radians([lat - self.lats, lon - self.lons]), axis=0)
            dist = RAD_EARTH * np.sin(dist/2.0)

        # logging.debug(f"distances : {zmath.stats_str(dist)} km")
        idx = np.argmin(dist)
        min_dist = dist[idx]
        logging.info(f"Minimum distance: {min_dist:.2e} km")
        if (warn_above is not None) and (min_dist > warn_above):
            logging.warning(f"WARNING: nearest distance {min_dist:.1f} km is large!")

        stat = self.iloc[idx]
        stat._nearest_name = self.cities.city_state(name)

        return stat, idx, min_dist


def station_id(stat):
    stid = str(stat.USAF.item()) + str(stat.WBAN.item())
    return stid


def load_stations_list():
    return pd.read_csv(FNAME_STATIONS)


def _merge_station_years(name, files, fname, allow_num_bad=3):
    beg = datetime.datetime.now()

    def _concat_files(files):
        pd_iter = (pd.read_csv(fil, dtype=str) for fil in files)
        df = pd.concat(pd_iter, ignore_index=True)
        return df

    # Try to concatenate files
    try:
        df = _concat_files(files)
    # On failure, try to identify bad files and skip them
    except Exception as err:
        logging.error(f"Concatenation failed for '{name}'!")
        sel = np.ones_like(files, dtype=bool)
        bads = 0
        for ii, ff in enumerate(files):
            try:
                df = pd.read_csv(ff, dtype=str)
            except:
                logging.error(f"Failed on {name} : {ff}!")
                sel[ii] = False
                bads += 1

        # If no bad files found.... don't know what's happening
        if bads == 0:
            logging.error(f"All individual files for '{name}' succeeded!")
            raise

        # Allow allow so many erroneous files
        if (allow_num_bad is not None) and (bads > allow_num_bad):
            err = f"Found {bads} bad files, more than allowed!"
            logging.error(err)
            raise RuntimeError(err)

        # Try to concatenate the good (seeming) files
        try:
            files = [files[ss] for ss in sel if ss]
            df = _concat_files(files)
            logging.warning(f"Success after skipping {bads}/{sel.size} files")
        except:
            err = f"Concatenation on files subset still failed!"
            logging.error(err)
            raise

    now = datetime.datetime.now()
    logging.info(f"Concat'd into new dataframe ({df.size}) after {now-beg}")

    df.to_csv(fname, index_label='index')

    logging.info(f"Saved to file ({fname}), size {zio.get_file_size(fname)}, after {datetime.datetime.now()-now}")

    return


def smooth(data, *args, **kwargs):
    smoothed = sp.ndimage.filters.gaussian_filter(data, *args, **kwargs)
    return smoothed


def download_station(stat, **kwargs):
    name = station_id(stat)
    beg = int(str(stat.BEGIN.item())[:4])
    end = int(str(stat.END.item())[:4])

    fname = get_station_fname(stat)
    fname_exists = os.path.exists(fname)
    logging.debug(f"{name=}, {fname=}")
    logging.info(f"{name=}, {beg=}, {end=} :: file exists: {fname_exists}")
    if not fname_exists:
        temp_path = os.path.join(PATH_STATION_DATA, f"_{name}")

        logging.debug(f"Path for station '{name}' : '{temp_path}'")
        files = _download_station_data(name, beg, end, temp_path, **kwargs)
        logging.info(f"{len(files)} years for station {name}")

        if len(files) == 0:
            logging.error(f"Failed to download any files for {name}, {stat['STATION NAME']}!")
            return

        _merge_station_years(name, files, fname)

        if os.path.isfile(fname):
            logging.debug(f"Removing temporary path '{temp_path}'")
            shutil.rmtree(temp_path)
        else:
            err = f"Failed to create output file '{fname}'!"
            logging.error(err)
            raise RuntimeError(err)

    return


def _download_station_data(name, beg, end, temp_path, warn_404=True):
    """
    """
    path_exists = os.path.exists(temp_path)
    logging.info(f"{name} : {temp_path=}, exists={path_exists}")
    if not path_exists:
        os.mkdir(temp_path)

    filenames = []
    num_new = 0
    num_tot = 0
    num_bad = 0
    for year in zio.tqdm(range(beg, end), total=(end-beg), desc='files', leave=False):
        fname = os.path.join(temp_path, FNAME_YEAR_BASE.format(name=name, year=year))
        fname_exists = os.path.exists(fname)
        logging.debug(f"{name}\t{fname} :: exists: {fname_exists}")
        if not fname_exists:
            url = URL_BASE.format(name=name, year=year)
            logging.debug(f"\t\t{url}")
            resp = requests.get(url, stream=True)
            logging.debug(f"\t\tRetrieved ok:{resp.ok}, status_code:{resp.status_code}")
            if not resp.ok:
                lvl = logging.WARNING if warn_404 else logging.INFO
                err = f"{resp.status_code=} for {name} {year} : '{fname}'"
                logging.log(lvl, err)
                num_bad += 1
                continue

            with open(fname, 'wb') as fil:
                for data in resp:
                    fil.write(data)

            logging.debug(f"\t\t{zio.get_file_size(fname)}")
            num_new += 1

        filenames.append(fname)
        num_tot += 1

    logging.info(f"{name} : {num_tot=}, {num_new=}, {num_bad=}")
    return filenames


def get_station(usaf=None, wban=None, call=None):
    if usaf is not None:
        key = 'USAF'
        val = usaf
    elif wban is not None:
        key = 'WBAN'
        val = wban
    elif call is not None:
        key = 'ICAO'
        val = call
    else:
        raise ValueError

    stations = load_stations_list()

    idx = (stations[key] == val)
    if np.count_nonzero(idx) != 1:
        raise ValueError(f"Did not find match for '{val}' under '{key}'!")

    stat = stations.loc[idx]
    return stat


def get_station_fname(stat):
    name = str(stat.USAF.item()) + str(stat.WBAN.item())
    fname = os.path.join(PATH_STATION_DATA, f"{name}.csv")
    return fname


def load_station_data(stat):
    fname = get_station_fname(stat)
    data = pd.read_csv(fname, dtype=str, usecols=LOAD_COLS, parse_dates=['DATE'])
    data['DATE'] = data['DATE'].dt.tz_localize('UTC')
    return data


def lat_lon_dist(loc1, loc2, to_radians=True, earth_radius=RAD_EARTH):
    """Calcualte distance between lat-lon pairs using the Haversine approximation.

    Arguments
    ---------
    loc1, loc2 : (2,) or (N,2) of latitude-longitude pairs

    Returns
    -------
    dist : () scalar or (N,) ndarray of scalar
        Distance between locations in units of given `earth_radius` (default: kilometers)

    From: https://stackoverflow.com/a/40453439
    """
    squeeze = (np.ndim(loc1) == 1) and (np.ndim(loc2) == 1)
    loc1 = np.atleast_2d(loc1).T
    loc2 = np.atleast_2d(loc2).T

    # Check the shape
    bad_dim = (np.ndim(loc1) != 2) or (np.ndim(loc2) != 2)
    bad_shp = (loc1.shape[0] != 2) or (loc2.shape[0] != 2)
    if bad_dim or bad_shp:
        raise ValueError(f"Both inputs must be shaped as (2,) or (N,2)!")

    if to_radians:
        # lat1, lon1, lat2, lon2 = np.radians([lat1, lon1, lat2, lon2])
        # (2,) or (X,2) ===> (2,X)
        loc1 = np.radians(loc1)
        loc2 = np.radians(loc2)

    dlat = np.subtract(loc1[0, :], loc2[0, :])
    dlon = np.subtract(loc1[1, :], loc2[1, :])
    aa = np.sin(dlat/2.0)**2 + np.cos(loc1[0, :]) * np.cos(loc2[0, :]) * np.sin(dlon/2.0)**2
    dist = earth_radius * 2 * np.arcsin(np.sqrt(aa))

    if squeeze:
        dist = dist.squeeze()

    return dist


def _conv_decimal(data, scale):
    # Convert to 1D array of integers
    data = _conv_char_to_int(data)
    # data = data.view(np.uint8) - ord('0')
    # aa = np.array([1000, 100, 10, 1])
    # aa = 10**np.arange(data.shape[1])[::-1]
    # data = np.sum(data * aa[np.newaxis, :], axis=1)

    data = data / scale
    return data


def _conv_char_to_int(data):
    # return data.view(np.uint8) - ord('0')
    # Convert each character to an integer
    data = data.view(np.uint8) - ord('0')
    # If there are multiple columns, convert from each place value to single integer
    if np.ndim(data) > 1:
        aa = 10**np.arange(data.shape[1])[::-1]
        data = np.sum(data * aa[np.newaxis, :], axis=1)

    return data


def _conv_char2d(data):
    # Convert from object array to 1D np.array of 7-char strings
    nchar = len(data.iloc[0])
    data = data.to_numpy().astype(f'S{nchar:d}')
    # Convert to 2D array of characters
    data = data.view(dtype='S1').reshape(data.size, nchar)
    return data


def temp_conv(df):
    """
    """
    temp = df['TMP']

    # ---- Extract encoded values ----

    # Convert from object array to 1D np.array of 7-char strings
    temp = temp.to_numpy().astype('S7')
    # Convert to 2D array of characters
    temp = temp.view(dtype='S1').reshape(temp.size, len(temp[0]))
    # Get quality code
    qq = temp[:, 6]   # .view(np.uint8) - ord('0')
    # Get sign
    ss = temp[:, 0]
    # convert to integers, combine, convert to float temperature
    #    temp = temp[:, 1:5].view(np.uint8) - ord('0')
    #    aa = np.array([1000, 100, 10, 1])
    #    temp = np.sum(temp * aa[np.newaxis, :], axis=1) / 10.0
    temp = _conv_decimal(temp[:, 1:5], 10.0)
    # Add back sign
    temp = temp * (1 + -2 * (np.array(ss) == b'-'))

    # Convert to F
    temp = sp.constants.convert_temperature(temp, 'Celsius', 'Fahrenheit')

    # ---- Determine valid entries ----
    valid = (qq == b'1') | (qq == b'5')  # | (qq != )

    return temp, valid


def precip_conv(df):
    """

    Returns
    -------
    rate : (N,) inches/hr
    valid : (N,) bool

    """

    _data = df['AA1']
    sel = ~_data.isnull()
    data = _data[sel]
    _rate = np.zeros_like(_data, dtype=float)
    _valid = np.zeros_like(_data, dtype=bool)

    # ---- Extract encoded values ----

    # Convert from object array to 1D np.array of 7-char strings
    nchar = len(data.iloc[0])
    data = data.to_numpy().astype(f'S{nchar:d}')
    # Convert to 2D array of characters
    data = data.view(dtype='S1').reshape(data.size, nchar)

    # Duration of measurement in hours
    dur = _conv_decimal(data[:, 0:2], 1.0)
    # Depth in millimeters
    dep = _conv_decimal(data[:, 3:7], 10.0)
    # Convert to inches
    dep = dep / (sp.constants.inch * 1000)

    # Convert to rate
    rate = dep / dur

    # Get condition-code and quality-code
    cc = data[:, 8]
    qq = data[:, 10]

    # ---- Determine valid entries ----
    valid = (qq == b'1') | (qq == b'5')  # | (qq != )
    # check = valid & ((cc == b'2') | (cc == b'3'))
    # if np.any(check):
    #     # print(f"Condition codes when valid: {np.unique(cc[check])}")
    #     print(df['AA1'][sel][check])

    # --- Place entries into full arrays
    _rate[sel] = rate
    _valid[sel] = valid
    rate = _rate
    valid = _valid

    return rate, valid


def cloud_cover_sum_conv(df):
    codes = []
    valid = []
    for ii in range(1, 7):
        try:
            cc, vv = _conv_ccs(df, ii)
        except KeyError:
            continue
        codes.append(cc)
        valid.append(vv)

    codes = np.vstack(codes)
    valid = np.vstack(valid)
    codes = np.max(codes * valid, axis=0)
    # print("valid = ", valid.shape, np.count_nonzero(valid))
    valid = np.any(valid, axis=0)
    # print("valid = ", valid.shape, np.count_nonzero(valid))
    return codes, valid


def _conv_ccs(df, num):
    """Convert cloud-cover-summation of particular layer (number `num`).

    Returns
    -------
    code : (N,) int, sky-cover code
        0 = Clear - No coverage
        1 = FEW - 2/8 or less coverage (not including zero)
        2 = SCATTERED - 3/8-4/8 coverage
        3 = BROKEN - 5/8-7/8 coverage
        4 = OVERCAST - 8/8 coverage
        9 = MISSING

    valid : (N,) bool

    """
    if num < 1 or num > 6:
        raise ValueError()

    key = f'GD{num}'

    _data = df[key]
    sel = ~_data.isnull()
    data = _data[sel]
    _code = np.zeros_like(_data, dtype=float)
    _valid = np.zeros_like(_data, dtype=bool)

    # ---- Extract encoded values ----
    # Convert to 2D array of characters (bytes)
    data = _conv_char2d(data)

    #
    code1 = _conv_char_to_int(data[:, 0])
    code2 = _conv_char_to_int(data[:, 2:4])
    qq = _conv_char_to_int(data[:, 5])

    fix = (code1 == 9) & (code2 != 99)
    if np.any(fix):
        logging.info(f"code1 <== code2 for {zmath.frac_str(fix)} values")
        mapping = [
            [0, [0]],
            [1, [1, 2, 11]],
            [2, [3, 4, 13]],
            [3, [5, 6, 14, 15, 16]],
            [4, [7, 8, 17, 18, 19]],
            [9, [9, 10, 99]]
        ]
        for one, _two in mapping:
            for two in _two:
                idx = fix & (code2 == two)
                code1[idx] = one

    # ---- Determine valid entries ----
    code = code1
    valid = (qq == 1) | (qq == 5) | (qq == 9)
    valid = valid & (code != 5) & (code != 6) & (code != 9)

    # --- Place entries into full arrays
    _code[sel] = code
    _valid[sel] = valid
    code = _code
    valid = _valid

    return code, valid


def station_to_grid(data, tzone='US/Pacific', epd_min=12.0):
    raw_temp, sel_temp = temp_conv(data)
    logging.info(f"valid temperatures = {zmath.frac_str(sel_temp)}")

    raw_precip, sel_precip = precip_conv(data)
    logging.info(f"valid precipitation = {zmath.frac_str(sel_precip)}")

    raw_clouds, sel_clouds = cloud_cover_sum_conv(data)
    logging.info(f"valid cloud cover sum = {zmath.frac_str(sel_clouds)}")

    sel = (sel_temp & sel_precip & sel_clouds)
    logging.info(f"valid entries = {zmath.frac_str(sel_precip)}")

    # ---- Make sure that data starts and ends at year boundaries ----
    time = data['DATE'].loc[sel]
    beg_year = int(time.iloc[0].year)
    last = time.size - 1
    end_year = time.iloc[-1].year
    logging.info(f"beg date: {time.iloc[0]}, year: {beg_year}")
    logging.info(f"end date: {time.iloc[last]}, year: {end_year}")

    beg = pd.Timestamp(f'{beg_year}-01-01T01:30:00', tz=tzone)
    if time.iloc[0] >= beg:
        beg = pd.Timestamp(f'{beg_year+1}-01-01T00:00:00', tz=tzone)
        sel = sel & (data['DATE'] >= beg)

    end = pd.Timestamp(f'{end_year}-12-31T22:30:00', tz=tzone)
    if time.iloc[last] <= end:
        end = pd.Timestamp(f'{end_year}-01-01T00:00:00', tz=tzone)
        sel = sel & (data['DATE'] < end)

    logging.info(f"valid temps and dates = {zmath.frac_str(sel)}")
    data = data.loc[sel]
    raw_temp = raw_temp[sel]
    raw_precip = raw_precip[sel]
    raw_clouds = raw_clouds[sel]
    time = data['DATE']

    # Make sure it worked
    last = time.size - 1
    beg_year = time.iloc[0].year
    if (time.iloc[0].day != 1) or (time.iloc[0].month != 1):
        raise ValueError(f"Dataset does not start on Jan. 1st!!  ({time[0]})")

    # Convert to proper timezone
    time = time.dt.tz_convert(tzone)

    # Determine the number of complete years covered
    nyrs = (time.iloc[last] - time.iloc[0]).total_seconds() / (3600*24*365)
    nyrs = int(np.floor(nyrs))
    logging.info(f"{beg_year=}, {time.iloc[0]}, {time.iloc[last]}, {nyrs=}")

    # ---- Find mapping of entries to target grid points ----

    # Initialize storage array, and create grid of hours after 'Jan. 1st' each year
    index = -1 * np.ones((nyrs, 365, 24), dtype=int)
    global_index = -1 * np.ones((nyrs, 365, 24), dtype=int)

    dt_grid = np.arange(365*24).astype(float)

    # Iterate over years, find the indices of entries matching each offset for that year
    years = -1 * np.ones(nyrs, dtype=int)
    entries = np.zeros(nyrs, dtype=float)
    for yy in zio.tqdm(range(nyrs)):
        year = beg_year + yy
        beg = pd.Timestamp(f'{year}-01-01', tz=tzone)
        end = pd.Timestamp(f'{year}-12-31T23:59:59', tz=tzone)

        # Find the entries for this year
        idx = (time >= beg) & (time <= end)
        # Determine the offset (index) for the first value
        offset = np.argmax(idx)
        num_year = np.count_nonzero(idx)
        epd = num_year / 365.0
        entries[yy] = epd
        msg = f"{year=}, {offset=}, #/day={epd:.2f}"
        logging.debug(msg)
        if epd < epd_min:
            logging.error(msg)
            err = f"Entries per day is {epd:.2f} < {epd_min=:.1f}!!"
            logging.error(err)
            # raise ValueError(err)
            continue

        years[yy] = year

        # Find the time of each entry relative to 'Jan 1st', in hours
        dt = (time[idx] - beg).dt.total_seconds() / 3600.0
        # Find the nearest entry matching each target grid-point
        sel = zmath.argnearest(dt, dt_grid, assume_sorted=True)
        # Store values
        index[yy, ...].flat = offset + sel

    # ---- Select valid years ----
    logging.info(f"Entries/day : {zmath.stats_str(entries)}")
    valid = (years > 0)
    if not np.all(valid):
        logging.warning(f"Valid years: {zmath.frac_str(valid)}")
        years = years[valid]
        index = index[valid, ...]
        global_index = global_index[valid, ...]

    # ---- Interpolate ----

    idx = index.flatten()
    temp = np.zeros_like(index, dtype=float)
    precip = np.zeros_like(index, dtype=float)
    clouds = np.zeros_like(index, dtype=int)
    temp.flat = raw_temp[idx]
    precip.flat = raw_precip[idx]
    clouds.flat = raw_clouds[idx]
    global_index.flat = data.iloc[idx].index.to_numpy()

    results = dict(temp=temp, precip=precip, clouds=clouds)

    return years, results, global_index
