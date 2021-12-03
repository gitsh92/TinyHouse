import React, { FC, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Input } from 'antd';
import logo from './assets/tinyhouse-logo.png';
import { MenuItems } from './components';
import { Viewer } from '../../lib/types';
import { displayErrorMessage } from '../../lib/utils';

interface Props {
  viewer: Viewer;
  setViewer: (viewer: Viewer) => void;
}

const { Header } = Layout;
const { Search } = Input;

export const AppHeader: FC<Props> = ({ viewer, setViewer }) => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    const pathnameSubStrings = pathname.split('/');

    if (!pathname.includes('/listings')) {
      setSearch('');
      return;
    }

    if (pathname.includes('/listings') && pathnameSubStrings.length === 3) {
      setSearch(decodeURI(pathnameSubStrings[2]));
    }
  }, [location]);

  const onSearch = (value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue) {
      navigate(`/listings/${value}`);
    } else {
      displayErrorMessage('Please enter a valid search!');
    }
  };

  return (
    <Header className="app-header">
      <div className="app-header__logo-search-section">
        <div className="app-header__logo">
          <Link to="/">
            <img src={logo} alt="App logo" />
          </Link>
        </div>
        <div className="app-header__search-input">
          <Search
            placeholder="Search 'San Fransisco'"
            enterButton
            value={search}
            onSearch={onSearch}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="app-header__menu-section">
        <MenuItems viewer={viewer} setViewer={setViewer} />
      </div>
    </Header>
  );
};
