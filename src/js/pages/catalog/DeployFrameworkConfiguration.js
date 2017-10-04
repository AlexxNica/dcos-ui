import React, { PropTypes } from "react";
import mixin from "reactjs-mixin";
import qs from "query-string";
import deepEqual from "deep-equal";
import { StoreMixin } from "mesosphere-shared-reactjs";
import { routerShape } from "react-router";
import CosmosPackagesStore from "#SRC/js/stores/CosmosPackagesStore";
import Util from "#SRC/js/utils/Util";
import FrameworkConfiguration from "#SRC/js/components/FrameworkConfiguration";
import Loader from "#SRC/js/components/Loader";

export default class DeployFrameworkConfiguration extends mixin(StoreMixin) {
  constructor(props) {
    super(props);

    this.state = {
      packageDetails: null,
      deployErrors: null,
      formErrors: {},
      formData: null
    };

    this.store_listeners = [
      {
        name: "cosmosPackages",
        events: [
          "packageDescriptionSuccess",
          "packageDescriptionError",
          "installSuccess",
          "installError"
        ]
      }
    ];

    CosmosPackagesStore.fetchPackageDescription(
      props.params.packageName,
      props.location.query.version
    );
  }

  onCosmosPackagesStorePackageDescriptionSuccess() {
    const packageDetails = CosmosPackagesStore.getPackageDetails();
    const formData = this.initializeFormDataFromSchema(packageDetails.config);
    this.setState({ packageDetails, formData });
  }

  onCosmosPackagesStorePackageDescriptionError() {
    // todo figure out what this response looks like and what we should do
  }

  onCosmosPackagesStoreInstallSuccess(name, version, appId) {
    const { router } = this.context;
    const { params, location } = this.props;

    const query = Object.assign({}, location.query, {
      appId
    });

    router.push(
      `/catalog/packages/${encodeURIComponent(params.packageName)}?${qs.stringify(query)}`
    );
  }

  onCosmosPackagesStoreInstallError(deployErrors) {
    this.setState({ deployErrors });
  }

  initializeFormDataFromSchema(value) {
    if (!Util.isObject(value)) {
      return value;
    }
    if (!value.properties) {
      return value.default;
    }

    const defaults = {};
    Object.keys(value.properties).forEach(property => {
      defaults[property] = this.initializeFormDataFromSchema(
        value.properties[property]
      );
    });

    return defaults;
  }

  handleRun() {
    const { packageDetails, formData } = this.state;

    const name = packageDetails.getName();
    const version = packageDetails.getVersion();
    CosmosPackagesStore.installPackage(name, version, formData);
  }

  handleGoBack() {
    const { router } = this.context;
    router.goBack();
  }

  onFormDataChange(formData) {
    if (deepEqual(formData, this.state.formData, { strict: true })) {
      return;
    }

    this.setState({ formData });
  }

  onFormErrorChange(formErrors) {
    if (deepEqual(formErrors, this.state.formErrors)) {
      return;
    }

    this.setState({ formErrors });
  }

  render() {
    const { packageDetails, deployErrors, formData, formErrors } = this.state;

    if (packageDetails == null) {
      return <Loader className="vertical-center" />;
    }

    return (
      <FrameworkConfiguration
        packageDetails={packageDetails}
        formData={formData}
        deployErrors={deployErrors}
        formErrors={formErrors}
        handleGoBack={this.handleGoBack.bind(this)}
        handleRun={this.handleRun.bind(this)}
        isInitialDeploy={true}
        onFormDataChange={this.onFormDataChange.bind(this)}
        onFormErrorChange={this.onFormErrorChange.bind(this)}
      />
    );
  }
}

DeployFrameworkConfiguration.contextTypes = {
  router: routerShape
};

DeployFrameworkConfiguration.propTypes = {
  params: PropTypes.object.isRequired
};
