/* tslint:disable */

export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type DataEntry = {
  id: Scalars['String'];
  name: Scalars['String'];
  url: Scalars['String'];
  averageLatencyMs: Scalars['Float'];
  lastSample: Scalars['String'];
  status: Scalars['String'];
  logo: Scalars['String'];
};

export type Mutation = {
  updateDataEntry: DataEntry;
};

export type MutationUpdateDataEntryArgs = {
  id: Scalars['String'];
  name: Scalars['String'];
  url: Scalars['String'];
  averageLatencyMs: Scalars['Float'];
  lastSample: Scalars['String'];
  status: Scalars['String'];
  logo: Scalars['String'];
};
