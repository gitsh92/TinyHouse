import React, { FC } from 'react';
import { Modal, Button, Divider, Typography } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import {
  CardElement,
  injectStripe,
  ReactStripeElements
} from 'react-stripe-elements';
import {
  displayErrorMessage,
  displaySuccessNotification,
  formatListingPrice
} from '../../../../lib/utils';
import { CREATE_BOOKING } from '../../../../lib/graphql/mutations';
import {
  CreateBooking as CreateBookingData,
  CreateBookingVariables
} from '../../../../lib/graphql/mutations/CreateBooking/__generated__/CreateBooking';
import { useMutation } from 'react-apollo';

interface Props {
  id: string;
  price: number;
  checkInDate: Moment;
  checkOutDate: Moment;
  modalVisible: boolean;
  setModalVisible: (modalVisible: boolean) => void;
  clearBookingData: () => void;
  handleListingRefetch: () => Promise<void>;
}

const { Paragraph, Title, Text } = Typography;

export const ListingCreateBookingModal: FC<
  Props & ReactStripeElements.InjectedStripeProps
> = ({
  id,
  price,
  checkInDate,
  checkOutDate,
  modalVisible,
  setModalVisible,
  clearBookingData,
  handleListingRefetch,
  stripe
}) => {
  const [createBooking, { loading }] = useMutation<
    CreateBookingData,
    CreateBookingVariables
  >(CREATE_BOOKING, {
    onCompleted: () => {
      clearBookingData();
      displaySuccessNotification(
        "You've successfully booked the listing!",
        'Booking history can always be found in your User page.'
      );
      handleListingRefetch();
    },
    onError: () => {
      displayErrorMessage(
        "Sorry! We weren't able to successfully book the listing. Please try again later!"
      );
    }
  });

  const daysBooked = checkOutDate.diff(checkInDate, 'days') + 1;
  const listingPrice = price * daysBooked;

  const handleCreateBooking = async () => {
    if (!stripe) {
      return displayErrorMessage(
        "Sorry! We weren't able to connect with Stripe."
      );
    }

    const { token: stripeToken, error } = await stripe.createToken();
    if (stripeToken) {
      createBooking({
        variables: {
          input: {
            id,
            source: stripeToken.id,
            checkIn: moment(checkInDate).format('YYYY-MM-DD'),
            checkOut: moment(checkOutDate).format('YYYY-MM-DD')
          }
        }
      });
    } else {
      displayErrorMessage(
        error && error.message
          ? error.message
          : "Sorry! We weren't able to book the listing. Please try again later."
      );
    }
  };

  return (
    <Modal
      visible={modalVisible}
      centered
      footer={null}
      onCancel={() => setModalVisible(false)}
    >
      <div className="listing-booking-modal">
        <div className="listing-booking-modal__intro">
          <Title className="listing-booking-modal__intro-title">
            <KeyOutlined />
          </Title>
          <Title level={3} className="listing-booking-modal__intro-title">
            Book your trip
          </Title>
          <Paragraph>
            Enter your payment information to book the listing for the dates
            between{' '}
            <Text strong mark>
              {moment(checkInDate).format('MMMM Do YYYY')}
            </Text>{' '}
            and{' '}
            <Text strong mark>
              {moment(checkOutDate).format('MMMM Do YYYY')}
            </Text>
            , inclusive.
          </Paragraph>
        </div>
        <Divider />
        <div className="listing-booking-modal__charge-summary">
          <Paragraph>
            {formatListingPrice(price, false)} * {daysBooked}{' '}
            {daysBooked === 1 ? 'day' : 'days'} ={' '}
            <Text strong>{formatListingPrice(listingPrice, false)}</Text>
          </Paragraph>
          <Paragraph className="listing-booking-modal__charge-summary-total">
            Total = <Text mark>{formatListingPrice(listingPrice, false)}</Text>
          </Paragraph>
        </div>
        <Divider />
        <div className="listing-booking-modal__stripe-card-selection">
          <CardElement
            hidePostalCode
            className="listing-booking-modal__stripe-card"
          />
          <Button
            size="large"
            type="primary"
            loading={loading}
            className="listing-booking-modal__cta"
            onClick={handleCreateBooking}
          >
            Book
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const WrappedListingCreateBookingModal = injectStripe(
  ListingCreateBookingModal
);
