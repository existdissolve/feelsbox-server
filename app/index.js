'use strict';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import connectSession from 'connect-mongo';
import passport from 'passport';
import https from 'https';
import logger from 'bristol';
import palin from 'palin';
import mongoose from 'mongoose';
import {parse} from 'url';
import fs from 'fs-extra';
import {GraphQLLocalStrategy, buildContext} from "graphql-passport";
import {ApolloServer} from 'apollo-server-express';
import {connect} from '-/mongodb';

import {init} from '-/socket';
import graphqlSchema from '-/graphql/schema';
import CategoryAPI from '-/graphql/datasource/Category';
import DeviceAPI from '-/graphql/datasource/Device';
import DeviceGroupAPI from '-/graphql/datasource/DeviceGroup';
import FeelAPI from '-/graphql/datasource/Feel';
import UserAPI from '-/graphql/datasource/User';

logger.addTarget('console').withFormatter(palin);

const graphQLAuthentication = (req, res, next) => {
    const {body, url, user} = req;
    const parsedUrl = parse(url);
    const {pathname} = parsedUrl;

    logger.info('hostname', req.hostname)

    if (pathname === '/api/graphql') {
        const {operationName} = body;
        const allowedOperations = ['IntrospectionQuery', 'login', 'logout'];
        // TODO: Lock down to dev only
        if (!user && !allowedOperations.includes(operationName)) {
            return res.status(401).json({message: 'User must be authenticated to access this resource'});
        }
    }

    next();
};

const mountMiddleware = app => {
    const sessionSecret = process.env.SESSION_SECRET;
    const MongoStore = connectSession(expressSession);

    app.use(cors());
    app.use(bodyParser.json());
    app.use(expressSession({
        cookie: {
            domain: 'feelsbox.local',
            httpOnly: false,
            secure: true
        },
        name: 'feelsbox',
        resave: true,
        rolling: true,
        saveUninitialized: false,
        secret: sessionSecret,
        store: new MongoStore({
            mongooseConnection: mongoose.connection
        })
    }));
};

const initializePassport = app => {
    passport.use(new GraphQLLocalStrategy(async(email, password, done) => {
        const User = mongoose.model('User');
        const user = await User.findOne({email});
        const error = user ? null : new Error("User could not be found");

        done(error, user ? user.id : user);
    }));

    passport.serializeUser(async function(userId, cb) {
        const User = mongoose.model('User');
        const userInstance = await User.findById(userId);

        if (userInstance) {
            return cb(null, userInstance.id);
        }

        cb(new Error('Could not locate user'));
    });

    passport.deserializeUser(function(obj, cb) {
        logger.info('deserialize user', obj);
        cb(null, obj);
    });

    app.use(passport.initialize());
    app.use(passport.session());
};

const initializeApolloServer = (app, server) => {
    const apollo = new ApolloServer({
        context: ({req}) => buildContext({req}),
        dataSources: () => ({
            categoryAPI: new CategoryAPI(),
            deviceAPI: new DeviceAPI(),
            deviceGroupAPI: new DeviceGroupAPI(),
            feelAPI: new FeelAPI(),
            userAPI: new UserAPI()
        }),
        schema: graphqlSchema,
        subscriptions: {
            path: '/api/subscriptions'
        }
    });

    apollo.applyMiddleware({
        app,
        path: '/api/graphql'
    });

    apollo.installSubscriptionHandlers(server);

    return server;
};

const start = async() => {
    const port = process.env.PORT || 3000;
    const app = new express();

    app.set('trust proxy', true);

    const key = await fs.readFile('./feelsbox.local-key.pem');
    const cert = await fs.readFile('./feelsbox.local.pem');
    const server = https.createServer({
        cert,
        key
    }, app);

    await connect();

    init(server);

    mountMiddleware(app);
    initializePassport(app);
    initializeApolloServer(app, server);
    app.use(graphQLAuthentication);

    server.listen(port, () => {
        logger.info(`listening on *:${port}`);
    });
};

start();