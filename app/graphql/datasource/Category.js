import MongooseAPI from '-/graphql/datasource/Mongoose';

export default class CategoryAPI extends MongooseAPI {
    constructor() {
        super('Category');
    }

    async collect(params) {
        const user = this.getUser();
        const {isMine} = params;

        params.query = {
            ...isMine && {
                owners: user
            },
            ...!isMine && {
                $or: [{
                    owners: user
                }, {
                    global: true
                }]
            }
        };

        const categories = await super.collect(params);
        const sortFn = (prev, next) => {
            const {name: prevName} = prev;
            const {name: nextName} = next;

            return prevName < nextName ? -1 : prevName > nextName ? 1 : 0;
        };

        return categories.sort(sortFn).map(category => {
            const owners = category.owners.map(owner => owner.toString());

            category.isOwner = owners.includes(user.toString());

            return category;
        });
    }
}
