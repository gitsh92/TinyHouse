import React, { FC } from 'react';
import { Card, Divider, Typography, Button, DatePicker } from 'antd';
import moment, { Moment } from 'moment';
import { displayErrorMessage, formatListingPrice } from '../../../../lib/utils';

const { Paragraph, Title } = Typography;

interface Props {
  price: number;
  checkInDate: Moment | null;
  checkOutDate: Moment | null;
  setCheckInDate: (checkInDate: Moment | null) => void;
  setCheckOutDate: (checkInDate: Moment | null) => void;
}

export const ListingCreateBooking: FC<Props> = ({
  price,
  checkInDate,
  checkOutDate,
  setCheckInDate,
  setCheckOutDate
}) => {
  const disabledDate = (currentDate?: Moment) => {
    if (!currentDate) {
      return false;
    }

    const dateIsBeforeEndOfDay = currentDate.isBefore(moment().endOf('day'));

    return dateIsBeforeEndOfDay;
  };

  const verifyAndSetCheckOutDate = (selectedCheckOutDate: Moment | null) => {
    if (checkInDate && selectedCheckOutDate) {
      if (moment(selectedCheckOutDate).isBefore(checkInDate, 'days')) {
        return displayErrorMessage(
          "You can't book a check-out date that is prior to a check-in date!"
        );
      }
    }

    setCheckOutDate(selectedCheckOutDate);
  };

  const checkOutInputDisabled = !checkInDate;
  const buttonDisabled = !checkInDate || !checkOutDate;

  return (
    <div className="listing-booking">
      <Card className="listing-booking__card">
        <div>
          <Paragraph>
            <Title level={2} className="listing-booking__card-title">
              {formatListingPrice(price)}
              <span>/day</span>
            </Title>
          </Paragraph>
          <Divider />
          <div className="listing-booking__card-date-picker">
            <Paragraph strong>Check In</Paragraph>
            <DatePicker
              value={checkInDate}
              format="YYYY/MM/DD"
              showToday={false}
              disabledDate={disabledDate}
              onChange={dateValue => setCheckInDate(dateValue)}
              onOpenChange={() => setCheckOutDate(null)}
            />
          </div>
          <div className="listing-booking__card-date-picker">
            <Paragraph strong>Check Out</Paragraph>
            <DatePicker
              value={checkOutDate}
              format="YYYY/MM/DD"
              showToday={false}
              disabled={checkOutInputDisabled}
              disabledDate={disabledDate}
              onChange={dateValue => verifyAndSetCheckOutDate(dateValue)}
            />
          </div>
        </div>
        <Divider />
        <Button
          size="large"
          type="primary"
          className="listing-booking__card-cta"
          disabled={buttonDisabled}
        >
          Request to book!
        </Button>
      </Card>
    </div>
  );
};
