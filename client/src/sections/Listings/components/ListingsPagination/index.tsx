import React, { FC } from 'react';
import { Pagination } from 'antd';

interface Props {
  total: number;
  page: number;
  limit: number;
  setPage: (page: number) => void;
}

export const ListingsPagination: FC<Props> = ({
  total,
  page,
  limit,
  setPage
}) => {
  return (
    <Pagination
      current={page}
      total={total}
      defaultPageSize={limit}
      hideOnSinglePage
      showLessItems
      onChange={(page: number) => setPage(page)}
      className="listings-pagination"
    />
  );
};
