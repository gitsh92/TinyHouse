import React, { FC } from 'react';
import { Alert } from 'antd';

interface Props {
  message?: string;
  description?: string;
}

export const ErrorBanner: FC<Props> = ({
  message = 'Something went wrong :(',
  description = 'Looks like something went wrong. Please try again later.'
}) => {
  return (
    <Alert
      banner
      closable
      message={message}
      description={description}
      type="error"
      className="error-banner"
    />
  );
};
