import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApolloClient from 'apollo-boost';
import { ApolloProvider, useMutation } from 'react-apollo';
import reportWebVitals from './reportWebVitals';
import { Affix, Layout, Spin } from 'antd';
import {
  Home,
  Host,
  Listing,
  Listings,
  NotFound,
  User,
  Login,
  AppHeader,
  Stripe
} from './sections';
import { Viewer } from './lib/types';
import { LOG_IN } from './lib/graphql/mutations';
import {
  LogIn as LogInData,
  LogInVariables
} from './lib/graphql/mutations/LogIn/__generated__/LogIn';
import './styles/index.css';
import { AppHeaderSkeleton, ErrorBanner } from './lib/components';
import { Elements, StripeProvider } from 'react-stripe-elements';

const client = new ApolloClient({
  uri: '/api',
  request: async operation => {
    const token = sessionStorage.getItem('token');
    operation.setContext({
      headers: {
        'X-CSRF-TOKEN': token || ''
      }
    });
  }
});

const initialViewer: Viewer = {
  id: null,
  token: null,
  avatar: null,
  hasWallet: null,
  didRequest: false
};

const App = () => {
  const [viewer, setViewer] = useState<Viewer>(initialViewer);
  const [logIn, { error }] = useMutation<LogInData, LogInVariables>(LOG_IN, {
    onCompleted: data => {
      if (data && data.logIn) {
        setViewer(data.logIn);

        if (data.logIn.token) {
          sessionStorage.setItem('token', data.logIn.token);
        } else {
          sessionStorage.removeItem('token');
        }
      }
    }
  });
  const logInRef = useRef(logIn);

  useEffect(() => {
    logInRef.current();
  }, []);

  if (!viewer.didRequest && !error) {
    return (
      <Layout className="app-skeleton">
        <AppHeaderSkeleton />
        <div className="app-skeleton__spin-section">
          <Spin size="large" tip="Launching Tinyhouse" />
        </div>
      </Layout>
    );
  }

  const logInErrorBannerElement = error ? (
    <ErrorBanner description="We weren't able to verify if you were logged in. Please try again later." />
  ) : null;

  return (
    <StripeProvider apiKey={process.env.REACT_APP_S_PUBLISHABLE_KEY as string}>
      <Router>
        <Layout id="app">
          {logInErrorBannerElement}
          <Affix offsetTop={0} className="app__affix-header">
            <AppHeader viewer={viewer} setViewer={setViewer} />
          </Affix>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/host" element={<Host viewer={viewer} />} />
            <Route
              path="/listing/:id"
              element={
                <Elements>
                  <Listing viewer={viewer} />
                </Elements>
              }
            />
            <Route path="/listings/:location" element={<Listings />} />
            <Route path="/listings" element={<Listings />} />
            <Route
              path="/user/:id"
              element={<User viewer={viewer} setViewer={setViewer} />}
            />
            <Route path="/login" element={<Login setViewer={setViewer} />} />
            <Route
              path="/stripe"
              element={<Stripe viewer={viewer} setViewer={setViewer} />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </StripeProvider>
  );
};

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
