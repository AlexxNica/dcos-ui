import React from 'react';

import {
  getSharedIconWithLabel,
  getContainerNameWithIcon
} from '../utils/ServiceConfigDisplayUtil';
import ConfigurationMapTable from '../components/ConfigurationMapTable';
import Heading from '../../../../../src/js/components/ConfigurationMapHeading';
import Section from '../../../../../src/js/components/ConfigurationMapSection';

const columns = [
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

module.exports = ({appConfig}) => {
  const {environment = {}, containers = []} = appConfig;

  if (!environment || !containers) {
    return <noscript />;
  }

  let combinedEnv = Object.keys(environment).reduce((memo, key) => {
    memo.push({
      key: <code>{key}</code>,
      value: environment[key],
      container: getSharedIconWithLabel()
    });

    return memo;
  }, []);

  combinedEnv = containers.reduce((memo, container) => {
    const {environment = {}} = container;

    return Object.keys(environment).reduce((cvMemo, key) => {
      cvMemo.push({
        key: <code>{key}</code>,
        value: environment[key],
        container: getContainerNameWithIcon(container)
      });

      return cvMemo;
    }, memo);
  }, combinedEnv);

  if (!combinedEnv.length) {
    return <noscript />;
  }

  return (
    <div>
      <Heading level={1}>Environment Variables</Heading>
      <Section key="pod-general-section">
        <ConfigurationMapTable
          className="table table-simple table-break-word flush-bottom"
          columnDefaults={{hideIfEmpty: true}}
          columns={columns}
          data={combinedEnv} />
      </Section>
    </div>
  );
};
