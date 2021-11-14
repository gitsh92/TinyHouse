import React, { FC } from 'react';
import { server } from '../../lib/api';
import { DeleteListingData, ListingsData } from './types';

const LISTINGS = `
  query Listings {
    listings {
      id
      title
      image
      address
      price
      numOfGuests
      numOfBaths
      numOfBeds
      rating
    }
  }
`;

const DELETE_LISTING = `
  mutation DeleteListing($id: ID!) {
    deleteListing(id: $id) {
      id
    }
  }
`;

interface Props {
  title: string;
}

export const Listings: FC<Props> = ({ title }) => {
  const fetchListings = async () => {
    const { data } = await server.fetch<ListingsData>({ query: LISTINGS });
    console.log(data.listings);
  };

  const deleteListing = async () => {
    const { data } = await server.fetch<DeleteListingData>({
      query: DELETE_LISTING,
      variables: { id: '619154e7ac22ec64df712d8a' }
    });
    console.log(data);
  };

  return (
    <div>
      <h2>{title}</h2>
      <button onClick={fetchListings}>Query listings</button>
      <button onClick={deleteListing}>Delete a listing</button>
    </div>
  );
};
