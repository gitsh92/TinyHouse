import { Request } from 'express';
import { IResolvers } from 'graphql-tools';
import { ObjectId } from 'mongodb';
import { Stripe } from '../../../lib/api';
import { Booking, Database, Listing, BookingsIndex } from '../../../lib/types';
import { authorize } from '../../../lib/utils';
import { CreateBookingArgs } from './types';

const resolveBookingsIndex = (
  bookingsIndex: BookingsIndex,
  checkInDate: string,
  checkOutDate: string
): BookingsIndex => {
  let dateCursor = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const newBookingsIndex: BookingsIndex = { ...bookingsIndex };

  while (dateCursor <= checkOut) {
    const y = dateCursor.getUTCFullYear();
    const m = dateCursor.getUTCMonth();
    const d = dateCursor.getUTCDate();

    if (!newBookingsIndex[y]) {
      newBookingsIndex[y] = {};
    }

    if (!newBookingsIndex[y][m]) {
      newBookingsIndex[y][m] = {};
    }

    if (!newBookingsIndex[y][m][d]) {
      newBookingsIndex[y][m][d] = true;
    } else {
      throw new Error(
        "Selected dates can't overlap dates that have already been booked"
      );
    }

    dateCursor = new Date(dateCursor.getTime() + 86400000); // + 1 day
  }

  return newBookingsIndex;
};

export const bookingResolvers: IResolvers = {
  Booking: {
    id: (booking: Booking): string => {
      return booking._id.toString();
    },
    listing: (
      booking: Booking,
      _args: any,
      { db }: { db: Database }
    ): Promise<Listing | null> => {
      return db.listings.findOne({ _id: booking.listing });
    },
    tenant: (booking: Booking, _args: any, { db }: { db: Database }) => {
      return db.users.findOne({ _id: booking.tenant });
    }
  },
  Mutation: {
    createBooking: async (
      _root: undefined,
      { input }: CreateBookingArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<Booking> => {
      try {
        const { id, source, checkIn, checkOut } = input;

        // verify a logged-in user is making the request
        const viewer = await authorize(db, req);
        if (!viewer) {
          throw new Error('Viewer cannot be found');
        }

        // find listing document that is being booked
        const listing = await db.listings.findOne({
          _id: new ObjectId(id)
        });
        if (!listing) {
          throw new Error("Listing can't be found");
        }

        // check that viewer is NOT booking their own listing
        if (listing.host === viewer._id) {
          throw new Error("Viewer can't book own listing");
        }

        // check that checkOut is NOT before checkIn
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkOutDate < checkInDate) {
          throw new Error("Check-out date can't be before check-in date");
        }

        // create a new bookingsIndex for listings being booked
        const bookingsIndex = resolveBookingsIndex(
          listing.bookingsIndex,
          checkIn,
          checkOut
        );

        // get total price to charge
        const totalPrice =
          listing.price *
          ((checkOutDate.getTime() - checkInDate.getTime()) / 86400000 + 1); // 86400000 === 1 day in ms

        // get user document of host of listing
        const host = await db.users.findOne({ _id: listing.host });

        if (!host || !host.walletId) {
          throw new Error(
            'The host either cannot be found or is not connected with Stripe'
          );
        }

        // create Stripe charge on behalf of host
        await Stripe.charge(totalPrice, source, host.walletId);

        // insert a new booking document to bookings collection
        const insertRes = await db.bookings.insertOne({
          _id: new ObjectId(),
          listing: listing._id,
          tenant: viewer._id,
          checkIn,
          checkOut
        });
        const insertedBooking = await db.bookings.findOne({
          _id: insertRes.insertedId
        });
        if (!insertedBooking) {
          throw new Error('Failed to insert new booking');
        }

        // update user document of host to increment income
        await db.users.updateOne(
          {
            _id: host._id
          },
          {
            $inc: { income: totalPrice }
          }
        );

        // update bookings field of tenant
        await db.users.updateOne(
          {
            _id: viewer._id
          },
          {
            $push: { bookings: insertedBooking._id }
          }
        );

        // update bookings field of listings document
        await db.listings.updateOne(
          {
            _id: listing._id
          },
          {
            $set: { bookingsIndex },
            $push: { bookings: insertedBooking._id }
          }
        );

        // return newly inserted booking
        return insertedBooking;
      } catch (error) {
        throw new Error(`Failed to create a booking: ${error}`);
      }
    }
  }
};
