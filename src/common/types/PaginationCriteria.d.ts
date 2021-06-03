/**
 * The pagination object is used to control which items from a multi-result list to return.
 */
export type SessionPagination = {
  limit: number, /** The maximum number of records to return */
  offset: number, /** The result offset from which to start the result set */
  orderby?:string, /** Which field to sort the results by */
  orderdir?: 'ASC' | 'DESC' /** Which direction to sort the results by */

}

export interface SessionPaginationCriteria extends SessionPagination {
  orderby?: 'createdAt'
}

export type PaginatedResult = {
  count: 3, /** Total number of rows matching the query */
  rows: Array<any> /** result items */
}