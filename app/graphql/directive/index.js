import MongooseDirective from '-/graphql/directive/Mongoose';
import {IsOpenDirective, IsOwnerDirective} from '-/graphql/directive/Authentication';

export default {
    isOpen: IsOpenDirective,
    isOwner: IsOwnerDirective,
    mongoose: MongooseDirective
};
