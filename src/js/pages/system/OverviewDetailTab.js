import classNames from 'classnames';
import mixin from 'reactjs-mixin';
import {Hooks} from 'PluginSDK';
import {Link} from 'react-router';
/* eslint-disable no-unused-vars */
import React from 'react';
/* eslint-enable no-unused-vars */
import {StoreMixin} from 'mesosphere-shared-reactjs';

import Config from '../../config/Config';
import ConfigStore from '../../stores/ConfigStore';
import DescriptionList from '../../components/DescriptionList';
import Loader from '../../components/Loader';
import MetadataStore from '../../stores/MetadataStore';
import MarathonStore from '../../../../plugins/services/src/js/stores/MarathonStore';
import Page from '../../components/Page';

const ClusterDetailsBreadcrumbs = () => {
  const crumbs = [
    <Link to="/cluster" key={-1}>Cluster</Link>
  ];

  return <Page.Header.Breadcrumbs iconID="cluster" breadcrumbs={crumbs} />;
};

class OverviewDetailTab extends mixin(StoreMixin) {
  constructor() {
    super(...arguments);

    this.state = {
      open: false
    };

    this.store_listeners = Hooks.applyFilter('OverviewDetailTab:StoreListeners', [
      {
        name: 'config',
        events: ['ccidSuccess']
      },
      {
        name: 'marathon',
        events: ['instanceInfoSuccess']
      },
      {
        name: 'metadata',
        events: ['dcosSuccess']
      }
    ]);
  }

  componentDidMount() {
    super.componentDidMount(...arguments);
    ConfigStore.fetchCCID();
    MarathonStore.fetchMarathonInstanceInfo();

    Hooks.applyFilter('OverviewDetailTab:DidMountCallbacks', [])
      .forEach((cb) => cb());
  }

  getLoading() {
    return <Loader size="small" type="ballBeat" />;
  }

  getClusterDetailsHash() {
    let ccid = ConfigStore.get('ccid');
    let productVersion = MetadataStore.version;

    if (Object.keys(ccid).length) {
      ccid = ccid.zbase32_public_key;
    } else {
      ccid = this.getLoading();
    }

    if (productVersion == null) {
      productVersion = this.getLoading();
    }

    // Allow plugins to add to the cluster details hash
    return Hooks.applyFilter('OverviewDetailTab:ClusterDetails', {
      [`${Config.productName} Version`]: productVersion,
      'Cryptographic Cluster ID': ccid
    });
  }

  getMarathonDetailsHash() {
    const marathonDetails = MarathonStore.getInstanceInfo();

    if (!Object.keys(marathonDetails).length) {
      return null;
    };

    return {
      'Marathon Details': {
        'Version': marathonDetails.version,
        'Framework ID': marathonDetails.frameworkId,
        'Leader': marathonDetails.leader,
        'Marathon Config': marathonDetails.marathon_config,
        'ZooKeeper Config': marathonDetails.zookeeper_config
      }
    };
  }

  buildDescriptionList(hash, addSpacing) {
    let headlineClassName = classNames({
      'h4': true,
      'flush-top': !addSpacing
    });

    return (
      <DescriptionList
        dtClassName="column-3 text-mute text-overflow-break-word"
        hash={hash}
        headlineClassName={headlineClassName} />
    );
  }

  render() {
    const marathonHash = this.getMarathonDetailsHash();
    let marathonDetails = null;

    if (marathonHash) {
      marathonDetails = this.buildDescriptionList(marathonHash, true);
    }

    return (
      <Page>
        <Page.Header breadcrumbs={<ClusterDetailsBreadcrumbs />} />
        {this.buildDescriptionList(this.getClusterDetailsHash())}
        {marathonDetails}
      </Page>
    );
  }
};

OverviewDetailTab.routeConfig = {
  label: 'Overview',
  matches: /^\/cluster\/details/
};

module.exports = OverviewDetailTab;
