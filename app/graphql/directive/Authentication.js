import {SchemaDirectiveVisitor} from 'apollo-server-express';
import {defaultFieldResolver} from 'graphql';

class BaseAuthenticationDirective extends SchemaDirectiveVisitor {
    visitObject(type) {
        this.ensureFieldsWrapped(type);

        type._modelType = this.args.type;
        type._strategy = this.args.strategy;
    }

    visitFieldDefinition(field, details) {
        this.ensureFieldsWrapped(details.objectType);

        field._modelType = this.args.type;
        field._strategy = this.args.strategy;
    }

    ensureFieldsWrapped(objectType) {
        // Mark the GraphQLObjectType object to avoid re-wrapping:
        if (objectType._authFieldsWrapped) {
            return;
        }

        objectType._authFieldsWrapped = true;

        const fields = objectType.getFields();

        Object.keys(fields).forEach(fieldName => {
            const field = fields[fieldName];
            const {resolve = defaultFieldResolver} = field;

            field.resolve = async function(...args) {
                const [, payload, context] = args;
                const {dataSources = {}, req = {}} = context;
                const {user} = req;
                const {_modelType: type, _strategy: strategy} = field;

                if (strategy === 'open') {
                    return resolve.apply(this, args);
                }

                if (!user) {
                    throw new Error('User is not authenticated');
                }

                const {_id} = payload;

                if (_id && type) {
                    console.log(type)
                    console.log(_id)
                    console.log(strategy)
                    const instance = await dataSources[`${type}API`].get(_id);

                    if (!instance) {
                        throw new Error('Resource could not be found');
                    }

                    if (instance.owner.toString() !== user) {
                        throw new Error('User does not have access to the requested resource');
                    }
                }

                return resolve.apply(this, args);
            };
        });
    }
}

export class IsOpenDirective extends BaseAuthenticationDirective {
    constructor(config) {
        super(config);

        this.args.strategy = 'open';
    }
}


export class IsOwnerDirective extends BaseAuthenticationDirective {
    constructor(config) {
        super(config);

        this.args.type = config.args.type;
        this.args.strategy = 'owner';
    }
}
