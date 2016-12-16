import React from 'react';

import {
  getSharedIconWithLabel,
  getContainerNameWithIcon
} from '../utils/ServiceConfigDisplayUtil';
import ConfigurationMapTable from '../components/ConfigurationMapTable';
import Heading from '../../../../../src/js/components/ConfigurationMapHeading';
import Section from '../../../../../src/js/components/ConfigurationMapSection';

class PodLabelsConfigSection extends React.Component {
  getColumns() {
    return [
      {
        heading: 'Key',
        prop: 'key'
      },
      {
        heading: 'Value',
        prop: 'value'
      },
      {
        heading: 'Container',
        prop: 'container'
      }
    ];
  }

  render() {
    const {labels = {}, containers = []} = this.props.appConfig;

    let combinedLabels = [];

    if (labels != null) {
      combinedLabels = Object.keys(labels).reduce((memo, key) => {
        memo.push({
          key: <code>{key}</code>,
          value: labels[key],
          container: getSharedIconWithLabel()
        });

        return memo;
      }, []);
    }

    combinedLabels = containers.reduce((memo, container) => {
      const {labels = {}} = container;

      if (labels != null) {
        return Object.keys(labels).reduce((cvMemo, key) => {
          cvMemo.push({
            key: <code>{key}</code>,
            value: labels[key],
            container: getContainerNameWithIcon(container)
          });

          return cvMemo;
        }, memo);
      }

      return memo;
    }, combinedLabels);

    if (!combinedLabels.length) {
      return null;
    }

    return (
      <div>
        <Heading level={1}>Labels</Heading>
        <Section key="pod-general-section">
          <ConfigurationMapTable
            className="table table-simple table-break-word flush-bottom"
            columnDefaults={{hideIfEmpty: true}}
            columns={this.getColumns()}
            data={combinedLabels} />
        </Section>
      </div>
    );
  }
};

PodLabelsConfigSection.defaultProps = {
  appConfig: {}
};

PodLabelsConfigSection.propTypes = {
  appConfig: React.PropTypes.object
};

module.exports = PodLabelsConfigSection;
