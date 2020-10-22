import MongooseAPI from '-/graphql/datasource/Mongoose';

export default class FeelAPI extends MongooseAPI {
    constructor() {
        super('Feel');
    }

    async collect(params) {
        const user = this.getUser();
        const {criteria = {}} = params;
        const {searchType = 'OWNER', sortType, text} = criteria;
        const userInstance = await this.getUserInstance();
        const subscriptions = userInstance.get('subscriptions');

        params.query = {
            active: true,
            ...searchType === 'OWNER' && {
                $or: [{
                    owner: user
                }, {
                    _id: {$in: subscriptions}
                }]
            },
            ...searchType !== 'OWNER' && {
                private: {$ne: true},
                owner: {$ne: user}
            },
            ...text && {
                name: {
                    $regex: new RegExp(text, 'gi')
                }
            }
        };

        let feels;

        if (sortType) {
            const property = sortType === 'MOSTPOPULAR' ? 'subscriberCount' : 'createdAt';

            feels = await super.collect(params).sort({[property]: -1});
        } else {
            feels = await super.collect(params);
        }

        return feels.map(feel => {
            const {_id, owner = ''} = feel;

            feel.isOwner = owner.toString() === user.toString();
            feel.isSubscribed = subscriptions.some(sub => sub.toString() === _id.toString());

            return feel;
        });
    }

    async subscribe(params) {
        const {_id} = params;
        const feel = await this.get(_id);

        if (feel) {
            const {subscriberCount: currentCount} = feel;
            const userAPI = this.getApi('user');
            const subscriberCount = currentCount + 1;

            await userAPI.subscribe({_id});
            await feel.toggleSubscription(true);
        }

        feel.isSubscribed = true;

        return feel;
    }

    async unsubscribe(params) {
        const {_id} = params;
        const feel = await this.get(_id);

        if (feel) {
            const {subscriberCount: currentCount} = feel;
            const userAPI = this.getApi('user');
            const subscriberCount = currentCount > 0 ? (currentCount - 1) : 0;

            await userAPI.unsubscribe({_id});
            await feel.toggleSubscription(false);
        }

        feel.isSubscribed = false;

        return feel;
    }
}
