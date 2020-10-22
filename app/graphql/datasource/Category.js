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
                owner: user
            },
            ...!isMine && {
                $or: [{
                    owner: user
                }, {
                    global: true
                }]
            }
        };

        const categories = await super.collect(params);

        return categories.map(category => {
            category.isOwner = category.owner.toString() === user.toString();

            return category;
        });
    }
}
