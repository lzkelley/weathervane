"""
"""

import logging
import calendar
import copy

import numpy as np
import scipy as sp
import matplotlib.pyplot as plt

import zcode.math as zmath

import kalepy as kale


def plot_hour_vs_day(vals, station=None, clabel='',
                     ax=None, levels=None, smooth=3, upsample=2, cmap=None):

    if ax is None:
        fig, ax = plt.subplots(figsize=[12, 4])

    if station is not None:
        _draw_station_title(ax, station)

    cmap = _def_temp_cmap(cmap)

    vave = np.mean(vals, axis=0)
    edges = [np.arange(1, 365+1).astype(float), np.arange(0, 24).astype(float)]
    if levels is None:
        levels = zmath.spacing(vave/5, integers=True, scale='lin') * 5

    mesh = np.meshgrid(*edges, indexing='ij')

    # pcm = ax.pcolormesh(vave.T)
    pcm, data = _draw_hist2d(ax, mesh, vals, smooth=smooth, upsample=upsample, cmap=cmap)
    cbar = plt.colorbar(pcm, label=clabel)

    # ax.axhline(12, color='0.5', ls='--')
    ax.set_yticks(np.arange(0, 25, 6))

    *_, cc = kale.plot.draw_contour2d(
        ax, edges, vave, cmap=pcm.cmap.reversed(),
        levels=levels, smooth=smooth*2, upsample=upsample/4, pad=1, cbar=cbar
    )

    ax.set(xlim=[0, 365], xlabel='Day of Year', ylim=[0, 24], ylabel='Hour of Day')

    _draw_twiny_months(ax)

    return ax, data, cc


def _def_temp_cmap(cmap=None):
    if cmap is None:
        cmap = 'RdBu_r'

    cmap = copy.copy(plt.get_cmap(cmap))
    return cmap


def _draw_station_title(ax, station, **kwargs):
    stat_name = station['STATION NAME'].title()
    lat = station['LAT']
    lon = station['LON']

    try:
        name = ", ".join(station._nearest_name)
    except AttributeError:
        name = None

    title = rf"{stat_name} $({lat:+.4f}, {lon:+.4f})$"
    if name is not None:
        title = f"{name}\n{title}"

    return ax.set_title(title, **kwargs)


def _draw_twiny_months(ax):
    ndays = calendar.mdays
    cum_days = np.cumsum(ndays)

    tw = ax.twiny()
    tw.set_xlim(ax.get_xlim())
    tw.set_xticks(cum_days)
    tw.set_xticklabels(['' for ii in range(cum_days.size)])

    mm = np.arange(1, 12+1)
    labels = [calendar.month(2000, mm).strip().split()[0][:3] for mm in mm]
    locs = zmath.midpoints(cum_days, scale='lin')
    tw.set_xticks(locs, minor=True)
    tw.set_xticklabels(labels, minor=True)
    for tick in tw.xaxis.get_minor_ticks():
        tick.tick1line.set_markersize(0)
        tick.tick2line.set_markersize(0)

    return


def _draw_hist2d(ax, mesh, vals, upsample=None, smooth=None, **kwargs):
    hist = np.mean(vals, axis=0)
    kwargs.setdefault('shading', 'auto')

    xx, yy = mesh
    if np.any([np.shape(zz) != np.shape(hist) for zz in [xx, yy]]):
        logging.error(f"{xx.shape=}, {yy.shape=}, {hist.shape=}")
        raise ValueError("`edges` must already be (2,) of 2D grids!")

    # Perform upsampling
    if (upsample is not None):
        if upsample is True:
            upsample = 2
        xx = sp.ndimage.zoom(xx.astype(float), upsample)
        yy = sp.ndimage.zoom(yy.astype(float), upsample)
        hist = sp.ndimage.zoom(hist, upsample)

    # perform smoothing
    if (smooth is not None):
        if upsample is not None:
            smooth *= upsample
        hist = sp.ndimage.filters.gaussian_filter(hist, smooth)

    pcm = ax.pcolormesh(xx, yy, hist, **kwargs)
    data = dict(x=xx, y=yy, z=hist)
    return pcm, data
