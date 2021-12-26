import React, { FC, useEffect, useRef } from 'react';
import { useMutation } from 'react-apollo';
import { Layout, Spin } from 'antd';
import { CONNECT_STRIPE } from '../../lib/graphql/mutations';
import {
  ConnectStripe as ConnectStripeData,
  ConnectStripeVariables
} from '../../lib/graphql/mutations/ConnectStripe/__generated__/ConnectStripe';
import { Navigate, useNavigate } from 'react-router';
import { Viewer } from '../../lib/types';
import { displaySuccessNotification } from '../../lib/utils';
import { useScrollToTop } from '../../lib/hooks';

interface Props {
  viewer: Viewer;
  setViewer: (viewer: Viewer) => void;
}

const { Content } = Layout;

export const Stripe: FC<Props> = ({ viewer, setViewer }) => {
  const navigate = useNavigate();

  const [connectStripe, { data, loading, error }] = useMutation<
    ConnectStripeData,
    ConnectStripeVariables
  >(CONNECT_STRIPE, {
    onCompleted: data => {
      if (data && data.connectStripe) {
        setViewer({ ...viewer, hasWallet: data.connectStripe.hasWallet });
        displaySuccessNotification(
          "You've successfully connected your Stripe account!",
          'You can now begin to create listings in the Host page.'
        );
      }
    }
  });

  const connectStripeRef = useRef(connectStripe);

  useScrollToTop();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code');

    if (code) {
      connectStripeRef.current({
        variables: {
          input: { code }
        }
      });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (data && data.connectStripe) {
    return <Navigate to={`/user/${viewer.id}`} />;
  }

  if (loading) {
    return (
      <Content className="stripe">
        <Spin size="large" tip="Connecting your Stripe account..." />
      </Content>
    );
  }

  if (error) {
    return <Navigate to={`/user/${viewer.id}?stripe_error=true`} />;
  }

  return null;
};
