import React, {Component} from 'react';
import {Tooltip} from 'reactjs-components';

import AdvancedSection from '../../../../../../src/js/components/form/AdvancedSection';
import AdvancedSectionContent from '../../../../../../src/js/components/form/AdvancedSectionContent';
import AdvancedSectionLabel from '../../../../../../src/js/components/form/AdvancedSectionLabel';
import ContainerServiceFormSection from './ContainerServiceFormSection';
import FieldError from '../../../../../../src/js/components/form/FieldError';
import FieldHelp from '../../../../../../src/js/components/form/FieldHelp';
import FieldInput from '../../../../../../src/js/components/form/FieldInput';
import FieldLabel from '../../../../../../src/js/components/form/FieldLabel';
import {findNestedPropertyInObject} from '../../../../../../src/js/utils/Util';
import FormGroup from '../../../../../../src/js/components/form/FormGroup';
import MetadataStore from '../../../../../../src/js/stores/MetadataStore';
import Icon from '../../../../../../src/js/components/Icon';
import General from '../../reducers/serviceForm/General';
import VolumeConstants from '../../constants/VolumeConstants';

const {MESOS, DOCKER} = VolumeConstants.type;

const CONTAINER_RUNTIMES = {
  docker: {
    label: <span>Docker Engine <em>(recommended)</em></span>,
    helpText: 'Docker’s container runtime. No support for multiple containers (Pods) or GPU resources.',
    type: DOCKER
  },
  mesos: {
    label: <span>Mesos</span>,
    helpText: 'Supports multiple containers (Pods) and GPU resources.',
    type: MESOS
  },
  universal: {
    label: <span>Universal Container Runtime <em>(experimental)</em></span>,
    helpText: 'Native container engine in Mesos using standard Linux features. Supports multiple containers (Pods) and GPU resources.',
    type: MESOS
  }
};

class GeneralServiceFormSection extends Component {

  isChecked(runtime, data) {

  }

  getRuntimeSelections(data = {}) {
    let {container = {}, cmd, gpus} = data;
    let isDisabled = {};
    let isChecked = {};
    let disabledTooltipContent;
    let type = container.type || DOCKER;
    let image = findNestedPropertyInObject(container, 'docker.image');
    // Single container with command and no image, disable 'DOCKER'
    if (cmd && !image) {
      isDisabled['docker'] = true;
      disabledTooltipContent = 'If you want to use Docker Engine you have to enter a container image, otherwise please select Universal Container Runtime.';
    }

    // TODO: Handle GPUs
    if (gpus != null) {
      isDisabled['docker'] = true;
      disabledTooltipContent = 'Docker Engine does not support GPU resources, please select Universal Container Runtime if you want to use GPU resources.';
    }

    return Object.keys(CONTAINER_RUNTIMES).map((runtimeName, index) => {
      let {helpText, label, type: containerType} = CONTAINER_RUNTIMES[runtimeName];
      let field = (
        <FieldLabel className="text-align-left" key={index}>
          <FieldInput
            checked={isChecked(runtimeName, data)}
            disabled={isDisabled[runtimeName]}
            name="container.type"
            type="radio"
            value={containerType} />
            {label}
          <FieldHelp>{helpText}</FieldHelp>
        </FieldLabel>
      );

      // Wrap field in tooltip if disabled and content populated
      if (isDisabled[runtimeName] && disabledTooltipContent) {
        field = (
          <Tooltip
            content={disabledTooltipContent}
            interactive={true}
            key={index}
            maxWidth={300}
            scrollContainer=".gm-scroll-view"
            wrapText={true}>
            {field}
          </Tooltip>
        );
      }

      return field;
    });
  }

  getIDHelpBlock() {
    return (
      <span>
        {'Include the path to your service, if applicable. E.g. /dev/tools/my-service. '}
        <a href="https://mesosphere.github.io/marathon/docs/application-groups.html" target="_blank">
          More information
        </a>.
      </span>
    );
  }

  render() {
    let {data, errors} = this.props;
    let typeErrors = findNestedPropertyInObject(errors, 'container.type');
    let runtimeTooltipContent = (
      <span>
        {'You can run Docker containers with both container runtimes. The Universal Container Runtime is better supported in DC/OS. '}
        <a href={MetadataStore.buildDocsURI('/usage/containerizers/')} target="_blank">
          More information
        </a>.
      </span>
    );

    return (
      <div className="form flush-bottom">
        <div className="form-row-element">
          <h2 className="form-header flush-top short-bottom">
            Services
          </h2>
          <p>
            Configure your service below. Start by giving your service a name.
          </p>
        </div>

        <div className="flex row">
          <FormGroup
            className="column-8"
            required={true}
            showError={Boolean(errors.id)}>
            <FieldLabel>
              Service Name
            </FieldLabel>
            <FieldInput
              name="id"
              type="text"
              value={data.id} />
            <FieldHelp>{this.getIDHelpBlock()}</FieldHelp>
            <FieldError>{errors.id}</FieldError>
          </FormGroup>

          <FormGroup
            className="column-4"
            showError={Boolean(errors.instances)}>
            <FieldLabel>
              Instances
            </FieldLabel>
            <FieldInput
              name="instances"
              min={0}
              type="number"
              value={data.instances} />
            <FieldError>{errors.instances}</FieldError>
          </FormGroup>
        </div>

        <AdvancedSection>
          <AdvancedSectionLabel>
            Advanced Service Settings
          </AdvancedSectionLabel>
          <AdvancedSectionContent>
            <h3 className="short-top short-bottom">
              {'Container Runtime '}
              <Tooltip
                content={runtimeTooltipContent}
                interactive={true}
                maxWidth={300}
                scrollContainer=".gm-scroll-view"
                wrapText={true}>
                  <Icon color="grey" id="ring-question" size="mini" family="mini" />
              </Tooltip>
            </h3>
            <p>The container runtime is responsible for running your service. We support the Mesos and Docker containerizers.</p>
            <FormGroup showError={Boolean(typeErrors)}>
              {this.getRuntimeSelections(data)}
              <FieldError>{typeErrors}</FieldError>
            </FormGroup>
          </AdvancedSectionContent>
        </AdvancedSection>

        <ContainerServiceFormSection data={data} errors={errors} />
      </div>
    );
  }
}

GeneralServiceFormSection.defaultProps = {
  data: {},
  errors: {}
};

GeneralServiceFormSection.propTypes = {
  data: React.PropTypes.object,
  errors: React.PropTypes.object
};

GeneralServiceFormSection.configReducers = General;

module.exports = GeneralServiceFormSection;
