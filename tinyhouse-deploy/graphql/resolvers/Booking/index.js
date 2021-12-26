"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingResolvers = void 0;
const mongodb_1 = require("mongodb");
const api_1 = require("../../../lib/api");
const utils_1 = require("../../../lib/utils");
const millisecondsPerDay = 86400000;
const resolveBookingsIndex = (bookingsIndex, checkInDate, checkOutDate) => {
    let dateCursor = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const newBookingsIndex = Object.assign({}, bookingsIndex);
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
        }
        else {
            throw new Error("Selected dates can't overlap dates that have already been booked");
        }
        dateCursor = new Date(dateCursor.getTime() + 86400000); // + 1 day
    }
    return newBookingsIndex;
};
exports.bookingResolvers = {
    Booking: {
        id: (booking) => {
            return booking._id.toString();
        },
        listing: (booking, _args, { db }) => {
            return db.listings.findOne({ _id: booking.listing });
        },
        tenant: (booking, _args, { db }) => {
            return db.users.findOne({ _id: booking.tenant });
        }
    },
    Mutation: {
        createBooking: (_root, { input }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id, source, checkIn, checkOut } = input;
                // verify a logged-in user is making the request
                const viewer = yield (0, utils_1.authorize)(db, req);
                if (!viewer) {
                    throw new Error('Viewer cannot be found');
                }
                // find listing document that is being booked
                const listing = yield db.listings.findOne({
                    _id: new mongodb_1.ObjectId(id)
                });
                if (!listing) {
                    throw new Error("Listing can't be found");
                }
                // check that viewer is NOT booking their own listing
                if (listing.host === viewer._id) {
                    throw new Error("Viewer can't book own listing");
                }
                // check that checkOut is NOT before checkIn
                const today = new Date();
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                if (checkInDate.getTime() > today.getTime() + 90 * millisecondsPerDay) {
                    throw new Error("Check-in date can't be more than 90 days from today");
                }
                if (checkOutDate.getTime() >
                    today.getTime() + 90 * millisecondsPerDay) {
                    throw new Error("Check-out date can't be more than 90 days from today");
                }
                if (checkOutDate < checkInDate) {
                    throw new Error("Check-out date can't be before check-in date");
                }
                // create a new bookingsIndex for listings being booked
                const bookingsIndex = resolveBookingsIndex(listing.bookingsIndex, checkIn, checkOut);
                // get total price to charge
                const totalPrice = listing.price *
                    ((checkOutDate.getTime() - checkInDate.getTime()) /
                        millisecondsPerDay +
                        1);
                // get user document of host of listing
                const host = yield db.users.findOne({ _id: listing.host });
                if (!host || !host.walletId) {
                    throw new Error('The host either cannot be found or is not connected with Stripe');
                }
                // create Stripe charge on behalf of host
                yield api_1.Stripe.charge(totalPrice, source, host.walletId);
                // insert a new booking document to bookings collection
                const insertRes = yield db.bookings.insertOne({
                    _id: new mongodb_1.ObjectId(),
                    listing: listing._id,
                    tenant: viewer._id,
                    checkIn,
                    checkOut
                });
                const insertedBooking = yield db.bookings.findOne({
                    _id: insertRes.insertedId
                });
                if (!insertedBooking) {
                    throw new Error('Failed to insert new booking');
                }
                // update user document of host to increment income
                yield db.users.updateOne({
                    _id: host._id
                }, {
                    $inc: { income: totalPrice }
                });
                // update bookings field of tenant
                yield db.users.updateOne({
                    _id: viewer._id
                }, {
                    $push: { bookings: insertedBooking._id }
                });
                // update bookings field of listings document
                yield db.listings.updateOne({
                    _id: listing._id
                }, {
                    $set: { bookingsIndex },
                    $push: { bookings: insertedBooking._id }
                });
                // return newly inserted booking
                return insertedBooking;
            }
            catch (error) {
                throw new Error(`Failed to create a booking: ${error}`);
            }
        })
    }
};
