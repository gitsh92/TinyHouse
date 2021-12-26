import React, { FC, useState } from 'react';
import { useQuery } from 'react-apollo';
import { useParams } from 'react-router';
import { Col, Layout, Row } from 'antd';
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
  WrappedListingCreateBookingModal as ListingCreateBookingModal,
  ListingDetails
} from './components';
import { Viewer } from '../../lib/types';
import { useScrollToTop } from '../../lib/hooks';

interface Props {
  viewer: Viewer;
}

const { Content } = Layout;

const PAGE_LIMIT = 3;

export const Listing: FC<Props> = ({ viewer }) => {
  const [bookingsPage, setBookingsPage] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Moment | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Moment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { id } = useParams();

  const { loading, data, error, refetch } = useQuery<
    ListingData,
    ListingVariables
  >(LISTING, {
    variables: {
      id: id ?? '',
      bookingsPage,
      limit: PAGE_LIMIT
    }
  });

  const clearBookingData = () => {
    setModalVisible(false);
    setCheckInDate(null);
    setCheckOutDate(null);
  };

  const handleListingRefetch = async () => {
    await refetch();
  };

  useScrollToTop();

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
      viewer={viewer}
      host={data.listing.host}
      price={data.listing.price}
      bookingsIndex={data.listing.bookingsIndex}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      setCheckInDate={setCheckInDate}
      setCheckOutDate={setCheckOutDate}
      setModalVisible={setModalVisible}
    />
  ) : null;

  const listingCreateBookingModalElement =
    data?.listing && checkInDate && checkOutDate ? (
      <ListingCreateBookingModal
        id={data.listing.id}
        clearBookingData={clearBookingData}
        handleListingRefetch={handleListingRefetch}
        price={data.listing.price}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
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
      {listingCreateBookingModalElement}
    </Content>
  );
};
