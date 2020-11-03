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

        return categories.map(category => {
            const owners = category.owners.map(owner => owner.toString());

            category.isOwner = owners.includes(user.toString());

            return category;
        });
    }
}
