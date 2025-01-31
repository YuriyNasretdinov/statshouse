// Copyright 2022 V Kontakte LLC
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import StatshousePdf from '../../doc/Statshouse.pdf';
import { ReactComponent as SVGLightning } from 'bootstrap-icons/icons/lightning.svg';
import { ReactComponent as SVGGridFill } from 'bootstrap-icons/icons/grid-fill.svg';
import { ReactComponent as SVGPlus } from 'bootstrap-icons/icons/plus.svg';
import { ReactComponent as SVGCardList } from 'bootstrap-icons/icons/card-list.svg';
// import { ReactComponent as SVGGear } from 'bootstrap-icons/icons/gear.svg';
import cn from 'classnames';

import { HeaderMenuItem } from './HeaderMenuItem';
import { NEWS_VERSION } from '../../constant';
import { selectorParams, selectorPlotList, selectorSetParams, useStore } from '../../store';
import { currentAccessInfo, logoutURL } from '../../common/access';
import { HeaderMenuItemPlot } from './HeaderMenuItemPlot';
import css from './style.module.scss';
import { PlotLink } from '../Plot/PlotLink';
import { parseParamsFromUrl } from '../../common/plotQueryParams';
import produce from 'immer';

export const StatsHouseIcon = () => {
  const location = useLocation();
  const [actualNews, setActualNews] = useState(false);
  useEffect(() => {
    setActualNews(location.pathname !== '/doc/news' && window.localStorage.getItem('NEWS_VERSION') !== NEWS_VERSION);
  }, [location]);
  return (
    <span className="position-relative">
      <SVGLightning className={css.icon} />
      {actualNews && (
        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger rounded-circle blink"></span>
      )}
    </span>
  );
};

export type HeaderMenuProps = {
  className?: string;
};

export const HeaderMenu: React.FC<HeaderMenuProps> = ({ className }) => {
  const params = useStore(selectorParams);
  const setParams = useStore(selectorSetParams);
  const menuPlots = useStore(selectorPlotList);
  const location = useLocation();
  const [actualNews, setActualNews] = useState(false);
  const ai = currentAccessInfo();

  const isView = location.pathname === '/view';
  const isDashList = location.pathname === '/dash-list';
  // const isAdminGroup = location.pathname === '/admin/group';

  useEffect(() => {
    setActualNews(location.pathname !== '/doc/news' && window.localStorage.getItem('NEWS_VERSION') !== NEWS_VERSION);
  }, [location]);

  const onPasteClipboard = useCallback(() => {
    (navigator.clipboard.readText ? navigator.clipboard.readText() : Promise.reject())
      .then((url) => {
        const parseParams = parseParamsFromUrl(url);
        if (parseParams.plots.length) {
          setParams(
            produce((p) => {
              p.plots = [...p.plots, ...parseParams.plots];
            })
          );
        }
      })
      .catch(() => {
        const url = prompt('Paste url') ?? '';
        const parseParams = parseParamsFromUrl(url);
        if (parseParams.plots.length) {
          setParams(
            produce((p) => {
              p.plots = [...p.plots, ...parseParams.plots];
            })
          );
        }
      });
  }, [setParams]);

  return (
    <div className={cn('sticky-top align-self-start', css.navOuter, className)}>
      <ul className={`nav pb-5  d-flex flex-column ${css.nav}`}>
        <HeaderMenuItem icon={StatsHouseIcon} title="Home" to="/" description="StatsHouse">
          <li className={css.splitter}></li>
          <li className="nav-item">
            <NavLink className="nav-link" to="/admin/create" title="Create metric" end>
              Create&nbsp;metric
            </NavLink>
          </li>
          <li className={css.splitter}></li>
          <li className="nav-item">
            <NavLink className="nav-link text-nowrap position-relative" to="/doc/news" title="News" end>
              {actualNews && (
                <span
                  className={cn(
                    'position-absolute __start-0 top-50 translate-middle-y p-1 bg-danger rounded-circle',
                    css.news
                  )}
                ></span>
              )}
              News&nbsp;<sup>{NEWS_VERSION}</sup>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" to="/doc/faq" title="FAQ" end>
              FAQ
            </NavLink>
          </li>
          <li className="nav-item">
            <a className="nav-link" href={StatshousePdf} title="Doc (PDF)">
              Doc&nbsp;(PDF)
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="https://github.com/VKCOM/statshouse/discussions" title="Support chat">
              Support&nbsp;chat
            </a>
          </li>
          <li className={css.splitter}></li>
          <li className="nav-item">
            <a className="nav-link" href="/openapi/" target="_blank" title="OpenAPI">
              OpenAPI
            </a>
          </li>
          {!!ai.user && (
            <>
              <li className={css.splitter}></li>
              <li className="nav-item">
                <span className="nav-link text-secondary">{ai.user}</span>
              </li>
              <li className="nav-item">
                <a className="nav-link" href={logoutURL} title="Log out">
                  Log&nbsp;out
                </a>
              </li>
            </>
          )}
        </HeaderMenuItem>
        {/*{ai.admin && (
          <HeaderMenuItem
            icon={SVGGear}
            to="/settings/prometheus"
            title="Setting"
            className={cn(isAdminGroup && css.activeItem)}
          ></HeaderMenuItem>
        )}*/}
        <HeaderMenuItem
          icon={SVGCardList}
          to="/dash-list"
          title="Dashboard list"
          className={cn(isDashList && css.activeItem)}
        ></HeaderMenuItem>
        <HeaderMenuItem
          icon={SVGGridFill}
          indexPlot={-1}
          title="Dashboard"
          className={cn(params.tabNum === -1 && isView && css.activeItem)}
        >
          <li className={css.splitter}></li>
          <li className="nav-item">
            <PlotLink className="nav-link" indexPlot={-2} title="Dashboard Setting">
              Dashboard&nbsp;Setting
            </PlotLink>
          </li>
        </HeaderMenuItem>
        {menuPlots.map((item) => (
          <HeaderMenuItemPlot key={item.indexPlot} indexPlot={item.indexPlot} />
        ))}
        <HeaderMenuItem icon={SVGPlus} indexPlot={params.plots.length} title="Duplicate plot to new tab">
          <li className={css.splitter}></li>
          <li className="nav-item">
            <span role="button" className="nav-link" title="Paste new tab from clipboard" onClick={onPasteClipboard}>
              Paste&nbsp;Clipboard
            </span>
          </li>
        </HeaderMenuItem>
      </ul>
    </div>
  );
};
