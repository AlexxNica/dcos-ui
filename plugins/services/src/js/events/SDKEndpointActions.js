import { RequestUtil } from "mesosphere-shared-reactjs";
import reqwest from "reqwest";

import AppDispatcher from "#SRC/js/events/AppDispatcher";
import {
  REQUEST_SDK_ENDPOINTS_SUCCESS,
  REQUEST_SDK_ENDPOINTS_ERROR,
  REQUEST_SDK_ENDPOINT_SUCCESS,
  REQUEST_SDK_ENDPOINT_ERROR,
  REQUEST_SDK_ENDPOINTS_LOADING
} from "../constants/ActionTypes";

const SDKEndpointsActions = {
  fetchEndpoints(serviceId) {
    AppDispatcher.handleServerAction({
      type: REQUEST_SDK_ENDPOINTS_LOADING,
      data: { serviceId }
    });
    const url = `/service/${serviceId}/v1/endpoints`;
    RequestUtil.json({
      url,
      method: "GET",
      success(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_SDK_ENDPOINTS_SUCCESS,
          data: { serviceId, endpoints: xhr }
        });
      },
      error(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_SDK_ENDPOINTS_ERROR,
          data: {
            serviceId,
            error: RequestUtil.parseResponseBody(xhr)
          },
          xhr
        });
      }
    });
  },
  fetchEndpoint(serviceId, endpointName) {
    const url = `/service/${serviceId}/v1/endpoints/${endpointName}`;
    const r = reqwest({
      url,
      method: "GET",
      success: resp => {
        AppDispatcher.handleServerAction({
          type: REQUEST_SDK_ENDPOINT_SUCCESS,
          data: {
            serviceId,
            endpointData: resp,
            contentType: r.request.getResponseHeader("Content-Type"),
            endpointName
          }
        });
      },
      error: resp => {
        AppDispatcher.handleServerAction({
          type: REQUEST_SDK_ENDPOINT_ERROR,
          data: {
            serviceId,
            error: resp
          }
        });
      }
    });
  }
};

module.exports = SDKEndpointsActions;
