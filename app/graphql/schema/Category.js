import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type Category @mongoose(model: "Category") {
        _id: ID
        active: Boolean
        isOwner: Boolean
        owner: User
        name: String
    }

    input CategoryInput {
        name: String!
    }

    extend type Mutation {
        addCategory(data: CategoryInput!): Category
        editCategory(_id: ID!, data: CategoryInput!): Category @isOwner(type: "category")
        removeCategory(_id: ID!): Null @isOwner(type: "category")
    }

    extend type Query {
        category(_id: ID!): Category @isOwner(type: "category")
        categories: [Category]
        myCategories: [Category]
    }
`;

const addCategory = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.categoryAPI.add(params);
};

const editCategory = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.categoryAPI.edit(params);
};

const removeCategory = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.categoryAPI.delete(params);
};

const category = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.categoryAPI.get(params);
};

const categories = async(root, params, context) => {
    const {dataSources} = context;

    return dataSources.categoryAPI.collect(params);
};

const myCategories = async(root, params, context) => {
    const {dataSources} = context;

    params.isMine = true;

    return dataSources.categoryAPI.collect(params);
};

export const resolvers = {
    Mutation: {
        addCategory,
        editCategory,
        removeCategory
    },
    Query: {
        category,
        categories,
        myCategories
    }
};
