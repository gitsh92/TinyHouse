import { Col, Layout, Row } from 'antd';
import React, { useState } from 'react';
import { useQuery } from 'react-apollo';
import { useParams } from 'react-router';
import { Moment } from 'moment';
import { ErrorBanner, PageSkeleton } from '../../lib/components';
import { LISTING } from '../../lib/graphql/queries';
import {
  Listing as ListingData,
  ListingVariables
} from '../../lib/graphql/queries/Listing/__generated__/Listing';
import {
  ListingBookings,
  ListingCreateBooking,
  ListingDetails
} from './components';

const { Content } = Layout;

const PAGE_LIMIT = 3;

export const Listing = () => {
  const [bookingsPage, setBookingsPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Moment | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Moment | null>(null);

  const { id } = useParams();

  const { loading, data, error } = useQuery<ListingData, ListingVariables>(
    LISTING,
    {
      variables: {
        id: id ?? '',
        bookingsPage,
        limit: PAGE_LIMIT
      }
    }
  );

  if (loading) {
    return (
      <Content className="listings">
        <PageSkeleton />
      </Content>
    );
  }

  if (error) {
    return (
      <Content className="listings">
        <ErrorBanner description="This listing may not exist or we've encountered an error. Please try again soon." />
        <PageSkeleton />
      </Content>
    );
  }

  const listingBookings = data?.listing?.bookings ?? null;

  const listingDetailsElement = data?.listing ? (
    <ListingDetails listing={data.listing} />
  ) : null;

  const listingBookingsElement = listingBookings ? (
    <ListingBookings
      listingBookings={listingBookings}
      bookingsPage={bookingsPage}
      limit={PAGE_LIMIT}
      setBookingsPage={setBookingsPage}
    />
  ) : null;

  const listingCreateBookingElement = data?.listing ? (
    <ListingCreateBooking
      price={data.listing.price}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      setCheckInDate={setCheckInDate}
      setCheckOutDate={setCheckOutDate}
    />
  ) : null;

  return (
    <Content className="listings">
      <Row gutter={24} justify="space-between">
        <Col xs={24} lg={14}>
          {listingDetailsElement}
          {listingBookingsElement}
        </Col>
        <Col xs={24} lg={10}>
          {listingCreateBookingElement}
        </Col>
      </Row>
    </Content>
  );
};
