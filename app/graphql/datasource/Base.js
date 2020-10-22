import {DataSource} from 'apollo-datasource';

export default class BaseAPI extends DataSource {
    initialize(config) {
        this.context = config.context;
    }

    getApi(name) {
        const {dataSources} = this.context;

        return dataSources[`${name}API`];
    }

    getUser() {
        const {req = {}} = this.context;
        const {user} = req;

        return user;
    }

    getUserInstance() {
        const user = this.getUser();
        const {dataSources} = this.context;
        const {userAPI} = dataSources;

        return userAPI.get(user);
    }
}
