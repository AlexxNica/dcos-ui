import React from 'react';
import {Table} from 'reactjs-components';

import ConfigurationMapEditAction from '../components/ConfigurationMapEditAction';
import Networking from '../../../../../src/js/constants/Networking';
import {
  getColumnClassNameFn,
  getColumnHeadingFn,
  getDisplayValue
} from '../utils/ServiceConfigDisplayUtil';
import ServiceConfigUtil from '../utils/ServiceConfigUtil';
import ServiceConfigBaseSectionDisplay from './ServiceConfigBaseSectionDisplay';
import {findNestedPropertyInObject} from '../../../../../src/js/utils/Util';

class ServiceNetworkingConfigSection extends ServiceConfigBaseSectionDisplay {
  /**
   * @override
   */
  shouldExcludeItem(row) {
    if (row.key !== 'ipAddress.networkName') {
      return false;
    }

    const {appConfig} = this.props;
    const networkName = findNestedPropertyInObject(appConfig, row.key);

    return !networkName;
  }

  /**
   * @override
   */
  getDefinition() {
    const {onEditClick} = this.props;

    return {
      tabViewID: 'networking',
      values: [
        {
          heading: 'Network',
          headingLevel: 1
        },
        {
          key: 'container.docker.network',
          label: 'Network Type',
          transformValue(networkType, appDefinition) {
            networkType = networkType || Networking.type.HOST;
            const networkName = findNestedPropertyInObject(
              appDefinition,
              'ipAddress.networkName'
            );

            return networkName != null ?
              Networking.type.USER :
              networkType;
          }
        },
        {
          key: 'ipAddress.networkName',
          label: 'Network Name'
        },
        {
          heading: 'Service Endpoints',
          headingLevel: 2
        },
        {
          key: 'portDefinitions',
          render(portDefinitions, appDefinition) {
            const containerPortMappings = findNestedPropertyInObject(
              appDefinition, 'container.docker.portMappings'
            ) || [];
            if (containerPortMappings.length !== 0) {
              portDefinitions = containerPortMappings;
            }

            // Make sure to have something to render, even if there is no data
            if (!portDefinitions) {
              portDefinitions = [];
            }

            const columns = [
              {
                heading: getColumnHeadingFn('Name'),
                prop: 'name',
                render(prop, row) {
                  return getDisplayValue(row[prop]);
                },
                className: getColumnClassNameFn(),
                sortable: true
              },
              {
                heading: getColumnHeadingFn('Protocol'),
                prop: 'protocol',
                className: getColumnClassNameFn(),
                render(prop, row) {
                  let protocol = row[prop] || '';
                  protocol = protocol.replace(/,\s*/g, ', ');

                  return getDisplayValue(protocol);
                },
                sortable: true
              },
              {
                heading: getColumnHeadingFn('Host Port'),
                prop: 'port',
                className: getColumnClassNameFn(),
                render(prop, row) {
                  return getDisplayValue(row['port'] || row['hostPort']);
                },
                sortable: true
              },
              {
                heading: getColumnHeadingFn('Container Port'),
                prop: 'containerPort',
                className: getColumnClassNameFn(),
                render(prop, row) {
                  return getDisplayValue(row[prop]);
                },
                sortable: true
              },
              {
                heading: getColumnHeadingFn('Load Balanced Address'),
                prop: '',
                className: getColumnClassNameFn(),
                render(prop, row) {
                  const {port, containerPort, labels} = row;
                  // For the HOST network we pick port (hostPort) and for USER/BRIDGE - containerPort
                  const lbPort = port || containerPort;

                  if (labels && ServiceConfigUtil.hasVIPLabel(labels)) {
                    return ServiceConfigUtil.buildHostName(
                      appDefinition.id,
                      lbPort
                    );
                  }

                  return getDisplayValue(undefined);
                },
                sortable: true
              }
            ];

            if (onEditClick) {
              columns.push({
                heading() { return null; },
                className: 'configuration-map-action',
                prop: 'edit',
                render() {
                  return (
                    <ConfigurationMapEditAction
                      onEditClick={onEditClick}
                      tabViewID="networking" />
                  );
                }
              });
            }

            return (
              <Table
                key="service-endpoints"
                className="table table-simple table-align-top table-break-word table-fixed-layout flush-bottom"
                columns={columns}
                data={portDefinitions} />
            );
          }
        }
      ]
    };
  }
}

module.exports = ServiceNetworkingConfigSection;
