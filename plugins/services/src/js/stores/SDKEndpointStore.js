import PluginSDK from "PluginSDK";

import { SERVER_ACTION } from "#SRC/js/constants/ActionTypes";
import AppDispatcher from "#SRC/js/events/AppDispatcher";
import GetSetBaseStore from "#SRC/js/stores/GetSetBaseStore";

import {
  REQUEST_SDK_ENDPOINTS_SUCCESS,
  REQUEST_SDK_ENDPOINTS_ERROR,
  REQUEST_SDK_ENDPOINT_SUCCESS,
  REQUEST_SDK_ENDPOINT_ERROR
} from "../constants/ActionTypes";

import SDKEndpointActions from "../events/SDKEndpointActions";
import SDKServiceEndpoint from "../structs/SDKServiceEndpoint";

class SDKEndpointStore extends GetSetBaseStore {
  constructor() {
    super(...arguments);

    const self = this;

    this.getSet_data = {
      services: {}
    };

    PluginSDK.addStoreConfig({
      store: this,
      storeID: this.storeID,
      listenAlways: true
    });

    this.dispatcherIndex = AppDispatcher.register(function(payload) {
      if (payload.source !== SERVER_ACTION) {
        return false;
      }

      const { type, data } = payload.action;
      switch (type) {
        case REQUEST_SDK_ENDPOINTS_SUCCESS:
          self.processNewEndpoints(data.serviceId, data.endpoints);
          break;
        case REQUEST_SDK_ENDPOINTS_ERROR:
          self.setServiceEndpoints(data.serviceId, {
            endpoints: [],
            error: data.error.description
          });
          break;
        case REQUEST_SDK_ENDPOINT_SUCCESS:
          self.processNewEndpoint(
            data.serviceId,
            data.endpointName,
            data.endpointData,
            data.contentType
          );
          break;
        case REQUEST_SDK_ENDPOINT_ERROR:
          self.setServiceEndpoints(data.serviceId, {
            endpoints: [],
            error: data.error
          });
          break;
      }

      return true;
    });
  }

  getEndpointService(serviceId) {
    const service = this.get("services")[serviceId];

    if (!service || !service.endpoints) {
      return null;
    }

    const sdkEndpointList = Object.keys(service.endpoints).map(endpointName => {
      const endpoint = service.endpoints[endpointName];

      return new SDKServiceEndpoint({
        endpointName,
        endpointData: endpoint.endpointData,
        contentType: endpoint.contentType
      });
    });

    return Object.assign({}, service, {
      endpoints: sdkEndpointList
    });
  }

  setServiceEndpoints(serviceId, serviceData) {
    const services = Object.assign({}, this.get("services"), {
      [serviceId]: {
        endpoints: serviceData.endpoints,
        error: serviceData.error
      }
    });
    this.set({ services });
  }

  processNewEndpoints(serviceId, endpointsArray) {
    const endpoints = endpointsArray.reduce(function(acc, endpointName) {
      acc[endpointName] = {};

      return acc;
    }, {});

    this.setServiceEndpoints(serviceId, {
      endpoints,
      error: ""
    });

    endpointsArray.forEach(function(endpoint) {
      SDKEndpointActions.fetchEndpoint(serviceId, endpoint);
    }, this);
  }

  processNewEndpoint(serviceId, endpointName, endpointData, contentType) {
    const service = this.get("services")[serviceId];
    if (!service && !service.endpoints[endpointName]) {
      return;
    }

    const newEndpoints = Object.assign({}, service.endpoints);
    newEndpoints[endpointName] = { endpointData, contentType };

    this.setServiceEndpoints(serviceId, {
      endpoints: newEndpoints,
      error: ""
    });
  }

  addChangeListener(eventName, callback) {
    this.on(eventName, callback);
  }

  removeChangeListener(eventName, callback) {
    this.removeListener(eventName, callback);
  }

  get storeID() {
    return "SDKEndpoint";
  }
}

module.exports = new SDKEndpointStore();
