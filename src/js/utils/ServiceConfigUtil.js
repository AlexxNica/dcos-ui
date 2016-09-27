import HostUtil from '../utils/HostUtil';
import Networking from '../constants/Networking';
import Util from '../utils/Util';

const serviceAddressKey = 'Service Address';

function buildHostName(id, port) {
  let hostname = HostUtil.stringToHostname(id);
  return `${hostname}${Networking.L4LB_ADDRESS}:${port}`;
}

function defaultCreateLink(contents) {
  return contents;
}

function hasVIPLabel(labels={}) {
  return Object.keys(labels).find(function (key) {
    return /^VIP_[0-9]+$/.test(key);
  });
}

var ServiceConfigUtil = {
  getCommandString(container) {
    // Generic Service
    if (container.cmd) {
      return container.cmd;
    }

    // Pod
    // https://github.com/mesosphere/marathon/blob/feature/pods/docs/docs/rest-api/public/api/v2/types/podContainer.raml#L61
    let {shell, argv} =
      Util.findNestedPropertyInObject(container, 'exec.command') || {};

    if (shell) {
      return shell;
    }
    if (Array.isArray(argv)) {
      return argv.join(' ');
    }

    return null;
  },

  getPortDefinitionGroups(id, portDefinitions, createLink = defaultCreateLink) {
    return portDefinitions.map(function (portDefinition, index) {
      let hash = Object.assign({}, portDefinition);
      let headline = `Port Definition ${index + 1}`;

      if (portDefinition.name) {
        headline += ` (${portDefinition.name})`;
      }

      // Check if this port is load balanced
      if (hasVIPLabel(portDefinition.labels)) {
        let link = buildHostName(id, portDefinition.port);
        hash[serviceAddressKey] = createLink(link, link);
      }

      return {
        hash,
        headline
      };
    });
  },

  getEndpointGroups(id, endpoints, createLink = defaultCreateLink) {
    return endpoints.map(function (endpoint, index) {
      let hash = Object.assign({}, endpoint);
      let headline = `Endpoint ${index + 1}`;

      if (endpoint.name) {
        headline += ` (${endpoint.name})`;
      }

      // Check if this port is load balanced
      if (hasVIPLabel(endpoint.labels)) {
        let link = buildHostName(id, endpoint.hostPort);
        hash[serviceAddressKey] = createLink(link, link);
      }

      return {
        hash,
        headline
      };
    });
  }

};

module.exports = ServiceConfigUtil;
