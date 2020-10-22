
import {gql} from 'apollo-server-express';

import Null from '-/graphql/scalar/Null';

export const typeDefs = gql`
    scalar Date
    scalar Null
`;

export const resolvers = {
    Null
};
