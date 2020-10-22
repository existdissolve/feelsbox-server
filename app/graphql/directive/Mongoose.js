import {SchemaDirectiveVisitor} from 'apollo-server-express';
import {defaultFieldResolver} from 'graphql';
import mongoose from 'mongoose';
import {cloneDeep, get, set} from 'lodash';

const isValidObjectId = mongoose.Types.ObjectId.isValid;

const findSelectionSet = (key, selectionSet) => {
    const {selections} = selectionSet;
    let set = {};

    for (const selection of selections) {
        const name = get(selection, 'name.value');
        const {selectionSet: nextSelectionSet} = selection;

        if (nextSelectionSet) {
            if (name === key) {
                set = nextSelectionSet;
            } else {
                set = findSelectionSet(key, nextSelectionSet);
            }
        }
    }

    return set;
};

export default class MongooseDirective extends SchemaDirectiveVisitor {
    visitObject(type) {
        const dataMap = {};
        const dataFieldMap = {};
        const {model, refField = '_id', refPath} = this.args;
        const fields = type.getFields();
        // since the "object" isn't a field with a resolver, we need to add resolvers to the fields on the object
        Object.keys(fields).forEach(fieldName => {
            const field = fields[fieldName];
            const {resolve = defaultFieldResolver} = field;
            // the basic idea is that every field except for _id needs to issue a query to get the data first so that it can
            // resolve the correct data
            field.resolve = async function(...args) {
                const [_id, , , meta] = args;
                // unfortunately, each of these resolves is in isolation, as there's not really a top-level "hook" that says
                // "resolve all these fields". To get around this, we can do some introspection and figure out from the meta
                // data passed to the resolver which fields are in the same query
                const rootKey = get(meta, 'path.prev.key');
                const baseSelectionSet = get(meta, 'operation.selectionSet', {});
                const {selections = []} = findSelectionSet(rootKey, cloneDeep(baseSelectionSet));
                const fieldNames = selections.map(selection => get(selection, 'name.value'));
                // not _id? need to make sure we resolve data
                if (fieldName !== '_id') {
                    // only continue if we have a valid object id
                    if (isValidObjectId(_id)) {
                        // to prevent a query for each field, we have a quasi-cache operating here
                        // the _id will be used as the key and will store the promise of the requested query
                        // this will work, because each of the resolvers is async and can await the resolution of the promise
                        // and use the data for their source
                        if (!dataMap[_id]) {
                            const [, , context] = args;
                            const lowercaseModel = model.toLowerCase();
                            const api = get(context, `dataSources.${lowercaseModel}API`);
                            const getter = get(api, 'get');

                            let data;

                            if (refPath) {
                                const Model = mongoose.model(model);

                                data = Model.findOne({[`${refPath}.${refField}`]: _id});
                            } else if (getter) {
                                // if we have an api with a getter, use it
                                data = getter.call(api, _id);
                            } else {
                                // otherwise, fallback to straight mongoose query using the passed model name
                                const Model = mongoose.model(model);

                                data = Model.findById(_id);
                            }

                            // add the promise to our cache
                            dataMap[_id] = data;
                        }

                        // flag that this field has been queried; important later on
                        set(dataFieldMap, `${_id}.${fieldName}`, true);

                        const sourceData = await dataMap[_id];
                        const finalSourceData = sourceData && refPath ? sourceData.get(refPath) : sourceData;
                        const [, ...rest] = args;

                        const dataArgs = [finalSourceData, ...rest];
                        // use the updated args with the source data to resolve this field
                        const result = await resolve.apply(this, dataArgs);
                        // if we were to just return here, we'd have a cachce that continues to build and build
                        // since we don't want that, we'll do a quick check to see if all the fields we were querying have
                        // run their resolvers
                        const resolvedFieldsCount = fieldNames.reduce((resolvedCount) => {
                            if (get(dataFieldMap, `${_id}.${fieldName}`)) {
                                resolvedCount++;
                            }

                            return resolvedCount;
                        }, 0);
                        // if the number of resolved fields matches the number that were supposed to run, we can clear the cache
                        if (resolvedFieldsCount === fieldNames.length) {
                            delete dataFieldMap[_id];
                            delete dataMap[_id];
                        }

                        return result;
                    } else {
                        return await resolve.apply(this, args);
                    }
                }

                return await resolve.apply(this, args);
            };
        });
    }
}
