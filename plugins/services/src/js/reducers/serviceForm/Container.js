import {SET, ADD_ITEM, REMOVE_ITEM} from '../../../../../../src/js/constants/TransactionTypes';
import {combineReducers} from '../../../../../../src/js/utils/ReducerUtil';
import ContainerConstants from '../../constants/ContainerConstants';
import {JSONReducer as volumes} from './Volumes';
import ValidatorUtil from '../../../../../../src/js/utils/ValidatorUtil';
import docker from './Docker';

const {DOCKER, MESOS, NONE} = ContainerConstants.type;

const containerJSONReducer = combineReducers({
  type(state, {type, path, value}) {
    if (path == null) {
      return state;
    }

    if (this.hasImage == null) {
      this.hasImage = false;
    }

    if (this.noState == null) {
      this.noState = true;
    }

    if (this.hasVolumes == null) {
      this.hasVolumes = [];
    }

    const joinedPath = path.join('.');
    if (type === SET && joinedPath === 'container.docker.image') {
      this.hasImage = !ValidatorUtil.isEmpty(value);
    }

    if (path[0] === 'localVolumes' || path[0] === 'externalVolumes') {
      switch (type) {
        case ADD_ITEM:
          this.hasVolumes.push(true);
          break;
        case REMOVE_ITEM:
          this.hasVolumes = this.hasVolumes.filter((item, index) => {
            return index !== value;
          });
      }
    }

    if (type === SET && joinedPath === 'container.type' && value !== NONE) {
      this.noState = false;

      return value;
    }

    if (value === NONE) {
      this.noState = true;
    }

    let volumesState = null;

    if (this.hasVolumes.length !== 0) {
      volumesState = MESOS;
    }

    if (this.noState) {
      return volumesState;
    }

    return state;
  },
  docker(_, {type, path, value}, index) {
    if (this.internalState == null) {
      this.internalState = {};
    }

    // Passing down the index as well, for reducers to use context
    this.internalState = docker(this.internalState, {type, path, value}, index);

    const joinedPath = path && path.join('.');
    if (type === SET && joinedPath === 'container.type') {
      this.containerType = value;
    }

    if (!ValidatorUtil.isEmpty(this.internalState) && this.containerType !== NONE) {
      let newState = Object.assign({}, this.internalState);
      Object.keys(this.internalState).forEach((key) => {
        if (ValidatorUtil.isEmpty(this.internalState[key])) {
          delete newState[key];
        }
      });

      return newState;
    }
  },
  volumes
});

const containerReducer = combineReducers({
  type(state, {type, path, value}) {
    if (path == null) {
      return state;
    }

    const joinedPath = path.join('.');
    if (type === SET && joinedPath === 'container.type') {
      return value;
    }

    return state;
  },
  docker(_, {type, path, value}, index) {
    if (this.internalState == null) {
      this.internalState = {};
    }

    // Passing down the index as well, for reducers to use context
    this.internalState = docker(this.internalState, {type, path, value}, index);

    const joinedPath = path && path.join('.');
    if (type === SET && joinedPath === 'container.type') {
      this.containerType = value;
    }

    if (!ValidatorUtil.isEmpty(this.internalState) && this.containerType !== NONE) {
      let newState = Object.assign({}, this.internalState);
      Object.keys(this.internalState).forEach((key) => {
        if (ValidatorUtil.isEmpty(this.internalState[key])) {
          delete newState[key];
        }
      });

      return newState;
    }
  },
  volumes
});

module.exports = {
  JSONReducer(_, ...args) {
    if (this.internalState == null) {
      this.internalState = {};
    }

    if (this.isMesosRuntime == null) {
      this.isMesosRuntime = true;
    }

    const {type, path, value} = args[0];

    if (type === SET && path.join('.') === 'container.type') {
      this.isMesosRuntime = value === NONE;
    }

    let newState = Object.assign(
      {}, containerJSONReducer.apply(this, [this.internalState, ...args])
    );

    this.internalState = newState;

    if (ValidatorUtil.isEmpty(newState.docker)) {
      delete newState.docker;
    }

    if (ValidatorUtil.isEmpty(newState.volumes)) {
      delete newState.volumes;
    }

    if (ValidatorUtil.isEmpty(newState.type)) {
      delete newState.type;
    }

    if (ValidatorUtil.isEmpty(newState)) {
      return null;
    }

    return newState;
  },
  FormReducer(_, ...args) {
    if (this.internalState == null) {
      this.internalState = {};
    }

    let newState = Object.assign(
      {}, containerReducer.apply(this, [this.internalState, ...args])
    );

    this.internalState = newState;

    if (ValidatorUtil.isEmpty(newState.docker)) {
      delete newState.docker;
    } else if (ValidatorUtil.isEmpty(newState.type)) {
      delete newState.docker;
    } else if (this.isMesosRuntime && !ValidatorUtil.isEmpty(newState.docker)) {
      delete newState.docker;
    } else if (newState.docker.type === NONE) {
      delete newState.docker;
    }

    if (newState.docker && newState.type !== DOCKER) {
      delete newState.docker.privileged;
      delete newState.docker.forcePullImage;
    }

    if (ValidatorUtil.isEmpty(newState.volumes)) {
      delete newState.volumes;
    }

    if (ValidatorUtil.isEmpty(newState.type)) {
      delete newState.type;
    }

    if (ValidatorUtil.isEmpty(newState)) {
      return null;
    }

    return newState;
  }
};
