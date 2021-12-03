import React from 'react';
import { List, Card, Skeleton } from 'antd';

import listingLoadingCardCover from '../../assets/listing-loading-card-cover.jpeg';

export const ListingsSkeleton = () => {
  const emptyData = [{}, {}, {}, {}, {}, {}, {}, {}];

  return (
    <div>
      <Skeleton paragraph={{ rows: 1 }} />
      <List
        grid={{
          gutter: 8,
          xs: 1,
          sm: 2,
          lg: 4
        }}
        dataSource={emptyData}
        renderItem={listing => (
          <List.Item>
            <Card
              cover={
                <img
                  src={listingLoadingCardCover}
                  className="listings-skeleton__card-cover-img"
                ></img>
              }
              loading
              className="listings-skeleton__card"
            />
          </List.Item>
        )}
      />
    </div>
  );
};
